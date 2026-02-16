
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Printer, Users, FilePlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useProcurement } from './procurement-provider';
import { useFirestore, useMemoFirebase, setDocumentNonBlocking, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { DemandNote, Quotation } from './demand-note-entry-form';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ComparativeStatementForm } from './cs-entry-form';

const MultiSelectPopover: React.FC<{
    items: Vendor[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    placeholder: string;
}> = ({ items, selectedIds, onSelectionChange, placeholder }) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (id: string) => {
        const newSelectedIds = selectedIds.includes(id)
            ? selectedIds.filter(selectedId => selectedId !== id)
            : [...selectedIds, id];
        onSelectionChange(newSelectedIds);
    };

    const selectedItems = items.filter(item => selectedIds.includes(item.id));

    return (
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-10">
                    <div className="flex flex-wrap gap-1">
                        {selectedItems.length > 0
                            ? selectedItems.map(item => <Badge key={item.id} variant="secondary">{item.vendorName}</Badge>)
                            : placeholder
                        }
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search vendors..." />
                     <ScrollArea className="h-48">
                        <CommandList>
                        <CommandEmpty>No vendors found.</CommandEmpty>
                        <CommandGroup>
                            {items.map(item => (
                                <CommandItem
                                    key={item.id}
                                    value={`${item.vendorName} ${item.vendorId}`}
                                    onSelect={() => handleSelect(item.id)}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", selectedIds.includes(item.id) ? "opacity-100" : "opacity-0")} />
                                    {item.vendorName}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        </CommandList>
                     </ScrollArea>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default function GPDeskTable() {
    const { user } = useUser();
    const { demandNotes, sections, employees, vendors, isLoading, orgSettings } = useProcurement();
    const { handlePrint } = usePrint();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [searchTerm, setSearchTerm] = useState('');
    const [assignedToFilter, setAssignedToFilter] = useState('all');
    const [vendorAssignmentFilter, setVendorAssignmentFilter] = useState('all');

    const [isAssignVendorOpen, setIsAssignVendorOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState<DemandNote | null>(null);
    const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);

    const [isCsFormOpen, setIsCsFormOpen] = useState(false);
    const [currentNoteForCs, setCurrentNoteForCs] = useState<DemandNote | null>(null);

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
            
            const vendorAssignmentMatch = vendorAssignmentFilter === 'all' || 
                (vendorAssignmentFilter === 'assigned' && item.quotations && item.quotations.length > 0) ||
                (vendorAssignmentFilter === 'not_assigned' && (!item.quotations || item.quotations.length === 0));

            return searchTermMatch && assignedToMatch && vendorAssignmentMatch;
        }).sort((a, b) => new Date(b.gpAssignedDate || 0).getTime() - new Date(a.gpAssignedDate || 0).getTime());
    }, [safeItems, searchTerm, assignedToFilter, vendorAssignmentFilter, currentUserEmployee, user, isGPOfficer, isGPConcern, getDepartmentName]);

    const handleOpenAssignVendors = (note: DemandNote) => {
        setCurrentNote(note);
        setSelectedVendorIds(note.quotations?.map(q => q.vendorId) || []);
        setIsAssignVendorOpen(true);
    };
    
    const handleCreateCs = (note: DemandNote) => {
        if (!note.quotations || note.quotations.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Cannot Create CS',
                description: 'You must assign vendors before creating a Comparative Statement.',
            });
            return;
        }
        setCurrentNoteForCs(note);
        setIsCsFormOpen(true);
    };

    const handleSaveCs = (csData: any) => {
        if (!firestore) return;
        const csRef = collection(firestore, 'comparativeStatements');
        addDocumentNonBlocking(csRef, csData);
        toast({ title: 'Success', description: 'Comparative Statement saved successfully.' });
    };

    const handleConfirmVendorAssignment = () => {
        if (!currentNote || !firestore) return;
        
        const noteRef = doc(firestore, 'demandNotes', currentNote.id);
        const existingQuotations = currentNote.quotations || [];

        const existingMap = new Map(existingQuotations.map(q => [q.vendorId, q]));

        const newQuotations: Quotation[] = selectedVendorIds.map(vendorId => {
            const existing = existingMap.get(vendorId);
            return existing || { vendorId, fileName: '', fileDataUrl: '' };
        });

        setDocumentNonBlocking(noteRef, { quotations: newQuotations }, { merge: true });
        toast({ title: 'Success', description: 'Vendor assignments have been updated.' });
        setIsAssignVendorOpen(false);
    };


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
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by Assigned To..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Concern Officers</SelectItem>
                                {gpConcernOfficers.map(officer => (
                                    <SelectItem key={officer.id} value={officer.id}>{officer.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={vendorAssignmentFilter} onValueChange={setVendorAssignmentFilter}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by Vendor Status..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Vendor Statuses</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="not_assigned">Not Assigned</SelectItem>
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
                                <TableHead>Assigned Date & Time</TableHead>
                                <TableHead>Vendor Assignment</TableHead>
                                <TableHead className="w-[160px] text-right">Actions</TableHead>
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
                            filteredItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.demandNoteNumber}</TableCell>
                                    <TableCell>{getDepartmentName(item.departmentId)}</TableCell>
                                    <TableCell>{getEmployeeName(item.gpConcernOfficerId || '')}</TableCell>
                                    <TableCell>{item.gpAssignedDate ? new Date(item.gpAssignedDate).toLocaleString() : 'N/A'}</TableCell>
                                    <TableCell>
                                        {item.quotations && item.quotations.length > 0
                                            ? <Badge variant="default">Assigned</Badge>
                                            : <Badge variant="secondary">Not Assigned</Badge>
                                        }
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenAssignVendors(item)}><Users className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Assign Vendors</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCreateCs(item)}><FilePlus className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Create CS</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/demand-notes/${item.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(item, 'demand-note')}><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Print</TooltipContent></Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No assigned demand notes found.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isAssignVendorOpen} onOpenChange={setIsAssignVendorOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Assign Vendors for {currentNote?.demandNoteNumber}</DialogTitle>
                        <DialogDescription>
                            Select one or more vendors to request quotations from for this demand note.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Vendors</Label>
                        <MultiSelectPopover
                            items={vendors || []}
                            selectedIds={selectedVendorIds}
                            onSelectionChange={setSelectedVendorIds}
                            placeholder="Select vendors to assign..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignVendorOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmVendorAssignment}>Confirm Assignment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isCsFormOpen && (
                 <ComparativeStatementForm
                    isOpen={isCsFormOpen}
                    setIsOpen={setIsCsFormOpen}
                    demandNote={currentNoteForCs}
                    onSave={handleSaveCs}
                />
            )}

        </TooltipProvider>
    );
}

  

    