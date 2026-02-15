
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
import { PlusCircle, Edit, Trash2, Search, Eye } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useProcurement } from './procurement-provider';
import { useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { DemandNote } from './demand-note-entry-form';
import { DemandNoteEntryForm } from './demand-note-entry-form';

export function DemandNoteTable() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { demandNotes, sections, isLoading } = useProcurement();

    const dataRef = useMemoFirebase(() => firestore ? collection(firestore, 'demandNotes') : null, [firestore]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<DemandNote> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const getDepartmentName = (id: string) => sections?.find(s => s.id === id)?.name || 'N/A';

    const safeItems = useMemo(() => Array.isArray(demandNotes) ? demandNotes : [], [demandNotes]);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return safeItems;
        const lowercasedTerm = searchTerm.toLowerCase();
        return safeItems.filter(item => 
            item.demandNoteNumber.toLowerCase().includes(lowercasedTerm) ||
            getDepartmentName(item.departmentId).toLowerCase().includes(lowercasedTerm)
        );
    }, [safeItems, searchTerm, sections]);
    
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

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by number or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button onClick={handleAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Demand Note
                    </Button>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
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
                                  <TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell>
                                </TableRow>
                              ))
                        ) : filteredItems.length > 0 ? (
                            filteredItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.demandNoteNumber}</TableCell>
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell>{getDepartmentName(item.departmentId)}</TableCell>
                                    <TableCell>Pending</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
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
