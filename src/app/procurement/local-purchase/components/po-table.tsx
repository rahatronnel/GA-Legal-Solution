
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { useProcurement } from './procurement-provider';
import type { PurchaseOrder } from './po-entry-form';
import { useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, XCircle, FilePlus, Eye, Printer, Info, CheckCircle, Hourglass, MoreHorizontal, Check, X, Filter, Copy, ChevronRight, ChevronLeft, AlertTriangle, Building, DollarSign, Send, PackageCheck, HelpCircle, ListOrdered, ShieldCheck, UserCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PurchaseOrderForm } from './po-entry-form';
import { useToast } from '@/hooks/use-toast';
import { collection, doc } from 'firebase/firestore';
import { getPOStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { MRREntryForm } from './mrr-entry-form';

const POUserGuide = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <div className="flex items-center gap-2 text-primary">
                    <HelpCircle className="h-6 w-6" />
                    <DialogTitle className="text-xl">Purchase Order (PO) User Guide</DialogTitle>
                </div>
                <DialogDescription>Essential instructions for managing vendor commitments.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow pr-4">
                <div className="space-y-6 py-4">
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><Info className="h-4 w-4"/> Data Origin</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Purchase Orders are the final commitment stage. They are automatically generated from an <Badge variant="outline">Approved Comparative Statement (CS)</Badge>. The items, units, and awarded prices are strictly inherited from the CS to ensure financial integrity.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><ListOrdered className="h-4 w-4"/> Workflow Progression</h4>
                        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                            <li><strong>Preparation:</strong> The GP Concern verifies terms, delivery dates, and mandatory instructions.</li>
                            <li><strong>Approval:</strong> The document moves sequentially through internal review stages.</li>
                            <li><strong>Dispatch:</strong> Once <Badge>Completed</Badge>, the user MUST click the <Send className="h-3 w-3 inline mx-1"/> button to record the "Sent to Vendor" status.</li>
                            <li><strong>Receipt:</strong> After dispatch, the PO becomes eligible for a Material Receiving Report (MRR).</li>
                        </ul>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><UserCheck className="h-4 w-4"/> Approval Roles</h4>
                        <p className="text-sm text-muted-foreground">
                            Standard PO approval involves the <strong>Purchase Department Technical Advisor</strong> followed by the <strong>Purchase Manager</strong>. These roles are configured globally in the Procurement Settings.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4"/> Visibility & Security</h4>
                        <p className="text-sm text-muted-foreground">
                            Access is granted to: Superadmins, GP Officers, the assigned GP Concern, and all past/current approvers in the chain. Approvers retain access to view the PO even after their task is complete for auditing purposes.
                        </p>
                    </section>
                </div>
            </ScrollArea>
            <DialogFooter>
                <Button onClick={() => onOpenChange(false)}>Got it, Thanks!</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

const POApprovalWizard = ({
    po,
    isOpen,
    onOpenChange,
    onApprove,
    vendor
}: {
    po: PurchaseOrder | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onApprove: (poId: string) => void;
    vendor: any;
}) => {
    const [step, setStep] = useState(1);

    useEffect(() => {
        if (isOpen) setStep(1);
    }, [isOpen]);

    if (!po) return null;

    const formatCurrency = (amount: number | undefined) => 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Approve Purchase Order: {po.poNumber}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 1 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 2 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 3 ? "bg-primary" : "bg-muted")} />
                    </div>
                </DialogHeader>

                <div className="py-6 min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-700 dark:text-blue-400">
                                <Building className="h-5 w-5" />
                                <h3 className="font-bold">Step 1: Vendor Audit</h3>
                            </div>
                            <Card className="bg-muted/30 border-primary/20">
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Supplier Name</Label>
                                        <p className="text-lg font-bold">{vendor?.vendorName || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Office Address</Label>
                                        <p className="text-sm">{vendor?.officeAddress || 'N/A'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Contact Person</Label>
                                            <p className="text-sm font-semibold">{vendor?.contactPersonName || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Vendor Email</Label>
                                            <p className="text-sm">{vendor?.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-700 dark:text-green-400">
                                <DollarSign className="h-5 w-5" />
                                <h3 className="font-bold">Step 2: Financial Verification</h3>
                            </div>
                            <Card className="bg-muted/30 border-primary/10">
                                <CardContent className="pt-6 space-y-3">
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Subtotal Amount:</span><span className="font-bold">{formatCurrency(po.totalAmount)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Discount Applied:</span><span className="text-red-500 font-bold">- {formatCurrency(po.discountAmount)}</span></div>
                                    <Separator />
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">VAT Amount:</span><span className="font-bold">+ {formatCurrency(po.vatAmount)}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Tax Amount:</span><span className="font-bold">+ {formatCurrency(po.taxAmount)}</span></div>
                                    <Separator />
                                    <div className="flex justify-between text-xl"><span className="font-black">Net Billed Amount:</span><span className="text-primary font-black">{formatCurrency(po.netPayableAmount)}</span></div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8 animate-in zoom-in-95 duration-300">
                            <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-10 w-10 text-destructive animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Confirm PO Approval</h3>
                                <p className="text-muted-foreground max-w-md">
                                    You are about to sign off on PO <span className="font-bold text-foreground">#{po.poNumber}</span> for <span className="font-bold text-primary">{formatCurrency(po.netPayableAmount)}</span>.
                                </p>
                                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm font-medium text-orange-700 dark:text-orange-400 mt-4">
                                    Your approval will be recorded in the audit history with a digital timestamp.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between w-full border-t pt-4">
                    <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                        {step < 3 ? (
                            <Button onClick={() => setStep(s => s + 1)}>
                                Next Step <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={() => onApprove(po.id)} className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-500/20">
                                <Check className="mr-2 h-4 w-4" /> Finalize Approval
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export function PurchaseOrderTable() {
    const { purchaseOrders, vendors, demandNotes, employees, comparativeStatements, mrrs, isLoading, orgSettings } = useProcurement();
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const poCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]);
    const mrrCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'mrrs') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('all');
    const [gpConcernFilter, setGpConcernFilter] = useState('all');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isPrepareDialogOpen, setIsPrepareDialogOpen] = useState(false);
    const [isPoFormOpen, setIsPoFormOpen] = useState(false);
    const [selectedCsForPo, setSelectedCsForPo] = useState<any>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedPoForStatus, setSelectedPoForStatus] = useState<PurchaseOrder | null>(null);
    const [isApprovalWizardOpen, setIsApprovalWizardOpen] = useState(false);
    const [selectedPoForApproval, setSelectedPoForApproval] = useState<PurchaseOrder | null>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    
    const [isMrrFormOpen, setIsMrrFormOpen] = useState(false);
    const [selectedPoForMrr, setSelectedPoForMrr] = useState<PurchaseOrder | null>(null);

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [user, employees]);
    const isSuperAdmin = user?.email === 'superadmin@galsolution.com';
    const isGPOfficer = orgSettings?.procurementSettings?.generalPurchaseOfficerId === currentUserEmployee?.id;
    const isManager = orgSettings?.procurementSettings?.managingDirectorId === currentUserEmployee?.id || 
                      orgSettings?.procurementSettings?.factoryDirectorId === currentUserEmployee?.id;

    const gpConcernOfficers = useMemo(() => {
        const ids = orgSettings?.procurementSettings?.gpConcernOfficerIds || [];
        return ids.map(id => employees.find(e => e.id === id)).filter(Boolean);
    }, [orgSettings, employees]);

    const filteredPOs = useMemo(() => {
        const safePOs = Array.isArray(purchaseOrders) ? purchaseOrders : [];
        return safePOs.filter(po => {
            let isVisible = isSuperAdmin || isGPOfficer || isManager;
            if (!isVisible && currentUserEmployee) {
                const dn = demandNotes?.find(dn => dn.id === po.demandNoteId);
                if (po.createdBy === currentUserEmployee.id || 
                    po.currentApproverId === currentUserEmployee.id ||
                    po.approvalHistory?.some(h => h.approverId === currentUserEmployee.id) ||
                    dn?.createdBy === currentUserEmployee.id ||
                    dn?.gpConcernOfficerId === currentUserEmployee.id) {
                    isVisible = true;
                }
            }
            if (!isVisible) return false;

            const dn = demandNotes?.find(dn => dn.id === po.demandNoteId);
            const cs = comparativeStatements?.find(c => c.id === po.csId);
            const lowerTerm = searchTerm.toLowerCase();
            const termMatch = !searchTerm || po.poNumber.toLowerCase().includes(lowerTerm) || cs?.csNumber.toLowerCase().includes(lowerTerm) || dn?.demandNoteNumber.toLowerCase().includes(lowerTerm);
            const vendorMatch = vendorFilter === 'all' || po.vendorId === vendorFilter;
            const gpMatch = gpConcernFilter === 'all' || dn?.gpConcernOfficerId === gpConcernFilter;
            return termMatch && vendorMatch && gpMatch;
        }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [purchaseOrders, searchTerm, vendorFilter, gpConcernFilter, demandNotes, comparativeStatements, isSuperAdmin, isGPOfficer, isManager, currentUserEmployee]);

    const approvableItems = useMemo(() => filteredPOs.filter(po => currentUserEmployee && po.currentApproverId === currentUserEmployee.id && po.approvalStatus !== 1 && po.approvalStatus !== 0), [filteredPOs, currentUserEmployee]);

    const handleApprovalAction = (poId: string) => {
        if (!firestore || !currentUserEmployee || !poCollectionRef) return;
        const po = purchaseOrders.find(p => p.id === poId);
        if (!po || !po.approvalFlow?.steps) return;

        const currentLevel = po.approvalHistory?.length || 0;
        const newHistoryEntry = { 
            approverId: currentUserEmployee.id, 
            status: 'Approved', 
            timestamp: new Date().toISOString(), 
            level: currentLevel, 
            remarks: 'Approved via wizard' 
        };

        let nextStatus = currentLevel + 1 < po.approvalFlow.steps.length ? getNextApprovalStatusCode(currentLevel) : 1;
        let nextApprover = currentLevel + 1 < po.approvalFlow.steps.length ? po.approvalFlow.steps[currentLevel + 1].approverId : '';

        setDocumentNonBlocking(doc(poCollectionRef, poId), { 
            approvalStatus: nextStatus, 
            currentApproverId: nextApprover, 
            approvalHistory: [...(po.approvalHistory || []), newHistoryEntry] 
        }, { merge: true });

        setIsApprovalWizardOpen(false);
        toast({ title: "Success", description: "Purchase Order approved." });
    };

    const handleSendToVendor = (poId: string) => {
        if (!firestore || !poCollectionRef) return;
        setDocumentNonBlocking(doc(poCollectionRef, poId), {
            isSentToVendor: true,
            sentToVendorDate: new Date().toISOString()
        }, { merge: true });
        toast({ title: "PO Sent", description: "Purchase Order has been marked as sent to vendor." });
    };

    const handleBulkApproval = (status: number) => {
        if (!firestore || !currentUserEmployee || !poCollectionRef) return;
        selectedRows.forEach(id => {
            const po = purchaseOrders.find(p => p.id === id);
            if (!po || !po.approvalFlow?.steps) return;
            const currentLevel = po.approvalHistory?.length || 0;
            const newHistoryEntry = { approverId: currentUserEmployee.id, status: status === 1 ? 'Approved' : 'Rejected', timestamp: new Date().toISOString(), level: currentLevel, remarks: 'Bulk action' };
            let nextStatus = status === 1 ? (currentLevel + 1 < po.approvalFlow.steps.length ? getNextApprovalStatusCode(currentLevel) : 1) : 0;
            let nextApprover = status === 1 && currentLevel + 1 < po.approvalFlow.steps.length ? po.approvalFlow.steps[currentLevel + 1].approverId : '';
            setDocumentNonBlocking(doc(poCollectionRef, id), { approvalStatus: nextStatus, currentApproverId: nextApprover, approvalHistory: [...(po.approvalHistory || []), newHistoryEntry] }, { merge: true });
        });
        setSelectedRows([]);
        toast({ title: "Success" });
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative w-full sm:w-[350px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search PO#, CS#, DN#..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                        </div>
                        {selectedRows.length > 0 && (
                            <div className="flex items-center gap-2 ml-4">
                                <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => handleBulkApproval(1)}><Check className="mr-2 h-4 w-4" /> Approve ({selectedRows.length})</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}><X className="mr-2 h-4 w-4" /> Reject</Button>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="text-primary border-primary hover:bg-primary/5" onClick={() => setIsGuideOpen(true)}><HelpCircle className="mr-2 h-4 w-4" /> User Guide</Button>
                        {(isSuperAdmin || isGPOfficer) && <Button onClick={() => setIsPrepareDialogOpen(true)}><FilePlus className="mr-2 h-4 w-4" /> Prepare PO</Button>}
                    </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select value={gpConcernFilter} onValueChange={setGpConcernFilter}>
                            <SelectTrigger><SelectValue placeholder="GP Concern..." /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All GP Concerns</SelectItem>{gpConcernOfficers.map(o => <SelectItem key={o!.id} value={o!.id}>{o!.fullName}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={vendorFilter} onValueChange={setVendorFilter}>
                            <SelectTrigger><SelectValue placeholder="Vendor..." /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Vendors</SelectItem>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.vendorName}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button variant="ghost" onClick={() => { setSearchTerm(''); setVendorFilter('all'); setGpConcernFilter('all'); }}><XCircle className="mr-2 h-4 w-4" /> Clear All</Button>
                    </div>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"><Checkbox checked={approvableItems.length > 0 && selectedRows.length === approvableItems.length} onCheckedChange={(c) => setSelectedRows(c ? approvableItems.map(i => i.id) : [])} /></TableHead>
                                <TableHead>PO Number</TableHead>
                                <TableHead>CS Number</TableHead>
                                <TableHead>Demand Note</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>GP Concern</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPOs.length > 0 ? filteredPOs.map((po) => {
                                const dn = demandNotes?.find(dn => dn.id === po.demandNoteId);
                                const cs = comparativeStatements?.find(c => c.id === po.csId);
                                const mrr = mrrs.find(m => m.poId === po.id);
                                const isWaitingForApproval = currentUserEmployee && po.currentApproverId === currentUserEmployee.id && po.approvalStatus !== 1 && po.approvalStatus !== 0;
                                const canSend = po.approvalStatus === 1 && !po.isSentToVendor && (isSuperAdmin || isGPOfficer || (currentUserEmployee && dn?.gpConcernOfficerId === currentUserEmployee.id));
                                const canMrr = po.isSentToVendor && !mrr && (isSuperAdmin || isGPOfficer || (currentUserEmployee && dn?.gpConcernOfficerId === currentUserEmployee.id));
                                const isApprovable = approvableItems.some(i => i.id === po.id);

                                return (
                                    <TableRow key={po.id} className={cn("hover:bg-muted/30 transition-colors", (isWaitingForApproval || canSend || canMrr) && "bg-orange-500/5")}>
                                        <TableCell><Checkbox checked={selectedRows.includes(po.id)} onCheckedChange={() => setSelectedRows(prev => prev.includes(po.id) ? prev.filter(r => r !== po.id) : [...prev, po.id])} disabled={!isApprovable} /></TableCell>
                                        <TableCell><div className="flex items-center gap-1"><span>{po.poNumber}</span><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { navigator.clipboard.writeText(po.poNumber); toast({ title: 'Copied!' }); }}><Copy className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Copy PO#</TooltipContent></Tooltip></div></TableCell>
                                        <TableCell><div className="flex items-center gap-1"><span>{cs?.csNumber || 'N/A'}</span><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { navigator.clipboard.writeText(cs?.csNumber || ''); toast({ title: 'Copied!' }); }}><Copy className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Copy CS#</TooltipContent></Tooltip></div></TableCell>
                                        <TableCell><div className="flex items-center gap-1"><span>{dn?.demandNoteNumber || 'N/A'}</span><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { navigator.clipboard.writeText(dn?.demandNoteNumber || ''); toast({ title: 'Copied!' }); }}><Copy className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Copy DN#</TooltipContent></Tooltip></div></TableCell>
                                        <TableCell>{vendors.find(v => v.id === po.vendorId)?.vendorName}</TableCell>
                                        <TableCell>{employees.find(e => e.id === dn?.gpConcernOfficerId)?.fullName}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={po.approvalStatus === 1 ? 'default' : 'secondary'}>{getPOStatusText(po)}</Badge>
                                                {isWaitingForApproval && <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap">⚠️ Approve Purchase Order</Badge>}
                                                {canSend && <Badge className="bg-blue-500 animate-pulse text-white whitespace-nowrap">⚠️ Send to Vendor</Badge>}
                                                {canMrr && <Badge className="bg-green-600 animate-pulse text-white whitespace-nowrap">⚠️ Prepare MRR</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {isWaitingForApproval && (
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 animate-pulse" onClick={() => { setSelectedPoForApproval(po); setIsApprovalWizardOpen(true); }}><Check className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Informed Approval</TooltipContent></Tooltip>
                                                )}
                                                {canSend && (
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 animate-pulse" onClick={() => handleSendToVendor(po.id)}><Send className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Mark as Sent to Vendor</TooltipContent></Tooltip>
                                                )}
                                                {canMrr && (
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 animate-pulse" onClick={() => { setSelectedPoForMrr(po); setIsMrrFormOpen(true); }}><PackageCheck className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Prepare MRR</TooltipContent></Tooltip>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setSelectedPoForStatus(po); setIsStatusModalOpen(true);}}><Info className="h-4 w-4 text-blue-500"/></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/purchase-orders/${po.id}`}><Eye className="h-4 w-4"/></Link></Button>
                                                {po.approvalStatus === 1 && (
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`/procurement/local-purchase/purchase-orders/${po.id}/print`, '_blank')}><Printer className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Print in New Tab</TooltipContent></Tooltip>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : <TableRow><TableCell colSpan={8} className="text-center h-24">No POs found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isPrepareDialogOpen} onOpenChange={setIsPrepareDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>Prepare PO</DialogTitle></DialogHeader>
                    <ScrollArea className="h-64 border rounded-md">
                        {comparativeStatements.filter(cs => cs.approvalStatus === 1 && !purchaseOrders.some(po => po.csId === cs.id)).map(cs => (
                            <div key={cs.id} className="p-3 border-b flex justify-between items-center">
                                <div><p className="font-semibold">{cs.csNumber}</p><p className="text-xs">{vendors.find(v => v.id === cs.selectedVendorId)?.vendorName}</p></div>
                                <Button size="sm" onClick={() => { setSelectedCsForPo(cs); setIsPrepareDialogOpen(false); setIsPoFormOpen(true); }}>Select</Button>
                            </div>
                        ))}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <PurchaseOrderForm isOpen={isPoFormOpen} setIsOpen={setIsPoFormOpen} onSave={(d) => addDocumentNonBlocking(poCollectionRef!, d)} cs={selectedCsForPo} />

            <MRREntryForm 
                isOpen={isMrrFormOpen} 
                setIsOpen={setIsMrrFormOpen} 
                po={selectedPoForMrr} 
                onSave={(d) => { mrrCollectionRef && addDocumentNonBlocking(mrrCollectionRef, d); toast({ title: 'MRR Prepared' }); }} 
            />

            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>PO Approval Flow</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedPoForStatus?.approvalFlow?.steps.map((step, index) => {
                            const historyEntry = selectedPoForStatus.approvalHistory?.find(h => h.level === index);
                            const approver = employees?.find(e => e.id === step.approverId);
                            const isPending = selectedPoForStatus.currentApproverId === step.approverId && selectedPoForStatus.approvalStatus !== 1 && selectedPoForStatus.approvalStatus !== 0;
                            return (
                                <li key={index} className="flex items-center gap-4 list-none">
                                    {historyEntry ? <CheckCircle className="h-6 w-6 text-green-500" /> : (isPending ? <Hourglass className="h-6 w-6 text-orange-500 animate-spin" /> : <MoreHorizontal className="h-6 w-6 text-muted-foreground" />)}
                                    <div className="flex-1 flex gap-3 items-center">
                                        <Avatar className="h-10 w-10 border"><AvatarFallback>{approver?.fullName?.charAt(0)}</AvatarFallback></Avatar>
                                        <div><p className="font-semibold">{step.stepName}</p><p className="text-sm">{approver?.fullName}</p>{historyEntry && <p className="text-[10px] text-muted-foreground">{new Date(historyEntry.timestamp).toLocaleString()}</p>}</div>
                                    </div>
                                </li>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            <POApprovalWizard 
                isOpen={isApprovalWizardOpen}
                onOpenChange={setIsApprovalWizardOpen}
                po={selectedPoForApproval}
                onApprove={handleApprovalAction}
                vendor={vendors.find(v => v.id === selectedPoForApproval?.vendorId)}
            />

            <POUserGuide isOpen={isGuideOpen} onOpenChange={setIsGuideOpen} />
        </TooltipProvider>
    );
}
