"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Search, Eye, Trash2, Check, Printer, X, Info, CheckCircle, 
    Hourglass, MoreHorizontal, Hand, FilePlus, Copy, DollarSign, 
    FileText, AlertTriangle, ChevronRight, ChevronLeft, HelpCircle,
    ListOrdered, ShieldCheck, UserCheck, Tag, BarChart2
} from 'lucide-react';
import { useProcurement } from './procurement-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import type { ComparativeStatement } from './cs-entry-form';
import { useToast } from '@/hooks/use-toast';
import { collection, doc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCSStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Label } from '@/components/ui/label';
import { PurchaseOrderForm } from './po-entry-form';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const CSUserGuide = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col animate-dialog-in">
            <DialogHeader>
                <div className="flex items-center gap-2 text-primary">
                    <HelpCircle className="h-6 w-6" />
                    <DialogTitle className="text-xl">Comparative Statement (CS) Guide</DialogTitle>
                </div>
                <DialogDescription>Internal guidelines for vendor quotation analysis and contract awarding.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow pr-4 max-h-[60vh]">
                <div className="space-y-6 py-4">
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><Info className="h-4 w-4"/> Objective</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            The Comparative Statement is designed to perform a high-fidelity "Apples-to-Apples" comparison between multiple vendor bids for a specific Demand Note.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><Tag className="h-4 w-4"/> Quotation Entry</h4>
                        <p className="text-sm text-muted-foreground">
                            GP Concern Officers input the detailed breakdown from each vendor, including unit prices, specific discounts, VAT/TAX percentages, and commercial terms (Payment & Delivery).
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4"/> Awarding Strategy</h4>
                        <p className="text-sm text-muted-foreground">
                            Once data is entered, the status moves to <Badge variant="outline">Pending Vendor Selection</Badge>. The authorized officer must then click the <Hand className="h-3 w-3 inline mx-1"/> button to "Award" the contract to the most competitive supplier.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><UserCheck className="h-4 w-4"/> Dynamic Approval Thresholds</h4>
                        <p className="text-sm text-muted-foreground">The internal approval chain is automatically calculated based on the lowest bid amount:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                            <li><strong>Up to $10k:</strong> Purchase Manager approval.</li>
                            <li><strong>$10k - $100k:</strong> Purchase Manager + Technical Advisor.</li>
                            <li><strong>Above $1M:</strong> Full Management Chain + MD/FD Final sign-off.</li>
                        </ul>
                    </section>
                </div>
            </ScrollArea>
            <DialogFooter className="border-t pt-4">
                <Button onClick={() => onOpenChange(false)}>Dismiss Guide</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

