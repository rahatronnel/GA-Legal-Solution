
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
import { PlusCircle, Edit, Trash2, Search, Eye, Check, X, Hand } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import type { Employee } from '@/app/user-management/components/employee-entry-form';


export function DemandNoteTable() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { demandNotes, sections, employees, isLoading, orgSettings } = useProcurement();

    const dataRef = useMemoFirebase(() => firestore ? collection(firestore, 'demandNotes') : null, [firestore]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<DemandNote> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedConcernOfficerId, setSelectedConcernOfficerId] = useState('');

    const currentUserEmployee = useMemo(() => {
        if (!user || !employees) return null;
        return employees.find(e => e.email === user.email);
    }, [user, employees]);
    
    const { isGPOfficer, gpConcernOfficers } = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        if (!settings || !employees) return { isGPOfficer: false, gpConcernOfficers: [] };

        const GPO = settings.generalPurchaseOfficerId === currentUserEmployee?.id;
        const officers = (settings.gpConcernOfficerIds || []).map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[] || [];
        return { isGPOfficer: GPO, gpConcernOfficers: officers };
    }, [orgSettings, currentUserEmployee, employees]);

    const getDepartmentName = (id: string) => sections?.find(s => s.id === id)?.name || 'N/A';

    const safeItems = useMemo(() => Array.isArray(demandNotes) ? demandNotes : [], [demandNotes]);

    const filteredItems = useMemo(() => {
        if (isLoading) return [];
        const isSuperAdmin = user?.email === 'superadmin@galsolution.com';

        let baseList: DemandNote[];

        // 1. Establish the base list based on the user's primary role.
        if (isSuperAdmin) {
            baseList = safeItems;
        } else if (isGPOfficer) {
            baseList = safeItems.filter(note => note.approvalStatus === 1 && note.gpStatus === 'Pending');
        } else if (currentUserEmployee) {
            const procurementSettings = orgSettings?.procurementSettings;
            const isHighLevelManager = procurementSettings && (
                procurementSettings.managingDirectorId === currentUserEmployee.id ||
                procurementSettings.factoryDirectorId === currentUserEmployee.id ||
                procurementSettings.manufacturingDeptManagerId === currentUserEmployee.id ||
                procurementSettings.specializedDeptManagerId === currentUserEmployee.id
            );
    
            if (isHighLevelManager) {
                baseList = safeItems;
            } else {
                const managedSectionIds = procurementSettings?.departmentHeads
                    ?.filter(dh => dh.headId === currentUserEmployee.id || dh.technicalAdvisorId === currentUserEmployee.id)
                    .map(dh => dh.sectionId) || [];
    
                if (managedSectionIds.length > 0) {
                    baseList = safeItems.filter(note => managedSectionIds.includes(note.sectionId));
                } else {
                    baseList = safeItems.filter(note => note.createdBy === currentUserEmployee.id);
                }
            }
        } else {
            baseList = []; // Default to empty if no role matches
        }
    
        // 2. Apply secondary UI filters on top of the role-based list.
        const finalList = baseList.filter(item => {
            const searchTermMatch = !searchTerm ||
                item.demandNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getDepartmentName(item.departmentId).toLowerCase().includes(searchTerm.toLowerCase());

            // For Superadmin and GP Officer, the status filter should be completely ignored.
            if (isSuperAdmin || isGPOfficer) {
                return searchTermMatch;
            }
            
            // For all other users, apply the status filter as normal.
            const statusMatch = statusFilter === 'all' 
                ? true
                : (statusFilter === 'pending'
                    ? (item.approvalStatus !== 1 && item.approvalStatus !== 0)
                    : item.approvalStatus === parseInt(statusFilter)
                  );
            
            return searchTermMatch && statusMatch;
        });
    
        // 3. Sort and return the final list.
        return finalList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    }, [safeItems, searchTerm, statusFilter, sections, currentUserEmployee, user, isLoading, orgSettings, isGPOfficer]);


    const approvableNotes = useMemo(() => {
        return filteredItems.filter(item => {
            const isPending = item.approvalStatus !== 1 && item.approvalStatus !== 0;
            const isApprover = currentUserEmployee && item.currentApproverId === currentUserEmployee.id;
            return isPending && isApprover;
        });
    }, [filteredItems, currentUserEmployee]);
    
    const allSelectableIds = useMemo(() => {
        return isGPOfficer ? filteredItems.filter(i => i.gpStatus === 'Pending').map(i => i.id) : approvableNotes.map(n => n.id);
    }, [isGPOfficer, filteredItems, approvableNotes]);

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
            const gpStatusUpdate: { gpStatus?: 'Pending' } = {};

            if (status === 1) { // Approved
                const nextLevel = currentLevel + 1;
                if (nextLevel < approvalLevels.length) {
                    newApprovalStatus = getNextApprovalStatusCode(currentLevel);
                    nextApproverId = approvalLevels[nextLevel].approverId;
                } else {
                    newApprovalStatus = 1; // Completed
                    nextApproverId = '';
                    gpStatusUpdate.gpStatus = 'Pending';
                }
            } else { // Rejected
                newApprovalStatus = 0;
                nextApproverId = '';
            }

            setDocumentNonBlocking(noteRef, {
                approvalStatus: newApprovalStatus,
                currentApproverId: nextApproverId,
                approvalHistory: [...(note.approvalHistory || []), newHistoryEntry],
                ...gpStatusUpdate,
            }, { merge: true });
        });
        
        toast({ title: 'Success', description: `${selectedRows.length} notes have been processed.` });
        setSelectedRows([]);
    };
    
    const handleOpenAssignDialog = () => {
        if (selectedRows.length === 0) {
            toast({ variant: 'destructive', title: 'No notes selected' });
            return;
        }
        setIsAssignDialogOpen(true);
    };

    const handleConfirmAssignment = () => {
        if (!selectedConcernOfficerId) {
            toast({ variant: 'destructive', title: 'Please select a concern officer.' });
            return;
        }
        if (!dataRef || !currentUserEmployee) return;

        selectedRows.forEach(noteId => {
            const noteRef = doc(dataRef, noteId);
            setDocumentNonBlocking(noteRef, {
                gpConcernOfficerId: selectedConcernOfficerId,
                gpAssignedBy: currentUserEmployee.id,
                gpAssignedDate: new Date().toISOString(),
                gpStatus: 'Assigned',
            }, { merge: true });
        });

        toast({ title: 'Success', description: `${selectedRows.length} notes assigned.` });
        setSelectedRows([]);
        setIsAssignDialogOpen(false);
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
                        {!isGPOfficer && (
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
                        )}
                    </div>
                     <div className="flex items-center gap-2">
                        {isGPOfficer ? (
                            canPerformBulkAction && <Button size="sm" onClick={handleOpenAssignDialog}><Hand className="mr-2 h-4 w-4"/>Assign Selected</Button>
                        ) : (
                            canPerformBulkAction && (
                                <>
                                    <Button size="sm" variant="outline" onClick={() => handleBulkApproval(1)}><Check className="mr-2 h-4 w-4"/>Approve Selected</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}><X className="mr-2 h-4 w-4"/>Reject Selected</Button>
                                </>
                            )
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
                                        checked={allSelectableIds.length > 0 && selectedRows.length === allSelectableIds.length}
                                        onCheckedChange={(checked) => {
                                           setSelectedRows(checked ? allSelectableIds : []);
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
                                const isPendingForCurrentUser = approvableNotes.some(note => note.id === item.id);
                                const isPendingForGP = isGPOfficer && item.approvalStatus === 1 && item.gpStatus === 'Pending';
                                const canSelect = isPendingForCurrentUser || isPendingForGP;
                                
                                return (
                                <TableRow key={item.id} data-state={selectedRows.includes(item.id) ? "selected" : ""}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.includes(item.id)}
                                            onCheckedChange={() => toggleRowSelection(item.id)}
                                            disabled={!canSelect}
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

            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Demand Notes</DialogTitle>
                        <DialogDescription>
                            You are assigning {selectedRows.length} note(s). Select a GP Concern Officer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>GP Concern Officer</Label>
                        <Select value={selectedConcernOfficerId} onValueChange={setSelectedConcernOfficerId}>
                            <SelectTrigger><SelectValue placeholder="Select an officer..." /></SelectTrigger>
                            <SelectContent>
                                {gpConcernOfficers.map(officer => (
                                    <SelectItem key={officer.id} value={officer.id}>{officer.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmAssignment}>Confirm Assignment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
