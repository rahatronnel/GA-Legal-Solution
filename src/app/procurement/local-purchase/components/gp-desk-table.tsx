"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
    Search, Eye, Printer, Users, FilePlus, Hand, 
    UserPlus, Copy, HelpCircle, Info, Tag, ShieldCheck, ListOrdered,
    Briefcase, CheckCircle2, ChevronsUpDown, Check, X
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { DemandNote, Quotation } from './demand-note-entry-form';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ComparativeStatementForm } from './cs-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import { Separator } from '@/components/ui/separator';

const GPDeskUserGuide = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col animate-dialog-in p-0 overflow-hidden">
            <div className="bg-primary p-6 text-primary-foreground shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <HelpCircle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <DialogTitle className="text-2xl font-black tracking-tight text-white">GP Desk Operational Guide</DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 font-medium">Internal workflow for General Purchase (GP) task management and vendor sourcing.</DialogDescription>
                    </div>
                </div>
            </div>
            <ScrollArea className="flex-grow">
                <div className="space-y-6 p-6 pb-32">
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><Info className="h-4 w-4"/> Objective</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            The General Purchase (GP) Desk is the operational hub where approved requisitions are transformed into actual vendor commitments. It manages the lifecycle between Demand Note approval and Comparative Statement generation.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><UserPlus className="h-4 w-4"/> Stage 1: Concern Assignment</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Once a Demand Note is approved, the <strong>GP Officer</strong> must assign a specific <strong>GP Concern Officer</strong>. This individual becomes the "Owner" of the procurement process for that specific requisition.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><Users className="h-4 w-4"/> Stage 2: Vendor Sourcing</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            The assigned Concern Officer identifies suitable vendors and clicks the <Users className="h-3 w-3 inline mx-1"/> icon to "Assign Vendors". This creates a structured tracking record for expected quotations.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><Tag className="h-4 w-4"/> Stage 3: Quotation Collection</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Concern Officers collect physical or digital bids from the assigned vendors. These quotations are then uploaded to the system via the Demand Note details page to ensure audit transparency.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><FilePlus className="h-4 w-4"/> Stage 4: CS Initiation</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            After quotations are finalized, the Concern Officer clicks the <FilePlus className="h-3 w-3 inline mx-1"/> icon to initiate the <strong>Comparative Statement (CS)</strong>. This triggers the financial analysis phase.
                        </p>
                    </section>
                </div>
                <ScrollBar orientation="vertical" />
            </ScrollArea>
            <DialogFooter className="p-4 border-t shrink-0">
                <Button onClick={() => onOpenChange(false)} className="w-full font-bold uppercase tracking-widest text-white">Dismiss Guide</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
};

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
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto min-h-10">
                    <div className="flex flex-wrap gap-1">
                        {selectedItems.length > 0
                            ? selectedItems.map(item => <Badge key={item.id} variant="secondary">{item.vendorName}</Badge>)
                            : placeholder
                        }
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 animate-scale-in">
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

