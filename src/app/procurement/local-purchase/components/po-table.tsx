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
import { useToast } from '@/hooks/use-toast';
import { 
    PlusCircle, Edit, Trash2, Search, Eye, Printer, Check, X, Filter, 
    XCircle, Copy, Send, PackageCheck, HelpCircle, Info, CheckCircle, 
    Hourglass, MoreHorizontal, ChevronLeft, ChevronRight, AlertTriangle, 
    ListOrdered, ShieldCheck, ShoppingCart, TrendingUp, DollarSign, 
    FileText, Gavel, BarChart2, Briefcase, ClipboardCheck, Package, Truck
} from 'lucide-react';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { PurchaseOrder } from './po-entry-form';
import { PurchaseOrderForm } from './po-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MRREntryForm } from './mrr-entry-form';
import { getPOStatusText, getNextApprovalStatusCode } from '../lib/status-helper';

const POUserGuide = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col animate-dialog-in p-0 overflow-hidden">
                <div className="bg-primary p-6 text-primary-foreground shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <ShoppingCart className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-white">PO Master Operational Guide</DialogTitle>
                            <DialogDescription className="text-primary-foreground/80 font-medium">Standard operating procedures for formal vendor commitment & legal documentation.</DialogDescription>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-6 space-y-8 pb-32">
                        <section className="space-y-4">
                            <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Visual Lifecycle Flow
                            </h4>
                            <div className="relative p-6 border-2 border-dashed rounded-2xl bg-muted/30 overflow-hidden">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><BarChart2 className="h-5 w-5" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight">CS<br/>Approved</span>
                                    </div>
                                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground animate-pulse" />
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><FileText className="h-5 w-5" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight">PO Draft<br/>Prepared</span>
                                    </div>
                                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground animate-pulse" />
                                    <div className="flex flex-col items-center gap-2 group scale-125">
                                        <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl ring-4 ring-primary/20 group-hover:rotate-12 transition-transform"><ShoppingCart className="h-6 w-6" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight text-primary">Signature<br/>Chain</span>
                                    </div>
                                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground animate-pulse" />
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Send className="h-5 w-5" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight">PO Sent<br/>to Vendor</span>
                                    </div>
                                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground animate-pulse" />
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="h-10 w-10 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><ClipboardCheck className="h-5 w-5" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight">Ready for<br/>Receipt (MRR)</span>
                                    </div>
                                </div>
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted-foreground/10 -translate-y-1/2 hidden md:block" />
                            </div>
                        </section>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6 space-y-2">
                                    <h5 className="font-bold flex items-center gap-2 text-blue-600"><Gavel className="h-4 w-4"/> Legal Commitment</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        The Purchase Order is a legally binding contract. Once approved and sent, it authorizes the vendor to deliver and invoice according to the predefined terms.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6 space-y-2">
                                    <h5 className="font-bold flex items-center gap-2 text-emerald-600"><DollarSign className="h-4 w-4"/> Financial Integrity</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        PO amounts are automatically synced from the **Approved CS**. This ensures that the final commitment matches the audit-vetted analysis exactly.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6 space-y-2">
                                    <h5 className="font-bold flex items-center gap-2 text-amber-600"><Send className="h-4 w-4"/> Dispatch Protocol</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Internal approval is only the first step. You must click the **"Send to Vendor"** icon to formally release the PO and start the delivery timer.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6 space-y-2">
                                    <h5 className="font-bold flex items-center gap-2 text-purple-600"><ShieldCheck className="h-4 w-4"/> Management Oversight</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Visibility is restricted to GP personnel and assigned approvers. Every signature is digitally timestamped for accounting audit trails.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="p-4 bg-primary/5 border rounded-xl space-y-3">
                            <h5 className="font-black text-[10px] uppercase tracking-tighter text-primary flex items-center gap-2"><Info className="h-4 w-4" /> Operational Constraint</h5>
                            <p className="text-xs text-muted-foreground italic">
                                POs cannot be modified once they enter the approval chain. Ensure all terms and descriptions are verified during the draft phase.
                            </p>
                        </div>
                    </div>
                    <ScrollBar orientation="vertical" />
                </ScrollArea>
                
                <DialogFooter className="p-4 border-t shrink-0">
                    <Button onClick={() => onOpenChange(false)} className="w-full font-bold uppercase tracking-widest text-white">Understood, Access PO Desk</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

