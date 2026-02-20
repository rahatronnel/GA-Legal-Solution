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
import { PlusCircle, Trash2, Search, Eye, Printer, Filter, XCircle, Check, X, Info, CheckCircle, Hourglass, MoreHorizontal, Copy, HelpCircle, ListOrdered, ShieldCheck, UserCheck, Tag } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { DemandNote } from './demand-note-entry-form';
import { DemandNoteEntryForm } from './demand-note-entry-form';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getDemandNoteStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const DemandNoteUserGuide = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col animate-dialog-in">
            <DialogHeader>
                <div className="flex items-center gap-2 text-primary">
                    <HelpCircle className="h-6 w-6" />
                    <DialogTitle className="text-xl">Demand Note (DN) User Guide</DialogTitle>
                </div>
                <DialogDescription>Internal guidelines for material and service requisitions.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow pr-4 max-h-[60vh] border rounded-md">
                <div className="space-y-6 p-4">
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><Info className="h-4 w-4"/> Objective</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            The Demand Note is the starting point of the procurement lifecycle. It serves as a formal internal request from any department for goods, services, or equipment.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><ListOrdered className="h-4 w-4"/> Dynamic Approval Logic</h4>
                        <p className="text-sm text-muted-foreground mb-2">The system automatically calculates the approval path based on the items requested:</p>
                        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                            <li><strong>Standard:</strong> Routed to the department's Head and Technical Advisor.</li>
                            <li><strong>Manufacturing:</strong> Routed to Head, TA, and the Manufacturing Dept. Manager.</li>
                            <li><strong>Special Items:</strong> Routed to Head, TA, Specialized Dept. Manager, and finally the Managing Director (MD).</li>
                        </ul>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4"/> GP Desk Integration</h4>
                        <p className="text-sm text-muted-foreground">
                            Once a Demand Note is <Badge>Final Approved</Badge>, it is automatically visible at the <strong>General Purchase (GP) Desk</strong>. Here, a GP Officer will assign a specific "GP Concern" to begin sourcing vendor quotations.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><UserCheck className="h-4 w-4"/> Access & Visibility</h4>
                        <p className="text-sm text-muted-foreground">
                            Requisitions are visible to the creator, all approvers in the chain, and GP personnel. Management can track the status in real-time via the <Badge variant="outline">Action Beacons</Badge> displayed in the list view.
                        </p>
                    </section>
                </div>
            </ScrollArea>
            <DialogFooter className="border-t pt-4">
                <Button onClick={() => onOpenChange(false)}>Dismiss Guide</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

