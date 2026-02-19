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
import { PlusCircle, Trash2, Search, Eye, Printer, Copy } from 'lucide-react';
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

export function DemandNoteTable() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { demandNotes, employees, isLoading, orgSettings } = useProcurement();
    const { handlePrint } = usePrint();

    const dataRef = useMemoFirebase(() => firestore ? collection(firestore, 'demandNotes') : null, [firestore]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<DemandNote> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [user, employees]);
    
    const roleData = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        const superAdminCheck = user?.email === 'superadmin@galsolution.com';
        if (!settings || !currentUserEmployee) return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isGPConcern: false };
        const GPO = settings.generalPurchaseOfficerId === currentUserEmployee.id;
        const GPC = !!settings.gpConcernOfficerIds?.includes(currentUserEmployee.id);
        return { isSuperAdmin: superAdminCheck, isGPOfficer: GPO, isGPConcern: GPC };
    }, [orgSettings, currentUserEmployee, user]);

    const userRoleText = useMemo(() => {
        if (roleData.isSuperAdmin) return "Role: Superadmin";
        if (roleData.isGPOfficer) return "Role: GP Officer";
        if (roleData.isGPConcern) return "Role: GP Concern Officer";
        return "Role: Employee";
    }, [roleData]);

    const filteredItems = useMemo(() => {
        const safeItems = Array.isArray(demandNotes) ? demandNotes : [];
        return safeItems.filter(item => {
            const searchTermMatch = !searchTerm || item.demandNoteNumber.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'all' || (statusFilter === 'pending' ? (item.approvalStatus !== 1 && item.approvalStatus !== 0) : item.approvalStatus === parseInt(statusFilter));
            return searchTermMatch && statusMatch;
        }).sort((a, b) => new Date(b.entryDate || 0).getTime() - new Date(a.entryDate || 0).getTime());
    }, [demandNotes, searchTerm, statusFilter]);

    const handleSave = (data: Partial<DemandNote>) => {
        if (!dataRef) return;
        if (data.id) {
            setDocumentNonBlocking(doc(dataRef, data.id), data, { merge: true });
            toast({ title: 'Success', description: 'Updated.' });
        } else {
            addDocumentNonBlocking(dataRef, data);
            toast({ title: 'Success', description: 'Created.' });
        }
    };

    const confirmDelete = () => {
        if (currentItem?.id && dataRef) deleteDocumentNonBlocking(doc(dataRef, currentItem.id));
        setIsDeleteConfirmOpen(false);
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search DN..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Badge variant="outline">{userRoleText}</Badge>
                    </div>
                    <Button onClick={() => { setCurrentItem(null); setIsFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Add DN</Button>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>DN Number</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map(item => {
                                    const isWaitingForMe = currentUserEmployee && item.currentApproverId === currentUserEmployee.id && item.approvalStatus !== 1 && item.approvalStatus !== 0;
                                    return (
                                        <TableRow key={item.id} className={isWaitingForMe ? 'bg-orange-500/10' : ''}>
                                            <TableCell>{item.demandNoteNumber}</TableCell>
                                            <TableCell>{item.date}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={item.approvalStatus === 1 ? 'default' : 'secondary'}>{getDemandNoteStatusText(item)}</Badge>
                                                    {isWaitingForMe && <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap">⚠️ Action Required</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" asChild><Link href={`/procurement/local-purchase/demand-notes/${item.id}`}><Eye className="h-4 w-4" /></Link></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handlePrint(item, 'demand-note')}><Printer className="h-4 w-4" /></Button>
                                                    <Button variant="destructive" size="icon" onClick={() => { setCurrentItem(item); setIsDeleteConfirmOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No demand notes found.
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
                    <DialogHeader><DialogTitle>Are you sure?</DialogTitle><DialogDescription>This action will permanently delete the demand note record.</DialogDescription></DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Confirm Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}