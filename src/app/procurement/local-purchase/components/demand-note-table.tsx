
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Search, Eye, Check, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useProcurement } from './procurement-provider';
import { useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { DemandNote } from './demand-note-entry-form';
import { DemandNoteEntryForm } from './demand-note-entry-form';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getDemandNoteStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';


export function DemandNoteTable() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { demandNotes, sections, employees, isLoading } = useProcurement();

    const dataRef = useMemoFirebase(() => firestore ? collection(firestore, 'demandNotes') : null, [firestore]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<DemandNote> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    const currentUserEmployee = useMemo(() => {
        if (!user || !employees) return null;
        return employees.find(e => e.email === user.email);
    }, [user, employees]);

    const getDepartmentName = (id: string) => sections?.find(s => s.id === id)?.name || 'N/A';

    const safeItems = useMemo(() => Array.isArray(demandNotes) ? demandNotes : [], [demandNotes]);

    const filteredItems = useMemo(() => {
        return safeItems.filter(item => {
            const searchTermMatch = !searchTerm ||
                item.demandNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getDepartmentName(item.departmentId).toLowerCase().includes(searchTerm.toLowerCase());

            let statusMatch = true;
            if (statusFilter === 'pending') {
                statusMatch = item.approvalStatus !== 1 && item.approvalStatus !== 0;
            } else if (statusFilter !== 'all') {
                statusMatch = item.approvalStatus === parseInt(statusFilter);
            }
            
            return searchTermMatch && statusMatch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [safeItems, searchTerm, statusFilter, sections]);

    const approvableNotes = useMemo(() => {
        return filteredItems.filter(item => {
            const isPending = item.approvalStatus !== 1 && item.approvalStatus !== 0;
            const isApprover = currentUserEmployee && item.currentApproverId === currentUserEmployee.id;
            return isPending && isApprover;
        });
    }, [filteredItems, currentUserEmployee]);

    const handleAdd = () => {
        setCurrentItem(null);
        setIsFormOpen(true);
    };

    const handleEdit = (item: DemandNote) => {
        setCurrentItem(item);
        setIsFormOpen(true);
    };
    
    const handleDelete = (item: DemandNote) => {
        setCurrentItem(item);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (currentItem?.id && dataRef) {
            deleteDocumentNonBlocking(doc(dataRef, currentItem.id));
            toast({ title: 'Success', description: 'Demand Note deleted successfully.' });
        }
        setIsDeleteConfirmOpen(false);
        setCurrentItem(null);
    };
    
    const handleSave = (data: Partial<DemandNote>) => {
        if (!dataRef) return;
        if (data.id) {
            const { id, ...updateData } = data;
            setDocumentNonBlocking(doc(dataRef, id), updateData, { merge: true });
            toast({ title: 'Success', description: 'Demand Note updated.' });
        } else {
            addDocumentNonBlocking(dataRef, data);
            toast({ title: 'Success', description: 'Demand Note created.' });
        }
        setIsFormOpen(false);
    };
    
    const getStatusVariant = (status: number | undefined) => {
        if (status === 1) return 'default';
        if (status === 0) return 'destructive';
        return 'secondary';
    }

    const toggleRowSelection = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    };

    const handleBulkApproval = (status: number) => {
        if (!firestore || !currentUserEmployee || !dataRef) return;

        selectedRows.forEach(noteId => {
            const note = demandNotes.find(b => b.id === noteId);
            if (!note || !note.approvalFlow?.steps) return;

            const noteRef = doc(dataRef, noteId);
            const approvalLevels = note.approvalFlow.steps;
            const currentLevel = note.approvalHistory?.length || 0;

            const newHistoryEntry = {
                approverId: currentUserEmployee.id,
                status: status === 1 ? 'Approved' : 'Rejected',
                timestamp: new Date().toISOString(),
                level: currentLevel,
                remarks: `Bulk action from list view`,
            };

            let newApprovalStatus: number | undefined;
            let nextApproverId: string;

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

            setDocumentNonBlocking(noteRef, {
                approvalStatus: newApprovalStatus,
                currentApproverId: nextApproverId,
                approvalHistory: [...(note.approvalHistory || []), newHistoryEntry],
            }, { merge: true });
        });
        
        toast({ title: 'Success', description: `${selectedRows.length} notes have been processed.` });
        setSelectedRows([]);
    };
    
    const canPerformBulkAction = selectedRows.length > 0;

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
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="1">Approved</SelectItem>
                                <SelectItem value="0">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center gap-2">
                        {canPerformBulkAction && (
                            <>
                                <Button size="sm" variant="outline" onClick={() => handleBulkApproval(1)}><Check className="mr-2 h-4 w-4"/>Approve Selected</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}><X className="mr-2 h-4 w-4"/>Reject Selected</Button>
                            </>
                        )}
                        <Button onClick={handleAdd}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Demand Note
                        </Button>
                    </div>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                     <Checkbox
                                        checked={selectedRows.length === approvableNotes.length && approvableNotes.length > 0}
                                        onCheckedChange={(checked) => {
                                           const allApprovableIds = approvableNotes.map(b => b.id);
                                           setSelectedRows(checked ? allApprovableIds : []);
                                        }}
                                        aria-label="Select all approvable notes"
                                    />
                                </TableHead>
                                <TableHead>Demand Note #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[120px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                             Array.from({length: 3}).map((_, i) => (
                                <TableRow key={i}>
                                  <TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell>
                                </TableRow>
                              ))
                        ) : filteredItems.length > 0 ? (
                            filteredItems.map(item => {
                                const isPending = item.approvalStatus !== 1 && item.approvalStatus !== 0;
                                const canApprove = currentUserEmployee && (item.currentApproverId === currentUserEmployee.id || user?.email === 'superadmin@galsolution.com');
                                return (
                                <TableRow key={item.id} data-state={selectedRows.includes(item.id) ? "selected" : ""}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.includes(item.id)}
                                            onCheckedChange={() => toggleRowSelection(item.id)}
                                            disabled={!isPending || !canApprove}
                                            aria-label={`Select note ${item.demandNoteNumber}`}
                                        />
                                    </TableCell>
                                    <TableCell>{item.demandNoteNumber}</TableCell>
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell>{getDepartmentName(item.departmentId)}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(item.approvalStatus)}>{getDemandNoteStatusText(item)}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/demand-notes/${item.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No demand notes found.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <DemandNoteEntryForm
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                onSave={handleSave}
                demandNote={currentItem}
            />

            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete "{currentItem?.demandNoteNumber}".
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
