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
import { Search, Eye, Trash2, Check, Printer, X, Info, CheckCircle, Hourglass, MoreHorizontal, Hand, FilePlus, Copy } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCSStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Label } from '@/components/ui/label';
import { PurchaseOrderForm } from './po-entry-form';
import { cn } from '@/lib/utils';

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

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);
    const handleConfirm = () => {
        if (cs && selectedVendorId) onVendorSelected(cs.id, selectedVendorId);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader><DialogTitle>Choose Vendor: {cs?.csNumber}</DialogTitle></DialogHeader>
                 <div className="py-4 space-y-4">
                    {step === 1 && (
                        <div>
                            <Label>Select Vendor</Label>
                            <Select onValueChange={setSelectedVendorId}>
                                <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                                <SelectContent>
                                    {(cs?.vendorDetails || []).map(detail => {
                                        const v = vendors.find(v => v.id === detail.vendorId);
                                        return <SelectItem key={detail.vendorId} value={detail.vendorId}>{v?.vendorName}</SelectItem>
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {step === 2 && <p className="p-4 text-center border bg-yellow-500/10 rounded-lg">Confirming this vendor will start the approval workflow.</p>}
                </div>
                <DialogFooter className="flex justify-between w-full">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1}>Back</Button>
                    {step === 1 ? <Button onClick={handleNext} disabled={!selectedVendorId}>Next</Button> : <Button onClick={handleConfirm}>Confirm</Button>}
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
        toast({ title: "Success", description: "Vendor awarded. Approval started." });
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
                                            <TableCell><div className="flex items-center gap-1"><span>{cs.csNumber}</span><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { navigator.clipboard.writeText(cs.csNumber); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Copy CS#</TooltipContent></Tooltip></div></TableCell>
                                            <TableCell><div className="flex items-center gap-1"><span>{dn?.demandNoteNumber || 'N/A'}</span><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { navigator.clipboard.writeText(dn?.demandNoteNumber || ''); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Copy DN#</TooltipContent></Tooltip></div></TableCell>
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
            
            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-lg">
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
                                        <Avatar className="h-10 w-10 border"><AvatarFallback>{approver?.fullName?.charAt(0)}</AvatarFallback></Avatar>
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
