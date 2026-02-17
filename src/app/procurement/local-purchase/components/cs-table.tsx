
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
import { Search, Eye, Edit, Trash2, ArrowUp, ArrowDown, XCircle, Copy, Users, CheckCircle, MoreHorizontal, Hourglass, User as UserIcon, Check, Printer, X } from 'lucide-react';
import { useProcurement } from './procurement-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useUser, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import type { ComparativeStatement, VendorDetail } from './cs-entry-form';
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
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import { getCSStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { PurchaseOrderForm } from './po-entry-form';
import type { PurchaseOrder } from './po-entry-form';


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
                     <DialogDescription>
                        Step {step} of 4: Follow the steps to finalize the vendor for this order.
                    </DialogDescription>
                </DialogHeader>

                 <div className="py-4 space-y-4">
                    {step === 1 && (
                        <div>
                            <Label htmlFor="vendor-select">Select Vendor</Label>
                            <Select onValueChange={setSelectedVendorId}>
                                <SelectTrigger id="vendor-select">
                                    <SelectValue placeholder="Choose a vendor..." />
                                </SelectTrigger>
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
                        <div>
                            <h4 className="font-semibold text-lg text-center">Final Confirmation</h4>
                             <div className="p-4 mt-4 text-center border-yellow-500/50 border bg-yellow-500/10 rounded-lg">
                                <p>You are about to select <strong>{selectedVendor.vendorName}</strong> for this purchase order.</p>
                                <p className="text-sm text-muted-foreground">This action will start the approval process and cannot be undone.</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between w-full">
                    <div>
                        {step > 1 && <Button variant="outline" onClick={handleBack}>Back</Button>}
                    </div>
                    <div>
                        {step < 4 && <Button onClick={handleNext} disabled={step === 1 && !selectedVendorId}>Next</Button>}
                        {step === 4 && <Button onClick={handleConfirm}>Confirm & Start Approval</Button>}
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

    const [isPoFormOpen, setIsPoFormOpen] = useState(false);
    const [selectedCsForPo, setSelectedCsForPo] = useState<ComparativeStatement | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [gpConcernFilter, setGpConcernFilter] = useState('all');
    const [vendorFilter, setVendorFilter] = useState('all');
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
    
    const getEmployeeName = (id?: string) => {
        if (!id || !employees || employees.length === 0) return 'N/A';
        return employees.find(e => e.id === id)?.fullName || 'N/A';
    }

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return { date: '', time: '' };
        try {
            const d = new Date(isoString);
            const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'});
            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return { date, time };
        } catch {
            return { date: 'N/A', time: 'N/A' };
        }
    }
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const safeItems = useMemo(() => Array.isArray(comparativeStatements) ? comparativeStatements : [], [comparativeStatements]);

    const { isSuperAdmin, isGPOfficer, isManager, isGPConcern, isCsApprover, currentUserEmployee } = useMemo(() => {
        const superAdminCheck = user?.email === 'superadmin@galsolution.com';
        const settings = orgSettings?.procurementSettings;

        if (!settings || !employees || employees.length === 0 || !user) {
          return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isManager: false, isGPConcern: false, isCsApprover: false, currentUserEmployee: null };
        }
        
        const currentEmp = employees.find(e => e.email === user.email);
        if (!currentEmp) {
          return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isManager: false, isGPConcern: false, isCsApprover: false, currentUserEmployee: null };
        }

        const GPO = settings.generalPurchaseOfficerId === currentEmp.id;
        const GPC = !!settings.gpConcernOfficerIds?.includes(currentEmp.id);
        const manager = 
            settings.managingDirectorId === currentEmp.id ||
            settings.factoryDirectorId === currentEmp.id ||
            settings.manufacturingDeptManagerId === currentEmp.id ||
            settings.specializedDeptManagerId === currentEmp.id;
            
        let csApproverCheck = false;
        const csRoles = settings.csApprovalRoles;
        if (csRoles) {
            const roleIds = [
                csRoles.purchaseManagerId,
                csRoles.purchaseDeptTaId,
                csRoles.viceFactoryManagerId,
                csRoles.accountsManagerId,
                csRoles.gmSalesDeptId,
                csRoles.gmAdministrationId,
            ];
            if (roleIds.includes(currentEmp.id)) {
                csApproverCheck = true;
            }
        }
        if (!csApproverCheck && settings.departmentHeads?.some(dh => dh.technicalAdvisorId === currentEmp.id)) {
            csApproverCheck = true;
        }
        if (!csApproverCheck && settings.specializedDeptTaId === currentEmp.id) {
            csApproverCheck = true;
        }
        
        return { isSuperAdmin: superAdminCheck, isGPOfficer: GPO, isManager: manager, isGPConcern: GPC, isCsApprover: csApproverCheck, currentUserEmployee: currentEmp };
    }, [orgSettings, employees, user]);

    const gpConcernOfficers = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        if (!settings || !employees) {
            return [];
        }
        return (settings.gpConcernOfficerIds || [])
            .map(id => employees.find(e => e.id === id))
            .filter(Boolean) as Employee[];
    }, [orgSettings, employees]);

    const userRoleText = useMemo(() => {
        if (isSuperAdmin) return "Role: Superadmin";
        if (isGPOfficer) return "Role: GP Officer";
        if (isManager) return "Role: Manager";
        if (isGPConcern) return "Role: GP Concern Officer";
        if (isCsApprover) return "Role: CS Approver";
        return "Role: Employee";
    }, [isSuperAdmin, isGPOfficer, isGPConcern, isManager, isCsApprover]);

     const filteredItems = useMemo(() => {
        let itemsToFilter: ComparativeStatement[];

        if (isSuperAdmin || isGPOfficer || isManager || isCsApprover) {
            itemsToFilter = [...safeItems];
        } else if (currentUserEmployee) {
            itemsToFilter = safeItems.filter(cs => {
                const demandNote = demandNotes?.find(dn => dn.id === cs.demandNoteId);
                return cs.createdBy === currentUserEmployee.id || 
                       cs.currentApproverId === currentUserEmployee.id ||
                       cs.vendorSelectorId === currentUserEmployee.id ||
                       (demandNote && demandNote.gpConcernOfficerId === currentUserEmployee.id);
            });
        } else {
            itemsToFilter = [];
        }
        
        return itemsToFilter.filter(cs => {
            const demandNote = demandNotes?.find(dn => dn.id === cs.demandNoteId);
            const searchTermMatch = !searchTerm ||
                cs.csNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getDemandNoteNumber(cs.demandNoteId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                getEmployeeName(demandNote?.gpConcernOfficerId).toLowerCase().includes(searchTerm.toLowerCase());
            
            const gpConcernMatch = gpConcernFilter === 'all' || demandNote?.gpConcernOfficerId === gpConcernFilter;

            const vendorMatch = vendorFilter === 'all' || cs.vendorDetails.some((vd: any) => vd.vendorId === vendorFilter);
            
            return searchTermMatch && gpConcernMatch && vendorMatch;
        });
    }, [safeItems, searchTerm, gpConcernFilter, vendorFilter, demandNotes, isSuperAdmin, isGPOfficer, isManager, isCsApprover, currentUserEmployee, employees, vendors]);
    
    const approvableCS = useMemo(() => {
        if (!currentUserEmployee || !orgSettings?.procurementSettings) return [];
        const { managingDirectorId, factoryDirectorId } = orgSettings.procurementSettings;
        
        return filteredItems.filter(cs => {
            const isPending = cs.approvalStatus !== 0 && cs.approvalStatus !== 1 && cs.approvalStatus !== 2;
            if (!isPending) return false;

            const isDirectApprover = cs.currentApproverId === currentUserEmployee.id;

            const finalStep = cs.approvalFlow?.steps[cs.approvalFlow.steps.length - 1];
            const isFinalStepForMD = finalStep?.approverId === managingDirectorId && cs.currentApproverId === managingDirectorId;
            const isCurrentUserFD = currentUserEmployee.id === factoryDirectorId;

            return isDirectApprover || (isFinalStepForMD && isCurrentUserFD);
        });
    }, [filteredItems, currentUserEmployee, orgSettings]);

    const allSelectableIds = useMemo(() => approvableCS.map(cs => cs.id), [approvableCS]);
    
     const handleApproval = (csId: string, status: number) => {
        if (!firestore || !currentUserEmployee || !csRef) return;

        const cs = comparativeStatements.find(c => c.id === csId);
        if (!cs || !cs.approvalFlow?.steps) return;
        
        const vendorName = getVendorName(cs.selectedVendorId);

        const csDocRef = doc(csRef, csId);
        const approvalLevels = cs.approvalFlow.steps;
        const currentLevel = cs.approvalHistory?.length || 0;

        const newHistoryEntry = {
            approverId: currentUserEmployee.id,
            status: status === 1 ? 'Approved' : 'Rejected',
            timestamp: new Date().toISOString(),
            level: currentLevel,
            remarks: `Approved vendor: ${vendorName}`,
        };
        
        let newApprovalStatus: number;
        let nextApproverId: string | undefined;

        if (status === 1) { // Approved
            const nextLevel = currentLevel + 1;
            if (nextLevel < approvalLevels.length) {
                newApprovalStatus = getNextApprovalStatusCode(currentLevel);
                nextApproverId = approvalLevels[nextLevel].approverId;
            } else {
                newApprovalStatus = 1; // Completed
                nextApproverId = '';
            }
        } else { // Rejected
            newApprovalStatus = 0;
            nextApproverId = '';
        }

        setDocumentNonBlocking(csDocRef, {
            approvalStatus: newApprovalStatus,
            currentApproverId: nextApproverId,
            approvalHistory: [...(cs.approvalHistory || []), newHistoryEntry],
        }, { merge: true });
        
        toast({ title: 'Success', description: `CS ${cs.csNumber} has been ${status === 1 ? 'approved' : 'rejected'}.` });
    };

    const handleOpenBulkConfirm = (type: 'approve' | 'reject') => {
        if (selectedRows.length === 0) return;
        setBulkActionType(type);
        setIsBulkConfirmOpen(true);
    };

    const processBulkAction = () => {
        if (!bulkActionType) return;
        selectedRows.forEach(csId => {
            const cs = comparativeStatements.find(c => c.id === csId);
            if (!cs || !cs.approvalFlow?.steps || !currentUserEmployee) return;
    
            const noteRef = doc(csRef, csId);
            const approvalLevels = cs.approvalFlow.steps;
            const currentLevel = cs.approvalHistory?.length || 0;
    
            const newHistoryEntry = {
                approverId: currentUserEmployee.id,
                status: bulkActionType === 'approve' ? 'Approved' : 'Rejected',
                timestamp: new Date().toISOString(),
                level: currentLevel,
                remarks: `Bulk action from list view`,
            };
    
            let updatePayload: Partial<ComparativeStatement> = {
                approvalHistory: [...(cs.approvalHistory || []), newHistoryEntry],
            };
            
            let newApprovalStatus: number | undefined;
    
            if (bulkActionType === 'approve') {
                const nextLevel = currentLevel + 1;
                if (nextLevel >= approvalLevels.length) {
                    newApprovalStatus = 1; // Completed
                    updatePayload.currentApproverId = '';
                } else {
                    newApprovalStatus = getNextApprovalStatusCode(currentLevel);
                    updatePayload.currentApproverId = approvalLevels[nextLevel].approverId;
                }
            } else {
                newApprovalStatus = 0; // Rejected
                updatePayload.currentApproverId = '';
            }
    
            updatePayload.approvalStatus = newApprovalStatus;
            setDocumentNonBlocking(noteRef, updatePayload, { merge: true });
        });
        
        toast({ title: 'Success', description: `${selectedRows.length} CS have been processed.` });
        setSelectedRows([]);
        setBulkActionType(null);
        setIsBulkConfirmOpen(false);
    };
    
    const toggleRowSelection = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    };
    
    const canPerformBulkAction = selectedRows.length > 0;
    
    const calculateVendorTotals = (cs: ComparativeStatement) => {
        if (!cs) return {};
        const totals: { [vendorId: string]: { subtotal: number; discount: number; vatAmount: number; taxAmount: number; grandTotal: number } } = {};
        
        cs.vendorDetails.forEach((vd) => {
            const subtotal = cs.items.reduce((acc, item) => {
                const quote = item.vendorQuotes.find((q) => q.vendorId === vd.vendorId);
                return acc + (item.quantity * (quote?.unitPrice || 0));
            }, 0);
            
            let discount = 0;
            if (vd.discountType === 'Percentage') {
                discount = subtotal * ((vd.discountValue || 0) / 100);
            } else {
                discount = vd.discountValue || 0;
            }
            
            const subTotalAfterDiscount = subtotal - discount;
            const vatAmount = subTotalAfterDiscount * ((vd.vatPercentage || 0) / 100);
            const taxAmount = subTotalAfterDiscount * ((vd.taxPercentage || 0) / 100);
            const grandTotal = subTotalAfterDiscount + vatAmount + taxAmount;

            totals[vd.vendorId] = { subtotal, discount, vatAmount, taxAmount, grandTotal };
        });
        
        return totals;
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

     const handleVendorSelected = (csId: string, vendorId: string) => {
        const cs = comparativeStatements.find(c => c.id === csId);
        if (!cs || !cs.approvalFlow?.steps) {
            toast({ variant: "destructive", title: "Error", description: "Approval flow not set for this CS." });
            return;
        }

        const csDocRef = doc(csRef, csId);
        const firstApproverId = cs.approvalFlow.steps[0]?.approverId || '';
        
        setDocumentNonBlocking(csDocRef, {
            selectedVendorId: vendorId,
            vendorSelectorId: currentUserEmployee?.id || '',
            vendorSelectionDate: new Date().toISOString(),
            approvalStatus: 3, // Move to "Pending Review"
            currentApproverId: firstApproverId,
        }, { merge: true });

        toast({ title: "Vendor Selected", description: "The CS is now ready for approval." });
        setIsVendorSelectionOpen(false);
    };

    const handleOpenVendorSelection = (cs: ComparativeStatement) => {
        setSelectedCsForVendor(cs);
        setIsVendorSelectionOpen(true);
    };
    
    const handleCreatePO = (cs: ComparativeStatement) => {
        setSelectedCsForPo(cs);
        setIsPoFormOpen(true);
    };

    const handleSavePO = (poData: Partial<PurchaseOrder>) => {
        if (!poCollectionRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to database.' });
            return;
        }
        addDocumentNonBlocking(poCollectionRef, poData);
        toast({ title: 'Success!', description: `Purchase Order ${poData.poNumber} has been created.` });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setGpConcernFilter('all');
        setVendorFilter('all');
    };
    
    const getStatusVariant = (status: number | undefined) => {
        if (status === 1) return 'default';
        if (status === 0) return 'destructive';
        if (status === 2) return 'outline';
        return 'secondary';
    }

    const handleViewStatus = (cs: ComparativeStatement) => {
        setSelectedCsForStatus(cs);
        setIsStatusModalOpen(true);
    };


    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by CS, DN, Creator..."
                                className="w-full rounded-lg bg-background pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                         <Select value={gpConcernFilter} onValueChange={setGpConcernFilter}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by GP Concern..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All GP Concerns</SelectItem>
                                {gpConcernOfficers.map(officer => (
                                    <SelectItem key={officer.id} value={officer.id}>{officer.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={vendorFilter} onValueChange={setVendorFilter}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by Vendor..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Vendors</SelectItem>
                                {(vendors || []).map((vendor: any) => (
                                    <SelectItem key={vendor.id} value={vendor.id}>{vendor.vendorName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" onClick={clearFilters}><XCircle className="mr-2 h-4 w-4" /> Clear</Button>
                    </div>
                     <div className="flex justify-end items-center gap-2">
                        <Badge variant="outline">{userRoleText}</Badge>
                        {canPerformBulkAction && (
                            <>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button size="sm" variant="outline"><Check className="mr-2 h-4 w-4"/>Approve</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Bulk Approval</AlertDialogTitle>
                                            <AlertDialogDescription>Are you sure you want to approve the following {selectedRows.length} comparative statement(s)?</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <ScrollArea className="max-h-60 p-4 border rounded-md">
                                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                                {selectedRows.map(id => {
                                                    const cs = comparativeStatements.find(c => c.id === id);
                                                    if (!cs) return null;
                                                    const vendor = vendors.find(v => v.id === cs.selectedVendorId);
                                                    const totals = calculateVendorTotals(cs);
                                                    const amount = cs.selectedVendorId ? (totals[cs.selectedVendorId]?.grandTotal || 0) : 0;
                                                    return (
                                                        <li key={id}>
                                                            <strong>{cs.csNumber}</strong>: Approve vendor <strong>{vendor?.vendorName || 'N/A'}</strong> for <strong>{formatCurrency(amount)}</strong>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </ScrollArea>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => processBulkAction()}>Confirm Approval</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><X className="mr-2 h-4 w-4"/>Reject</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Bulk Rejection</AlertDialogTitle>
                                            <AlertDialogDescription>Are you sure you want to reject {selectedRows.length} comparative statement(s)? This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => processBulkAction()} className="bg-destructive hover:bg-destructive/90">Confirm Reject</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                    </div>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={allSelectableIds.length > 0 && selectedRows.length === allSelectableIds.length}
                                        onCheckedChange={(checked) => {
                                           setSelectedRows(checked ? allSelectableIds : []);
                                        }}
                                        aria-label="Select all approvable CS"
                                    />
                                </TableHead>
                                <TableHead>CS Number</TableHead>
                                <TableHead>Demand Note</TableHead>
                                <TableHead>GP Concern</TableHead>
                                <TableHead>Awarded Vendor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[120px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                        <TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((cs) => {
                                    const {date: selectionDate, time: selectionTime} = formatDateTime(cs.vendorSelectionDate);
                                    const totals = calculateVendorTotals(cs);
                                    const amount = cs.selectedVendorId ? (totals[cs.selectedVendorId]?.grandTotal || 0) : 0;
                                    const canSelectForApproval = approvableCS.some(approvable => approvable.id === cs.id);
                                    const demandNote = demandNotes?.find(dn => dn.id === cs.demandNoteId);
                                    const isCurrentConcernOfficer = currentUserEmployee?.id === demandNote?.gpConcernOfficerId;
                                    const canSelectVendor = (isSuperAdmin || isCurrentConcernOfficer) && cs.approvalStatus === 2;
                                    const poExists = (purchaseOrders || []).some(po => po.csId === cs.id);
                                    const canCreatePO = (isGPOfficer || isSuperAdmin || isCurrentConcernOfficer);

                                    return (
                                        <TableRow key={cs.id} data-state={selectedRows.includes(cs.id) ? "selected" : ""}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedRows.includes(cs.id)}
                                                    onCheckedChange={() => toggleRowSelection(cs.id)}
                                                    disabled={!canSelectForApproval}
                                                    aria-label={`Select CS ${cs.csNumber}`}
                                                />
                                            </TableCell>
                                            <TableCell>{cs.csNumber}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                  <Link href={`/procurement/local-purchase/demand-notes/${cs.demandNoteId}`} className="text-primary hover:underline">
                                                        {getDemandNoteNumber(cs.demandNoteId)}
                                                  </Link>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { const dnNumber = getDemandNoteNumber(cs.demandNoteId); navigator.clipboard.writeText(dnNumber); toast({ title: 'Copied!'});}}>
                                                        <Copy className="h-3 w-3" />
                                                      </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Copy DN Number</TooltipContent>
                                                  </Tooltip>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getEmployeeName(demandNote?.gpConcernOfficerId)}</TableCell>
                                            <TableCell>
                                                {cs.selectedVendorId ? (
                                                    <div className="flex flex-col">
                                                        <span>{getVendorName(cs.selectedVendorId)}</span>
                                                        {cs.vendorSelectionDate && <span className="text-xs text-muted-foreground">{selectionDate} {selectionTime}</span>}
                                                    </div>
                                                ) : 'Not Selected'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(cs.approvalStatus)}>{getCSStatusText(cs)}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {cs.selectedVendorId ? formatCurrency(amount) : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                     {canCreatePO && cs.approvalStatus === 1 && !poExists && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCreatePO(cs)}>
                                                                    <span>📄</span>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Create Purchase Order</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {canSelectVendor && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenVendorSelection(cs)}>
                                                                    <span>⭕</span>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Choose Vendor</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewStatus(cs)}><Users className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>View Approval Status</TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/comparative-statements/${cs.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
                                                    {cs.approvalStatus === 1 && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(cs, 'comparative-statement')}><Printer className="h-4 w-4" /></Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Print CS</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(cs)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">No comparative statements found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete CS "{currentItem?.csNumber}".
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Approval Status for {selectedCsForStatus?.csNumber}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <ul className="space-y-4">
                            {selectedCsForStatus?.approvalFlow?.steps.map((step, index) => {
                                const historyEntry = selectedCsForStatus.approvalHistory?.find(h => h.level === index);
                                const approver = employees?.find(e => e.id === step.approverId);
                                const designation = designations?.find(d => d.id === approver?.designationId);
                                
                                let status: 'approved' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';
                                const isPending = selectedCsForStatus.approvalStatus !== 0 && selectedCsForStatus.approvalStatus !== 1;
                                
                                if (historyEntry?.status === 'Approved') status = 'approved';
                                else if (historyEntry?.status === 'Rejected') status = 'rejected';
                                else if (selectedCsForStatus.currentApproverId === step.approverId && isPending) status = 'pending';

                                return (
                                    <li key={index} className="flex items-start gap-4">
                                        <div>
                                            {status === 'approved' && <CheckCircle className="h-6 w-6 text-green-500" />}
                                            {status === 'pending' && <Hourglass className="h-6 w-6 text-orange-500 animate-spin" />}
                                            {status === 'upcoming' && <MoreHorizontal className="h-6 w-6 text-muted-foreground" />}
                                            {status === 'rejected' && <X className="h-6 w-6 text-destructive" />}
                                        </div>
                                        <div className="flex-1 flex gap-4 items-center">
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarImage src={approver?.profilePicture} alt={approver?.fullName} />
                                                <AvatarFallback>{approver?.fullName?.charAt(0) || <UserIcon />}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{step.stepName}</p>
                                                <p className="text-sm">{approver?.fullName || 'N/A'} <span className="text-xs text-muted-foreground">({designation?.name || 'N/A'})</span></p>
                                                {historyEntry && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {historyEntry.status} on {formatDateTime(historyEntry.timestamp)?.date}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <VendorSelectionDialog
                cs={selectedCsForVendor}
                isOpen={isVendorSelectionOpen}
                onOpenChange={setIsVendorSelectionOpen}
                onVendorSelected={handleVendorSelected}
                vendors={vendors || []}
            />
            
            <PurchaseOrderForm 
                isOpen={isPoFormOpen}
                setIsOpen={setIsPoFormOpen}
                onSave={handleSavePO}
                cs={selectedCsForPo}
            />

            <AlertDialog open={isBulkConfirmOpen} onOpenChange={setIsBulkConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Bulk {bulkActionType === 'approve' ? 'Approval' : 'Rejection'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to {bulkActionType} the following {selectedRows.length} item(s):
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <ScrollArea className="max-h-60 p-4 border rounded-md">
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            {selectedRows.map(id => {
                                const cs = comparativeStatements.find(c => c.id === id);
                                if (!cs) return null;
                                const vendor = vendors.find(v => v.id === cs.selectedVendorId);
                                const totals = calculateVendorTotals(cs);
                                const amount = cs.selectedVendorId ? (totals[cs.selectedVendorId]?.grandTotal || 0) : 0;
                                return (
                                    <li key={id}>
                                        <strong>{cs.csNumber}</strong>: Approve vendor <strong>{vendor?.vendorName || 'N/A'}</strong> for <strong>{formatCurrency(amount)}</strong>
                                    </li>
                                )
                            })}
                        </ul>
                    </ScrollArea>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={processBulkAction} className={bulkActionType === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </TooltipProvider>
    );
}
