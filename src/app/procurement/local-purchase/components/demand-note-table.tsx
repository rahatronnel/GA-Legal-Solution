
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
import { PlusCircle, Edit, Trash2, Search, Eye, Check, X, Hand, Printer } from 'lucide-react';
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
import { usePrint } from '@/app/vehicle-management/components/print-provider';


export function DemandNoteTable() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { demandNotes, sections, employees, isLoading, orgSettings } = useProcurement();
    const { handlePrint } = usePrint();

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
    
    const { isGPOfficer, isGPConcern, gpConcernOfficers, isSuperAdmin, isManager } = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        const superAdminCheck = user?.email === 'superadmin@galsolution.com';

        if (!settings || !employees || !user) {
            return { isGPOfficer: false, isSuperAdmin: superAdminCheck, isGPConcern: false, isManager: false, gpConcernOfficers: [] };
        }
        
        const currentEmp = employees.find(e => e.email === user?.email);
        if (!currentEmp) {
            return { isGPOfficer: false, isSuperAdmin: superAdminCheck, isGPConcern: false, isManager: false, gpConcernOfficers: [] };
        }

        const GPO = settings.generalPurchaseOfficerId === currentEmp.id;
        const GPC = !!settings.gpConcernOfficerIds?.includes(currentEmp.id);
        const officers = (settings.gpConcernOfficerIds || []).map(id => employees.find(e => e.id === id)).filter(Boolean) as any[] || [];
        const manager = 
            settings.managingDirectorId === currentEmp.id ||
            settings.factoryDirectorId === currentEmp.id ||
            settings.manufacturingDeptManagerId === currentEmp.id ||
            settings.specializedDeptManagerId === currentEmp.id;
        
        return { isGPOfficer: GPO, isGPConcern: GPC, gpConcernOfficers: officers, isSuperAdmin: superAdminCheck, isManager: manager };
    }, [orgSettings, employees, user]);

    const userRoleText = useMemo(() => {
        if (isSuperAdmin) return "Role: Superadmin";
        if (isGPOfficer) return "Role: GP Officer";
        if (isManager) return "Role: Manager";
        if (isGPConcern) return "Role: GP Concern Officer";
        return "Role: Employee";
    }, [isSuperAdmin, isGPOfficer, isGPConcern, isManager]);

    const getDepartmentName = (id: string) => sections?.find(s => s.id === id)?.name || 'N/A';
    const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.fullName || 'N/A';

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

    const safeItems = useMemo(() => Array.isArray(demandNotes) ? demandNotes : [], [demandNotes]);
    
    const filteredItems = useMemo(() => {
        if (isLoading) return [];
    
        let baseList: DemandNote[];
    
        if (isSuperAdmin) {
            baseList = safeItems;
        } else if (currentUserEmployee) {
            if (isManager) {
                baseList = safeItems;
            } else {
                const procurementSettings = orgSettings?.procurementSettings;
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
            baseList = [];
        }
    
        const finalList = baseList.filter(item => {
            const searchTermMatch = !searchTerm ||
                item.demandNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getDepartmentName(item.departmentId).toLowerCase().includes(searchTerm.toLowerCase());
            
            const statusMatch = statusFilter === 'all' 
                ? true
                : (statusFilter === 'pending'
                    ? (item.approvalStatus !== 1 && item.approvalStatus !== 0)
                    : item.approvalStatus === parseInt(statusFilter, 10)
                  );
            
            return searchTermMatch && statusMatch;
        });
    
        return finalList.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    
    }, [safeItems, searchTerm, statusFilter, sections, currentUserEmployee, isLoading, orgSettings, isManager, isSuperAdmin]);


    const approvableNotes = useMemo(() => {
        return filteredItems.filter(item => {
            const isPending = item.approvalStatus !== 1 && item.approvalStatus !== 0;
            const isApprover = currentUserEmployee && item.currentApproverId === currentUserEmployee.id;
            return isPending && isApprover;
        });
    }, [filteredItems, currentUserEmployee]);
    
    const allSelectableIds = useMemo(() => {
        return approvableNotes.map(n => n.id);
    }, [approvableNotes]);

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

            let updatePayload: Partial<DemandNote> = {
                approvalHistory: [...(note.approvalHistory || []), newHistoryEntry],
            };

            if (status === 1) { // Approved
                const nextLevel = currentLevel + 1;
                if (nextLevel < approvalLevels.length) {
                    updatePayload.approvalStatus = getNextApprovalStatusCode(currentLevel);
                    updatePayload.currentApproverId = approvalLevels[nextLevel].approverId;
                } else {
                    updatePayload.approvalStatus = 1; // Completed
                    updatePayload.currentApproverId = '';
                    updatePayload.gpStatus = 'Pending';
                }
            } else { // Rejected
                updatePayload.approvalStatus = 0;
                updatePayload.currentApproverId = '';
            }

            setDocumentNonBlocking(noteRef, updatePayload, { merge: true });
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
                        <Badge variant="outline">{userRoleText}</Badge>
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
                                <TableHead>Created By</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>GP Status</TableHead>
                                <TableHead className="w-[160px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                            Array.from({length: 3}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-5"/></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-32 float-right" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredItems.length > 0 ? (
                            filteredItems.map(item => {
                                const isPendingForCurrentUser = approvableNotes.some(note => note.id === item.id);
                                const canSelect = isPendingForCurrentUser;
                                const {date: entryDate, time: entryTime} = formatDateTime(item.entryDate);
                                
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
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{getEmployeeName(item.createdBy)}</span>
                                            {entryDate && <span className="text-xs text-muted-foreground">{entryDate}</span>}
                                            {entryTime && <span className="text-xs text-muted-foreground">{entryTime}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant={getStatusVariant(item.approvalStatus)}>{getDemandNoteStatusText(item)}</Badge></TableCell>
                                    <TableCell>
                                        {item.approvalStatus === 1 ? (
                                            <Badge variant={item.gpStatus === 'Assigned' ? 'default' : 'secondary'}>{item.gpStatus || 'Pending'}</Badge>
                                        ) : (
                                            <Badge variant="outline">N/A</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/demand-notes/${item.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(item, 'demand-note')}><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Print</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
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