function POApprovalWizard({
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
}) {
    const [step, setStep] = useState(1);

    useEffect(() => {
        if (isOpen) setStep(1);
    }, [isOpen]);

    if (!po) return null;

    const formatCurrency = (amount: number | undefined) => 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl animate-dialog-in">
                <DialogHeader>
                    <DialogTitle>Approve PO: {po.poNumber}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 1 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 2 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 3 ? "bg-primary" : "bg-muted")} />
                    </div>
                </DialogHeader>

                <div className="py-6 min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="font-bold flex items-center gap-2"><Info className="h-5 w-5 text-blue-500" /> Step 1: Vendor Audit</h3>
                            <Card className="bg-muted/30 p-4 border-primary/10">
                                <p className="font-bold text-lg">{vendor?.vendorName}</p>
                                <p className="text-sm text-muted-foreground">{vendor?.officeAddress}</p>
                            </Card>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="font-bold flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600" /> Step 2: Financial Liability</h3>
                            <div className="flex justify-between text-2xl font-black p-4 bg-muted/20 rounded-lg border border-dashed border-primary/20">
                                <span>Total Amount:</span>
                                <span className="text-primary">{formatCurrency(po.netPayableAmount)}</span>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8 animate-in zoom-in-95 duration-300">
                            <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-10 w-10 text-destructive animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-bold">Confirm Digital Sign-off</h3>
                            <p className="text-sm text-muted-foreground">Your signature will be recorded with a non-repudiable timestamp.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between w-full border-t pt-4">
                    <Button variant="outline" onClick={() => setStep(prev => prev - 1)} disabled={step === 1}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                    {step < 3 ? (
                        <Button onClick={() => setStep(prev => prev + 1)}>Next Review Step <ChevronRight className="ml-2 h-4 w-4" /></Button>
                    ) : (
                        <Button variant="destructive" onClick={() => onApprove(po.id)} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 font-bold">Approve & Sign PO</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function PurchaseOrderTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const { purchaseOrders, vendors, demandNotes, employees, comparativeStatements, mrrs, isLoading, orgSettings } = useProcurement();
  
  const poRef = useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]);
  const mrrRef = useMemoFirebase(() => firestore ? collection(firestore, 'mrrs') : null, [firestore]);

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

  const filteredPOs = useMemo(() => {
    const safePOs = Array.isArray(purchaseOrders) ? purchaseOrders : [];
    return safePOs.filter(po => {
        const dn = demandNotes?.find(note => note.id === po.demandNoteId);
        const lowerTerm = searchTerm.toLowerCase();
        const termMatch = !searchTerm || po.poNumber.toLowerCase().includes(lowerTerm) || dn?.demandNoteNumber.toLowerCase().includes(lowerTerm);
        const vendorMatch = vendorFilter === 'all' || po.vendorId === vendorFilter;
        const gpMatch = gpConcernFilter === 'all' || dn?.gpConcernOfficerId === gpConcernFilter;
        return termMatch && vendorMatch && gpMatch;
    }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [purchaseOrders, searchTerm, vendorFilter, gpConcernFilter, demandNotes]);

  const approvableItems = useMemo(() => filteredPOs.filter(po => currentUserEmployee && po.currentApproverId === currentUserEmployee.id && po.approvalStatus !== 1 && po.approvalStatus !== 0), [filteredPOs, currentUserEmployee]);

  const handleApprovalAction = (poId: string) => {
    if (!firestore || !currentUserEmployee || !poRef) return;
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po || !po.approvalFlow?.steps) return;
    const currentLevel = po.approvalHistory?.length || 0;
    const newHistoryEntry = { 
        approverId: currentUserEmployee.id, 
        status: 'Approved' as const, 
        timestamp: new Date().toISOString(), 
        level: currentLevel, 
        remarks: 'Wizard approval sign-off' 
    };
    let nextStatus = currentLevel + 1 < po.approvalFlow.steps.length ? getNextApprovalStatusCode(currentLevel) : 1;
    let nextApprover = currentLevel + 1 < po.approvalFlow.steps.length ? po.approvalFlow.steps[currentLevel + 1].approverId : '';
    setDocumentNonBlocking(doc(poRef, poId), { approvalStatus: nextStatus, currentApproverId: nextApprover, approvalHistory: [...(po.approvalHistory || []), newHistoryEntry] }, { merge: true });
    setIsApprovalWizardOpen(false);
    toast({ title: "Approved Successfully" });
  };

  const handleSendToVendor = (poId: string) => {
    if (!firestore || !poRef) return;
    setDocumentNonBlocking(doc(poRef, poId), { isSentToVendor: true, sentToVendorDate: new Date().toISOString() }, { merge: true });
    toast({ title: "PO Dispatched", description: "Formal notification sent to supplier." });
  };

  const handleBulkApproval = (status: number) => {
    if (!firestore || !currentUserEmployee || !poRef) return;
    selectedRows.forEach(id => {
        const po = purchaseOrders.find(p => p.id === id);
        if (!po || !po.approvalFlow?.steps) return;
        const currentLevel = po.approvalHistory?.length || 0;
        const newHistoryEntry = { approverId: currentUserEmployee.id, status: status === 1 ? 'Approved' : 'Rejected', timestamp: new Date().toISOString(), level: currentLevel, remarks: 'Bulk list action' };
        let nextStatus = status === 1 ? (currentLevel + 1 < po.approvalFlow.steps.length ? getNextApprovalStatusCode(currentLevel) : 1) : 0;
        let nextApprover = status === 1 && currentLevel + 1 < po.approvalFlow.steps.length ? po.approvalFlow.steps[currentLevel + 1].approverId : '';
        setDocumentNonBlocking(doc(poRef, id), { approvalStatus: nextStatus, currentApproverId: nextApprover, approvalHistory: [...(po.approvalHistory || []), newHistoryEntry] }, { merge: true });
    });
    setSelectedRows([]);
    toast({ title: "Bulk Action Processed" });
  };

  return (
    <TooltipProvider>
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative w-full sm:w-[350px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search PO#, DN#..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                    </div>
                    {selectedRows.length > 0 && (
                        <div className="flex items-center gap-2 ml-4">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => handleBulkApproval(1)}><Check className="mr-2 h-4 w-4" /> Approve ({selectedRows.length})</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}><X className="mr-2 h-4 w-4" /> Reject</Button>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="text-primary border-primary animate-scale-in" onClick={() => setIsGuideOpen(true)}><HelpCircle className="mr-2 h-4 w-4" /> User Guide</Button>
                    {(isSuperAdmin || isGPOfficer) && <Button onClick={() => setIsPrepareDialogOpen(true)} className="animate-scale-in"><PlusCircle className="mr-2 h-4 w-4" /> Prepare PO</Button>}
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[50px]"><Checkbox checked={approvableItems.length > 0 && selectedRows.length === approvableItems.length} onCheckedChange={(c) => setSelectedRows(c ? approvableItems.map(i => i.id) : [])} /></TableHead>
                            <TableHead className="font-bold">PO Number</TableHead>
                            <TableHead className="font-bold">Demand Note</TableHead>
                            <TableHead className="font-bold">GP Concern</TableHead>
                            <TableHead className="font-bold">Vendor</TableHead>
                            <TableHead className="font-bold">Amount</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="w-[140px] text-right font-bold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPOs.length > 0 ? filteredPOs.map((po) => {
                            const dn = demandNotes?.find(note => note.id === po.demandNoteId);
                            const mrr = mrrs.find(m => m.poId === po.id);
                            const isWaitingForApproval = currentUserEmployee && po.currentApproverId === currentUserEmployee.id && po.approvalStatus !== 1 && po.approvalStatus !== 0;
                            const canSend = po.approvalStatus === 1 && !po.isSentToVendor && (isSuperAdmin || isGPOfficer || (currentUserEmployee && dn?.gpConcernOfficerId === currentUserEmployee.id));
                            const canMrr = po.isSentToVendor && !mrr && (isSuperAdmin || isGPOfficer || (currentUserEmployee && dn?.gpConcernOfficerId === currentUserEmployee.id));
                            const isApprovable = approvableItems.some(i => i.id === po.id);

                            return (
                                <TableRow key={po.id} className={cn("hover:bg-muted/30 transition-colors", (isWaitingForApproval || canSend || canMrr) && "bg-orange-500/5")}>
                                    <TableCell><Checkbox checked={selectedRows.includes(po.id)} onCheckedChange={() => setSelectedRows(prev => prev.includes(po.id) ? prev.filter(r => r !== po.id) : [...prev, po.id])} disabled={!isApprovable} /></TableCell>
                                    <TableCell><div className="flex items-center gap-1 font-medium"><span>{po.poNumber}</span><Button variant="ghost" size="icon" className="h-4 w-4 opacity-50 hover:opacity-100" onClick={() => { navigator.clipboard.writeText(po.poNumber); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button></div></TableCell>
                                    <TableCell>{dn?.demandNoteNumber || 'N/A'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-primary">{employees?.find(e => e.id === dn?.gpConcernOfficerId)?.fullName || 'Unassigned'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs max-w-[150px] truncate">{vendors.find(v => v.id === po.vendorId)?.vendorName}</TableCell>
                                    <TableCell className="font-bold font-mono text-primary">
                                        {po.netPayableAmount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 items-start py-1 text-[10px]">
                                            <Badge variant={po.approvalStatus === 1 ? 'default' : 'secondary'} className="whitespace-nowrap text-[9px] h-4">{getPOStatusText(po)}</Badge>
                                            {po.isSentToVendor && po.sentToVendorDate && (
                                                <div className="text-[10px] text-muted-foreground leading-tight flex flex-col font-medium pl-1 italic border-l-2 border-primary/20 ml-1">
                                                    <span>{new Date(po.sentToVendorDate).toLocaleDateString()}</span>
                                                    <span>{new Date(po.sentToVendorDate).toLocaleTimeString()}</span>
                                                </div>
                                            )}
                                            {isWaitingForApproval && <Badge className="bg-orange-500 animate-pulse text-white text-[9px] h-4">⚠️ Signing Required</Badge>}
                                            {canSend && <Badge className="bg-blue-500 animate-pulse text-white text-[9px] h-4">⚠️ Dispatch Needed</Badge>}
                                            {canMrr && <Badge className="bg-green-600 animate-pulse text-white text-[9px] h-4">⚠️ Receipt Ready</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {isWaitingForApproval && <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 animate-pulse" onClick={() => { setSelectedPoForApproval(po); setIsApprovalWizardOpen(true); }}><Check className="mr-2 h-4 w-4" /></Button>}
                                            {canSend && <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 animate-pulse" onClick={() => handleSendToVendor(po.id)}><Send className="mr-2 h-4 w-4" /></Button>}
                                            {canMrr && <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 animate-pulse" onClick={() => { setSelectedPoForMrr(po); setIsMrrFormOpen(true); }}><PackageCheck className="h-4 w-4" /></Button>}
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setSelectedPoForStatus(po); setIsStatusModalOpen(true);}}><Info className="h-4 w-4 text-blue-500"/></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/purchase-orders/${po.id}`}><Eye className="h-4 w-4"/></Link></Button>
                                            {po.approvalStatus === 1 && <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => window.open(`/procurement/local-purchase/purchase-orders/${po.id}/print`, '_blank')}><Printer className="mr-2 h-4 w-4"/></Button>}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        }) : <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground italic">No Purchase Orders matching your search criteria.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </div>

        <Dialog open={isPrepareDialogOpen} onOpenChange={setIsPrepareDialogOpen}>
            <DialogContent className="animate-dialog-in max-w-lg"><DialogHeader><DialogTitle>Select Approved CS to Prepare PO</DialogTitle><DialogDescription>Choose a finalized statement to generate an official Purchase Order.</DialogDescription></DialogHeader>
                <ScrollArea className="h-64 border rounded-md p-2 bg-muted/5">
                    {comparativeStatements.filter(cs => cs.approvalStatus === 1 && !purchaseOrders.some(po => po.csId === cs.id)).map(cs => (
                        <div key={cs.id} className="p-3 border-b flex justify-between items-center hover:bg-muted/50 rounded-lg transition-colors mb-1">
                            <div><p className="font-bold text-sm">{cs.csNumber}</p><p className="text-[10px] text-muted-foreground uppercase font-black">{vendors.find(v => v.id === cs.selectedVendorId)?.vendorName}</p></div>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedCsForPo(cs); setIsPrepareDialogOpen(false); setIsPoFormOpen(true); }}>Select CS</Button>
                        </div>
                    ))}
                    {comparativeStatements.filter(cs => cs.approvalStatus === 1 && !purchaseOrders.some(po => po.csId === cs.id)).length === 0 && (
                        <div className="p-8 text-center text-muted-foreground text-xs italic">No approved Comparative Statements available for PO generation.</div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>

        <PurchaseOrderForm isOpen={isPoFormOpen} setIsOpen={setIsPoFormOpen} onSave={(d) => poRef && addDocumentNonBlocking(poRef, d)} cs={selectedCsForPo} />
        <MRREntryForm isOpen={isMrrFormOpen} setIsOpen={setIsMrrFormOpen} po={selectedPoForMrr} onSave={(d) => { mrrRef && addDocumentNonBlocking(mrrRef, d); toast({ title: 'MRR Logged' }); }} />
        <POApprovalWizard isOpen={isApprovalWizardOpen} onOpenChange={setIsApprovalWizardOpen} po={selectedPoForApproval} onApprove={() => handleApprovalAction(selectedPoForApproval!.id)} vendor={vendors.find(v => v.id === selectedPoForApproval?.vendorId)} />
        
        {isGuideOpen && <POUserGuide isOpen={isGuideOpen} onOpenChange={setIsGuideOpen} />}

        <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
            <DialogContent className="sm:max-w-md animate-dialog-in">
                <DialogHeader><DialogTitle>PO Audit Flow: {selectedPoForStatus?.poNumber}</DialogTitle></DialogHeader>
                <div className="py-4 space-y-4">
                    {selectedPoForStatus?.approvalFlow?.steps.map((step, index) => {
                        const historyEntry = selectedPoForStatus.approvalHistory?.find(h => h.level === index);
                        const isPending = selectedPoForStatus.currentApproverId === step.approverId && selectedPoForStatus.approvalStatus !== 1;
                        return (
                            <li key={index} className="flex items-center gap-4 list-none">
                                {historyEntry ? <CheckCircle className="h-6 w-6 text-green-500" /> : (isPending ? <Hourglass className="h-6 w-6 text-orange-500 animate-spin" /> : <MoreHorizontal className="h-6 w-6 text-muted-foreground" />)}
                                <div className="flex-1">
                                    <p className="font-bold text-sm">{step.stepName}</p>
                                    <p className="text-xs text-muted-foreground">{employees?.find(e => e.id === step.approverId)?.fullName}</p>
                                    {historyEntry && <p className="text-[10px] text-muted-foreground italic">Approved on {new Date(historyEntry.timestamp).toLocaleString()}</p>}
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
