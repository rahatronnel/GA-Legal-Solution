
"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
import { Search, Eye, Trash2, Check, Printer, X, Copy, Users, CheckCircle, Hourglass, MoreHorizontal, User as UserIcon, XCircle, FileText } from 'lucide-react';
import { useProcurement } from './procurement-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PurchaseOrderForm, type PurchaseOrder } from './po-entry-form';

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
    const selectedVendorDetails = cs?.vendorDetails.find(vd => vd.vendorId === selectedVendorId);
    
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
                    {step === 3 && selectedVendorDetails && (
                        <div>
                            <h4 className="font-semibold text-lg mb-2">Review Commercial Terms</h4>
                             <div className="space-y-2 text-sm p-4 border rounded-md">
                                <p><strong>Delivery Terms:</strong> {selectedVendorDetails.deliveryTerms || 'N/A'}</p>
                                <p><strong>Payment Terms:</strong> {selectedVendorDetails.paymentTerms || 'N/A'}</p>
                                <p><strong>Warranty:</strong> {selectedVendorDetails.warranty || 'N/A'}</p>
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
    const { comparativeStatements, demandNotes, isLoading, employees, orgSettings, vendors, designations, purchaseOrders } = useProcurement();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { handlePrint } = usePrint();

    const csRef = useMemoFirebase(() => firestore ? collection(firestore, 'comparativeStatements') : null, [firestore]);
    const poCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [gpConcernFilter, setGpConcernFilter] = useState('all');
    const [vendorFilter, setVendorFilter] = useState('all');
    
    const [isPoFormOpen, setIsPoFormOpen] = useState(false);
    const [selectedCsForPo, setSelectedCsForPo] = useState<ComparativeStatement | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<ComparativeStatement | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedCsForStatus, setSelectedCsForStatus] = useState<ComparativeStatement | null>(null);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isVendorSelectionOpen, setIsVendorSelectionOpen] = useState(false);
    const [selectedCsForVendor, setSelectedCsForVendor] = useState<ComparativeStatement | null>(null);
    const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
    const [bulkActionType, setBulkActionType] = useState<'approve' | 'reject' | null>(null);

    const getDemandNoteNumber = (id: string) => demandNotes?.find(dn => dn.id === id)?.demandNoteNumber || 'N/A';
    const getVendorName = (vendorId?: string) => vendors?.find(v => v.id === vendorId)?.vendorName || 'N/A';
    const getEmployeeName = (id?: string) => employees?.find(e => e.id === id)?.fullName || 'N/A';

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    const formatDateTime = (isoString?: string) => {
        if (!isoString) return { date: '', time: '' };
        try {
            const d = new Date(isoString);
            return {
                date: d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'}),
                time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        } catch { return { date: 'N/A', time: 'N/A' }; }
    }

    const { isSuperAdmin, isGPOfficer, isManager, isGPConcern, isCsApprover, currentUserEmployee } = useMemo(() => {
        const superAdminCheck = user?.email === 'superadmin@galsolution.com';
        const settings = orgSettings?.procurementSettings;
        const currentEmp = employees?.find(e => e.email === user?.email);

        if (!settings || !currentEmp) return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isManager: false, isGPConcern: false, isCsApprover: false, currentUserEmployee: null };

        const GPO = settings.generalPurchaseOfficerId === currentEmp.id;
        const GPC = !!settings.gpConcernOfficerIds?.includes(currentEmp.id);
        const manager = settings.managingDirectorId === currentEmp.id || settings.factoryDirectorId === currentEmp.id;
        let csApproverCheck = settings.csApprovalRoles && Object.values(settings.csApprovalRoles).includes(currentEmp.id);
        
        return { isSuperAdmin: superAdminCheck, isGPOfficer: GPO, isManager: manager, isGPConcern: GPC, isCsApprover: !!csApproverCheck, currentUserEmployee: currentEmp };
    }, [orgSettings, employees, user]);

    const filteredItems = useMemo(() => {
        const safeItems = Array.isArray(comparativeStatements) ? comparativeStatements : [];
        return safeItems.filter(cs => {
            const demandNote = demandNotes?.find(dn => dn.id === cs.demandNoteId);
            const searchTermMatch = !searchTerm || cs.csNumber.toLowerCase().includes(searchTerm.toLowerCase()) || getDemandNoteNumber(cs.demandNoteId).toLowerCase().includes(searchTerm.toLowerCase());
            const gpConcernMatch = gpConcernFilter === 'all' || demandNote?.gpConcernOfficerId === gpConcernFilter;
            const vendorMatch = vendorFilter === 'all' || cs.vendorDetails.some((vd: any) => vd.vendorId === vendorFilter);
            return searchTermMatch && gpConcernMatch && vendorMatch;
        }).sort((a, b) => new Date(b.csDate).getTime() - new Date(a.csDate).getTime());
    }, [comparativeStatements, searchTerm, gpConcernFilter, vendorFilter, demandNotes]);

    const handleApproval = (csId: string, status: number) => {
        if (!firestore || !currentUserEmployee || !csRef) return;
        const cs = comparativeStatements.find(c => c.id === csId);
        if (!cs || !cs.approvalFlow?.steps) return;

        const csDocRef = doc(csRef, csId);
        const approvalLevels = cs.approvalFlow.steps;
        const currentLevel = cs.approvalHistory?.length || 0;

        const newHistoryEntry = {
            approverId: currentUserEmployee.id,
            status: status === 1 ? 'Approved' : 'Rejected',
            timestamp: new Date().toISOString(),
            level: currentLevel,
            remarks: `Approved vendor: ${getVendorName(cs.selectedVendorId)}`,
        };
        
        let newApprovalStatus: number;
        let nextApproverId: string | undefined;

        if (status === 1) {
            const nextLevel = currentLevel + 1;
            if (nextLevel < approvalLevels.length) {
                newApprovalStatus = getNextApprovalStatusCode(currentLevel);
                nextApproverId = approvalLevels[nextLevel].approverId;
            } else {
                newApprovalStatus = 1; // Completed
                nextApproverId = '';
            }
        } else {
            newApprovalStatus = 0;
            nextApproverId = '';
        }

        setDocumentNonBlocking(csDocRef, {
            approvalStatus: newApprovalStatus,
            currentApproverId: nextApproverId,
            approvalHistory: [...(cs.approvalHistory || []), newHistoryEntry],
        }, { merge: true });
        
        toast({ title: 'Success', description: `CS ${cs.csNumber} processed.` });
    };

    const handleDelete = (cs: ComparativeStatement) => {
        setCurrentItem(cs);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (currentItem && csRef) {
            deleteDocumentNonBlocking(doc(csRef, currentItem.id));
            toast({ title: "Success", description: "Comparative Statement deleted." });
        }
        setIsDeleteConfirmOpen(false);
        setCurrentItem(null);
    };

    const handleCreatePO = (cs: ComparativeStatement) => {
        setSelectedCsForPo(cs);
        setIsPoFormOpen(true);
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

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search CS, DN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                        </div>
                        <Select value={vendorFilter} onValueChange={setVendorFilter}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Vendor" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Vendors</SelectItem>{vendors?.map(v => <SelectItem key={v.id} value={v.id}>{v.vendorName}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button variant="ghost" onClick={() => { setSearchTerm(''); setVendorFilter('all'); setGpConcernFilter('all'); }}><XCircle className="mr-2 h-4 w-4" /> Clear</Button>
                    </div>
                    <Badge variant="outline">Role: {userRoleText.split(': ')[1]}</Badge>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
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
                                <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((cs) => {
                                    const totals = calculateVendorTotals(cs);
                                    const amount = cs.selectedVendorId ? (totals[cs.selectedVendorId]?.grandTotal || 0) : 0;
                                    const { date, time } = formatDateTime(cs.vendorSelectionDate);
                                    const poExists = purchaseOrders?.some(po => po.csId === cs.id);
                                    const isConcern = currentUserEmployee?.id === demandNotes?.find(d => d.id === cs.demandNoteId)?.gpConcernOfficerId;
                                    const canCreatePO = (isSuperAdmin || isGPOfficer || isConcern) && cs.approvalStatus === 1 && !poExists;

                                    return (
                                        <TableRow key={cs.id}>
                                            <TableCell>{cs.csNumber}</TableCell>
                                            <TableCell>{getDemandNoteNumber(cs.demandNoteId)}</TableCell>
                                            <TableCell>{getEmployeeName(demandNotes?.find(d => d.id === cs.demandNoteId)?.gpConcernOfficerId)}</TableCell>
                                            <TableCell>
                                                {cs.selectedVendorId ? (
                                                    <div className="flex flex-col">
                                                        <span>{getVendorName(cs.selectedVendorId)}</span>
                                                        <span className="text-[10px] text-muted-foreground">{date} {time}</span>
                                                    </div>
                                                ) : 'N/A'}
                                            </TableCell>
                                            <TableCell><Badge variant={cs.approvalStatus === 1 ? 'default' : 'secondary'}>{getCSStatusText(cs)}</Badge></TableCell>
                                            <TableCell className="text-right font-semibold">{cs.selectedVendorId ? formatCurrency(amount) : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {canCreatePO && (
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCreatePO(cs)}><span>📄</span></Button></TooltipTrigger><TooltipContent>Create PO</TooltipContent></Tooltip>
                                                    )}
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setSelectedCsForStatus(cs); setIsStatusModalOpen(true);}}><Users className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Status</TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/comparative-statements/${cs.id}`}><Eye className="h-4 w-4"/></Link></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(cs)}><Trash2 className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center">No results found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent><DialogHeader><DialogTitle>Are you sure?</DialogTitle></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button><Button variant="destructive" onClick={confirmDelete}>Delete</Button></DialogFooter></DialogContent>
            </Dialog>

            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Approval Status for {selectedCsForStatus?.csNumber}</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <ul className="space-y-4">
                            {selectedCsForStatus?.approvalFlow?.steps.map((step, index) => {
                                const historyEntry = selectedCsForStatus.approvalHistory?.find(h => h.level === index);
                                const approver = employees?.find(e => e.id === step.approverId);
                                let status: 'approved' | 'pending' | 'upcoming' = historyEntry ? 'approved' : (selectedCsForStatus.currentApproverId === step.approverId ? 'pending' : 'upcoming');
                                return (
                                    <li key={index} className="flex items-start gap-4">
                                        {status === 'approved' ? <CheckCircle className="h-6 w-6 text-green-500" /> : (status === 'pending' ? <Hourglass className="h-6 w-6 text-orange-500 animate-spin" /> : <MoreHorizontal className="h-6 w-6 text-muted-foreground" />)}
                                        <div><p className="font-semibold">{step.stepName}</p><p className="text-sm">{approver?.fullName || 'N/A'}</p></div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </DialogContent>
            </Dialog>

            <PurchaseOrderForm isOpen={isPoFormOpen} setIsOpen={setIsPoFormOpen} onSave={handleSavePO} cs={selectedCsForPo} />
        </TooltipProvider>
    );
}
