
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

/**
 * TRUE APPLE GENIE ENGINE (WARPED FUNNEL MATRIX)
 * Executes 16-point polygon warping for high-fidelity liquid motion.
 */
const GENIE_FUNNEL = `
polygon(
48% 100%,
52% 100%,
60% 92%,
68% 80%,
74% 65%,
78% 48%,
80% 30%,
81% 15%,
82% 0%,
18% 0%,
19% 15%,
20% 30%,
22% 48%,
26% 65%,
32% 80%,
40% 92%
)
`;

const genieVariants = {
  initial: {
    opacity: 0,
    scale: 0.01,
    x: "40vw",
    y: "40vh",
    rotate: -12,
    filter: "blur(15px)",
    clipPath: GENIE_FUNNEL,
    borderRadius: "100%",
    transition: { duration: 0.001 }
  },
  open: {
    opacity: 1,
    scale: 1,
    x: "-50%",
    y: "-50%",
    rotate: 0,
    filter: "blur(0px)",
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    borderRadius: "24px",
    transition: {
      duration: 0.75,
      ease: [0.19, 1, 0.22, 1],
      opacity: { duration: 0.3 },
      filter: { duration: 0.4 }
    }
  },
  exit: {
    opacity: 0,
    scale: 0.015,
    x: "40vw",
    y: "40vh",
    rotate: 8,
    filter: "blur(12px)",
    clipPath: GENIE_FUNNEL,
    borderRadius: "100%",
    transition: {
      duration: 0.65,
      ease: [0.32, 0, 0.67, 0]
    }
  }
};

