
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useProcurement } from './procurement-provider';
import { useUser } from '@/firebase';
import type { DemandNote } from './demand-note-entry-form';
import { Button } from '@/components/ui/button';

export default function GPDeskTable() {
    const { user } = useUser();
    const { demandNotes, sections, employees, isLoading, orgSettings } = useProcurement();

    const [searchTerm, setSearchTerm] = useState('');
    const [assignedToFilter, setAssignedToFilter] = useState('all');

    const currentUserEmployee = useMemo(() => {
        if (!user || !employees) return null;
        return employees.find(e => e.email === user.email);
    }, [user, employees]);

    const getDepartmentName = (id: string) => sections?.find(s => s.id === id)?.name || 'N/A';
    const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.fullName || 'N/A';

    const safeItems = useMemo(() => Array.isArray(demandNotes) ? demandNotes : [], [demandNotes]);

    const { isGPOfficer, isGPConcern, gpConcernOfficers } = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        if (!settings || !currentUserEmployee || !employees) return { isGPOfficer: false, isGPConcern: false, gpConcernOfficers: [] };
        
        const GPO = settings.generalPurchaseOfficerId === currentUserEmployee.id;
        const GPC = !!settings.gpConcernOfficerIds?.includes(currentUserEmployee.id || '');
        const officers = (settings.gpConcernOfficerIds || []).map(id => employees.find(e => e.id === id)).filter(Boolean);
        
        return { isGPOfficer: GPO, isGPConcern: GPC, gpConcernOfficers: officers as any[] };
    }, [orgSettings, currentUserEmployee, employees]);
    

    const filteredItems = useMemo(() => {
        const isSuperAdmin = user?.email === 'superadmin@galsolution.com';

        let assignedNotes = safeItems.filter(note => note.gpStatus === 'Assigned');

        if (!isSuperAdmin && !isGPOfficer) {
            if (isGPConcern) {
                assignedNotes = assignedNotes.filter(note => note.gpConcernOfficerId === currentUserEmployee?.id);
            } else {
                return []; // Regular users shouldn't see the GP desk
            }
        }
        
        return assignedNotes.filter(item => {
            const searchTermMatch = !searchTerm ||
                item.demandNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getDepartmentName(item.departmentId).toLowerCase().includes(searchTerm.toLowerCase());

            const assignedToMatch = assignedToFilter === 'all' || item.gpConcernOfficerId === assignedToFilter;
            
            return searchTermMatch && assignedToMatch;
        }).sort((a, b) => new Date(b.gpAssignedDate || 0).getTime() - new Date(a.gpAssignedDate || 0).getTime());
    }, [safeItems, searchTerm, assignedToFilter, currentUserEmployee, user, isGPOfficer, isGPConcern]);


    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by number or department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter by Assigned To..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Concern Officers</SelectItem>
                                {gpConcernOfficers.map(officer => (
                                    <SelectItem key={officer.id} value={officer.id}>{officer.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Demand Note #</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Assigned To</TableHead>
                                <TableHead>Assigned Date</TableHead>
                                <TableHead className="w-[80px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                             Array.from({length: 3}).map((_, i) => (
                                <TableRow key={i}>
                                  <TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell>
                                </TableRow>
                              ))
                        ) : filteredItems.length > 0 ? (
                            filteredItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.demandNoteNumber}</TableCell>
                                    <TableCell>{getDepartmentName(item.departmentId)}</TableCell>
                                    <TableCell>{getEmployeeName(item.gpConcernOfficerId || '')}</TableCell>
                                    <TableCell>{item.gpAssignedDate ? new Date(item.gpAssignedDate).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/demand-notes/${item.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No assigned demand notes found.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </TooltipProvider>
    );
}
