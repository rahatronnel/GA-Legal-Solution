
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
import { Search, Eye, Edit, Trash2, ArrowUp, ArrowDown, XCircle, Copy } from 'lucide-react';
import { useProcurement } from './procurement-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useUser, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
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
import { getCSStatusText } from '../lib/status-helper';

export function ComparativeStatementTable() {
    const { comparativeStatements, demandNotes, isLoading, employees, orgSettings, vendors } = useProcurement();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const csRef = useMemoFirebase(() => firestore ? collection(firestore, 'comparativeStatements') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [gpConcernFilter, setGpConcernFilter] = useState('all');
    const [vendorFilter, setVendorFilter] = useState('all');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<ComparativeStatement | null>(null);

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

    const { isSuperAdmin, isGPOfficer, isManager, isGPConcern, currentUserEmployee } = useMemo(() => {
        const superAdminCheck = user?.email === 'superadmin@galsolution.com';
        const settings = orgSettings?.procurementSettings;

        if (!settings || !employees || employees.length === 0 || !user) {
          return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isManager: false, isGPConcern: false, currentUserEmployee: null };
        }
        
        const currentEmp = employees.find(e => e.email === user.email);
        if (!currentEmp) {
          return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isManager: false, isGPConcern: false, currentUserEmployee: null };
        }

        const isGPOfficer = settings.generalPurchaseOfficerId === currentEmp.id;
        const isGPConcern = !!settings.gpConcernOfficerIds?.includes(currentEmp.id);
        const isManager = 
            settings.managingDirectorId === currentEmp.id ||
            settings.factoryDirectorId === currentEmp.id ||
            settings.manufacturingDeptManagerId === currentEmp.id ||
            settings.specializedDeptManagerId === currentEmp.id;
        
        return { isSuperAdmin: superAdminCheck, isGPOfficer, isManager, isGPConcern, currentUserEmployee: currentEmp };
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
        return "Role: Employee";
    }, [isSuperAdmin, isGPOfficer, isGPConcern, isManager]);

    const filteredItems = useMemo(() => {
        const canViewAll = isSuperAdmin || isGPOfficer || isManager;
        let itemsToFilter: any[];

        if (canViewAll) {
            itemsToFilter = [...safeItems];
        } else if (isGPConcern) {
             if (currentUserEmployee) {
                itemsToFilter = safeItems.filter(cs => cs.createdBy === currentUserEmployee.id);
            } else {
                itemsToFilter = [];
            }
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
    }, [safeItems, searchTerm, gpConcernFilter, vendorFilter, demandNotes, isSuperAdmin, isGPOfficer, isManager, isGPConcern, currentUserEmployee, employees, vendors]);
    
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
                    </div>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
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

                                    return (
                                        <TableRow key={cs.id}>
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
                                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/comparative-statements/${cs.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger>
                                                        <TooltipContent>View</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button></TooltipTrigger>
                                                        <TooltipContent>Edit</TooltipContent>
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
                                    <TableCell colSpan={6} className="h-24 text-center">No comparative statements found.</TableCell>
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
        </TooltipProvider>
    );
}
