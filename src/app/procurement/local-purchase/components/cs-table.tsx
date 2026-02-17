
"use client";

import React, { useState, useMemo } from 'react';
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
import { Search, Eye, Edit, Trash2, ArrowUp, ArrowDown, XCircle, Copy, Users, CheckCircle, MoreHorizontal, Hourglass, X as XIcon, User as UserIcon, Check, X } from 'lucide-react';
import { useProcurement } from './procurement-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useUser, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
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
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import { getCSStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';


export function ComparativeStatementTable() {
    const { comparativeStatements, demandNotes, isLoading, employees, orgSettings, vendors, designations } = useProcurement();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const csRef = useMemoFirebase(() => firestore ? collection(firestore, 'comparativeStatements') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [gpConcernFilter, setGpConcernFilter] = useState('all');
    const [vendorFilter, setVendorFilter] = useState('all');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<ComparativeStatement | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedCsForStatus, setSelectedCsForStatus] = useState<ComparativeStatement | null>(null);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    const getDemandNoteNumber = (id: string) => demandNotes?.find(dn => dn.id === id)?.demandNoteNumber || 'N/A';
    
    const getEmployeeName = (id?: string) => {
        if (!id || !employees || employees.length === 0) return 'N/A';
        return employees.find(e => e.id === id)?.fullName || 'N/A';
    }

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return { date: '', time: '' };
        try {
            const d = new Date(isoString);
            const date = d.toLocaleDateString();
            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return { date, time };
        } catch {
            return { date: 'N/A', time: 'N/A' };
        }
    }

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

        const isGPOfficer = settings.generalPurchaseOfficerId === currentEmp.id;
        const isGPConcern = !!settings.gpConcernOfficerIds?.includes(currentEmp.id);
        const isManager = 
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
        
        return { isSuperAdmin: superAdminCheck, isGPOfficer, isManager, isGPConcern, isCsApprover: csApproverCheck, currentUserEmployee: currentEmp };
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
            itemsToFilter = safeItems.filter(cs => 
                cs.createdBy === currentUserEmployee.id || 
                cs.currentApproverId === currentUserEmployee.id
            );
        } else {
            itemsToFilter = [];
        }
        
        return itemsToFilter.filter(cs => {
            const searchTermMatch = !searchTerm ||
                cs.csNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getDemandNoteNumber(cs.demandNoteId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                getEmployeeName(cs.createdBy).toLowerCase().includes(searchTerm.toLowerCase());
            
            const gpConcernMatch = gpConcernFilter === 'all' || cs.createdBy === gpConcernFilter;

            const vendorMatch = vendorFilter === 'all' || cs.vendorDetails.some((vd: any) => vd.vendorId === vendorFilter);
            
            return searchTermMatch && gpConcernMatch && vendorMatch;
        });
    }, [safeItems, searchTerm, gpConcernFilter, vendorFilter, demandNotes, isSuperAdmin, isGPOfficer, isManager, isGPConcern, isCsApprover, currentUserEmployee, employees, vendors]);
    
    const approvableCS = useMemo(() => {
        if (!currentUserEmployee || !orgSettings?.procurementSettings) return [];
        const { managingDirectorId, factoryDirectorId } = orgSettings.procurementSettings;
        
        return filteredItems.filter(cs => {
            const isPending = cs.approvalStatus !== 0 && cs.approvalStatus !== 1;
            if (!isPending) return false;

            const isDirectApprover = cs.currentApproverId === currentUserEmployee.id;

            const finalStep = cs.approvalFlow?.steps[cs.approvalFlow.steps.length - 1];
            const isFinalStepForMD = finalStep?.approverId === managingDirectorId && cs.currentApproverId === managingDirectorId;
            const isCurrentUserFD = currentUserEmployee.id === factoryDirectorId;

            return isDirectApprover || (isFinalStepForMD && isCurrentUserFD);
        });
    }, [filteredItems, currentUserEmployee, orgSettings]);

    const allSelectableIds = useMemo(() => approvableCS.map(cs => cs.id), [approvableCS]);
    
    const handleBulkApproval = (status: number) => {
        if (!firestore || !currentUserEmployee || !csRef) return;
        
        selectedRows.forEach(csId => {
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
                remarks: `Bulk action from list view`,
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
        });
        
        toast({ title: 'Success', description: `${selectedRows.length} CS documents have been processed.` });
        setSelectedRows([]);
    };
    
    const toggleRowSelection = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    };
    
    const canPerformBulkAction = selectedRows.length > 0;
    
    const calculateVendorTotals = (cs: ComparativeStatement) => {
        if (!cs || !cs.vendorDetails || !cs.items) return [];
        
        return cs.vendorDetails.map(vd => {
            const subtotal = cs.items.reduce((acc, item) => {
                const quote = item.vendorQuotes.find(q => q.vendorId === vd.vendorId);
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
            return subTotalAfterDiscount + vatAmount + taxAmount;
        });
    };
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    
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
    
    const clearFilters = () => {
        setSearchTerm('');
        setGpConcernFilter('all');
        setVendorFilter('all');
    };
    
    const getStatusVariant = (status: number | undefined) => {
        if (status === 1) return 'default';
        if (status === 0) return 'destructive';
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
                                <Button size="sm" variant="outline" onClick={() => handleBulkApproval(1)}><Check className="mr-2 h-4 w-4"/>Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}><X className="mr-2 h-4 w-4"/>Reject</Button>
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
                                <TableHead>Created By</TableHead>
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
                                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-20 float-right" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-24 float-right" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((cs) => {
                                    const {date, time} = formatDateTime(cs.csDate);
                                    const totals = calculateVendorTotals(cs);
                                    const minAmount = totals.length > 0 ? Math.min(...totals) : 0;
                                    const maxAmount = totals.length > 0 ? Math.max(...totals) : 0;
                                    const canSelect = approvableCS.some(approvable => approvable.id === cs.id);

                                    return (
                                        <TableRow key={cs.id} data-state={selectedRows.includes(cs.id) ? "selected" : ""}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedRows.includes(cs.id)}
                                                    onCheckedChange={() => toggleRowSelection(cs.id)}
                                                    disabled={!canSelect}
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
                                                            <Button
                                                              variant="ghost"
                                                              size="icon"
                                                              className="h-6 w-6"
                                                              onClick={() => {
                                                                const dnNumber = getDemandNoteNumber(cs.demandNoteId);
                                                                navigator.clipboard.writeText(dnNumber);
                                                                toast({ title: 'Copied!', description: 'Demand Note number copied to clipboard.' });
                                                              }}
                                                            >
                                                              <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Copy DN Number</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{getEmployeeName(cs.createdBy)}</span>
                                                    {date && <span className="text-xs text-muted-foreground">{date}</span>}
                                                    {time && <span className="text-xs text-muted-foreground">{time}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(cs.approvalStatus)}>{getCSStatusText(cs)}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="flex items-center text-red-500 font-semibold">
                                                        <ArrowUp className="h-3 w-3 mr-1" />
                                                        {formatCurrency(maxAmount)}
                                                    </span>
                                                    <span className="flex items-center text-green-500 font-semibold">
                                                        <ArrowDown className="h-3 w-3 mr-1" />
                                                        {formatCurrency(minAmount)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewStatus(cs)}><Users className="h-4 w-4" /></Button></TooltipTrigger>
                                                        <TooltipContent>View Approval Status</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/comparative-statements/${cs.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger>
                                                        <TooltipContent>View</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(cs)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger>
                                                        <TooltipContent>Delete</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">No comparative statements found.</TableCell>
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
                                            {status === 'rejected' && <XIcon className="h-6 w-6 text-destructive" />}
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
        </TooltipProvider>
    );
}
