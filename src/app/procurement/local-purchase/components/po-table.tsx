
"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useProcurement } from './procurement-provider';
import type { PurchaseOrder } from './po-entry-form';
import { useUser, useFirestore, addDocumentNonBlocking, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, XCircle, FilePlus, Eye, Printer, Info, CheckCircle, Hourglass, MoreHorizontal, Check, X, Filter, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PurchaseOrderForm } from './po-entry-form';
import { useToast } from '@/hooks/use-toast';
import { collection, doc } from 'firebase/firestore';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { getPOStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export function PurchaseOrderTable() {
    const { purchaseOrders, vendors, demandNotes, employees, comparativeStatements, isLoading, orgSettings } = useProcurement();
    const { user } = useUser();
    const { toast } = useToast();
    const { handlePrint } = usePrint();
    const firestore = useFirestore();
    const poCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('all');
    const [gpConcernFilter, setGpConcernFilter] = useState('all');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isPrepareDialogOpen, setIsPrepareDialogOpen] = useState(false);
    const [isPoFormOpen, setIsPoFormOpen] = useState(false);
    const [selectedCsForPo, setSelectedCsForPo] = useState<any>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedPoForStatus, setSelectedPoForStatus] = useState<PurchaseOrder | null>(null);

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
            // Visibility Check
            let isVisible = isSuperAdmin || isGPOfficer || isManager;
            if (!isVisible && currentUserEmployee) {
                const dn = demandNotes?.find(dn => dn.id === po.demandNoteId);
                if (po.createdBy === currentUserEmployee.id || 
                    po.currentApproverId === currentUserEmployee.id ||
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
        toast({ title: 'Success' });
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
                    {(isSuperAdmin || isGPOfficer) && <Button onClick={() => setIsPrepareDialogOpen(true)}><FilePlus className="mr-2 h-4 w-4" /> Prepare PO</Button>}
                </div>

                <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select value={gpConcernFilter} onValueChange={setGpConcernFilter}>
                            <SelectTrigger><SelectValue placeholder="GP Concern..." /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All GP Concerns</SelectItem>{gpConcernOfficers.map(o => <SelectItem key={o.id} value={o.id}>{o.fullName}</SelectItem>)}</SelectContent>
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
                                const isWaitingForMe = currentUserEmployee && po.currentApproverId === currentUserEmployee.id && po.approvalStatus !== 1 && po.approvalStatus !== 0;
                                const isApprovable = approvableItems.some(i => i.id === po.id);

                                return (
                                    <TableRow key={po.id} className={cn(isWaitingForMe && "bg-orange-500/5")}>
                                        <TableCell><Checkbox checked={selectedRows.includes(po.id)} onCheckedChange={() => setSelectedRows(prev => prev.includes(po.id) ? prev.filter(r => r !== po.id) : [...prev, po.id])} disabled={!isApprovable} /></TableCell>
                                        <TableCell><div className="flex items-center gap-1"><span>{po.poNumber}</span><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { navigator.clipboard.writeText(po.poNumber); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Copy PO#</TooltipContent></Tooltip></div></TableCell>
                                        <TableCell><div className="flex items-center gap-1"><span>{cs?.csNumber || 'N/A'}</span><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { navigator.clipboard.writeText(cs?.csNumber || ''); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Copy CS#</TooltipContent></Tooltip></div></TableCell>
                                        <TableCell><div className="flex items-center gap-1"><span>{dn?.demandNoteNumber || 'N/A'}</span><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => { navigator.clipboard.writeText(dn?.demandNoteNumber || ''); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Copy DN#</TooltipContent></Tooltip></div></TableCell>
                                        <TableCell>{vendors.find(v => v.id === po.vendorId)?.vendorName}</TableCell>
                                        <TableCell>{employees.find(e => e.id === dn?.gpConcernOfficerId)?.fullName}</TableCell>
                                        <TableCell><div className="flex items-center gap-2"><Badge variant={po.approvalStatus === 1 ? 'default' : 'secondary'}>{getPOStatusText(po)}</Badge>{isWaitingForMe && <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap">⚠️ Action Required</Badge>}</div></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setSelectedPoForStatus(po); setIsStatusModalOpen(true);}}><Info className="h-4 w-4 text-blue-500"/></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/purchase-orders/${po.id}`}><Eye className="h-4 w-4"/></Link></Button>
                                                {po.approvalStatus === 1 && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(po, 'purchase-order')}><Printer className="h-4 w-4"/></Button>}
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
        </TooltipProvider>
    );
}