const VendorSelectionDialog: React.FC<{
  cs: ComparativeStatement | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onVendorSelected: (csId: string, vendorId: string) => void;
  vendors: any[];
}> = ({ cs, isOpen, onOpenChange, onVendorSelected, vendors }) => {
    const [step, setStep] = useState(1);
    const [selectedVendorId, setSelectedVendorId] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedVendorId('');
        }
    }, [isOpen]);

    const selectedVendor = vendors.find(v => v.id === selectedVendorId);
    const selectedVendorDetail = cs?.vendorDetails.find(d => d.vendorId === selectedVendorId);

    const financials = useMemo(() => {
        if (!cs || !selectedVendorId) return null;
        
        const subtotal = cs.items.reduce((acc, item) => {
            const quote = item.vendorQuotes.find(q => q.vendorId === selectedVendorId);
            return acc + (item.quantity * (quote?.unitPrice || 0));
        }, 0);

        const detail = cs.vendorDetails.find(d => d.vendorId === selectedVendorId);
        let discount = 0;
        if (detail) {
            if (detail.discountType === 'Percentage') {
                discount = subtotal * ((detail.discountValue || 0) / 100);
            } else {
                discount = detail.discountValue || 0;
            }
        }

        const subtotalAfterDiscount = subtotal - discount;
        const vat = subtotalAfterDiscount * ((detail?.vatPercentage || 0) / 100);
        const tax = subtotalAfterDiscount * ((detail?.taxPercentage || 0) / 100);
        const total = subtotalAfterDiscount + vat + tax;

        return { subtotal, discount, vat, tax, total };
    }, [cs, selectedVendorId]);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);
    
    const handleConfirm = () => {
        if (cs && selectedVendorId) onVendorSelected(cs.id, selectedVendorId);
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl animate-dialog-in">
                <DialogHeader>
                    <DialogTitle>Award Contract: {cs?.csNumber}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 1 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 2 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 3 ? "bg-primary" : "bg-muted")} />
                    </div>
                </DialogHeader>

                 <div className="py-6 min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label className="text-lg">Step 1: Select Vendor & Review Financials</Label>
                                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                                    <SelectTrigger className="h-12 text-lg animate-scale-in"><SelectValue placeholder="Choose a vendor to award..." /></SelectTrigger>
                                    <SelectContent className="animate-scale-in">
                                        {(cs?.vendorDetails || []).map(detail => {
                                            const v = vendors.find(v => v.id === detail.vendorId);
                                            return <SelectItem key={detail.vendorId} value={detail.vendorId}>{v?.vendorName}</SelectItem>
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {financials && (
                                <Card className="bg-muted/30 border-primary/20">
                                    <CardContent className="pt-6 space-y-3">
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Main Price (Subtotal):</span><span className="font-bold">{formatCurrency(financials.subtotal)}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Applied Discount:</span><span className="text-red-500 font-bold">- {formatCurrency(financials.discount)}</span></div>
                                        <Separator />
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">VAT ({selectedVendorDetail?.vatPercentage}%):</span><span className="font-bold">+ {formatCurrency(financials.vat)}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Tax ({selectedVendorDetail?.taxPercentage}%):</span><span className="font-bold">+ {formatCurrency(financials.tax)}</span></div>
                                        <Separator />
                                        <div className="flex justify-between text-lg"><span className="font-extrabold">Final Billed Amount:</span><span className="text-primary font-black">{formatCurrency(financials.total)}</span></div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1">
                                <Label className="text-lg">Step 2: Review Commercial Terms</Label>
                                <p className="text-sm text-muted-foreground">Verify terms for <span className="font-bold text-foreground">{selectedVendor?.vendorName}</span></p>
                            </div>

                            <div className="grid gap-4">
                                <Card className="p-4 flex items-start gap-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg"><Hand className="h-5 w-5 text-blue-500" /></div>
                                    <div className="space-y-1"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivery Terms</p><p className="text-sm">{selectedVendorDetail?.deliveryTerms || 'Not Specified'}</p></div>
                                </Card>
                                <Card className="p-4 flex items-start gap-4">
                                    <div className="p-2 bg-green-500/10 rounded-lg"><DollarSign className="h-5 w-5 text-green-500" /></div>
                                    <div className="space-y-1"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Terms</p><p className="text-sm">{selectedVendorDetail?.paymentTerms || 'Not Specified'}</p></div>
                                </Card>
                                <Card className="p-4 flex items-start gap-4">
                                    <div className="p-2 bg-orange-500/10 rounded-lg"><FileText className="h-5 w-5 text-orange-500" /></div>
                                    <div className="space-y-1"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Warranty / Guarantee</p><p className="text-sm">{selectedVendorDetail?.warranty || 'Not Specified'}</p></div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8 animate-in zoom-in-95 duration-300">
                            <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-10 w-10 text-destructive animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Confirm Award Selection</h3>
                                <p className="text-muted-foreground max-w-md">
                                    You are about to award the contract to <span className="font-bold text-foreground">{selectedVendor?.vendorName}</span> for <span className="font-bold text-primary">{formatCurrency(financials?.total || 0)}</span>.
                                </p>
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm font-medium text-yellow-700 dark:text-yellow-400 mt-4">
                                    This action will freeze the selection and start the multi-level internal approval workflow. This cannot be undone easily.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between w-full border-t pt-4">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                        {step < 3 ? (
                            <Button onClick={handleNext} disabled={!selectedVendorId}>
                                Next Step <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button variant="destructive" onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-500/20">
                                Confirm Award & Start Approval
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function ComparativeStatementTable() {
    const { comparativeStatements, demandNotes, isLoading, employees, orgSettings, vendors, purchaseOrders } = useProcurement();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { handlePrint } = usePrint();

    const csRef = useMemoFirebase(() => firestore ? collection(firestore, 'comparativeStatements') : null, [firestore]);
    const poRef = useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isVendorSelectionOpen, setIsVendorSelectionOpen] = useState(false);
    const [selectedCsForVendor, setSelectedCsForVendor] = useState<ComparativeStatement | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedCsForStatus, setSelectedCsForStatus] = useState<ComparativeStatement | null>(null);
    const [isPoFormOpen, setIsPoFormOpen] = useState(false);
    const [selectedCsForPo, setSelectedCsForPo] = useState<any>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [user, employees]);
    const isSuperAdmin = user?.email === 'superadmin@galsolution.com';
    const isGPOfficer = orgSettings?.procurementSettings?.generalPurchaseOfficerId === currentUserEmployee?.id;
    const isManager = orgSettings?.procurementSettings?.managingDirectorId === currentUserEmployee?.id || 
                      orgSettings?.procurementSettings?.factoryDirectorId === currentUserEmployee?.id;

    const filteredItems = useMemo(() => {
        const safeItems = Array.isArray(comparativeStatements) ? comparativeStatements : [];
        return safeItems.filter(cs => {
            let isVisible = isSuperAdmin || isGPOfficer || isManager;
            if (!isVisible && currentUserEmployee) {
                const dn = demandNotes?.find(d => d.id === cs.demandNoteId);
                if (cs.createdBy === currentUserEmployee.id || 
                    cs.currentApproverId === currentUserEmployee.id || 
                    cs.approvalHistory?.some(h => h.approverId === currentUserEmployee.id) ||
                    cs.vendorSelectorId === currentUserEmployee.id ||
                    dn?.createdBy === currentUserEmployee.id ||
                    dn?.gpConcernOfficerId === currentUserEmployee.id) {
                    isVisible = true;
                }
            }
            if (!isVisible) return false;

            const dn = demandNotes?.find(d => d.id === cs.demandNoteId);
            return !searchTerm || cs.csNumber.toLowerCase().includes(searchTerm.toLowerCase()) || dn?.demandNoteNumber.toLowerCase().includes(searchTerm.toLowerCase());
        }).sort((a, b) => new Date(b.csDate || 0).getTime() - new Date(a.csDate || 0).getTime());
    }, [comparativeStatements, searchTerm, demandNotes, isSuperAdmin, isGPOfficer, isManager, currentUserEmployee]);

    const approvableItems = useMemo(() => filteredItems.filter(i => currentUserEmployee && i.currentApproverId === currentUserEmployee.id && i.approvalStatus !== 1 && i.approvalStatus !== 0 && i.approvalStatus !== 2), [filteredItems, currentUserEmployee]);

    const handleVendorSelected = (csId: string, vendorId: string) => {
        if (!csRef || !firestore) return;
        const cs = comparativeStatements.find(c => c.id === csId);
        if (!cs || !cs.approvalFlow?.steps) return;
        setDocumentNonBlocking(doc(csRef, csId), {
            selectedVendorId: vendorId,
            vendorSelectionDate: new Date().toISOString(),
            approvalStatus: 3, 
            currentApproverId: cs.approvalFlow.steps[0]?.approverId || '',
        }, { merge: true });
        toast({ title: "Vendor Awarded", description: "Internal approval workflow has been initiated." });
        setIsVendorSelectionOpen(false);
    };

    const handleBulkApproval = (status: number) => {
        if (!firestore || !currentUserEmployee || !csRef) return;
        selectedRows.forEach(id => {
            const cs = comparativeStatements.find(c => c.id === id);
            if (!cs || !cs.approvalFlow?.steps) return;
            const currentLevel = cs.approvalHistory?.length || 0;
            const newHistoryEntry = { approverId: currentUserEmployee.id, status: status === 1 ? 'Approved' : 'Rejected', timestamp: new Date().toISOString(), level: currentLevel, remarks: 'Bulk action' };
            let nextStatus = status === 1 ? (currentLevel + 1 < cs.approvalFlow.steps.length ? getNextApprovalStatusCode(currentLevel) : 1) : 0;
            let nextApprover = status === 1 && currentLevel + 1 < cs.approvalFlow.steps.length ? cs.approvalFlow.steps[currentLevel + 1].approverId : '';
            setDocumentNonBlocking(doc(csRef, id), { approvalStatus: nextStatus, currentApproverId: nextApprover, approvalHistory: [...(cs.approvalHistory || []), newHistoryEntry] }, { merge: true });
        });
        setSelectedRows([]);
        toast({ title: 'Processed' });
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search CS, DN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                        </div>
                        {selectedRows.length > 0 && (
                            <div className="flex items-center gap-2 ml-4">
                                <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => handleBulkApproval(1)}><Check className="mr-2 h-4 w-4" /> Approve ({selectedRows.length})</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}><X className="mr-2 h-4 w-4" /> Reject</Button>
                            </div>
                        )}
                    </div>
                    <Button variant="outline" className="text-primary border-primary hover:bg-primary/5" onClick={() => setIsGuideOpen(true)}><HelpCircle className="mr-2 h-4 w-4" /> User Guide</Button>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"><Checkbox checked={approvableItems.length > 0 && selectedRows.length === approvableItems.length} onCheckedChange={(c) => setSelectedRows(c ? approvableItems.map(i => i.id) : [])} /></TableHead>
                                <TableHead>CS Number</TableHead>
                                <TableHead>Demand Note</TableHead>
                                <TableHead>GP Concern</TableHead>
                                <TableHead>Awarded Vendor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[140px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((cs) => {
                                    const poExists = purchaseOrders?.some(po => po.csId === cs.id);
                                    const dn = demandNotes?.find(d => d.id === cs.demandNoteId);
                                    const concern = employees?.find(e => e.id === dn?.gpConcernOfficerId);
                                    
                                    const needsVendorSelection = cs.approvalStatus === 2 && (isSuperAdmin || isGPOfficer || currentUserEmployee?.id === cs.vendorSelectorId);
                                    const needsApproval = currentUserEmployee && cs.currentApproverId === currentUserEmployee.id && cs.approvalStatus !== 1 && cs.approvalStatus !== 0 && cs.approvalStatus !== 2;
                                    
                                    const isWaitingForMe = needsVendorSelection || needsApproval;
                                    const isApprovable = approvableItems.some(i => i.id === cs.id);

                                    return (
                                        <TableRow key={cs.id} className={cn("hover:bg-muted/30 transition-colors", isWaitingForMe && "bg-orange-500/5")}>
                                            <TableCell><Checkbox checked={selectedRows.includes(cs.id)} onCheckedChange={() => setSelectedRows(prev => prev.includes(cs.id) ? prev.filter(r => r !== cs.id) : [...prev, cs.id])} disabled={!isApprovable} /></TableCell>
                                            <TableCell><div className="flex items-center gap-1"><span>{cs.csNumber}</span><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { navigator.clipboard.writeText(cs.csNumber); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Copy CS#</TooltipContent></Tooltip></div></TableCell>
                                            <TableCell><div className="flex items-center gap-1"><span>{dn?.demandNoteNumber || 'N/A'}</span><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { navigator.clipboard.writeText(dn?.demandNoteNumber || ''); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Copy DN#</TooltipContent></Tooltip></div></TableCell>
                                            <TableCell><div className="flex flex-col"><span className="text-xs font-medium">{concern?.fullName || 'Unassigned'}</span>{dn?.gpAssignedDate && <span className="text-[9px] text-muted-foreground">{new Date(dn.gpAssignedDate).toLocaleString()}</span>}</div></TableCell>
                                            <TableCell><div className="flex flex-col"><span className="text-xs font-medium">{cs.selectedVendorId ? vendors?.find(v => v.id === cs.selectedVendorId)?.vendorName : 'N/A'}</span>{cs.vendorSelectionDate && <span className="text-[9px] text-muted-foreground">{new Date(cs.vendorSelectionDate).toLocaleString()}</span>}</div></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={cs.approvalStatus === 1 ? 'default' : 'secondary'}>{getCSStatusText(cs)}</Badge>
                                                    {needsVendorSelection && <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap">⚠️ Select Awarded Vendor</Badge>}
                                                    {needsApproval && <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap">⚠️ Approve Statement</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {needsVendorSelection && <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 animate-pulse" onClick={() => { setSelectedCsForVendor(cs); setIsVendorSelectionOpen(true); }}><Hand className="h-4 w-4" /></Button>}
                                                    {cs.approvalStatus === 1 && !poExists && (isSuperAdmin || isGPOfficer || (currentUserEmployee && dn?.gpConcernOfficerId === currentUserEmployee.id)) && <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => { setSelectedCsForPo(cs); setIsPoFormOpen(true); }}><FilePlus className="h-4 w-4" /></Button>}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setSelectedCsForStatus(cs); setIsStatusModalOpen(true);}}><Info className="h-4 w-4 text-blue-500"/></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/comparative-statements/${cs.id}`}><Eye className="h-4 w-4"/></Link></Button>
                                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => csRef && deleteDocumentNonBlocking(doc(csRef, cs.id))}><Trash2 className="h-4 w-4"/></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : <TableRow><TableCell colSpan={7} className="h-24 text-center">No statements found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            <VendorSelectionDialog cs={selectedCsForVendor} isOpen={isVendorSelectionOpen} onOpenChange={setIsVendorSelectionOpen} onVendorSelected={handleVendorSelected} vendors={vendors || []} />
            <PurchaseOrderForm isOpen={isPoFormOpen} setIsOpen={setIsPoFormOpen} onSave={(d) => { poRef && addDocumentNonBlocking(poRef, d); toast({ title: 'PO Created' }); }} cs={selectedCsForPo} />
            <CSUserGuide isOpen={isGuideOpen} onOpenChange={setIsGuideOpen} />

            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-lg animate-dialog-in">
                    <DialogHeader><DialogTitle>Approval Flow: {selectedCsForStatus?.csNumber}</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedCsForStatus?.approvalFlow?.steps.map((step, index) => {
                            const historyEntry = selectedCsForStatus.approvalHistory?.find((h:any) => h.level === index);
                            const approver = (employees || []).find(e => e.id === step.approverId);
                            const isPending = selectedCsForStatus.currentApproverId === step.approverId && selectedCsForStatus.approvalStatus !== 1 && selectedCsForStatus.approvalStatus !== 0;
                            return (
                                <li key={index} className="flex items-start gap-4 list-none">
                                    {historyEntry ? <CheckCircle className="h-6 w-6 text-green-500" /> : (isPending ? <Hourglass className="h-6 w-6 text-orange-500 animate-spin" /> : <MoreHorizontal className="h-6 w-6 text-muted-foreground" />)}
                                    <div className="flex-1 flex gap-3 items-center">
                                        <Avatar className="h-10 w-10 border"><AvatarFallback>{approver?.fullName?.charAt(0) || <UserIcon />}</AvatarFallback></Avatar>
                                        <div><p className="font-semibold">{step.stepName}</p><p className="text-sm">{approver?.fullName}</p>{historyEntry && <p className="text-[10px] text-muted-foreground">{new Date(historyEntry.timestamp).toLocaleString()}</p>}</div>
                                    </div>
                                </li>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}