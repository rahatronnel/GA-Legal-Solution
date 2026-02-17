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
import { Badge } from '@/components/ui/badge';

export function ComparativeStatementTable() {
    const { comparativeStatements, demandNotes, isLoading, employees, orgSettings } = useProcurement();
    const { user } = useUser();
    const [searchTerm, setSearchTerm] = useState('');

    const getDemandNoteNumber = (id: string) => demandNotes?.find(dn => dn.id === id)?.demandNoteNumber || 'N/A';
    const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.fullName || 'N/A';

    const formatDateTime = (isoString: string) => {
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
        const superAdmin = user?.email === 'superadmin@galsolution.com';
        const settings = orgSettings?.procurementSettings;
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
                                        <TableCell><Skeleton className="h-8 w-24 float-right" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((cs) => {
                                    const {date, time} = formatDateTime(cs.csDate);
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
                                                    <span className="text-xs text-muted-foreground">{date}</span>
                                                    <span className="text-xs text-muted-foreground">{time}</span>
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
                                                        <TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger>
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
        </TooltipProvider>
    );
}