export function DemandNoteTable() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { demandNotes, employees, sections, comparativeStatements, purchaseOrders, isLoading, orgSettings } = useProcurement();
    const { handlePrint } = usePrint();

    const dataRef = useMemoFirebase(() => firestore ? collection(firestore, 'demandNotes') : null, [firestore]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<DemandNote> | null>(null);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedNoteForStatus, setSelectedNoteForStatus] = useState<DemandNote | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stageFilter, setStageFilter] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const currentUserEmployee = useMemo(() => {
        if (!user || !employees) return null;
        return employees.find(e => e.email === user.email);
    }, [user, employees]);

    const roleData = useMemo(() => {
        const superAdminCheck = user?.email === 'superadmin@galsolution.com';
        const settings = orgSettings?.procurementSettings;
        if (!settings || !currentUserEmployee) return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isGPConcern: false, isManager: false, isAnyDeptHead: false };

        const GPO = settings.generalPurchaseOfficerId === currentUserEmployee.id;
        const GPC = !!settings.gpConcernOfficerIds?.includes(currentUserEmployee.id);
        const managerCheck =
            settings.managingDirectorId === currentUserEmployee.id ||
            settings.factoryDirectorId === currentUserEmployee.id ||
            settings.manufacturingDeptManagerId === currentUserEmployee.id ||
            settings.specializedDeptManagerId === currentUserEmployee.id;
        
        const anyDeptHeadCheck = settings.departmentHeads?.some(
            dh => dh.headId === currentUserEmployee.id || dh.technicalAdvisorId === currentUserEmployee.id
        );

        return {
            isSuperAdmin: superAdminCheck,
            isGPOfficer: GPO,
            isGPConcern: GPC,
            isManager: managerCheck,
            isAnyDeptHead: anyDeptHeadCheck
        };
    }, [orgSettings, currentUserEmployee, user]);

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
            let isVisible = false;
            if (roleData.isSuperAdmin || roleData.isGPOfficer || roleData.isGPConcern || roleData.isManager) {
                isVisible = true; 
            } else if (roleData.isAnyDeptHead) {
                const isHeadOfThisDept = orgSettings?.procurementSettings?.departmentHeads?.some(
                    dh => dh.sectionId === item.sectionId && (dh.headId === currentUserEmployee?.id || dh.technicalAdvisorId === currentUserEmployee?.id)
                );
                if (isHeadOfThisDept) isVisible = true;
            }
            
            if (item.createdBy === currentUserEmployee?.id) isVisible = true;
            if (currentUserEmployee && item.currentApproverId === currentUserEmployee.id) isVisible = true;
            if (currentUserEmployee && item.approvalHistory?.some(h => h.approverId === currentUserEmployee.id)) isVisible = true;

            if (!isVisible) return false;

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

            const dateMatch = !dateRange?.from || (item.entryDate && isWithinInterval(parseISO(item.entryDate), { 
                start: dateRange.from, 
                end: dateRange.to || dateRange.from 
            }));

            return searchTermMatch && statusMatch && stageMatch && dateMatch;
        }).sort((a, b) => new Date(b.entryDate || 0).getTime() - new Date(a.entryDate || 0).getTime());
    }, [enrichedItems, searchTerm, statusFilter, stageFilter, dateRange, roleData, orgSettings, currentUserEmployee, sections]);

    const approvableItems = useMemo(() => {
        return filteredItems.filter(item => 
            item.approvalStatus !== 1 && 
            item.approvalStatus !== 0 && 
            currentUserEmployee && 
            item.currentApproverId === currentUserEmployee.id
        );
    }, [filteredItems, currentUserEmployee]);

    const toggleRowSelection = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    };

    const handleBulkApproval = (status: number) => {
        if (!firestore || !currentUserEmployee || !dataRef) return;

        selectedRows.forEach(id => {
            const item = demandNotes.find(dn => dn.id === id);
            if (!item || !item.approvalFlow?.steps) return;

            const currentLevel = item.approvalHistory?.length || 0;
            const approvalLevels = item.approvalFlow.steps;

            const newHistoryEntry = {
                approverId: currentUserEmployee.id,
                status: status === 1 ? 'Approved' : 'Rejected',
                timestamp: new Date().toISOString(),
                level: currentLevel,
                remarks: `Bulk action from list view`,
            };

            let nextStatus: number;
            let nextApprover: string;

            if (status === 1) {
                const nextLevel = currentLevel + 1;
                if (nextLevel < approvalLevels.length) {
                    nextStatus = getNextApprovalStatusCode(currentLevel);
                    nextApprover = approvalLevels[nextLevel].approverId;
                } else {
                    nextStatus = 1;
                    nextApprover = '';
                }
            } else {
                nextStatus = 0;
                nextApprover = '';
            }

            setDocumentNonBlocking(doc(dataRef, id), {
                approvalStatus: nextStatus,
                currentApproverId: nextApprover,
                approvalHistory: [...(item.approvalHistory || []), newHistoryEntry],
            }, { merge: true });
        });

        toast({ title: 'Success', description: `${selectedRows.length} records processed.` });
        setSelectedRows([]);
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

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by DN#, Department, or Creator..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        {selectedRows.length > 0 && (
                            <div className="flex items-center gap-2 ml-4">
                                <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => handleBulkApproval(1)}>
                                    <Check className="mr-2 h-4 w-4" /> Approve Selected ({selectedRows.length})
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}>
                                    <X className="mr-2 h-4 w-4" /> Reject Selected ({selectedRows.length})
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="text-primary border-primary hover:bg-primary/5" onClick={() => setIsGuideOpen(true)}><HelpCircle className="mr-2 h-4 w-4" /> User Guide</Button>
                        <Button onClick={() => { setCurrentItem(null); setIsFormOpen(true); }}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Demand Note
                        </Button>
                    </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Filter className="h-4 w-4" /> Filter Options
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="animate-scale-in"><SelectValue placeholder="Approval Status" /></SelectTrigger>
                            <SelectContent className="animate-scale-in">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending Approval</SelectItem>
                                <SelectItem value="1">Final Approved</SelectItem>
                                <SelectItem value="0">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={stageFilter} onValueChange={setStageFilter}>
                            <SelectTrigger className="animate-scale-in"><SelectValue placeholder="Workflow Stage" /></SelectTrigger>
                            <SelectContent className="animate-scale-in">
                                <SelectItem value="all">All Stages</SelectItem>
                                <SelectItem value="gp_assigned">GP Desk Assigned</SelectItem>
                                <SelectItem value="cs_prepared">CS Prepared</SelectItem>
                                <SelectItem value="po_prepared">PO Prepared</SelectItem>
                            </SelectContent>
                        </Select>

                        <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full" />
                        
                        <Button variant="ghost" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setStageFilter('all'); setDateRange(undefined); }} className="text-muted-foreground">
                            <XCircle className="mr-2 h-4 w-4" /> Clear All
                        </Button>
                    </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[50px]">
                                    <Checkbox 
                                        checked={approvableItems.length > 0 && selectedRows.length === approvableItems.length}
                                        onCheckedChange={(checked) => setSelectedRows(checked ? approvableItems.map(i => i.id) : [])}
                                    />
                                </TableHead>
                                <TableHead className="font-bold">DN Number</TableHead>
                                <TableHead className="font-bold">Department</TableHead>
                                <TableHead className="font-bold">Created By</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="font-bold">GP Status</TableHead>
                                <TableHead className="text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-10">Loading...</TableCell></TableRow>
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map(item => {
                                    const isWaitingForApproval = currentUserEmployee && item.currentApproverId === currentUserEmployee.id && item.approvalStatus !== 1 && item.approvalStatus !== 0;
                                    const isWaitingForGP = (roleData.isGPOfficer || roleData.isSuperAdmin) && item.approvalStatus === 1 && !item.gpConcernOfficerId;
                                    const isApprovable = approvableItems.some(ai => ai.id === item.id);

                                    return (
                                        <TableRow key={item.id} className={cn("hover:bg-muted/30 transition-colors", (isWaitingForApproval || isWaitingForGP) && "bg-orange-500/5")}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={selectedRows.includes(item.id)}
                                                    onCheckedChange={() => toggleRowSelection(item.id)}
                                                    disabled={!isApprovable}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1">
                                                        <span>{item.demandNoteNumber}</span>
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-4 w-4 opacity-50 hover:opacity-100" onClick={() => { navigator.clipboard.writeText(item.demandNoteNumber); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Copy DN#</TooltipContent></Tooltip>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">{item.date}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getDepartmentName(item.departmentId)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{item.creatorName}</span>
                                                    <span className="text-[10px] text-muted-foreground">{item.entryDate ? new Date(item.entryDate).toLocaleString() : 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={item.approvalStatus === 1 ? 'default' : (item.approvalStatus === 0 ? 'destructive' : 'secondary')}>
                                                        {getDemandNoteStatusText(item)}
                                                    </Badge>
                                                    {isWaitingForApproval && (
                                                        <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap">⚠️ Approve Requisition</Badge>
                                                    )}
                                                    {isWaitingForGP && (
                                                        <Badge className="bg-blue-500 animate-pulse text-white whitespace-nowrap">⚠️ Assign Concern</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant={item.gpConcernOfficerId ? "outline" : "secondary"} className="w-fit">
                                                        {item.gpConcernOfficerId ? "Assigned" : "Pending GP"}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={item.concernName}>{item.concernName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedNoteForStatus(item); setIsStatusModalOpen(true); }}><Info className="h-4 w-4 text-blue-500"/></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Approval Flow</TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/demand-notes/${item.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent className="animate-scale-in">View Details</TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(item, 'demand-note')}><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Print DN</TooltipContent></Tooltip>
                                                    <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => { setCurrentItem(item); setIsDeleteConfirmOpen(true); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Delete Record</TooltipContent></Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No records found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <DemandNoteEntryForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} onSave={handleSave} demandNote={currentItem} />
            <DemandNoteUserGuide isOpen={isGuideOpen} onOpenChange={setIsGuideOpen} />
            
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="animate-dialog-in">
                    <DialogHeader><DialogTitle>Delete Requisition?</DialogTitle><div className="text-sm text-muted-foreground">This will permanently remove demand note <strong>{currentItem?.demandNoteNumber}</strong>.</div></DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Confirm Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-lg animate-dialog-in">
                    <DialogHeader><DialogTitle>Approval Flow: {selectedNoteForStatus?.demandNoteNumber}</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <ul className="space-y-4">
                            {selectedNoteForStatus?.approvalFlow?.steps.map((step, index) => {
                                const historyEntry = selectedNoteForStatus.approvalHistory?.find((h:any) => h.level === index);
                                const approver = employees?.find(e => e.id === step.approverId);
                                const isPending = selectedNoteForStatus.currentApproverId === step.approverId && selectedNoteForStatus.approvalStatus !== 1 && selectedNoteForStatus.approvalStatus !== 0;
                                let status: 'approved' | 'pending' | 'upcoming' = historyEntry ? 'approved' : (isPending ? 'pending' : 'upcoming');
                                return (
                                    <li key={index} className="flex items-start gap-4">
                                        {status === 'approved' ? <CheckCircle className="h-6 w-6 text-green-500" /> : (status === 'pending' ? <Hourglass className="h-6 w-6 text-orange-500 animate-spin" /> : <MoreHorizontal className="h-6 w-6 text-muted-foreground" />)}
                                        <div className="flex-1 flex gap-3 items-center">
                                            <Avatar className="h-10 w-10 border"><AvatarFallback>{approver?.fullName?.charAt(0) || '?'}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="font-semibold">{step.stepName}</p>
                                                <p className="text-sm">{approver?.fullName || 'Not Assigned'}</p>
                                                {historyEntry && <p className="text-[10px] text-muted-foreground">Approved: {new Date(historyEntry.timestamp).toLocaleString()}</p>}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
