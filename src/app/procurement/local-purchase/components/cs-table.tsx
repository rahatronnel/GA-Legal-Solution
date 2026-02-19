
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
import { Search, Eye, Trash2, Check, Printer, X, Info, CheckCircle, Hourglass, MoreHorizontal, Hand, FilePlus } from 'lucide-react';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCSStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Label } from '@/components/ui/label';
import { PurchaseOrderForm, type PurchaseOrder } from './po-entry-form';
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

    const selectedVendor = vendors.find(v => v.id === selectedVendorId);
    
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedVendorId('');
        }
    }, [isOpen]);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);
    const handleConfirm = () => {
        if (cs && selectedVendorId) {
            onVendorSelected(cs.id, selectedVendorId);
        }
    };
    
    const calculateTotals = (vendorId: string) => {
        const itemTotal = cs?.items?.reduce((sum, item) => {
            const quote = item.vendorQuotes.find(q => q.vendorId === vendorId);
            return sum + (item.quantity * (quote?.unitPrice || 0));
        }, 0) || 0;

        const vendorDetail = cs?.vendorDetails?.find(d => d.vendorId === vendorId);
        let discount = 0;
        if (vendorDetail) {
            if (vendorDetail.discountType === 'Percentage') {
                discount = itemTotal * ((vendorDetail.discountValue || 0) / 100);
            } else {
                discount = vendorDetail.discountValue || 0;
            }
        }
        
        const subTotalAfterDiscount = itemTotal - discount;
        const vatAmount = subTotalAfterDiscount * ((vendorDetail?.vatPercentage || 0) / 100);
        const taxAmount = subTotalAfterDiscount * ((vendorDetail?.taxPercentage || 0) / 100);
        const grandTotal = subTotalAfterDiscount + vatAmount + taxAmount;

        return { itemTotal, discount, grandTotal, vatAmount, taxAmount };
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    const totals = selectedVendorId ? calculateTotals(selectedVendorId) : null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Choose Vendor for CS: {cs?.csNumber}</DialogTitle>
                     <DialogDescription>Step {step} of 4: Select and review vendor selection.</DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-4">
                    {step === 1 && (
                        <div>
                            <Label htmlFor="vendor-select">Select Vendor</Label>
                            <Select onValueChange={setSelectedVendorId}>
                                <SelectTrigger id="vendor-select"><SelectValue placeholder="Choose a vendor..." /></SelectTrigger>
                                <SelectContent>
                                    {(cs?.vendorDetails || []).map(detail => {
                                        const vendor = vendors.find(v => v.id === detail.vendorId);
                                        return <SelectItem key={detail.vendorId} value={detail.vendorId}>{vendor?.vendorName || detail.vendorId}</SelectItem>
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {step === 2 && selectedVendor && (
                         <div>
                            <h4 className="font-semibold text-lg mb-2">Review Prices for: {selectedVendor.vendorName}</h4>
                            <Table>
                                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Total Price</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {cs?.items.map(item => {
                                        const quote = item.vendorQuotes.find(q => q.vendorId === selectedVendorId);
                                        return (
                                            <TableRow key={item.demandNoteItemId}>
                                                <TableCell>{item.particulars}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(quote?.unitPrice || 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency((quote?.unitPrice || 0) * item.quantity)}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                     <TableRow className="font-bold"><TableCell colSpan={2}>Grand Total</TableCell><TableCell className="text-right">{formatCurrency(totals?.grandTotal || 0)}</TableCell></TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {step === 3 && selectedVendorId && (
                        <div>
                            <h4 className="font-semibold text-lg mb-2">Review Commercial Terms</h4>
                             <div className="space-y-2 text-sm p-4 border rounded-md">
                                <p><strong>Delivery Terms:</strong> {cs?.vendorDetails.find(vd => vd.vendorId === selectedVendorId)?.deliveryTerms || 'N/A'}</p>
                                <p><strong>Payment Terms:</strong> {cs?.vendorDetails.find(vd => vd.vendorId === selectedVendorId)?.paymentTerms || 'N/A'}</p>
                                <p><strong>Warranty:</strong> {cs?.vendorDetails.find(vd => vd.vendorId === selectedVendorId)?.warranty || 'N/A'}</p>
                            </div>
                        </div>
                    )}
                     {step === 4 && selectedVendor && (
                        <div className="p-4 text-center border-yellow-500/50 border bg-yellow-500/10 rounded-lg">
                            <p>You are about to select <strong>{selectedVendor.vendorName}</strong> for this purchase order.</p>
                            <p className="text-sm text-muted-foreground">This action will start the approval process.</p>
                        </div>
                    )}
                </div>
                <DialogFooter className="flex justify-between w-full">
                    <div>{step > 1 && <Button variant="outline" onClick={handleBack}>Back</Button>}</div>
                    <div>
                        {step < 4 ? <Button onClick={handleNext} disabled={step === 1 && !selectedVendorId}>Next</Button> : <Button onClick={handleConfirm}>Confirm & Start Approval</Button>}
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
    const poCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('all');
    
    const [isPoFormOpen, setIsPoFormOpen] = useState(false);
    const [selectedCsForPo, setSelectedCsForPo] = useState<any>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<ComparativeStatement | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedCsForStatus, setSelectedCsForStatus] = useState<ComparativeStatement | null>(null);
    const [isVendorSelectionOpen, setIsVendorSelectionOpen] = useState(false);
    const [selectedCsForVendor, setSelectedCsForVendor] = useState<ComparativeStatement | null>(null);
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

    const getDemandNoteNumber = (id: string) => demandNotes?.find(dn => dn.id === id)?.demandNoteNumber || 'N/A';
    const getVendorName = (vendorId?: string) => vendors?.find(v => v.id === vendorId)?.vendorName || 'N/A';
    const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.fullName || 'N/A';
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const filteredItems = useMemo(() => {
        const safeItems = Array.isArray(comparativeStatements) ? comparativeStatements : [];
        return safeItems.filter(cs => {
            const searchTermMatch = !searchTerm || cs.csNumber.toLowerCase().includes(searchTerm.toLowerCase()) || getDemandNoteNumber(cs.demandNoteId).toLowerCase().includes(searchTerm.toLowerCase());
            const vendorMatch = vendorFilter === 'all' || cs.vendorDetails.some((vd: any) => vd.vendorId === vendorFilter);
            return searchTermMatch && vendorMatch;
        }).sort((a, b) => new Date(b.csDate || 0).getTime() - new Date(a.csDate || 0).getTime());
    }, [comparativeStatements, searchTerm, vendorFilter, demandNotes]);

    const approvableItems = useMemo(() => {
        return filteredItems.filter(item => 
            item.approvalStatus !== 1 && 
            item.approvalStatus !== 0 && 
            item.approvalStatus !== 2 &&
            currentUserEmployee && 
            item.currentApproverId === currentUserEmployee.id
        );
    }, [filteredItems, currentUserEmployee]);

    const toggleRowSelection = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    };

    const handleVendorSelected = (csId: string, vendorId: string) => {
        if (!csRef || !firestore) return;
        const cs = comparativeStatements.find(c => c.id === csId);
        if (!cs || !cs.approvalFlow?.steps) return;

        const firstApproverId = cs.approvalFlow.steps[0]?.approverId || '';

        setDocumentNonBlocking(doc(csRef, csId), {
            selectedVendorId: vendorId,
            vendorSelectionDate: new Date().toISOString(),
            approvalStatus: 3, 
            currentApproverId: firstApproverId,
        }, { merge: true });

        toast({ title: "Success", description: "Vendor selected. Approval process started." });
        setIsVendorSelectionOpen(false);
    };

    const handleBulkApproval = (status: number) => {
        if (!firestore || !currentUserEmployee || !csRef) return;

        selectedRows.forEach(id => {
            const cs = comparativeStatements.find(c => c.id === id);
            if (!cs || !cs.approvalFlow?.steps) return;

            const currentLevel = cs.approvalHistory?.length || 0;
            const approvalLevels = cs.approvalFlow.steps;

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

            setDocumentNonBlocking(doc(csRef, id), {
                approvalStatus: nextStatus,
                currentApproverId: nextApprover,
                approvalHistory: [...(cs.approvalHistory || []), newHistoryEntry],
            }, { merge: true });
        });

        toast({ title: 'Success', description: `${selectedRows.length} statements processed.` });
        setSelectedRows([]);
    };

    const calculateVendorTotals = (cs: ComparativeStatement) => {
        const totals: { [vendorId: string]: any } = {};
        cs.vendorDetails.forEach((vd) => {
            const subtotal = cs.items.reduce((acc, item) => {
                const quote = item.vendorQuotes.find((q) => q.vendorId === vd.vendorId);
                return acc + (item.quantity * (quote?.unitPrice || 0));
            }, 0);
            let discount = vd.discountType === 'Percentage' ? subtotal * ((vd.discountValue || 0) / 100) : (vd.discountValue || 0);
            const subTotalAfterDiscount = subtotal - discount;
            const vatAmount = subTotalAfterDiscount * ((vd.vatPercentage || 0) / 100);
            const taxAmount = subTotalAfterDiscount * ((vd.taxPercentage || 0) / 100);
            totals[vd.vendorId] = { grandTotal: subTotalAfterDiscount + vatAmount + taxAmount };
        });
        return totals;
    };

    const confirmDelete = () => {
        if (currentItem && csRef) {
            deleteDocumentNonBlocking(doc(csRef, currentItem.id));
            toast({ title: "Success", description: "Statement deleted." });
        }
        setIsDeleteConfirmOpen(false);
        setCurrentItem(null);
    };

    const handleSavePO = (poData: Partial<PurchaseOrder>) => {
        if (!poCollectionRef) return;
        addDocumentNonBlocking(poCollectionRef, poData);
        toast({ title: 'Success', description: `Purchase Order ${poData.poNumber} created.` });
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
                                <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => handleBulkApproval(1)}>
                                    <Check className="mr-2 h-4 w-4" /> Approve Selected ({selectedRows.length})
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}>
                                    <X className="mr-2 h-4 w-4" /> Reject Selected ({selectedRows.length})
                                </Button>
                            </div>
                        )}
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
                                <TableHead>CS Number</TableHead>
                                <TableHead>Demand Note</TableHead>
                                <TableHead>GP Concern</TableHead>
                                <TableHead>Awarded Vendor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[140px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={8} className="text-center">Loading...</TableCell></TableRow>
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((cs) => {
                                    const totals = calculateVendorTotals(cs);
                                    const amount = cs.selectedVendorId ? (totals[cs.selectedVendorId]?.grandTotal || 0) : 0;
                                    const poExists = purchaseOrders?.some(po => po.csId === cs.id);
                                    const dn = demandNotes?.find(d => d.id === cs.demandNoteId);
                                    
                                    const canSelectVendor = cs.approvalStatus === 2 && (isSuperAdmin || isGPOfficer || currentUserEmployee?.id === cs.vendorSelectorId);
                                    const isWaitingForMe = (currentUserEmployee && cs.currentApproverId === currentUserEmployee.id && cs.approvalStatus !== 1 && cs.approvalStatus !== 0 && cs.approvalStatus !== 2) || canSelectVendor;
                                    const isApprovable = approvableItems.some(i => i.id === cs.id);
                                    const canCreatePO = cs.approvalStatus === 1 && !poExists && (isSuperAdmin || isGPOfficer || (currentUserEmployee && dn?.gpConcernOfficerId === currentUserEmployee.id));

                                    return (
                                        <TableRow key={cs.id} className={cn("hover:bg-muted/30 transition-colors", isWaitingForMe && "bg-orange-500/5")}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={selectedRows.includes(cs.id)}
                                                    onCheckedChange={() => toggleRowSelection(cs.id)}
                                                    disabled={!isApprovable}
                                                />
                                            </TableCell>
                                            <TableCell>{cs.csNumber}</TableCell>
                                            <TableCell>{dn?.demandNoteNumber || 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium">{getEmployeeName(dn?.gpConcernOfficerId || '')}</span>
                                                    {dn?.gpAssignedDate && <span className="text-[9px] text-muted-foreground">{new Date(dn.gpAssignedDate).toLocaleString()}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium">{cs.selectedVendorId ? getVendorName(cs.selectedVendorId) : 'N/A'}</span>
                                                    {cs.vendorSelectionDate && <span className="text-[9px] text-muted-foreground">{new Date(cs.vendorSelectionDate).toLocaleString()}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={cs.approvalStatus === 1 ? 'default' : 'secondary'}>{getCSStatusText(cs)}</Badge>
                                                    {isWaitingForMe && (
                                                        <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap">⚠️ Action Required</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{cs.selectedVendorId ? formatCurrency(amount) : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {canSelectVendor && (
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 animate-pulse" onClick={() => { setSelectedCsForVendor(cs); setIsVendorSelectionOpen(true); }}><Hand className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Award Contract</TooltipContent></Tooltip>
                                                    )}
                                                    {canCreatePO && (
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => { setSelectedCsForPo(cs); setIsPoFormOpen(true); }}><FilePlus className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Create PO</TooltipContent></Tooltip>
                                                    )}
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setSelectedCsForStatus(cs); setIsStatusModalOpen(true);}}><Info className="h-4 w-4 text-blue-500"/></Button></TooltipTrigger><TooltipContent>Approval Flow</TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/comparative-statements/${cs.id}`}><Eye className="h-4 w-4"/></Link></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => {setCurrentItem(cs); setIsDeleteConfirmOpen(true);}}><Trash2 className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow><TableCell colSpan={8} className="h-24 text-center">No statements found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Are you sure?</DialogTitle></DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Approval Status: {selectedCsForStatus?.csNumber}</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <ul className="space-y-4">
                            {selectedCsForStatus?.approvalFlow?.steps.map((step, index) => {
                                const historyEntry = selectedCsForStatus.approvalHistory?.find((h:any) => h.level === index);
                                const approver = employees?.find(e => e.id === step.approverId);
                                const isPending = selectedCsForStatus.currentApproverId === step.approverId && selectedCsForStatus.approvalStatus !== 1 && selectedCsForStatus.approvalStatus !== 0;
                                let status: 'approved' | 'pending' | 'upcoming' = historyEntry ? 'approved' : (isPending ? 'pending' : 'upcoming');
                                return (
                                    <li key={index} className="flex items-start gap-4">
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
                        </ul>
                    </div>
                </DialogContent>
            </Dialog>

            <VendorSelectionDialog cs={selectedCsForVendor} isOpen={isVendorSelectionOpen} onOpenChange={setIsVendorSelectionOpen} onVendorSelected={handleVendorSelected} vendors={vendors || []} />
            <PurchaseOrderForm isOpen={isPoFormOpen} setIsOpen={setIsPoFormOpen} onSave={handleSavePO} cs={selectedCsForPo} />
        </TooltipProvider>
    );
}