const DemandNoteUserGuide = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col animate-dialog-in p-0 overflow-hidden">
            <div className="bg-primary p-6 text-primary-foreground shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <DialogTitle className="text-2xl font-black tracking-tight text-white">Demand Note Operational Guide</DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 font-medium">Official standards for internal requisition and approval signatures.</DialogDescription>
                    </div>
                </div>
            </div>
            <ScrollArea className="flex-1 min-h-0">
                <div className="p-6 space-y-6">
                    <section className="space-y-2">
                        <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Info className="h-4 w-4"/> Requisition Integrity</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Demand Notes (DN) represent the formal intent to procure. Every field, including <strong>Budget Year</strong> and <strong>Purpose</strong>, is mandatory for audit traceability.</p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Dynamic Routing Logic</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">The system automatically detects <strong>Special Categories</strong>. If a sensitive part is detected, the approval chain expands to include the Specialized Manager and Managing Director automatically.</p>
                    </section>
                </div>
                <ScrollBar orientation="vertical" />
            </ScrollArea>
            <DialogFooter className="p-4 border-t shrink-0">
                <Button onClick={() => onOpenChange(false)} className="w-full font-bold uppercase tracking-widest text-white">Confirm & Close</Button>
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
}: any) => {
  if (!dn) return null;

  const cs = comparativeStatements?.find((c: any) => c.demandNoteId === dn.id);
  const po = purchaseOrders?.find((p: any) => p.demandNoteId === dn.id);
  const mrr = mrrs?.find((m: any) => m.poId === po?.id || m.demandNoteNumber === dn.demandNoteNumber);
  const pn = paymentNotes?.find((p: any) => p.mrrId === mrr?.id);

  const steps = [
    { label: "DN Entry", icon: FileText, status: "Done", color: "bg-blue-500", timestamp: dn.entryDate },
    { label: "GP assigned", icon: UserPlus, status: dn.gpConcernOfficerId ? "Done" : "Pending", color: dn.gpConcernOfficerId ? "bg-emerald-500" : "bg-muted", timestamp: dn.gpAssignedDate },
    { label: "Sourcing (CS)", icon: BarChart2, status: cs ? "Done" : "Waiting", color: cs ? "bg-amber-500" : "bg-muted", timestamp: cs?.csDate },
    { label: "Contract (PO)", icon: ShoppingCart, status: po ? "Done" : "Waiting", color: po ? "bg-purple-500" : "bg-muted", timestamp: po?.createdAt },
    { label: "Receipt (MRR)", icon: Package, status: mrr ? "Done" : "Waiting", color: mrr ? "bg-emerald-800" : "bg-muted", timestamp: mrr?.createdAt },
    { label: "Treasury (PN)", icon: Wallet, status: pn ? "Ready" : "Waiting", color: pn ? "bg-orange-500" : "bg-muted", timestamp: pn?.createdAt }
  ];

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                variants={genieVariants}
                initial="initial"
                animate="open"
                exit="exit"
                style={{
                  transformOrigin: "bottom right",
                  willChange: "transform, clip-path, opacity, filter"
                }}
                className="fixed left-[50%] top-[50%] z-50 w-full sm:max-w-2xl h-fit max-h-[85vh] bg-background shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border-none outline-none"
              >
                <div className="p-6 text-white bg-primary flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <History className="h-6 w-6 text-white animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Lifecycle Beacon</h2>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">DN: {dn.demandNoteNumber}</p>
                    </div>
                  </div>
                  <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"><X className="h-5 w-5" /></button>
                </div>

                <ScrollArea className="flex-grow p-8 bg-muted/5">
                  <div className="space-y-10 py-4">
                    <div className="grid grid-cols-1 gap-8 relative before:absolute before:left-6 before:top-4 before:h-[calc(100%-32px)] before:w-0.5 before:bg-muted-foreground/10">
                        {steps.map((step, idx) => (
                            <div key={idx} className="relative flex items-center gap-6 group">
                                <div className={cn(
                                    "h-12 w-12 rounded-full border-4 border-background flex items-center justify-center z-10 shadow-lg transition-transform group-hover:scale-110",
                                    step.color,
                                    step.status === "Waiting" || step.status === "Pending" ? "opacity-40 grayscale" : "text-white"
                                )}>
                                    <step.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-sm uppercase tracking-tight">{step.label}</h4>
                                        <Badge variant={step.status === "Done" || step.status === "Ready" ? "default" : "secondary"} className="text-[9px] h-4">
                                            {step.status}
                                        </Badge>
                                    </div>
                                    {step.timestamp && <p className="text-[10px] text-muted-foreground mt-0.5 italic">Executed on {new Date(step.timestamp).toLocaleString()}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>

                <DialogFooter className="p-4 border-t bg-muted/10 shrink-0">
                  <Button onClick={() => onOpenChange(false)} className="w-full font-black uppercase tracking-widest text-xs">Acknowledge Status</Button>
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
  const { handlePrint } = usePrint();
  const { user } = useUser();

  const { demandNotes, sections, comparativeStatements, purchaseOrders, mrrs, paymentNotes, isLoading, employees, orgSettings } = useProcurement();
  const notesRef = useMemoFirebase(() => firestore ? collection(firestore, 'demandNotes') : null, [firestore]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<DemandNote> | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptId] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [user, employees]);
  const isSuperAdmin = user?.email === 'superadmin@galsolution.com';

  const filteredItems = useMemo(() => {
    const safeItems = Array.isArray(demandNotes) ? demandNotes : [];
    return safeItems.filter(note => {
        const dept = sections.find(s => s.id === note.departmentId);
        const lowerSearch = searchTerm.toLowerCase();
        
        const searchMatch = !searchTerm || 
            note.demandNoteNumber.toLowerCase().includes(lowerSearch) ||
            dept?.name.toLowerCase().includes(lowerSearch);

        const statusMatch = statusFilter === 'all' || note.approvalStatus === parseInt(statusFilter);
        const deptMatch = deptFilter === 'all' || note.departmentId === deptFilter;
        const dateMatch = !dateRange?.from || (note.date && isWithinInterval(parseISO(note.date), { start: dateRange.from, end: dateRange.to || dateRange.from }));

        // Visibility: Approvers see what they need to sign, Creators see their own, GPO/Admins see all
        const isGPOfficer = orgSettings?.procurementSettings?.generalPurchaseOfficerId === currentUserEmployee?.id;
        let isVisible = isSuperAdmin || isGPOfficer;
        if (!isVisible && currentUserEmployee) {
            if (note.createdBy === currentUserEmployee.id || 
                note.currentApproverId === currentUserEmployee.id || 
                note.approvalHistory?.some(h => h.approverId === currentUserEmployee.id)) {
                isVisible = true;
            }
        }

        return searchMatch && statusMatch && deptMatch && dateMatch && isVisible;
    }).sort((a, b) => new Date(b.entryDate || 0).getTime() - new Date(a.entryDate || 0).getTime());
  }, [demandNotes, searchTerm, statusFilter, deptFilter, dateRange, sections, isSuperAdmin, currentUserEmployee, orgSettings]);

  const approvableItems = useMemo(() => filteredItems.filter(i => currentUserEmployee && i.currentApproverId === currentUserEmployee.id && i.approvalStatus !== 1 && i.approvalStatus !== 0), [filteredItems, currentUserEmployee]);

  const handleBulkApproval = (status: number) => {
    if (!firestore || !currentUserEmployee || !notesRef) return;
    selectedRows.forEach(id => {
        const dn = demandNotes.find(d => d.id === id);
        if (!dn || !dn.approvalFlow?.steps) return;
        const currentLevel = dn.approvalHistory?.length || 0;
        const newHistoryEntry = { approverId: currentUserEmployee.id, status: status === 1 ? 'Approved' : 'Rejected', timestamp: new Date().toISOString(), level: currentLevel, remarks: 'Bulk action' };
        let nextStatus = status === 1 ? (currentLevel + 1 < dn.approvalFlow.steps.length ? getNextApprovalStatusCode(currentLevel) : 1) : 0;
        let nextApprover = status === 1 && currentLevel + 1 < dn.approvalFlow.steps.length ? dn.approvalFlow.steps[currentLevel + 1].approverId : '';
        setDocumentNonBlocking(doc(notesRef, id), { approvalStatus: nextStatus, currentApproverId: nextApprover, approvalHistory: [...(dn.approvalHistory || []), newHistoryEntry] }, { merge: true });
    });
    setSelectedRows([]);
    toast({ title: 'Success', description: 'Bulk action complete.' });
  };

  const handleSave = (data: Partial<DemandNote>) => {
    if (!notesRef) return;
    if (data.id) {
        setDocumentNonBlocking(doc(notesRef, data.id), data, { merge: true });
        toast({ title: 'Demand Note Updated' });
    } else {
        addDocumentNonBlocking(notesRef, data);
        toast({ title: 'Demand Note Created' });
    }
  };

  const handleDelete = (note: DemandNote) => {
    setCurrentNote(note);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentNote?.id && notesRef) {
        deleteDocumentNonBlocking(doc(notesRef, currentNote.id));
        toast({ title: 'Note Deleted' });
    }
    setIsDeleteConfirmOpen(false);
    setCurrentNote(null);
  };

  return (
    <TooltipProvider>
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search DN#, Dept..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                    </div>
                    {selectedRows.length > 0 && (
                        <div className="flex items-center gap-2 ml-4">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => handleBulkApproval(1)}><Check className="mr-2 h-4 w-4" /> Approve ({selectedRows.length})</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}><X className="mr-2 h-4 w-4" /> Reject</Button>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="text-primary border-primary hover:bg-primary/5 animate-scale-in" onClick={() => setIsGuideOpen(true)}><HelpCircle className="mr-2 h-4 w-4" /> Operational Guide</Button>
                    <Button onClick={() => { setCurrentNote(null); setIsFormOpen(true); }} className="animate-scale-in shadow-lg shadow-primary/20"><PlusCircle className="mr-2 h-4 w-4" /> Issue Demand Note</Button>
                </div>
            </div>

            <div className="p-4 border rounded-xl bg-background shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground"><Filter className="h-3.5 w-3.5" /> High-Fidelity Filters</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <Select value={deptFilter} onValueChange={setDeptId}>
                        <SelectTrigger className="animate-scale-in"><SelectValue placeholder="Department" /></SelectTrigger>
                        <SelectContent>{(sections || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="animate-scale-in"><SelectValue placeholder="Approval Status" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="1">Approved</SelectItem><SelectItem value="0">Rejected</SelectItem><SelectItem value="2">Pending</SelectItem></SelectContent>
                    </Select>
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} className="animate-scale-in" />
                    <Button variant="ghost" onClick={() => { setDeptId('all'); setStatusFilter('all'); setDateRange(undefined); setSearchTerm(''); }} className="text-destructive"><XCircle className="mr-2 h-4 w-4"/> Clear</Button>
                </div>
            </div>

            <div className="border rounded-xl overflow-hidden shadow-sm bg-background">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 border-b-2">
                            <TableHead className="w-[50px]"><Checkbox checked={approvableItems.length > 0 && selectedRows.length === approvableItems.length} onCheckedChange={(c) => setSelectedRows(c ? approvableItems.map(i => i.id) : [])} /></TableHead>
                            <TableHead className="font-black uppercase text-[10px]">DN Number & Date</TableHead>
                            <TableHead className="font-black uppercase text-[10px]">Requisition Dept.</TableHead>
                            <TableHead className="font-black uppercase text-[10px]">Contact Point</TableHead>
                            <TableHead className="font-black uppercase text-[10px]">Lifecycle Hub</TableHead>
                            <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
                            <TableHead className="w-[140px] text-right font-black uppercase text-[10px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10">Syncing requisition records...</TableCell></TableRow>
                        ) : filteredItems.length > 0 ? (
                            filteredItems.map((note) => {
                                const isWaitingForMe = currentUserEmployee && note.currentApproverId === currentUserEmployee.id && note.approvalStatus !== 1 && note.approvalStatus !== 0;
                                const isApprovable = approvableItems.some(i => i.id === note.id);
                                return (
                                    <TableRow key={note.id} className={cn("hover:bg-muted/30 transition-colors group", isWaitingForMe && "bg-orange-500/5")}>
                                        <TableCell><Checkbox checked={selectedRows.includes(note.id)} onCheckedChange={() => setSelectedRows(p => p.includes(note.id) ? p.filter(r => r !== note.id) : [...p, note.id])} disabled={!isApprovable} /></TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold text-xs">{note.demandNoteNumber}</span>
                                                    <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { navigator.clipboard.writeText(note.demandNoteNumber); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-medium">{note.date}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell><span className="text-xs font-semibold">{sections.find(s => s.id === note.departmentId)?.name || 'N/A'}</span></TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold leading-none">{note.contactPersonName}</span>
                                                <span className="text-[10px] text-muted-foreground">{note.contactPersonNumber}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={() => { setCurrentNote(note); setIsTrackerOpen(true); }} className="h-7 text-[9px] font-black uppercase tracking-tighter gap-1.5 hover:bg-primary hover:text-white transition-all shadow-sm">
                                                <History className="h-3.5 w-3.5" /> Status Track
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={note.approvalStatus === 1 ? 'default' : (note.approvalStatus === 0 ? 'destructive' : 'secondary')} className="text-[9px] h-4">
                                                    {getDemandNoteStatusText(note as any)}
                                                </Badge>
                                                {isWaitingForMe && <Badge className="bg-orange-500 text-white animate-pulse text-[9px] h-4">⚠️ Signing Needed</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/demand-notes/${note.id}`}><Eye className="h-4 w-4"/></Link></Button></TooltipTrigger><TooltipContent className="animate-scale-in">View Details</TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(note as any, 'demand-note')}><Printer className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Print Note</TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(note as any)}><Trash2 className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent className="animate-scale-in">Delete Record</TooltipContent></Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">No requisition records found.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </div>

        <DemandNoteEntryForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} onSave={handleSave} demandNote={currentNote} />
        
        <DNStatusTrackerDialog
            dn={currentNote}
            isOpen={isTrackerOpen}
            onOpenChange={setIsTrackerOpen}
            employees={employees}
            comparativeStatements={comparativeStatements}
            purchaseOrders={purchaseOrders}
            mrrs={mrrs}
            paymentNotes={paymentNotes}
        />

        <DemandNoteUserGuide isOpen={isGuideOpen} onOpenChange={setIsGuideOpen} />

        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <DialogContent className="animate-dialog-in">
                <DialogHeader><DialogTitle>Hard Delete Record?</DialogTitle><DialogDescription>You are about to permanently wipe Demand Note <strong>{currentNote?.demandNoteNumber}</strong> from the organizational registry. This is irreversible.</DialogDescription></DialogHeader>
                <DialogFooter><Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button><Button variant="destructive" onClick={confirmDelete}>Confirm Deletion</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    </TooltipProvider>
  );
}
