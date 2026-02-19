
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
import { Search, XCircle, FilePlus, Eye, Printer, Info, CheckCircle, Hourglass, MoreHorizontal, Check, X, Filter } from 'lucide-react';
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
    const { purchaseOrders, vendors, demandNotes, employees, comparativeStatements, isLoading, orgSettings, designations } = useProcurement();
    const { user } = useUser();
    const { toast } = useToast();
    const { handlePrint } = usePrint();
    const firestore = useFirestore();
    const poCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('all');
    const [gpConcernFilter, setGpConcernFilter] = useState('all');
    
    const [isPrepareDialogOpen, setIsPrepareDialogOpen] = useState(false);
    const [isPoFormOpen, setIsPoFormOpen] = useState(false);
    const [selectedCsForPo, setSelectedCsForPo] = useState<any>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedPoForStatus, setSelectedPoForStatus] = useState<PurchaseOrder | null>(null);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    const currentUserEmployee = useMemo(() => {
        if (!user || !employees) return null;
        return employees.find(e => e.email === user.email);
    }, [user, employees]);

    const roleData = useMemo(() => {
        const superAdminCheck = user?.email === 'superadmin@galsolution.com';
        const settings = orgSettings?.procurementSettings;
        if (!settings || !currentUserEmployee) return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isGPConcern: false, isCsApprover: false };

        const GPO = settings.generalPurchaseOfficerId === currentUserEmployee.id;
        const GPC = !!settings.gpConcernOfficerIds?.includes(currentUserEmployee.id);
        
        let csApproverCheck = false;
        const csRoles = settings.csApprovalRoles;
        if (csRoles) {
            const roleIds = [
                csRoles.purchaseManagerId, csRoles.purchaseDeptTaId, csRoles.viceFactoryManagerId,
                csRoles.accountsManagerId, csRoles.gmSalesDeptId, csRoles.gmAdministrationId,
            ];
            if (roleIds.includes(currentUserEmployee.id)) csApproverCheck = true;
        }
        if (!csApproverCheck && settings.departmentHeads?.some(dh => dh.technicalAdvisorId === currentUserEmployee.id)) csApproverCheck = true;
        if (!csApproverCheck && settings.specializedDeptTaId === currentUserEmployee.id) csApproverCheck = true;

        return { isSuperAdmin: superAdminCheck, isGPOfficer: GPO, isGPConcern: GPC, isCsApprover: csApproverCheck };
    }, [orgSettings, currentUserEmployee, user]);

    const { isSuperAdmin, isGPOfficer } = roleData;

    const getVendorName = (id: string) => vendors?.find(v => v.id === id)?.vendorName || 'N/A';
    const getDemandNoteNumber = (id: string) => demandNotes?.find(dn => dn.id === id)?.demandNoteNumber || 'N/A';
    const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.fullName || 'N/A';
    const formatCurrency = (amount?: number) => amount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount) : 'N/A';

    const gpConcernOfficers = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        if (!settings || !employees) return [];
        return (settings.gpConcernOfficerIds || [])
            .map(id => employees.find(e => e.id === id))
            .filter(Boolean);
    }, [orgSettings, employees]);

    const filteredPOs = useMemo(() => {
        const safePOs = Array.isArray(purchaseOrders) ? purchaseOrders : [];
        return safePOs.filter(po => {
            const lowerTerm = searchTerm.toLowerCase();
            const demandNote = demandNotes?.find(dn => dn.id === po.demandNoteId);
            const cs = comparativeStatements?.find(c => c.id === po.csId);
            
            const searchTermMatch = !searchTerm || 
                po.poNumber.toLowerCase().includes(lowerTerm) || 
                (cs?.csNumber.toLowerCase().includes(lowerTerm)) ||
                (demandNote?.demandNoteNumber.toLowerCase().includes(lowerTerm));

            const vendorMatch = vendorFilter === 'all' || po.vendorId === vendorFilter;
            const gpMatch = gpConcernFilter === 'all' || demandNote?.gpConcernOfficerId === gpConcernFilter;

            return searchTermMatch && vendorMatch && gpMatch;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [purchaseOrders, searchTerm, vendorFilter, gpConcernFilter, demandNotes, comparativeStatements]);

    const approvableItems = useMemo(() => {
        return filteredPOs.filter(po => 
            po.approvalStatus !== 1 && 
            po.approvalStatus !== 0 && 
            currentUserEmployee && 
            po.currentApproverId === currentUserEmployee.id
        );
    }, [filteredPOs, currentUserEmployee]);

    const toggleRowSelection = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    };

    const handleBulkApproval = (status: number) => {
        if (!firestore || !currentUserEmployee || !poCollectionRef) return;

        selectedRows.forEach(id => {
            const po = purchaseOrders.find(p => p.id === id);
            if (!po || !po.approvalFlow?.steps) return;

            const currentLevel = po.approvalHistory?.length || 0;
            const approvalLevels = po.approvalFlow.steps;

            const newHistoryEntry = {
                approverId: currentUserEmployee.id,
                status: status === 1 ? 'Approved' : 'Rejected',
                timestamp: new Date().toISOString(),
                level: currentLevel,
                remarks: `Bulk action from list view`,
            };

            let nextStatus: number;
            let nextApprover: string;

            if (status === 1) {
                const nextLevel = currentLevel + 1;
                if (nextLevel < approvalLevels.length) {
                    nextStatus = getNextApprovalStatusCode(currentLevel);
                    nextApprover = approvalLevels[nextLevel].approverId;
                } else {
                    nextStatus = 1;
                    nextApprover = '';
                }
            } else {
                nextStatus = 0;
                nextApprover = '';
            }

            setDocumentNonBlocking(doc(poCollectionRef, id), {
                approvalStatus: nextStatus,
                currentApproverId: nextApprover,
                approvalHistory: [...(po.approvalHistory || []), newHistoryEntry],
            }, { merge: true });
        });

        toast({ title: 'Success', description: `${selectedRows.length} POs processed.` });
        setSelectedRows([]);
    };

    const handleSavePO = (poData: Partial<PurchaseOrder>) => {
        if (!poCollectionRef) return;
        addDocumentNonBlocking(poCollectionRef, poData);
        toast({ title: 'Success', description: `PO ${poData.poNumber} created.` });
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
                                <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => handleBulkApproval(1)}>
                                    <Check className="mr-2 h-4 w-4" /> Approve ({selectedRows.length})
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}>
                                    <X className="mr-2 h-4 w-4" /> Reject ({selectedRows.length})
                                </Button>
                            </div>
                        )}
                    </div>
                    {(isSuperAdmin || isGPOfficer) && (
                        <Button onClick={() => setIsPrepareDialogOpen(true)}><FilePlus className="mr-2 h-4 w-4" /> Prepare PO</Button>
                    )}
                </div>

                <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Filter className="h-4 w-4" /> Filter Options
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select value={gpConcernFilter} onValueChange={setGpConcernFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by GP Concern..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All GP Concerns</SelectItem>
                                {gpConcernOfficers.map(officer => (
                                    <SelectItem key={officer.id} value={officer.id}>{officer.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={vendorFilter} onValueChange={setVendorFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by Vendor..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Vendors</SelectItem>
                                {vendors.map(v => (
                                    <SelectItem key={v.id} value={v.id}>{v.vendorName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" onClick={() => { setSearchTerm(''); setVendorFilter('all'); setGpConcernFilter('all'); }} className="text-muted-foreground">
                            <XCircle className="mr-2 h-4 w-4" /> Clear All Filters
                        </Button>
                    </div>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox 
                                        checked={approvableItems.length > 0 && selectedRows.length === approvableItems.length}
                                        onCheckedChange={(c) => setSelectedRows(c ? approvableItems.map(i => i.id) : [])}
                                    />
                                </TableHead>
                                <TableHead>PO Number</TableHead>
                                <TableHead>CS Number</TableHead>
                                <TableHead>Demand Note</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>GP Concern</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPOs.length > 0 ? filteredPOs.map((po) => {
                                const isWaitingForMe = currentUserEmployee && po.currentApproverId === currentUserEmployee.id && po.approvalStatus !== 1 && po.approvalStatus !== 0;
                                const isApprovable = approvableItems.some(i => i.id === po.id);
                                const dn = demandNotes?.find(dn => dn.id === po.demandNoteId);
                                const cs = comparativeStatements?.find(c => c.id === po.csId);

                                return (
                                    <TableRow key={po.id} className={cn("hover:bg-muted/30 transition-colors", isWaitingForMe && "bg-orange-500/5")}>
                                        <TableCell>
                                            <Checkbox 
                                                checked={selectedRows.includes(po.id)}
                                                onCheckedChange={() => toggleRowSelection(po.id)}
                                                disabled={!isApprovable}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{po.poNumber}</TableCell>
                                        <TableCell>{cs?.csNumber || 'N/A'}</TableCell>
                                        <TableCell>{dn?.demandNoteNumber || 'N/A'}</TableCell>
                                        <TableCell>{getVendorName(po.vendorId)}</TableCell>
                                        <TableCell>{getEmployeeName(dn?.gpConcernOfficerId || '')}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={po.approvalStatus === 1 ? 'default' : 'secondary'}>{getPOStatusText(po)}</Badge>
                                                {isWaitingForMe && (
                                                    <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap">⚠️ Action Required</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(po.netPayableAmount)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setSelectedPoForStatus(po); setIsStatusModalOpen(true);}}><Info className="h-4 w-4 text-blue-500"/></Button></TooltipTrigger><TooltipContent>Approval Flow</TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/purchase-orders/${po.id}`}><Eye className="h-4 w-4"/></Link></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(po, 'purchase-order')}><Printer className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Print</TooltipContent></Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : <TableRow><TableCell colSpan={9} className="text-center h-24">No POs found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isPrepareDialogOpen} onOpenChange={setIsPrepareDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader><DialogTitle>Create New PO</DialogTitle></DialogHeader>
                    <ScrollArea className="h-64 border rounded-md">
                        {comparativeStatements.filter(cs => cs.approvalStatus === 1 && !purchaseOrders.some(po => po.csId === cs.id)).map(cs => (
                            <div key={cs.id} className="p-3 border-b flex justify-between items-center">
                                <div><p className="font-semibold">{cs.csNumber}</p><p className="text-xs text-muted-foreground">{getVendorName(cs.selectedVendorId!)}</p></div>
                                <Button size="sm" onClick={() => { setSelectedCsForPo(cs); setIsPrepareDialogOpen(false); setIsPoFormOpen(true); }}>Select</Button>
                            </div>
                        ))}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <PurchaseOrderForm isOpen={isPoFormOpen} setIsOpen={setIsPoFormOpen} onSave={handleSavePO} cs={selectedCsForPo} />

            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>PO Approval Flow</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedPoForStatus?.approvalFlow?.steps.map((step, index) => {
                            const historyEntry = selectedPoForStatus.approvalHistory?.find(h => h.level === index);
                            const approver = employees?.find(e => e.id === step.approverId);
                            const isPending = selectedPoForStatus.currentApproverId === step.approverId && selectedPoForStatus.approvalStatus !== 1 && selectedPoForStatus.approvalStatus !== 0;
                            let status: 'approved' | 'pending' | 'upcoming' = historyEntry ? 'approved' : (isPending ? 'pending' : 'upcoming');
                            return (
                                <li key={index} className="flex items-center gap-4 list-none">
                                    {status === 'approved' ? <CheckCircle className="h-6 w-6 text-green-500" /> : (status === 'pending' ? <Hourglass className="h-6 w-6 text-orange-500 animate-spin" /> : <MoreHorizontal className="h-6 w-6 text-muted-foreground" />)}
                                    <div className="flex-1 flex gap-3 items-center">
                                        <Avatar className="h-10 w-10 border"><AvatarFallback>{approver?.fullName?.charAt(0) || '?'}</AvatarFallback></Avatar>
                                        <div>
                                            <p className="font-semibold">{step.stepName}</p>
                                            <p className="text-sm">{approver?.fullName || 'Not Assigned'}</p>
                                            {historyEntry && <p className="text-[10px] text-muted-foreground">Approved: {new Date(historyEntry.timestamp).toLocaleString()}</p>}
                                        </div>
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
