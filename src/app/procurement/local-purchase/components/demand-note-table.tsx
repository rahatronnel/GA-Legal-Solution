
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
import { 
    PlusCircle, Trash2, Search, Eye, Printer, Filter, XCircle, Check, X, Info, 
    CheckCircle, Hourglass, MoreHorizontal, Copy, HelpCircle, ListOrdered, 
    ShieldCheck, UserCheck, CheckCircle2, PackageCheck, History, ArrowRight,
    FileText, Briefcase, BarChart2, ShoppingCart, Package, Wallet, Timer,
    UserPlus, DollarSign, Truck, Send, FilePlus, Hand, User, XCircle as XCircleIcon
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { DemandNote, Quotation } from './demand-note-entry-form';
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
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from "framer-motion";

const DemandNoteUserGuide = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col animate-dialog-in p-0 overflow-hidden">
            <DialogHeader className="p-6 bg-primary text-primary-foreground shrink-0">
                <div className="flex items-center gap-2">
                    <HelpCircle className="h-6 w-6 text-white" />
                    <DialogTitle className="text-xl text-white font-black uppercase tracking-tight">DN Operational Guide</DialogTitle>
                </div>
                <DialogDescription className="text-white/70">Internal guidelines for material and service requisitions.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow">
                <div className="p-6 space-y-6">
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
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Requisitions are visible to the creator, all approvers in the chain, and GP personnel. Management can track the status in real-time via the <Badge variant="outline">Action Beacons</Badge> displayed in the list view. This ensures a transparent and audit-ready procurement cycle.
                        </p>
                    </section>
                </div>
                <ScrollBar orientation="vertical" />
            </ScrollArea>
            <DialogFooter className="p-4 border-t shrink-0">
                <Button onClick={() => onOpenChange(false)} className="w-full">Dismiss Guide</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

const DNStatusTrackerDialog = ({ 
    dn, 
    isOpen, 
    onOpenChange,
    employees,
    comparativeStatements,
    purchaseOrders,
    mrrs,
    paymentNotes
}: { 
    dn: DemandNote | null, 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void,
    employees: any[],
    comparativeStatements: any[],
    purchaseOrders: any[],
    mrrs: any[],
    paymentNotes: any[]
}) => {
    if (!dn) return null;

    const cs = comparativeStatements.find(c => c.demandNoteId === dn.id);
    const po = purchaseOrders.find(p => p.demandNoteId === dn.id);
    const mrr = mrrs.find(m => m.poId === po?.id || m.demandNoteNumber === dn.demandNoteNumber);
    const pn = paymentNotes.find(p => p.mrrId === mrr?.id);

    const getEmployeeName = (id?: string) => employees.find(e => e.id === id)?.fullName || 'N/A';

    const events = useMemo(() => {
        const list: any[] = [];
        list.push({ title: 'Demand Note Issued', date: dn.entryDate, by: getEmployeeName(dn.createdBy), type: 'DN', status: 'done' });
        dn.approvalHistory?.forEach((h: any) => {
            list.push({ title: dn.approvalFlow?.steps[h.level]?.stepName || 'DN Approval', date: h.timestamp, by: getEmployeeName(h.approverId), type: 'DN', status: h.status === 'Approved' ? 'done' : 'fail' });
        });
        if (dn.gpAssignedDate) list.push({ title: 'GP Concern Assigned', date: dn.gpAssignedDate, by: getEmployeeName(dn.gpAssignedBy), type: 'GP', status: 'done' });
        if (dn.vendorAssignmentDate) list.push({ title: 'Vendor Sourcing Started', date: dn.vendorAssignmentDate, by: getEmployeeName(dn.gpConcernOfficerId), type: 'GP', status: 'done' });
        if (cs) {
            list.push({ title: 'CS Prepared', date: cs.csDate, by: getEmployeeName(cs.createdBy), type: 'CS', status: 'done' });
            if (cs.vendorSelectionDate) list.push({ title: 'Vendor Awarded', date: cs.vendorSelectionDate, by: getEmployeeName(cs.vendorSelectorId), type: 'CS', status: 'done' });
            cs.approvalHistory?.forEach((h: any) => {
                list.push({ title: cs.approvalFlow?.steps[h.level]?.stepName || 'CS Approval', date: h.timestamp, by: getEmployeeName(h.approverId), type: 'CS', status: h.status === 'Approved' ? 'done' : 'fail' });
            });
        }
        if (po) {
            list.push({ title: 'Purchase Order Issued', date: po.createdAt, by: getEmployeeName(po.createdBy), type: 'PO', status: 'done' });
            po.approvalHistory?.forEach((h: any) => {
                list.push({ title: po.approvalFlow?.steps[h.level]?.stepName || 'PO Approval', date: h.timestamp, by: getEmployeeName(h.approverId), type: 'PO', status: h.status === 'Approved' ? 'done' : 'fail' });
            });
            if (po.isSentToVendor && po.sentToVendorDate) list.push({ title: 'PO Dispatched to Vendor', date: po.sentToVendorDate, by: 'GP Desk', type: 'PO', status: 'done' });
        }
        if (mrr) {
            list.push({ title: 'Materials Received (MRR)', date: mrr.createdAt, by: getEmployeeName(mrr.createdBy), type: 'MRR', status: 'done' });
            mrr.approvalHistory?.forEach((h: any) => {
                list.push({ title: mrr.approvalFlow?.steps[h.level]?.stepName || 'MRR Approval', date: h.timestamp, by: getEmployeeName(h.approverId), type: 'MRR', status: h.status === 'Approved' ? 'done' : 'fail' });
            });
            if (mrr.requesterConfirmedAt) list.push({ title: 'Requester Confirmed Receipt', date: mrr.requesterConfirmedAt, by: getEmployeeName(mrr.requesterConfirmedBy), type: 'MRR', status: 'done' });
        }
        if (pn) {
            list.push({ title: 'Payment Note Initiated', date: pn.createdAt, by: getEmployeeName(pn.createdBy), type: 'PN', status: 'done' });
            pn.approvalHistory?.forEach((h: any) => {
                list.push({ title: 'PN Audit Sign-off', date: h.timestamp, by: getEmployeeName(h.approverId), type: 'PN', status: h.status === 'Approved' ? 'done' : 'fail' });
            });
        }
        return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [dn, cs, po, mrr, pn, employees]);

    const macroStatus = useMemo(() => {
        if (pn?.approvalStatus === 1) return { label: 'Payment Authorized', color: 'bg-green-600', icon: CheckCircle2 };
        if (pn) return { label: 'In Treasury Audit (PN)', color: 'bg-orange-500', icon: Wallet };
        if (mrr?.approvalStatus === 1) return { label: 'Awaiting Payment Initiation', color: 'bg-blue-600', icon: DollarSign };
        if (mrr) return { label: 'In Quality Audit (MRR)', color: 'bg-orange-500', icon: Package };
        if (po?.isSentToVendor) return { label: 'Awaiting Goods Arrival', color: 'bg-blue-500', icon: Truck };
        if (po?.approvalStatus === 1) return { label: 'Awaiting PO Dispatch', color: 'bg-orange-500', icon: Send };
        if (po) return { label: 'In PO Authorization', color: 'bg-orange-500', icon: ShoppingCart };
        if (cs?.approvalStatus === 1) return { label: 'Awaiting PO Creation', color: 'bg-blue-600', icon: FilePlus };
        if (cs?.approvalStatus === 3) return { label: 'In Financial Audit (CS)', color: 'bg-orange-500', icon: BarChart2 };
        if (cs) return { label: 'Awaiting Vendor Award', color: 'bg-orange-500', icon: Hand };
        if (dn.gpConcernOfficerId) return { label: 'In Vendor Sourcing (GP)', color: 'bg-blue-500', icon: Briefcase };
        if (dn.approvalStatus === 1) return { label: 'Awaiting GP Assignment', color: 'bg-blue-600', icon: UserPlus };
        if (dn.approvalStatus === 0) return { label: 'Requisition Rejected', color: 'bg-destructive', icon: XCircleIcon };
        return { label: 'In Internal Approval (DN)', color: 'bg-orange-500', icon: Hourglass };
    }, [dn, cs, po, mrr, pn]);

    const genieVariants = {
        initial: {
          opacity: 0,
          scale: 0.01,
          x: "40vw",
          y: "40vh",
          filter: "blur(10px)",
          clipPath: `polygon(48% 100%, 52% 100%, 60% 92%, 68% 80%, 74% 65%, 78% 48%, 80% 30%, 81% 15%, 82% 0%, 18% 0%, 19% 15%, 20% 30%, 22% 48%, 26% 65%, 32% 80%, 40% 92%)`,
        },
        open: {
          opacity: 1,
          scale: 1,
          x: "-50%",
          y: "-50%",
          filter: "blur(0px)",
          clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`,
          transition: {
            duration: 0.65,
            ease: [0.19, 1, 0.22, 1],
          }
        },
        exit: {
          opacity: 0,
          scale: 0.01,
          x: "40vw",
          y: "40vh",
          filter: "blur(8px)",
          clipPath: `polygon(48% 100%, 52% 100%, 60% 92%, 68% 80%, 74% 65%, 78% 48%, 80% 30%, 81% 15%, 82% 0%, 18% 0%, 19% 15%, 20% 30%, 22% 48%, 26% 65%, 32% 80%, 40% 92%)`,
          transition: {
            duration: 0.55,
            ease: [0.32, 0, 0.67, 0],
          }
        }
    };

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
            <AnimatePresence>
                {isOpen && (
                    <DialogPrimitive.Portal forceMount>
                        <DialogPrimitive.Overlay asChild>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
                        </DialogPrimitive.Overlay>
                        <DialogPrimitive.Content asChild forceMount>
                            <motion.div
                                variants={genieVariants}
                                initial="initial"
                                animate="open"
                                exit="exit"
                                style={{ transformOrigin: "bottom right" }}
                                className="fixed left-[50%] top-[50%] z-50 sm:max-w-xl w-full h-[80vh] max-h-[80vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none outline-none focus:outline-none bg-background rounded-[24px]"
                            >
                                <div className={cn("p-6 text-white shrink-0 relative overflow-hidden shadow-lg z-20", macroStatus.color)}>
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shadow-xl"><macroStatus.icon className="h-8 w-8 text-white" /></div>
                                            <div>
                                                <h2 className="text-xl font-black uppercase tracking-tighter leading-none">Lifecycle Tracker</h2>
                                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">{dn.demandNoteNumber}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-white/20 text-white border-none font-black text-xs px-3">{macroStatus.label}</Badge>
                                    </div>
                                    <div className="absolute -top-12 -right-12 h-32 w-32 bg-white/5 rounded-full blur-2xl" />
                                    <button onClick={() => onOpenChange(false)} className="absolute top-2 right-2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X className="h-4 w-4 text-white" /></button>
                                </div>

                                <div className="flex-1 min-h-0 bg-background relative">
                                    <ScrollArea className="h-full w-full">
                                        <div className="p-6 space-y-8 relative before:absolute before:left-[2.5rem] before:top-0 before:h-full before:w-0.5 before:bg-muted pb-12">
                                            {events.map((event, i) => (
                                                <div key={i} className="relative pl-14 group">
                                                    <div className={cn("absolute left-6 h-8 w-8 rounded-full border-4 border-background flex items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-110", event.status === 'done' ? "bg-green-500 text-white" : "bg-destructive text-white")}>
                                                        {event.status === 'done' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-sm font-black uppercase tracking-tight">{event.title}</h4>
                                                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">{new Date(event.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <p className="text-muted-foreground font-medium flex items-center gap-1"><User className="h-3 w-3" /> {event.by}</p>
                                                            <p className="text-muted-foreground italic">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <ScrollBar orientation="vertical" />
                                    </ScrollArea>
                                </div>

                                <DialogFooter className="p-4 border-t bg-muted/30 shrink-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                                    <Button onClick={() => onOpenChange(false)} className="w-full font-bold uppercase tracking-widest text-white shadow-lg">Close Tracker</Button>
                                </DialogFooter>
                            </motion.div>
                        </DialogPrimitive.Content>
                    </DialogPrimitive.Portal>
                )}
            </AnimatePresence>
        </DialogPrimitive.Root>
    );
};

export function DemandNoteTable() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const { demandNotes, employees, sections, comparativeStatements, purchaseOrders, mrrs, paymentNotes, isLoading, orgSettings } = useProcurement();
    const { handlePrint } = usePrint();

    const dataRef = useMemoFirebase(() => firestore ? collection(firestore, 'demandNotes') : null, [firestore]);
    const mrrRef = useMemoFirebase(() => firestore ? collection(firestore, 'mrrs') : null, [firestore]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isTrackerOpen, setIsTrackerOpen] = useState(false);
    const [selectedDnForTracker, setSelectedDnForTracker] = useState<DemandNote | null>(null);
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
            dh => (dh.headId === currentUserEmployee.id || dh.technicalAdvisorId === currentUserEmployee.id)
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
            const mrr = mrrs?.find(m => m.demandNoteNumber === dn.demandNoteNumber);
            
            return {
                ...dn,
                creatorName: creator?.fullName || 'N/A',
                concernName: concern?.fullName || 'Unassigned',
                csPreparedDate: cs?.csDate || null,
                poPreparedDate: po?.createdAt || null,
                hasCs: !!cs,
                hasPo: !!po,
                mrrId: mrr?.id || null,
                mrrConfirmed: !!mrr?.requesterConfirmedAt
            };
        });
    }, [demandNotes, comparativeStatements, purchaseOrders, mrrs, employees]);

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

    const handleConfirmMRR = (mrrId: string) => {
        if (!firestore || !mrrRef || !currentUserEmployee) return;
        setDocumentNonBlocking(doc(mrrRef, mrrId), {
            requesterConfirmedAt: new Date().toISOString(),
            requesterConfirmedBy: currentUserEmployee.id
        }, { merge: true });
        toast({ title: 'Receipt Confirmed', description: 'Your official acknowledgement has been recorded.' });
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
                                    const canConfirmMRR = item.mrrId && !item.mrrConfirmed && currentUserEmployee?.id === item.createdBy;
                                    const isApprovable = approvableItems.some(ai => ai.id === item.id);

                                    return (
                                        <TableRow key={item.id} className={cn("hover:bg-muted/30 transition-colors", (isWaitingForApproval || isWaitingForGP || canConfirmMRR) && "bg-orange-500/5")}>
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
                                                        <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap text-[10px] h-4">⚠️ Approve Requisition</Badge>
                                                    )}
                                                    {isWaitingForGP && (
                                                        <Badge className="bg-blue-500 animate-pulse text-white whitespace-nowrap text-[10px] h-4">⚠️ Assign Concern</Badge>
                                                    )}
                                                    {canConfirmMRR && (
                                                        <Badge className="bg-green-600 animate-pulse text-white whitespace-nowrap text-[10px] h-4">✅ Confirm Receipt</Badge>
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
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 animate-pulse" onClick={() => { setSelectedDnForTracker(item); setIsTrackerOpen(true); }}><History className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Status Track</TooltipContent></Tooltip>
                                                    {canConfirmMRR && (
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 animate-pulse" onClick={() => handleConfirmMRR(item.mrrId!)}><PackageCheck className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Confirm MRR Receipt</TooltipContent></Tooltip>
                                                    )}
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
            
            <DNStatusTrackerDialog 
                isOpen={isTrackerOpen} 
                onOpenChange={setIsTrackerOpen} 
                dn={selectedDnForTracker}
                employees={employees}
                comparativeStatements={comparativeStatements}
                purchaseOrders={purchaseOrders}
                mrrs={mrrs}
                paymentNotes={paymentNotes}
            />

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
                                const approver = (employees || []).find(e => e.id === step.approverId);
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
