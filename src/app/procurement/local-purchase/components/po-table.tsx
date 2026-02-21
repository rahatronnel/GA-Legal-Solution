
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
import { 
    PlusCircle, Edit, Trash2, Search, Eye, Printer, Check, X, Filter, 
    XCircle, Copy, Send, PackageCheck, HelpCircle, Info, CheckCircle, 
    Hourglass, MoreHorizontal, ChevronLeft, ChevronRight, AlertTriangle, 
    ListOrdered, ShieldCheck 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { PurchaseOrder } from './po-entry-form';
import { PurchaseOrderForm } from './po-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import type { OrganizationSettings } from '@/app/settings/page';
import { getPOStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { MRREntryForm } from './mrr-entry-form';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const POUserGuide = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col animate-dialog-in">
            <DialogHeader>
                <div className="flex items-center gap-2 text-primary">
                    <HelpCircle className="h-6 w-6" />
                    <DialogTitle className="text-xl">Purchase Order (PO) User Guide</DialogTitle>
                </div>
                <DialogDescription>Essential instructions for managing vendor commitments.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[450px] border rounded-md">
                <div className="space-y-6 p-4">
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><Info className="h-4 w-4"/> Data Origin</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Purchase Orders are the final commitment stage. They are automatically generated from an <Badge variant="outline">Approved Comparative Statement (CS)</Badge>.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><ListOrdered className="h-4 w-4"/> Workflow Progression</h4>
                        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                            <li><strong>Preparation:</strong> The GP Concern verifies terms, delivery dates, and mandatory instructions.</li>
                            <li><strong>Approval:</strong> The document moves sequentially through internal review stages.</li>
                            <li><strong>Dispatch:</strong> Click <Send className="h-3 w-3 inline mx-1"/> to mark as formally sent to the vendor.</li>
                        </ul>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4"/> Management Oversight</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Visibility is restricted to GP personnel and the assigned approvers in the dynamic chain. All signatures are timestamped.
                        </p>
                    </section>
                </div>
                <ScrollBar orientation="vertical" />
            </ScrollArea>
            <DialogFooter className="border-t pt-4">
                <Button onClick={() => onOpenChange(false)}>Dismiss</Button>
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
                            <h3 className="font-bold flex items-center gap-2"><Info className="h-5 w-5" /> Step 1: Vendor Audit</h3>
                            <Card className="bg-muted/30 p-4">
                                <p className="font-bold">{vendor?.vendorName}</p>
                                <p className="text-sm text-muted-foreground">{vendor?.officeAddress}</p>
                            </Card>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="font-bold flex items-center gap-2"><Info className="h-5 w-5" /> Step 2: Financials</h3>
                            <div className="flex justify-between text-xl font-black"><span>Total Amount:</span><span className="text-primary">{formatCurrency(po.netPayableAmount)}</span></div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8 animate-in zoom-in-95 duration-300">
                            <AlertTriangle className="h-10 w-10 text-destructive animate-pulse" />
                            <h3 className="text-2xl font-bold">Confirm Sign-off</h3>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between w-full border-t pt-4">
                    <Button variant="outline" onClick={() => setStep(prev => prev - 1)} disabled={step === 1}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                    {step < 3 ? <Button onClick={() => setStep(prev => prev + 1)}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button> : <Button onClick={() => onApprove(po.id)} className="bg-green-600 hover:bg-green-700 text-white">Approve PO</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export function PurchaseOrderTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { handlePrint } = usePrint();
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
    const newHistoryEntry = { approverId: currentUserEmployee.id, status: 'Approved' as const, timestamp: new Date().toISOString(), level: currentLevel, remarks: 'Wizard approval' };
    let nextStatus = currentLevel + 1 < po.approvalFlow.steps.length ? getNextApprovalStatusCode(currentLevel) : 1;
    let nextApprover = currentLevel + 1 < po.approvalFlow.steps.length ? po.approvalFlow.steps[currentLevel + 1].approverId : '';
    setDocumentNonBlocking(doc(poRef, poId), { approvalStatus: nextStatus, currentApproverId: nextApprover, approvalHistory: [...(po.approvalHistory || []), newHistoryEntry] }, { merge: true });
    setIsApprovalWizardOpen(false);
    toast({ title: "Approved" });
  };

  const handleSendToVendor = (poId: string) => {
    if (!firestore || !poRef) return;
    setDocumentNonBlocking(doc(poRef, poId), { isSentToVendor: true, sentToVendorDate: new Date().toISOString() }, { merge: true });
    toast({ title: "PO Dispatched" });
  };

  const handleBulkApproval = (status: number) => {
    if (!firestore || !currentUserEmployee || !poRef) return;
    selectedRows.forEach(id => {
        const po = purchaseOrders.find(p => p.id === id);
        if (!po || !po.approvalFlow?.steps) return;
        const currentLevel = po.approvalHistory?.length || 0;
        const newHistoryEntry = { approverId: currentUserEmployee.id, status: status === 1 ? 'Approved' : 'Rejected', timestamp: new Date().toISOString(), level: currentLevel, remarks: 'Bulk action' };
        let nextStatus = status === 1 ? (currentLevel + 1 < po.approvalFlow.steps.length ? getNextApprovalStatusCode(currentLevel) : 1) : 0;
        let nextApprover = status === 1 && currentLevel + 1 < po.approvalFlow.steps.length ? po.approvalFlow.steps[currentLevel + 1].approverId : '';
        setDocumentNonBlocking(doc(poRef, id), { approvalStatus: nextStatus, currentApproverId: nextApprover, approvalHistory: [...(po.approvalHistory || []), newHistoryEntry] }, { merge: true });
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
                    <Button variant="outline" className="text-primary border-primary" onClick={() => setIsGuideOpen(true)}><HelpCircle className="mr-2 h-4 w-4" /> User Guide</Button>
                    {(isSuperAdmin || isGPOfficer) && <Button onClick={() => setIsPrepareDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Prepare PO</Button>}
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[50px]"><Checkbox checked={approvableItems.length > 0 && selectedRows.length === approvableItems.length} onCheckedChange={(c) => setSelectedRows(c ? approvableItems.map(i => i.id) : [])} /></TableHead>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Demand Note</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                                    <TableCell><div className="flex items-center gap-1"><span>{po.poNumber}</span><Button variant="ghost" size="icon" className="h-4 w-4 opacity-50" onClick={() => { navigator.clipboard.writeText(po.poNumber); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button></div></TableCell>
                                    <TableCell>{dn?.demandNoteNumber || 'N/A'}</TableCell>
                                    <TableCell>{vendors.find(v => v.id === po.vendorId)?.vendorName}</TableCell>
                                    <TableCell className="font-bold">
                                        {po.netPayableAmount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 items-start">
                                            <Badge variant={po.approvalStatus === 1 ? 'default' : 'secondary'}>{getPOStatusText(po)}</Badge>
                                            {po.isSentToVendor && po.sentToVendorDate && (
                                                <div className="text-[10px] text-muted-foreground leading-tight flex flex-col font-medium pl-1">
                                                    <span>{new Date(po.sentToVendorDate).toLocaleDateString()}</span>
                                                    <span>{new Date(po.sentToVendorDate).toLocaleTimeString()}</span>
                                                </div>
                                            )}
                                            {isWaitingForApproval && <Badge className="bg-orange-500 animate-pulse text-white text-[10px]">⚠️ Signing Required</Badge>}
                                            {canSend && <Badge className="bg-blue-500 animate-pulse text-white text-[10px]">⚠️ Dispatch Needed</Badge>}
                                            {canMrr && <Badge className="bg-green-600 animate-pulse text-white text-[10px]">⚠️ Receipt Ready</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {isWaitingForApproval && <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 animate-pulse" onClick={() => { setSelectedPoForApproval(po); setIsApprovalWizardOpen(true); }}><Check className="h-4 w-4" /></Button>}
                                            {canSend && <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 animate-pulse" onClick={() => handleSendToVendor(po.id)}><Send className="h-4 w-4" /></Button>}
                                            {canMrr && <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 animate-pulse" onClick={() => { setSelectedPoForMrr(po); setIsMrrFormOpen(true); }}><PackageCheck className="h-4 w-4" /></Button>}
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setSelectedPoForStatus(po); setIsStatusModalOpen(true);}}><Info className="h-4 w-4 text-blue-500"/></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/purchase-orders/${po.id}`}><Eye className="h-4 w-4"/></Link></Button>
                                            {po.approvalStatus === 1 && <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => window.open(`/procurement/local-purchase/purchase-orders/${po.id}/print`, '_blank')}><Printer className="h-4 w-4"/></Button>}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        }) : <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No records matching search.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </div>

        <Dialog open={isPrepareDialogOpen} onOpenChange={setIsPrepareDialogOpen}>
            <DialogContent className="animate-dialog-in"><DialogHeader><DialogTitle>Prepare PO from Approved CS</DialogTitle></DialogHeader>
                <ScrollArea className="h-64 border rounded-md">
                    {comparativeStatements.filter(cs => cs.approvalStatus === 1 && !purchaseOrders.some(po => po.csId === cs.id)).map(cs => (
                        <div key={cs.id} className="p-3 border-b flex justify-between items-center hover:bg-muted/50">
                            <div><p className="font-bold text-sm">{cs.csNumber}</p><p className="text-[10px] text-muted-foreground">{vendors.find(v => v.id === cs.selectedVendorId)?.vendorName}</p></div>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedCsForPo(cs); setIsPrepareDialogOpen(false); setIsPoFormOpen(true); }}>Select</Button>
                        </div>
                    ))}
                </ScrollArea>
            </DialogContent>
        </Dialog>

        <PurchaseOrderForm isOpen={isPoFormOpen} setIsOpen={setIsPoFormOpen} onSave={(d) => poRef && addDocumentNonBlocking(poRef, d)} cs={selectedCsForPo} />
        <MRREntryForm isOpen={isMrrFormOpen} setIsOpen={setIsMrrFormOpen} po={selectedPoForMrr} onSave={(d) => { mrrRef && addDocumentNonBlocking(mrrRef, d); toast({ title: 'MRR Logged' }); }} />
        <POApprovalWizard isOpen={isApprovalWizardOpen} onOpenChange={setIsApprovalWizardOpen} po={selectedPoForApproval} onApprove={handleApprovalAction} vendor={vendors.find(v => v.id === selectedPoForApproval?.vendorId)} />
        <POUserGuide isOpen={isGuideOpen} onOpenChange={setIsGuideOpen} />

        <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
            <DialogContent className="sm:max-w-md animate-dialog-in">
                <DialogHeader><DialogTitle>PO Audit Flow</DialogTitle></DialogHeader>
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
