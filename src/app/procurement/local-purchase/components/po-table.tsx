"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useProcurement } from './procurement-provider';
import type { PurchaseOrder } from './po-entry-form';
import { useUser, useFirestore, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, XCircle, FilePlus, Eye, Printer, Users, CheckCircle, Hourglass, MoreHorizontal } from 'lucide-react';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PurchaseOrderForm } from './po-entry-form';
import { useToast } from '@/hooks/use-toast';
import { collection } from 'firebase/firestore';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { getPOStatusText } from '../lib/status-helper';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function PurchaseOrderTable() {
    const { purchaseOrders, vendors, demandNotes, employees, comparativeStatements, isLoading, orgSettings, designations } = useProcurement();
    const { user } = useUser();
    const { toast } = useToast();
    const { handlePrint } = usePrint();
    const firestore = useFirestore();
    const poCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('all');
    
    const [isPrepareDialogOpen, setIsPrepareDialogOpen] = useState(false);
    const [isPoFormOpen, setIsPoFormOpen] = useState(false);
    const [selectedCsForPo, setSelectedCsForPo] = useState<any>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedPoForStatus, setSelectedPoForStatus] = useState<PurchaseOrder | null>(null);

    const currentUserEmployee = useMemo(() => {
        if (!user || !employees) return null;
        return employees.find(e => e.email === user.email);
    }, [user, employees]);

    const roleData = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        const superAdminCheck = user?.email === 'superadmin@galsolution.com';
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

    const { isSuperAdmin, isGPOfficer, isGPConcern, isCsApprover } = roleData;

    const userRoleText = useMemo(() => {
        if (isSuperAdmin) return "Role: Superadmin";
        if (isGPOfficer) return "Role: GP Officer";
        if (isGPConcern) return "Role: GP Concern Officer";
        if (isCsApprover) return "Role: CS Approver";
        return "Role: Employee";
    }, [isSuperAdmin, isGPOfficer, isGPConcern, isCsApprover]);

    const filteredPOs = useMemo(() => {
        const safePOs = Array.isArray(purchaseOrders) ? purchaseOrders : [];
        return safePOs.filter(po => {
            const lowerTerm = searchTerm.toLowerCase();
            const demandNote = demandNotes?.find(dn => dn.id === po.demandNoteId);
            const searchTermMatch = !searchTerm || po.poNumber.toLowerCase().includes(lowerTerm) || (demandNote?.demandNoteNumber.toLowerCase().includes(lowerTerm));
            const vendorMatch = vendorFilter === 'all' || po.vendorId === vendorFilter;
            return searchTermMatch && vendorMatch;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [purchaseOrders, searchTerm, vendorFilter, demandNotes]);

    const getVendorName = (id: string) => vendors?.find(v => v.id === id)?.vendorName || 'N/A';
    const getDemandNoteNumber = (id: string) => demandNotes?.find(dn => dn.id === id)?.demandNoteNumber || 'N/A';
    const formatCurrency = (amount?: number) => amount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount) : 'N/A';

    const handleSavePO = (poData: Partial<PurchaseOrder>) => {
        if (!poCollectionRef) return;
        addDocumentNonBlocking(poCollectionRef, poData);
        toast({ title: 'Success', description: `PO ${poData.poNumber} created.` });
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Input placeholder="Search PO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-[250px]" />
                        <Badge variant="outline">{userRoleText}</Badge>
                    </div>
                    {(isSuperAdmin || isGPOfficer || isGPConcern) && (
                        <Button onClick={() => setIsPrepareDialogOpen(true)}><FilePlus className="mr-2 h-4 w-4" /> Prepare PO</Button>
                    )}
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO Number</TableHead>
                                <TableHead>Demand Note</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPOs.length > 0 ? filteredPOs.map((po) => {
                                // Identification of Action Required tasks
                                const isWaitingForMe = currentUserEmployee && po.currentApproverId === currentUserEmployee.id && po.approvalStatus !== 1 && po.approvalStatus !== 0;
                                
                                return (
                                    <TableRow key={po.id} className={isWaitingForMe ? 'bg-orange-500/10' : ''}>
                                        <TableCell className="font-medium">{po.poNumber}</TableCell>
                                        <TableCell>{getDemandNoteNumber(po.demandNoteId)}</TableCell>
                                        <TableCell>{getVendorName(po.vendorId)}</TableCell>
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
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setSelectedPoForStatus(po); setIsStatusModalOpen(true);}}><Users className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Status</TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/purchase-orders/${po.id}`}><Eye className="h-4 w-4"/></Link></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(po, 'purchase-order')}><Printer className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Print</TooltipContent></Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : <TableRow><TableCell colSpan={6} className="text-center h-24">No POs found.</TableCell></TableRow>}
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
                            let status: 'approved' | 'pending' | 'upcoming' = historyEntry ? 'approved' : (selectedPoForStatus.currentApproverId === step.approverId ? 'pending' : 'upcoming');
                            return (
                                <li key={index} className="flex items-center gap-4 list-none">
                                    {status === 'approved' ? <CheckCircle className="h-6 w-6 text-green-500" /> : (status === 'pending' ? <Hourglass className="h-6 w-6 text-orange-500 animate-spin" /> : <MoreHorizontal className="h-6 w-6 text-muted-foreground" />)}
                                    <div><p className="font-semibold">{step.stepName}</p><p className="text-sm">{approver?.fullName || 'Not Assigned'}</p></div>
                                </li>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}