export function GPDeskTable() {
    const { demandNotes, sections, employees, vendors, comparativeStatements, isLoading, orgSettings } = useProcurement();
    const { user } = useUser();
    const { handlePrint } = usePrint();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [searchTerm, setSearchTerm] = useState('');
    const [assignedToFilter, setAssignedToFilter] = useState('all');
    const [vendorAssignmentFilter, setVendorAssignmentFilter] = useState('all');

    const [isAssignConcernOpen, setIsAssignConcernOpen] = useState(false);
    const [selectedConcernId, setSelectedConcernId] = useState('');

    const [isAssignVendorOpen, setIsAssignVendorOpen] = useState(false);
    const [currentNote, setCurrentNote] = useState<DemandNote | null>(null);
    const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);

    const [isCsFormOpen, setIsCsFormOpen] = useState(false);
    const [currentNoteForCs, setCurrentNoteForCs] = useState<DemandNote | null>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const currentUserEmployee = useMemo(() => {
        if (!user || !employees) return null;
        return employees.find(e => e.email === user.email);
    }, [user, employees]);

    const roleData = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        const superAdmin = user?.email === 'superadmin@galsolution.com' || user?.email === 'systemadmin@ykk.com';

        if (!settings || !employees || !user) {
            return { isGPOfficer: false, isSuperAdmin: superAdmin, isGPConcern: false, isManager: false };
        }
        
        const currentEmp = employees.find(e => e.email === user?.email);
        if (!currentEmp) {
            return { isGPOfficer: false, isSuperAdmin: superAdmin, isGPConcern: false, isManager: false };
        }

        const GPO = settings.generalPurchaseOfficerId === currentEmp.id;
        const GPC = !!settings.gpConcernOfficerIds?.includes(currentEmp.id);
        const manager = 
            settings.managingDirectorId === currentEmp.id ||
            settings.factoryDirectorId === currentEmp.id ||
            settings.manufacturingDeptManagerId === currentEmp.id ||
            settings.specializedDeptManagerId === currentEmp.id;
        
        return { isGPOfficer: GPO, isSuperAdmin: superAdmin, isGPConcern: GPC, isManager: manager };
    }, [orgSettings, employees, user]);
    
    useEffect(() => {
        if (roleData.isGPConcern && !roleData.isSuperAdmin && !roleData.isGPOfficer && !roleData.isManager) {
            setAssignedToFilter(currentUserEmployee?.id || 'all');
        }
    }, [roleData, currentUserEmployee]);

    const gpConcernOfficers = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        if (!settings || !employees) {
            return [];
        }
        return (settings.gpConcernOfficerIds || [])
            .map(id => employees.find(e => e.id === id))
            .filter(Boolean) as Employee[];
    }, [orgSettings, employees]);

    const getDepartmentName = (id: string) => sections?.find(s => s.id === id)?.name || 'N/A';
    const getEmployeeName = (id: string) => employees?.find(e => e.id === id)?.fullName || 'N/A';

    const safeItems = useMemo(() => Array.isArray(demandNotes) ? demandNotes : [], [demandNotes]);

    const filteredItems = useMemo(() => {
        const canViewAll = roleData.isSuperAdmin || roleData.isGPOfficer || roleData.isManager;

        let baseList: DemandNote[];

        if (canViewAll) {
            baseList = safeItems.filter(note => Number(note.approvalStatus) === 1);
        } else if (roleData.isGPConcern) {
            baseList = safeItems.filter(note => note.gpConcernOfficerId === currentUserEmployee?.id && Number(note.approvalStatus) === 1);
        } else {
            baseList = [];
        }
        
        return baseList.filter(item => {
            const searchTermMatch = !searchTerm ||
                item.demandNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getDepartmentName(item.departmentId).toLowerCase().includes(searchTerm.toLowerCase());

            const assignedToMatch = assignedToFilter === 'all' || item.gpConcernOfficerId === assignedToFilter;
            
            const vendorAssignmentMatch = vendorAssignmentFilter === 'all' || 
                (vendorAssignmentFilter === 'assigned' && item.quotations && item.quotations.length > 0) ||
                (vendorAssignmentFilter === 'not_assigned' && (!item.quotations || item.quotations.length === 0));

            return searchTermMatch && assignedToMatch && vendorAssignmentMatch;
        }).sort((a, b) => {
            // HIGH-FIDELITY PRIORITY SORTING: Unassigned DNs (Waiting for Officer) must appear first
            const aIsUnassigned = !a.gpConcernOfficerId;
            const bIsUnassigned = !b.gpConcernOfficerId;

            if (aIsUnassigned && !bIsUnassigned) return -1;
            if (!aIsUnassigned && bIsUnassigned) return 1;

            if (aIsUnassigned && bIsUnassigned) {
                return new Date(a.entryDate || 0).getTime() - new Date(b.entryDate || 0).getTime();
            }

            return new Date(b.gpAssignedDate || 0).getTime() - new Date(a.gpAssignedDate || 0).getTime();
        });
    }, [safeItems, searchTerm, assignedToFilter, vendorAssignmentFilter, roleData, currentUserEmployee, sections]);


    const handleOpenAssignConcern = (note: DemandNote) => {
        setCurrentNote(note);
        setSelectedConcernId(note.gpConcernOfficerId || '');
        setIsAssignConcernOpen(true);
    };

    const handleConfirmConcernAssignment = () => {
        if (!currentNote || !firestore || !currentUserEmployee) return;
        
        const noteRef = doc(firestore, 'demandNotes', currentNote.id);
        setDocumentNonBlocking(noteRef, { 
            gpConcernOfficerId: selectedConcernId,
            gpAssignedBy: currentUserEmployee.id,
            gpAssignedDate: new Date().toISOString(),
            gpStatus: 'Pending' 
        }, { merge: true });

        toast({ title: 'Success', description: 'GP Concern Officer has been assigned.' });
        setIsAssignConcernOpen(false);
    };

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

        setDocumentNonBlocking(noteRef, { 
            quotations: newQuotations,
            vendorAssignmentDate: new Date().toISOString(),
            gpStatus: newQuotations.length > 0 ? 'Assigned' : 'Pending'
        }, { merge: true });

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
                        <Select value={assignedToFilter} onValueChange={setAssignedToFilter} disabled={roleData.isGPConcern && !roleData.isSuperAdmin && !roleData.isGPOfficer && !roleData.isManager}>
                            <SelectTrigger className="w-[200px] animate-scale-in"><SelectValue placeholder="Filter by GP Concern..." /></SelectTrigger>
                            <SelectContent className="animate-scale-in">
                                <SelectItem value="all">All Concern Officers</SelectItem>
                                {gpConcernOfficers.map(officer => (
                                    <SelectItem key={officer.id} value={officer.id}>{officer.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={vendorAssignmentFilter} onValueChange={setVendorAssignmentFilter}>
                            <SelectTrigger className="w-[200px] animate-scale-in"><SelectValue placeholder="Filter by Vendor Status..." /></SelectTrigger>
                            <SelectContent className="animate-scale-in">
                                <SelectItem value="all">All Vendor Statuses</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="not_assigned">Not Assigned</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" className="text-primary border-primary hover:bg-primary/5 animate-scale-in" onClick={() => setIsGuideOpen(true)}>
                        <HelpCircle className="mr-2 h-4 w-4" /> User Guide
                    </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-bold">Demand Note #</TableHead>
                                <TableHead className="font-bold">Department</TableHead>
                                <TableHead className="font-bold">GP Concern</TableHead>
                                <TableHead className="font-bold">Vendor Assignment</TableHead>
                                <TableHead className="font-bold">CS Prepared</TableHead>
                                <TableHead className="w-[160px] text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                             Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                  <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                                </TableRow>
                              ))
                        ) : filteredItems.length > 0 ? (
                            filteredItems.map(item => {
                                const cs = comparativeStatements.find(cs => cs.demandNoteId === item.id);
                                const isCurrentUserConcern = currentUserEmployee?.id === item.gpConcernOfficerId;
                                const isGPManager = roleData.isGPOfficer || roleData.isSuperAdmin;
                                
                                const needsVendorAssignment = isCurrentUserConcern && (!item.quotations || item.quotations.length === 0);
                                const needsCsCreation = isCurrentUserConcern && item.quotations && item.quotations.length > 0 && !cs;
                                const isWaitingForAssignment = isGPManager && !item.gpConcernOfficerId;

                                return (
                                <TableRow key={item.id} className={cn("hover:bg-muted/30 transition-colors", (needsVendorAssignment || needsCsCreation || isWaitingForAssignment) && 'bg-orange-50/5')}>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">{item.demandNoteNumber}</span>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-4 w-4 opacity-50 hover:opacity-100" onClick={() => { navigator.clipboard.writeText(item.demandNoteNumber); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Copy DN#</TooltipContent></Tooltip>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getDepartmentName(item.departmentId)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className={item.gpConcernOfficerId ? 'text-sm font-medium' : 'text-muted-foreground italic'}>
                                                {item.gpConcernOfficerId ? getEmployeeName(item.gpConcernOfficerId) : 'Unassigned'}
                                            </span>
                                            {item.gpAssignedDate && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(item.gpAssignedDate).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {item.quotations && item.quotations.length > 0 ? (
                                            <div>
                                                <Badge variant="default">Assigned</Badge>
                                                {item.vendorAssignmentDate && (
                                                    <span className="block text-[10px] text-muted-foreground">
                                                        {new Date(item.vendorAssignmentDate).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        ) : <Badge variant="secondary">Not Assigned</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {cs ? (
                                            <div className="flex flex-col">
                                                <Badge variant="default">Yes</Badge>
                                                <span className="text-[10px] text-muted-foreground">{new Date(cs.csDate).toLocaleString()}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="secondary">No</Badge>
                                                {isWaitingForAssignment && <Badge className="bg-blue-500 animate-pulse text-white whitespace-nowrap text-[9px] h-4">⚠️ Assign Concern</Badge>}
                                                {needsVendorAssignment && <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap text-[9px] h-4">⚠️ Assign Vendors</Badge>}
                                                {needsCsCreation && <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap text-[9px] h-4">⚠️ Prepare CS</Badge>}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {isGPManager && !item.gpConcernOfficerId && (
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 animate-pulse" onClick={() => handleOpenAssignConcern(item)}><UserPlus className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Assign Concern Officer</TooltipContent></Tooltip>
                                            )}
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenAssignVendors(item)} disabled={!isCurrentUserConcern}><Users className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Assign Vendors</TooltipContent></Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCreateCs(item)} disabled={!!cs || !item.quotations || item.quotations.length === 0 || !isCurrentUserConcern}><FilePlus className="h-4 w-4" /></Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="animate-scale-in">{cs ? 'CS already created' : 'Create CS'}</TooltipContent>
                                            </Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/demand-notes/${item.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent className="animate-scale-in">View Requisition</TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(item, 'demand-note')}><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Print DN</TooltipContent></Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No approved demand notes currently awaiting GP Desk processing.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isAssignConcernOpen} onOpenChange={setIsAssignConcernOpen}>
                <DialogContent className="sm:max-w-md animate-dialog-in">
                    <DialogHeader>
                        <DialogTitle>Assign GP Concern Officer</DialogTitle>
                        <DialogDescription>Select the officer responsible for processing the quotations for DN: {currentNote?.demandNoteNumber}.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Select Officer</Label>
                            <Select value={selectedConcernId} onValueChange={setSelectedConcernId}>
                                <SelectTrigger className="animate-scale-in"><SelectValue placeholder="Choose an officer..." /></SelectTrigger>
                                <SelectContent className="animate-scale-in">
                                    {gpConcernOfficers.map(officer => (
                                        <SelectItem key={officer.id} value={officer.id}>{officer.fullName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignConcernOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmConcernAssignment} disabled={!selectedConcernId}>Confirm Assignment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAssignVendorOpen} onOpenChange={setIsAssignVendorOpen}>
                <DialogContent className="sm:max-w-2xl animate-dialog-in">
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

            <GPDeskUserGuide isOpen={isGuideOpen} onOpenChange={setIsGuideOpen} />

        </TooltipProvider>
    );
}
