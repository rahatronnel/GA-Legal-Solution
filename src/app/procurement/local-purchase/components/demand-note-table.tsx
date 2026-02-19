
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
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Search, Eye, Printer, Filter, XCircle, Clock, User, CheckCircle2, FileText, ShoppingCart, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProcurement } from './procurement-provider';
import { useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { DemandNote } from './demand-note-entry-form';
import { DemandNoteEntryForm } from './demand-note-entry-form';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getDemandNoteStatusText } from '../lib/status-helper';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export function DemandNoteTable() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { demandNotes, employees, sections, comparativeStatements, purchaseOrders, isLoading, orgSettings } = useProcurement();
    const { handlePrint } = usePrint();

    const dataRef = useMemoFirebase(() => firestore ? collection(firestore, 'demandNotes') : null, [firestore]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<DemandNote> | null>(null);
    
    // Detailed Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stageFilter, setStageFilter] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const currentUserEmployee = useMemo(() => {
        if (!user || !employees) return null;
        return employees.find(e => e.email === user.email);
    }, [user, employees]);

    const getDepartmentName = (id?: string) => sections?.find(s => s.id === id)?.name || 'N/A';

    const enrichedItems = useMemo(() => {
        const safeItems = Array.isArray(demandNotes) ? demandNotes : [];
        return safeItems.map(dn => {
            const cs = comparativeStatements?.find(c => c.demandNoteId === dn.id);
            const po = purchaseOrders?.find(p => p.demandNoteId === dn.id);
            const creator = employees?.find(e => e.id === dn.createdBy);
            const concern = employees?.find(e => e.id === dn.gpConcernOfficerId);
            
            return {
                ...dn,
                creatorName: creator?.fullName || 'N/A',
                concernName: concern?.fullName || 'Unassigned',
                csPreparedDate: cs?.csDate || null,
                poPreparedDate: po?.createdAt || null,
                hasCs: !!cs,
                hasPo: !!po,
            };
        });
    }, [demandNotes, comparativeStatements, purchaseOrders, employees]);

    const filteredItems = useMemo(() => {
        return enrichedItems.filter(item => {
            const lowerSearch = searchTerm.toLowerCase();
            const searchTermMatch = !searchTerm || 
                item.demandNoteNumber.toLowerCase().includes(lowerSearch) ||
                getDepartmentName(item.departmentId).toLowerCase().includes(lowerSearch) ||
                item.creatorName.toLowerCase().includes(lowerSearch);

            let statusMatch = true;
            if (statusFilter === 'pending') {
                statusMatch = item.approvalStatus !== 1 && item.approvalStatus !== 0;
            } else if (statusFilter !== 'all') {
                statusMatch = item.approvalStatus === parseInt(statusFilter);
            }

            let stageMatch = true;
            if (stageFilter === 'gp_assigned') stageMatch = !!item.gpConcernOfficerId;
            else if (stageFilter === 'cs_prepared') stageMatch = item.hasCs;
            else if (stageFilter === 'po_prepared') stageMatch = item.hasPo;
            else if (stageFilter === 'approved_only') stageMatch = item.approvalStatus === 1;

            const dateMatch = !dateRange?.from || (item.entryDate && isWithinInterval(parseISO(item.entryDate), { 
                start: dateRange.from, 
                end: dateRange.to || dateRange.from 
            }));

            return searchTermMatch && statusMatch && stageMatch && dateMatch;
        }).sort((a, b) => new Date(b.entryDate || 0).getTime() - new Date(a.entryDate || 0).getTime());
    }, [enrichedItems, searchTerm, statusFilter, stageFilter, dateRange]);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setStageFilter('all');
        setDateRange(undefined);
    };

    const handleSave = (data: Partial<DemandNote>) => {
        if (!dataRef) return;
        if (data.id) {
            setDocumentNonBlocking(doc(dataRef, data.id), data, { merge: true });
            toast({ title: 'Success', description: 'Demand Note updated.' });
        } else {
            addDocumentNonBlocking(dataRef, data);
            toast({ title: 'Success', description: 'Demand Note created.' });
        }
    };

    const confirmDelete = () => {
        if (currentItem?.id && dataRef) deleteDocumentNonBlocking(doc(dataRef, currentItem.id));
        setIsDeleteConfirmOpen(false);
    };

    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        } catch { return 'N/A'; }
    }

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by DN#, Department, or Creator..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button onClick={() => { setCurrentItem(null); setIsFormOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Demand Note
                    </Button>
                </div>

                <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Filter className="h-4 w-4" /> Filter Options
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger><SelectValue placeholder="Approval Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending Approval</SelectItem>
                                <SelectItem value="1">Final Approved</SelectItem>
                                <SelectItem value="0">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={stageFilter} onValueChange={setStageFilter}>
                            <SelectTrigger><SelectValue placeholder="Workflow Stage" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stages</SelectItem>
                                <SelectItem value="approved_only">Approved Requisitions</SelectItem>
                                <SelectItem value="gp_assigned">GP Desk Assigned</SelectItem>
                                <SelectItem value="cs_prepared">CS Prepared</SelectItem>
                                <SelectItem value="po_prepared">PO Prepared</SelectItem>
                            </SelectContent>
                        </Select>

                        <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full" />
                        
                        <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                            <XCircle className="mr-2 h-4 w-4" /> Clear All
                        </Button>
                    </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-bold">DN Number</TableHead>
                                <TableHead className="font-bold">Department</TableHead>
                                <TableHead className="font-bold">Created By</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="font-bold">GP Status</TableHead>
                                <TableHead className="font-bold">CS Info</TableHead>
                                <TableHead className="font-bold">PO Info</TableHead>
                                <TableHead className="text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-10">Loading Requisitions...</TableCell></TableRow>
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map(item => {
                                    const isWaitingForMe = currentUserEmployee && item.currentApproverId === currentUserEmployee.id && item.approvalStatus !== 1 && item.approvalStatus !== 0;
                                    
                                    return (
                                        <TableRow key={item.id} className={cn("hover:bg-muted/30 transition-colors", isWaitingForMe && "bg-orange-500/5")}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{item.demandNoteNumber}</span>
                                                    <span className="text-[10px] text-muted-foreground">{item.date}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getDepartmentName(item.departmentId)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{item.creatorName}</span>
                                                    <span className="text-[10px] text-muted-foreground">{formatDateTime(item.entryDate)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={item.approvalStatus === 1 ? 'default' : (item.approvalStatus === 0 ? 'destructive' : 'secondary')}>
                                                        {getDemandNoteStatusText(item)}
                                                    </Badge>
                                                    {isWaitingForMe && (
                                                        <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap">⚠️ Action Required</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant={item.gpConcernOfficerId ? "outline" : "secondary"} className="w-fit">
                                                        {item.gpConcernOfficerId ? "Assigned" : "Pending GP"}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={item.concernName}>
                                                        {item.concernName}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1">
                                                        {item.hasCs ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3 text-muted-foreground" />}
                                                        <span className="text-xs">{item.hasCs ? 'Prepared' : 'Not Ready'}</span>
                                                    </div>
                                                    {item.csPreparedDate && <span className="text-[9px] text-muted-foreground">{formatDateTime(item.csPreparedDate)}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1">
                                                        {item.hasPo ? <ShoppingCart className="h-3 w-3 text-green-500" /> : <FileText className="h-3 w-3 text-muted-foreground" />}
                                                        <span className="text-xs">{item.hasPo ? 'PO Issued' : 'No PO'}</span>
                                                    </div>
                                                    {item.poPreparedDate && <span className="text-[9px] text-muted-foreground">{formatDateTime(item.poPreparedDate)}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/demand-notes/${item.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>View Details</TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(item, 'demand-note')}><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Print DN</TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => { setCurrentItem(item); setIsDeleteConfirmOpen(true); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Delete Record</TooltipContent></Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                        No requisitions found matching your filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <DemandNoteEntryForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} onSave={handleSave} demandNote={currentItem} />
            
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Requisition?</DialogTitle><DialogDescription>This will permanently remove demand note <strong>{currentItem?.demandNoteNumber}</strong>. This action cannot be undone.</DialogDescription></DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Confirm Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
