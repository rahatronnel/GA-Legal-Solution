
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
import { Search, Eye, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
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

export function ComparativeStatementTable() {
    const { comparativeStatements, demandNotes, isLoading, employees, orgSettings } = useProcurement();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const csRef = useMemoFirebase(() => firestore ? collection(firestore, 'comparativeStatements') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
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
        
        if (!searchTerm) {
            return itemsToFilter;
        }

        const lowercasedTerm = searchTerm.toLowerCase();
        return itemsToFilter.filter(cs =>
            cs.csNumber.toLowerCase().includes(lowercasedTerm) ||
            getDemandNoteNumber(cs.demandNoteId).toLowerCase().includes(lowercasedTerm) ||
            getEmployeeName(cs.createdBy).toLowerCase().includes(lowercasedTerm)
        );
    }, [safeItems, searchTerm, demandNotes, isSuperAdmin, isGPOfficer, isManager, isGPConcern, currentUserEmployee, employees]);
    
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


    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by CS, DN, GP Concern..."
                                className="w-full rounded-lg bg-background pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                         <Badge variant="outline">{userRoleText}</Badge>
                    </div>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>CS Number</TableHead>
                                <TableHead>Demand Note Number</TableHead>
                                <TableHead>GP Concern</TableHead>
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
                                                <Link href={`/procurement/local-purchase/demand-notes/${cs.demandNoteId}`} className="text-primary hover:underline">
                                                    {getDemandNoteNumber(cs.demandNoteId)}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{getEmployeeName(cs.createdBy)}</span>
                                                    {date && <span className="text-xs text-muted-foreground">{date}</span>}
                                                    {time && <span className="text-xs text-muted-foreground">{time}</span>}
                                                </div>
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
                                    <TableCell colSpan={5} className="h-24 text-center">No comparative statements found.</TableCell>
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
