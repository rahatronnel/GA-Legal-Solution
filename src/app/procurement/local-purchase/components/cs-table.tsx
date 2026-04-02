"use client";

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
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
    PlusCircle, Edit, Trash2, Search, Eye, Printer, Check, X, Filter, 
    XCircle, Hand, FilePlus, Copy, DollarSign, FileText, AlertTriangle, 
    ChevronRight, ChevronLeft, HelpCircle, ListOrdered, ShieldCheck, 
    UserCheck, Tag, BarChart2, TrendingUp, Wallet, Gavel, 
    GitCommitHorizontal, MapPin, Info, Hourglass, MoreHorizontal,
    CheckCircle2, CheckCircle, History, Cpu
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { ComparativeStatement } from './cs-entry-form';
import { ComparativeStatementForm } from './cs-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import type { OrganizationSettings } from '@/app/settings/page';
import { getCSStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PurchaseOrderForm } from './po-entry-form';
import { cn } from '@/lib/utils';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';

const CSUserGuide = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col animate-dialog-in p-0 overflow-hidden">
                <div className="bg-primary p-6 text-primary-foreground shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <BarChart2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-white">CS Master Operational Guide</DialogTitle>
                            <DialogDescription className="text-primary-foreground/80 font-medium">Internal standards for high-fidelity procurement analysis & vendor awarding.</DialogDescription>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-6 space-y-8 pb-32">
                        <section className="space-y-4">
                            <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Visual Lifecycle Flow
                            </h4>
                            <div className="relative p-6 border-2 border-dashed rounded-2xl bg-muted/30 overflow-hidden">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><FileText className="h-5 w-5" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight">DN<br/>Approved</span>
                                    </div>
                                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground animate-pulse" />
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><MapPin className="h-5 w-5" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight">GP Sourcing<br/>(Vendors)</span>
                                    </div>
                                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground animate-pulse" />
                                    <div className="flex flex-col items-center gap-2 group scale-125">
                                        <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl ring-4 ring-primary/20 group-hover:rotate-12 transition-transform"><BarChart2 className="h-6 w-6" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight text-primary">CS Analysis<br/>(You are here)</span>
                                    </div>
                                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground animate-pulse" />
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Gavel className="h-5 w-5" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight">Contract<br/>Awarded</span>
                                    </div>
                                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground animate-pulse" />
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="h-10 w-10 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><ShieldCheck className="h-5 w-5" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight">Management<br/>Approval</span>
                                    </div>
                                </div>
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted-foreground/10 -translate-y-1/2 hidden md:block" />
                            </div>
                        </section>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6 space-y-2">
                                    <h5 className="font-bold flex items-center gap-2 text-blue-600"><Info className="h-4 w-4"/> The "Apples-to-Apples" Logic</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        The CS module eliminates guesswork. It presents quotes from different vendors side-by-side so you can compare not just price, but <strong>quality, lead time, and commercial terms</strong> instantly.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6 space-y-2">
                                    <h5 className="font-bold flex items-center gap-2 text-emerald-600"><DollarSign className="h-4 w-4"/> Dynamic Financial Audit</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Input unit prices, and the system automatically calculates discounts, VAT, and Tax. It highlights the <strong>"Best Offer"</strong> (lowest total cost) with a green badge automatically.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6 space-y-2">
                                    <h5 className="font-bold flex items-center gap-2 text-amber-600"><Gavel className="h-4 w-4"/> Awarding & Commitment</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        After analysis, click the <Hand className="h-3 w-3 inline mx-1"/> <strong>Award</strong> button. This selects the official supplier and initiates the internal multi-stage signature workflow.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6 space-y-2">
                                    <h5 className="font-bold flex items-center gap-2 text-purple-600"><ShieldCheck className="h-4 w-4"/> Intelligent Approval Matrix</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        The system builds the signature chain based on the <strong>Awarded Amount</strong>. Large investments are automatically routed to the MD/FD for final authorization.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <ScrollBar orientation="vertical" />
                </ScrollArea>
                
                <DialogFooter className="p-4 border-t shrink-0">
                    <Button onClick={() => onOpenChange(false)} className="w-full font-bold uppercase tracking-widest text-white">Understood, Let&apos;s Analyze</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const VendorSelectionDialog: React.FC<{
  cs: ComparativeStatement | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorSelected: (csId: string, vendorId: string) => void;
  vendors: any[];
}> = ({ cs, isOpen, onOpenChange, onVendorSelected, vendors }) => {
    const [step, setStep] = useState(1);
    const [selectedVendorId, setSelectedVendorId] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedVendorId('');
        }
    }, [isOpen]);

    const selectedVendor = vendors.find((v: Vendor) => v.id === selectedVendorId);
    const selectedVendorDetail = cs?.vendorDetails.find(d => d.vendorId === selectedVendorId);

    const financials = useMemo(() => {
        if (!cs || !selectedVendorId) return null;
        
        const subtotal = cs.items.reduce((acc, item) => {
            const quote = item.vendorQuotes.find(q => q.vendorId === selectedVendorId);
            return acc + (item.quantity * (quote?.unitPrice || 0));
        }, 0);

        const detail = cs.vendorDetails.find(d => d.vendorId === selectedVendorId);
        let discount = 0;
        if (detail) {
            if (detail.discountType === 'Percentage') {
                discount = subtotal * ((detail.discountValue || 0) / 100);
            } else {
                discount = detail.discountValue || 0;
            }
        }

        const subtotalAfterDiscount = subtotal - discount;
        const vat = subtotalAfterDiscount * ((detail?.vatPercentage || 0) / 100);
        const tax = subtotalAfterDiscount * ((detail?.taxPercentage || 0) / 100);
        const total = subtotalAfterDiscount + vat + tax;

        return { subtotal, discount, vat, tax, total };
    }, [cs, selectedVendorId]);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);
    
    const handleConfirm = () => {
        if (cs && selectedVendorId) onVendorSelected(cs.id, selectedVendorId);
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl animate-dialog-in">
                <DialogHeader>
                    <DialogTitle>Award Contract: {cs?.csNumber}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 1 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 2 ? "bg-primary" : "bg-muted")} />
                        <div className={cn("h-2 flex-1 rounded-full transition-all", step >= 3 ? "bg-primary" : "bg-muted")} />
                    </div>
                </DialogHeader>

                 <div className="py-6 min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label className="text-lg">Step 1: Select Vendor & Review Financials</Label>
                                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                                    <SelectTrigger className="h-12 text-lg animate-scale-in"><SelectValue placeholder="Choose a vendor to award..." /></SelectTrigger>
                                    <SelectContent className="animate-scale-in">
                                        {(cs?.vendorDetails || []).map(detail => {
                                            const v = vendors.find((v: Vendor) => v.id === detail.vendorId);
                                            return <SelectItem key={detail.vendorId} value={detail.vendorId}>{v?.vendorName}</SelectItem>
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {financials && (
                                <Card className="bg-muted/30 border-primary/20">
                                    <CardContent className="pt-6 space-y-3">
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Main Price (Subtotal):</span><span className="font-bold">{formatCurrency(financials.subtotal)}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Applied Discount:</span><span className="text-red-500 font-bold">- {formatCurrency(financials.discount)}</span></div>
                                        <Separator />
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">VAT ({selectedVendorDetail?.vatPercentage}%):</span><span className="font-bold">+ {formatCurrency(financials.vat)}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground font-medium">Tax ({selectedVendorDetail?.taxPercentage}%):</span><span className="font-bold">+ {formatCurrency(financials.tax)}</span></div>
                                        <Separator />
                                        <div className="flex justify-between text-lg"><span className="font-extrabold">Final Billed Amount:</span><span className="text-primary font-black">{formatCurrency(financials.total)}</span></div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1">
                                <Label className="text-lg">Step 2: Review Commercial Terms</Label>
                                <p className="text-sm text-muted-foreground">Verify terms for <span className="font-bold text-foreground">{selectedVendor?.vendorName}</span></p>
                            </div>

                            <div className="grid gap-4">
                                <Card className="p-4 flex items-start gap-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg"><Hand className="h-5 w-5 text-blue-500" /></div>
                                    <div className="space-y-1"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivery Terms</p><p className="text-sm">{selectedVendorDetail?.deliveryTerms || 'Not Specified'}</p></div>
                                </Card>
                                <Card className="p-4 flex items-start gap-4">
                                    <div className="p-2 bg-green-500/10 rounded-lg"><DollarSign className="h-5 w-5 text-green-500" /></div>
                                    <div className="space-y-1"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Terms</p><p className="text-sm">{selectedVendorDetail?.paymentTerms || 'Not Specified'}</p></div>
                                </Card>
                                <Card className="p-4 flex items-start gap-4">
                                    <div className="p-2 bg-orange-500/10 rounded-lg"><FileText className="h-5 w-5 text-orange-500" /></div>
                                    <div className="space-y-1"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Warranty / Guarantee</p><p className="text-sm">{selectedVendorDetail?.warranty || 'Not Specified'}</p></div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8 animate-in zoom-in-95 duration-300">
                            <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-10 w-10 text-destructive animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Confirm Award Selection</h3>
                                <p className="text-muted-foreground max-w-md">
                                    You are about to award the contract to <span className="font-bold text-foreground">{selectedVendor?.vendorName}</span> for <span className="font-bold text-primary">{formatCurrency(financials?.total || 0)}</span>.
                                </p>
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm font-medium text-yellow-700 dark:text-yellow-400 mt-4">
                                    This action will freeze the selection and start the multi-level internal approval workflow.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between w-full border-t pt-4">
                    <Button variant="outline" onClick={() => setStep(prev => prev - 1)} disabled={step === 1}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                        {step < 3 ? (
                            <Button onClick={handleNext} disabled={!selectedVendorId}>
                                Next Step <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button variant="destructive" onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-500/20 font-bold">
                                <Check className="mr-2 h-4 w-4" /> Confirm Award & Start Approval
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function ComparativeStatementTable() {
    const { comparativeStatements, demandNotes, isLoading, employees, orgSettings, vendors, purchaseOrders } = useProcurement();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { handlePrint } = usePrint();

    const csRef = useMemoFirebase(() => firestore ? collection(firestore, 'comparativeStatements') : null, [firestore]);
    const poRef = useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isVendorSelectionOpen, setIsVendorSelectionOpen] = useState(false);
    const [selectedCsForVendor, setSelectedCsForVendor] = useState<ComparativeStatement | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedCsForStatus, setSelectedCsForStatus] = useState<ComparativeStatement | null>(null);
    const [isPoFormOpen, setIsPoFormOpen] = useState(false);
    const [selectedCsForPo, setSelectedCsForPo] = useState<any>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const currentUserEmployee = useMemo(() => {
        if (!user || !employees) return null;
        return (employees as Employee[]).find((e: Employee) => e.email === user.email);
    }, [user, employees]);

    const isMainSuperAdmin = user?.email === 'superadmin@galsolution.com';
    const isProcurementAdmin = user?.email === 'systemadmin@ykk.com';
    const isSuperAdmin = isMainSuperAdmin || isProcurementAdmin;

    const isGPOfficer = orgSettings?.procurementSettings?.generalPurchaseOfficerId === currentUserEmployee?.id;
    const isManager = orgSettings?.procurementSettings?.managingDirectorId === currentUserEmployee?.id || 
                      orgSettings?.procurementSettings?.factoryDirectorId === currentUserEmployee?.id;

    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (isLoading) return;
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        tl.fromTo(containerRef.current, { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.4 });
        tl.fromTo(".cs-header-animate", { y: -20, scale: 0.95, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.3, stagger: 0.03, ease: "back.out(1.7)" }, "-=0.3");
        tl.fromTo(".cs-table-animate", { rotationX: -5, transformOrigin: "top", scale: 0.99, opacity: 0 }, { rotationX: 0, scale: 1, opacity: 1, duration: 0.5, ease: "expo.out" }, "-=0.2");
        if (comparativeStatements && comparativeStatements.length > 0) {
            tl.fromTo(".cs-row-animate", { x: -20, opacity: 0, filter: "blur(8px)" }, { x: 0, opacity: 1, filter: "blur(0px)", stagger: { each: 0.02, from: "start" }, duration: 0.4, ease: "power2.out" }, "-=0.4");
        }
    }, { scope: containerRef, dependencies: [isLoading, comparativeStatements?.length] });

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const calculateCsTotals = (cs: ComparativeStatement, vendorId: string) => {
        const subtotal = cs.items.reduce((acc, item) => {
            const quote = item.vendorQuotes.find(q => q.vendorId === vendorId);
            return acc + (item.quantity * (quote?.unitPrice || 0));
        }, 0);

        const detail = cs.vendorDetails.find(d => d.vendorId === vendorId);
        let discount = 0;
        if (detail) {
            if (detail.discountType === 'Percentage') {
                discount = subtotal * ((detail.discountValue || 0) / 100);
            } else {
                discount = detail.discountValue || 0;
            }
        }

        const subtotalAfterDiscount = subtotal - discount;
        const vat = subtotalAfterDiscount * ((detail?.vatPercentage || 0) / 100);
        const tax = subtotalAfterDiscount * ((detail?.taxPercentage || 0) / 100);
        const total = subtotalAfterDiscount + vat + tax;

        return { subtotal, discount, vat, tax, total };
    };

    const filteredItems = useMemo(() => {
        const safeItems = Array.isArray(comparativeStatements) ? comparativeStatements : [];
        if (safeItems.length === 0) return [];

        return (safeItems as ComparativeStatement[]).filter(cs => {
            let isVisible = isSuperAdmin || isGPOfficer || isManager;
            if (!isVisible && currentUserEmployee) {
                if (cs.createdBy === currentUserEmployee.id || 
                    cs.currentApproverId === currentUserEmployee.id || 
                    cs.approvalHistory?.some((h: any) => h.approverId === currentUserEmployee.id)) {
                    isVisible = true;
                }
            }
            if (!isVisible && !currentUserEmployee) isVisible = true;
            if (!isVisible) return false;

            const dn = demandNotes?.find(d => d.id === cs.demandNoteId);
            const lowerSearch = searchTerm.toLowerCase();
            return !searchTerm || 
                cs.csNumber.toLowerCase().includes(lowerSearch) || 
                dn?.demandNoteNumber.toLowerCase().includes(lowerSearch);
        }).sort((a, b) => new Date(b.csDate || 0).getTime() - new Date(a.csDate || 0).getTime());
    }, [comparativeStatements, searchTerm, demandNotes, isSuperAdmin, isGPOfficer, isManager, currentUserEmployee]);

    const approvableItems = useMemo(() => {
        if (!currentUserEmployee) return [];
        return filteredItems.filter(i => i.currentApproverId === currentUserEmployee.id && i.approvalStatus !== 1 && i.approvalStatus !== 0 && i.approvalStatus !== 2);
    }, [filteredItems, currentUserEmployee]);

    const handleVendorSelected = (csId: string, vendorId: string) => {
        if (!csRef || !firestore) return;
        const cs = (comparativeStatements as ComparativeStatement[]).find(c => c.id === csId);
        if (!cs || !cs.approvalFlow?.steps) return;
        setDocumentNonBlocking(doc(csRef, csId), {
            selectedVendorId: vendorId,
            vendorSelectionDate: new Date().toISOString(),
            approvalStatus: 3, 
            currentApproverId: cs.approvalFlow.steps[0]?.approverId || '',
        }, { merge: true });
        toast({ title: "Vendor Awarded", description: "Internal approval workflow initiated." });
        setIsVendorSelectionOpen(false);
    };

    const handleBulkApproval = (status: number) => {
        if (!firestore || !currentUserEmployee || !csRef) return;
        selectedRows.forEach(id => {
            const cs = (comparativeStatements as ComparativeStatement[]).find(c => c.id === id);
            if (!cs || !cs.approvalFlow?.steps) return;
            const currentLevel = cs.approvalHistory?.length || 0;
            const newHistoryEntry = { 
                approverId: currentUserEmployee.id, 
                status: status === 1 ? 'Approved' : 'Rejected', 
                timestamp: new Date().toISOString(), 
                level: currentLevel, 
                remarks: 'Bulk action' 
            };
            let nextStatus = status === 1 ? (currentLevel + 1 < cs.approvalFlow.steps.length ? getNextApprovalStatusCode(currentLevel) : 1) : 0;
            let nextApprover = status === 1 && currentLevel + 1 < cs.approvalFlow.steps.length ? cs.approvalFlow.steps[currentLevel + 1].approverId : '';
            setDocumentNonBlocking(doc(csRef, id), { 
                approvalStatus: nextStatus, 
                currentApproverId: nextApprover, 
                approvalHistory: [...(cs.approvalHistory || []), newHistoryEntry] 
            }, { merge: true });
        });
        setSelectedRows([]);
        toast({ title: 'Batch Success' });
    };

    return (
        <TooltipProvider>
            <div className="space-y-4" ref={containerRef} style={{ perspective: '1500px' }}>
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative w-full sm:max-w-xs cs-header-animate">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Quick Search CS, DN..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="pl-8 bg-background/50 backdrop-blur-sm shadow-inner h-9" 
                            />
                        </div>
                        {selectedRows.length > 0 && (
                            <div className="flex items-center gap-2 ml-4 cs-header-animate">
                                <Button size="sm" variant="outline" className="text-green-600 border-green-600 bg-green-50/50 h-8" onClick={() => handleBulkApproval(1)}>
                                    <Check className="mr-2 h-4 w-4" /> Approve Selected ({selectedRows.length})
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8" onClick={() => handleBulkApproval(0)}>
                                    <X className="mr-2 h-4 w-4" /> Reject
                                </Button>
                            </div>
                        )}
                    </div>
                    <Button variant="outline" className="text-primary border-primary hover:bg-primary/5 shadow-sm cs-header-animate font-bold uppercase tracking-tighter h-9" onClick={() => setIsGuideOpen(true)}>
                        <HelpCircle className="mr-2 h-4 w-4" /> Operational Standards
                    </Button>
                </div>

                <div className="border rounded-[20px] overflow-hidden shadow-2xl bg-background/80 backdrop-blur-xl cs-table-animate">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 border-b-2">
                                <TableHead className="w-[50px]">
                                    <Checkbox 
                                        checked={approvableItems.length > 0 && selectedRows.length === approvableItems.length} 
                                        onCheckedChange={(c) => setSelectedRows(c ? approvableItems.map(i => i.id) : [])} 
                                    />
                                </TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">CS Identity</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">DN Reference</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">GP Concern</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Awarded Vendor</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Awarded Amount</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                                <TableHead className="w-[140px] text-right font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                            <p className="text-[10px] font-black uppercase text-muted-foreground animate-pulse">Syncing Registry...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((cs) => {
                                    const poExists = purchaseOrders?.some(po => po.csId === cs.id);
                                    const dn = demandNotes?.find(d => d.id === cs.demandNoteId);
                                    const gpConcern = employees?.find(e => e.id === dn?.gpConcernOfficerId);
                                    
                                    const needsVendorSelection = cs.approvalStatus === 2 && (isSuperAdmin || isGPOfficer || currentUserEmployee?.id === cs.vendorSelectorId);
                                    const needsApproval = currentUserEmployee && cs.currentApproverId === currentUserEmployee.id && cs.approvalStatus !== 1 && cs.approvalStatus !== 0 && cs.approvalStatus !== 2;
                                    
                                    const isWaitingForMe = needsVendorSelection || needsApproval;
                                    const isApprovable = approvableItems.some(i => i.id === cs.id);

                                    const financialDetails = cs.selectedVendorId ? calculateCsTotals(cs, cs.selectedVendorId) : null;

                                    return (
                                        <TableRow key={cs.id} className={cn("hover:bg-primary/[0.02] transition-colors duration-200 cs-row-animate group h-14", isWaitingForMe && "bg-orange-50/5")}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={selectedRows.includes(cs.id)} 
                                                    onCheckedChange={() => setSelectedRows(prev => prev.includes(cs.id) ? prev.filter(r => r !== cs.id) : [...prev, cs.id])} 
                                                    disabled={!isApprovable} 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1 font-black text-sm text-primary">
                                                        <span>{cs.csNumber}</span>
                                                        <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { navigator.clipboard.writeText(cs.csNumber); toast({ title: 'Copied!' }); }}>
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <span className="text-[9px] text-muted-foreground font-black">{new Date(cs.csDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline" className="font-bold border-primary/10 text-[10px]">{dn?.demandNoteNumber || 'N/A'}</Badge></TableCell>
                                            <TableCell>
                                                <span className="text-[10px] font-black uppercase text-primary">{gpConcern?.fullName || 'Unassigned'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-primary">{cs.selectedVendorId ? vendors?.find((v: Vendor) => v.id === cs.selectedVendorId)?.vendorName : 'Pending Selection'}</span>
                                                    {cs.vendorSelectionDate && <span className="text-[9px] text-muted-foreground italic font-black">Awarded: {new Date(cs.vendorSelectionDate).toLocaleDateString()}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {financialDetails ? (
                                                    <div className="flex flex-col text-[10px] gap-0.5">
                                                        <span className="font-black text-xs text-primary">{formatCurrency(financialDetails.total)}</span>
                                                        <span className="text-muted-foreground font-bold">VAT: {formatCurrency(financialDetails.vat)}</span>
                                                        <span className="text-muted-foreground font-bold">Tax: {formatCurrency(financialDetails.tax)}</span>
                                                        <span className="text-red-500 font-bold">Disc: -{formatCurrency(financialDetails.discount)}</span>
                                                    </div>
                                                ) : <span className="text-[10px] text-muted-foreground italic">N/A</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant={cs.approvalStatus === 1 ? 'default' : 'secondary'} className="font-black uppercase text-[9px] tracking-widest">{getCSStatusText(cs)}</Badge>
                                                    {needsVendorSelection && <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap text-[9px] font-black h-4 px-2">⚠️ Award</Badge>}
                                                    {needsApproval && <Badge className="bg-blue-600 animate-pulse text-white whitespace-nowrap text-[9px] font-black h-4 px-2">⚠️ Approve</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    {needsVendorSelection && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-500/10 rounded-full animate-pulse border border-blue-500/20" onClick={() => { setSelectedCsForVendor(cs); setIsVendorSelectionOpen(true); }}>
                                                                    <Hand className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="animate-scale-in">Award Contract / Select Vendor</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {cs.approvalStatus === 1 && !poExists && (isSuperAdmin || isGPOfficer || (currentUserEmployee && dn?.gpConcernOfficerId === currentUserEmployee.id)) && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-600/10 rounded-full border border-green-600/20" onClick={() => { setSelectedCsForPo(cs); setIsPoFormOpen(true); }}>
                                                                    <FilePlus className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="animate-scale-in">Create Purchase Order</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 text-blue-500" onClick={() => {setSelectedCsForStatus(cs); setIsStatusModalOpen(true);}}>
                                                                <Info className="h-4 w-4"/>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="animate-scale-in">View Approval Flow</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" asChild>
                                                                <Link href={`/procurement/local-purchase/comparative-statements/${cs.id}`}><Eye className="h-4 w-4"/></Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="animate-scale-in">View Details</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => csRef && deleteDocumentNonBlocking(doc(csRef, cs.id))}>
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="animate-scale-in">Delete Record</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-48 text-center text-muted-foreground italic font-medium">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <BarChart2 className="h-12 w-12" />
                                            <p className="font-black uppercase text-xs tracking-[0.2em]">Registry Empty</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            <VendorSelectionDialog 
                cs={selectedRows.length === 1 ? filteredItems.find(i => i.id === selectedRows[0]) || selectedCsForVendor : selectedCsForVendor} 
                isOpen={isVendorSelectionOpen} 
                onOpenChange={setIsVendorSelectionOpen} 
                onVendorSelected={handleVendorSelected} 
                vendors={vendors || []} 
            />

            <PurchaseOrderForm 
                isOpen={isPoFormOpen} 
                setIsOpen={setIsPoFormOpen} 
                onSave={(d) => { poRef && addDocumentNonBlocking(poRef, d); toast({ title: 'PO Created' }); }} 
                cs={selectedCsForPo} 
            />
            
            <CSUserGuide isOpen={isGuideOpen} onOpenChange={setIsGuideOpen} />

            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-md animate-dialog-in">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter text-primary">CS Audit Chain</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-[10px] font-black uppercase text-blue-900">Deep Scan Engine</p>
                        <p className="text-[9px] text-muted-foreground font-bold">
                          DN -> GP -> CS -> PO -> MRR -> PN
                        </p>
                        <Separator className="my-2" />
                        {selectedCsForStatus?.approvalFlow?.steps.map((step: any, index: number) => {
                            const historyEntry = selectedCsForStatus.approvalHistory?.find((h:any) => h.level === index);
                            const approver = (employees || []).find(e => e.id === step.approverId);
                            const isPending = selectedCsForStatus.currentApproverId === step.approverId && selectedCsForStatus.approvalStatus !== 1 && selectedCsForStatus.approvalStatus !== 0 && selectedCsForStatus.approvalStatus !== 2;
                            
                            return (
                                <li key={index} className="flex items-start gap-4 list-none group">
                                    <div className="shrink-0 mt-1">
                                        {historyEntry ? (
                                            <CheckCircle className="h-6 w-6 text-green-500" />
                                        ) : (isPending ? (
                                            <Hourglass className="h-6 w-6 text-orange-500 animate-spin" />
                                        ) : (
                                            <MoreHorizontal className="h-6 w-6 text-muted-foreground" />
                                        ))}
                                    </div>
                                    <div className="flex-1 flex gap-3 items-center bg-muted/20 p-2 rounded-xl border border-primary/5">
                                        <Avatar className="h-9 w-9 border-2 border-primary/5">
                                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">{approver?.fullName?.charAt(0) || '?'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-black uppercase text-[10px] tracking-widest text-primary leading-none mb-1">{step.stepName}</p>
                                            <p className="text-xs font-bold leading-tight">{approver?.fullName}</p>
                                            {historyEntry && (
                                                <p className="text-[9px] text-muted-foreground mt-1 font-medium">{new Date(historyEntry.timestamp).toLocaleString()}</p>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
