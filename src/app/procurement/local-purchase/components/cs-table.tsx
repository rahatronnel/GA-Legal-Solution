
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
import { Search, Eye, Edit, Trash2 } from 'lucide-react';
import { useProcurement } from './procurement-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useUser } from '@/firebase';

export function ComparativeStatementTable() {
    const { comparativeStatements, demandNotes, isLoading, employees, orgSettings } = useProcurement();
    const { user } = useUser();
    const [searchTerm, setSearchTerm] = useState('');

    const getDemandNoteNumber = (id: string) => demandNotes?.find(dn => dn.id === id)?.demandNoteNumber || 'N/A';

    const safeItems = useMemo(() => Array.isArray(comparativeStatements) ? comparativeStatements : [], [comparativeStatements]);

    const { isSuperAdmin, isGPOfficer, isManager, isGPConcern, currentUserEmployee } = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        const superAdmin = user?.email === 'superadmin@galsolution.com';
        if (!settings || !employees || employees.length === 0 || !user) {
          return { isSuperAdmin: superAdmin, isGPOfficer: false, isManager: false, isGPConcern: false, currentUserEmployee: null };
        }
        const currentEmp = employees.find(e => e.email === user?.email);
        if (!currentEmp) {
          return { isSuperAdmin: superAdmin, isGPOfficer: false, isManager: false, isGPConcern: false, currentUserEmployee: null };
        }

        const GPO = settings.generalPurchaseOfficerId === currentEmp.id;
        const GPC = !!settings.gpConcernOfficerIds?.includes(currentEmp.id);
        const manager = 
            settings.managingDirectorId === currentEmp.id ||
            settings.factoryDirectorId === currentEmp.id ||
            settings.manufacturingDeptManagerId === currentEmp.id ||
            settings.specializedDeptManagerId === currentEmp.id;
        
        return { isSuperAdmin: superAdmin, isGPOfficer: GPO, isManager: manager, isGPConcern: GPC, currentUserEmployee: currentEmp };
    }, [orgSettings, employees, user]);

    const filteredItems = useMemo(() => {
        let itemsToFilter = [...safeItems];

        // If user is NOT a superadmin, GPO, or Manager, they must be a GP concern officer
        // In that case, only show CS they created.
        if (!isSuperAdmin && !isGPOfficer && !isManager) {
             if (isGPConcern && currentUserEmployee) {
                itemsToFilter = itemsToFilter.filter(cs => cs.createdBy === currentUserEmployee.id);
            } else {
                return []; // If not any of these roles, show nothing.
            }
        }
        
        if (!searchTerm) return itemsToFilter;

        const lowercasedTerm = searchTerm.toLowerCase();
        return itemsToFilter.filter(cs =>
            cs.csNumber.toLowerCase().includes(lowercasedTerm) ||
            getDemandNoteNumber(cs.demandNoteId).toLowerCase().includes(lowercasedTerm)
        );
    }, [safeItems, searchTerm, demandNotes, isSuperAdmin, isGPOfficer, isManager, isGPConcern, currentUserEmployee]);


    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by CS or DN number..."
                            className="w-full rounded-lg bg-background pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>CS Number</TableHead>
                                <TableHead>CS Date</TableHead>
                                <TableHead>Demand Note Number</TableHead>
                                <TableHead className="w-[120px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-24 float-right" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((cs) => (
                                    <TableRow key={cs.id}>
                                        <TableCell>{cs.csNumber}</TableCell>
                                        <TableCell>{cs.csDate}</TableCell>
                                        <TableCell>
                                            <Link href={`/procurement/local-purchase/demand-notes/${cs.demandNoteId}`} className="text-primary hover:underline">
                                                {getDemandNoteNumber(cs.demandNoteId)}
                                            </Link>
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
                                                    <TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger>
                                                    <TooltipContent>Delete</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No comparative statements found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </TooltipProvider>
    );
}
