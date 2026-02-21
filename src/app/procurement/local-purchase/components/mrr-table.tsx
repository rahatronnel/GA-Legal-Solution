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
    Search, Eye, Printer, Users, FilePlus, Hand, Edit, Trash2, 
    UserPlus, Copy, HelpCircle, Info, Tag, ShieldCheck, ListOrdered,
    Briefcase, ClipboardCheck, CheckCircle2, ChevronsUpDown, Check, X,
    Package, BarChart2, TrendingUp, DollarSign, Gavel, Truck, ChevronRight,
    ShoppingCart, Box, UserCheck, Upload
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { DemandNote } from './demand-note-entry-form';
import type { MRR } from './mrr-entry-form';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn, imageToDataUrl } from '@/lib/utils';
import { getMRRStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { UploadedFile } from './po-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';

const MRRUserGuide = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col animate-dialog-in p-0 overflow-hidden">
                <div className="bg-primary p-6 text-primary-foreground shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Package className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight text-white">MRR Master Operational Guide</DialogTitle>
                            <DialogDescription className="text-primary-foreground/80 font-medium">Standard standards for physical material receipt, quality audit, and evidence collection.</DialogDescription>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-6 space-y-8 pb-32">
                        <section className="space-y-4">
                            <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Receipt Verification Flow
                            </h4>
                            <div className="relative p-6 border-2 border-dashed rounded-2xl bg-muted/30 overflow-hidden">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><ShoppingCart className="h-5 w-5" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight">PO Dispatched<br/>to Vendor</span>
                                    </div>
                                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground animate-pulse" />
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Truck className="h-5 w-5" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight">Physical<br/>Delivery Receipt</span>
                                    </div>
                                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground animate-pulse" />
                                    <div className="flex flex-col items-center gap-2 group scale-125">
                                        <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl ring-4 ring-primary/20 group-hover:rotate-12 transition-transform"><Package className="h-6 w-6" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight text-primary">Evidence<br/>Upload (Invoice)</span>
                                    </div>
                                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground animate-pulse" />
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><CheckCircle2 className="h-5 w-5" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight">Store Manager<br/>Approval</span>
                                    </div>
                                    <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground animate-pulse" />
                                    <div className="flex flex-col items-center gap-2 group">
                                        <div className="h-10 w-10 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><ShieldCheck className="h-5 w-5" /></div>
                                        <span className="text-[10px] font-black text-center uppercase leading-tight">Flow Finalized<br/>(Accounting)</span>
                                    </div>
                                </div>
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted-foreground/10 -translate-y-1/2 hidden md:block" />
                            </div>
                        </section>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6 space-y-2">
                                    <h5 className="font-bold flex items-center gap-2 text-blue-600"><ClipboardCheck className="h-4 w-4"/> The "Entry Audit" Objective</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        The MRR is the official organizational proof that goods have entered the premises. It validates that the **Quantity** and **Quality** match the original Demand Note requirements.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6 space-y-2">
                                    <h5 className="font-bold flex items-center gap-2 text-emerald-600"><FilePlus className="h-4 w-4"/> Evidence Collection</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        To finalize an MRR, the GP Concern **must upload** clear scans of the **Vendor Bill/Invoice** and the **Delivery Challan**. These documents are permanently linked.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6 space-y-2">
                                    <h5 className="font-bold flex items-center gap-2 text-amber-600"><UserCheck className="h-4 w-4"/> Receiver Confirmation</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        A "Receiver Confirmant" must be selected. This is the specific individual who performed the physical inspection. Their digital profile is recorded.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6 space-y-2">
                                    <h5 className="font-bold flex items-center gap-2 text-purple-600"><ShieldCheck className="h-4 w-4"/> Multi-Stage Verification</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Once finalized, the MRR moves through a 4-stage flow: **GP Concern** -> **Requested Dept. Manager** -> **Purchase Manager** -> **Purchase Dept. TA**.
                                    </p>
                                </CardContent>
                            </div>
                        </div>

                        <div className="p-4 bg-primary/5 border rounded-xl space-y-3">
                            <h5 className="font-black text-[10px] uppercase tracking-tighter text-primary flex items-center gap-2"><Box className="h-4 w-4" /> Physical Condition Check</h5>
                            <p className="text-xs text-muted-foreground">
                                Inspectors must flag **Goods Condition** and **Packaging Condition** explicitly. Damaged shipments must be marked as **"Not Ok"** to prevent faulty assets from entering inventory.
                            </p>
                        </div>
                    </div>
                    <ScrollBar orientation="vertical" />
                </ScrollArea>
                
                <DialogFooter className="p-4 border-t shrink-0">
                    <Button onClick={() => onOpenChange(false)} className="w-full font-bold uppercase tracking-widest text-white">Understood, Perform Receipt</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const FinalizeMrrDialog = ({
    mrr,
    isOpen,
    onOpenChange,
    onFinalize,
    employees,
    demandNotes
}: {
    mrr: MRR | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onFinalize: (docData: { bill: UploadedFile[], challan: UploadedFile[], confirmantId: string }) => void;
    employees: Employee[];
    demandNotes: DemandNote[];
}) => {
    const { toast } = useToast();
    const [billDocs, setBillDocs] = useState<UploadedFile[]>([]);
    const [challanDocs, setChallanDocs] = useState<UploadedFile[]>([]);
    const [confirmantId, setConfirmantId] = useState('');
    const [openSearch, setOpenSearch] = useState(false);

    useEffect(() => {
        if (isOpen && mrr) {
            setBillDocs([]);
            setChallanDocs([]);
            const dn = demandNotes.find(d => d.demandNoteNumber === mrr.demandNoteNumber);
            setConfirmantId(dn?.createdBy || '');
        }
    }, [isOpen, mrr, demandNotes]);

    const handleFileChange = (type: 'bill' | 'challan') => async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const newFiles: UploadedFile[] = [];
            for (const file of files) {
                try {
                    const dataUrl = await imageToDataUrl(file);
                    newFiles.push({ id: Date.now().toString() + Math.random(), name: file.name, file: dataUrl });
                } catch (err) { toast({ variant: 'destructive', title: 'File Error' }); }
            }
            if (type === 'bill') setBillDocs(p => [...p, ...newFiles]);
            else setChallanDocs(p => [...p, ...newFiles]);
        }
    };

    const handleConfirm = () => {
        if (!confirmantId || billDocs.length === 0 || challanDocs.length === 0) {
            toast({ variant: 'destructive', title: 'Missing Info', description: 'Evidence and Confirmant are required.' });
            return;
        }
        onFinalize({ bill: billDocs, challan: challanDocs, confirmantId });
    };

    if (!mrr) return null;
    const selectedEmployee = employees.find(e => e.id === confirmantId);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl animate-dialog-in">
                <DialogHeader>
                    <DialogTitle>Finalize MRR: {mrr.mrrNumber}</DialogTitle>
                    <DialogDescription>Upload Bill/Invoice and Challan to initiate approval.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="flex justify-between font-bold text-xs uppercase">Bill / Invoice <Label htmlFor="up-bill" className="text-primary hover:underline cursor-pointer"><Upload className="h-3 w-3 inline"/></Label></Label>
                            <input id="up-bill" type="file" multiple className="hidden" onChange={handleFileChange('bill')} />
                            <div className="space-y-1">{billDocs.map(f => <div key={f.id} className="text-xs p-1 bg-muted rounded flex justify-between"><span>{f.name}</span><X className="h-3 w-3 cursor-pointer" onClick={()=>setBillDocs(p=>p.filter(x=>x.id!==f.id))}/></div>)}</div>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex justify-between font-bold text-xs uppercase">Challan <Label htmlFor="up-challan" className="text-primary hover:underline cursor-pointer"><Upload className="h-3 w-3 inline"/></Label></Label>
                            <input id="up-challan" type="file" multiple className="hidden" onChange={handleFileChange('challan')} />
                            <div className="space-y-1">{challanDocs.map(f => <div key={f.id} className="text-xs p-1 bg-muted rounded flex justify-between"><span>{f.name}</span><X className="h-3 w-3 cursor-pointer" onClick={()=>setChallanDocs(p=>p.filter(x=>x.id!==f.id))}/></div>)}</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase">Receiver Confirmant</Label>
                        <Popover open={openSearch} onOpenChange={setOpenSearch}>
                            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between animate-scale-in">{selectedEmployee ? selectedEmployee.fullName : "Select verifyer..."}<ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" /></Button></PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 animate-scale-in">
                                <Command>
                                    <CommandInput placeholder="Search..." />
                                    <CommandList>
                                        <CommandEmpty>No one found.</CommandEmpty>
                                        <CommandGroup>
                                            {employees.map((emp) => (
                                                <CommandItem key={emp.id} value={emp.fullName} onSelect={() => { setConfirmantId(emp.id); setOpenSearch(false); }}>
                                                    <Check className={cn("mr-2 h-4 w-4", confirmantId === emp.id ? "opacity-100" : "opacity-0")} />
                                                    {emp.fullName}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleConfirm}>Finalize & Submit</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export function MRRTable() {
    const { mrrs, employees, orgSettings, demandNotes, isLoading } = useProcurement();
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const mrrColRef = useMemoFirebase(() => firestore ? collection(firestore, 'mrrs') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [selectedMrrForFinal, setSelectedMrrForFinal] = useState<MRR | null>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedMrrForStatus, setSelectedMrrForStatus] = useState<MRR | null>(null);

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [user, employees]);
    const isSuperAdmin = user?.email === 'superadmin@galsolution.com';

    const roleData = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        if (!settings || !currentUserEmployee) return { isGPOfficer: false, isManager: false };
        return {
            isGPOfficer: settings.generalPurchaseOfficerId === currentUserEmployee.id,
            isManager: settings.managingDirectorId === currentUserEmployee.id || settings.factoryDirectorId === currentUserEmployee.id
        };
    }, [orgSettings, currentUserEmployee]);

    const filteredMrrs = useMemo(() => {
        const safeItems = Array.isArray(mrrs) ? mrrs : [];
        return safeItems.filter(mrr => {
            let isVisible = isSuperAdmin || roleData.isGPOfficer || roleData.isManager;
            if (!isVisible && currentUserEmployee) {
                if (mrr.createdBy === currentUserEmployee.id || mrr.currentApproverId === currentUserEmployee.id || mrr.approvalHistory?.some(h => h.approverId === currentUserEmployee.id)) {
                    isVisible = true;
                }
            }
            if (!isVisible) return false;
            return !searchTerm || mrr.mrrNumber.toLowerCase().includes(searchTerm.toLowerCase()) || mrr.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
        }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [mrrs, searchTerm, isSuperAdmin, roleData, currentUserEmployee]);

    const approvableItems = useMemo(() => filteredMrrs.filter(m => currentUserEmployee && m.currentApproverId === currentUserEmployee.id && m.approvalStatus > 2), [filteredMrrs, currentUserEmployee]);

    const handleFinalize = (data: { bill: UploadedFile[], challan: UploadedFile[], confirmantId: string }) => {
        if (!selectedMrrForFinal || !mrrColRef || !orgSettings?.procurementSettings) return;
        const dn = demandNotes.find(d => d.demandNoteNumber === selectedMrrForFinal.demandNoteNumber);
        const { procurementSettings } = orgSettings;
        const requestedDeptHeadId = procurementSettings.departmentHeads.find(dh => dh.sectionId === dn?.sectionId)?.headId;
        const steps = [
            { stepName: 'GP Concern', approverId: selectedMrrForFinal.createdBy },
            { stepName: 'Requested Dept. Manager', approverId: requestedDeptHeadId || '' },
            { stepName: 'Purchase Manager', approverId: procurementSettings.csApprovalRoles?.purchaseManagerId || '' },
            { stepName: 'Purchase Dept. TA', approverId: procurementSettings.csApprovalRoles?.purchaseDeptTaId || '' }
        ].filter(s => !!s.approverId);

        setDocumentNonBlocking(doc(mrrColRef, selectedMrrForFinal.id), {
            documents: { bill: data.bill, challan: data.challan },
            receiverConfirmantId: data.confirmantId,
            approvalFlow: { steps },
            approvalStatus: 3, 
            currentApproverId: steps[0].approverId,
        }, { merge: true });
        setIsFinalizeOpen(false);
        toast({ title: 'Finalized' });
    };

    const handleBulkApproval = (status: number) => {
        if (!firestore || !currentUserEmployee || !mrrColRef) return;
        selectedRows.forEach(id => {
            const mrr = mrrs.find(m => m.id === id);
            if (!mrr || !mrr.approvalFlow?.steps) return;
            const currentLevel = mrr.approvalHistory?.length || 0;
            const newHistoryEntry = { approverId: currentUserEmployee.id, status: status === 1 ? 'Approved' : 'Rejected', timestamp: new Date().toISOString(), level: currentLevel, remarks: 'Bulk' };
            let nextStatus = status === 1 ? (currentLevel + 1 < mrr.approvalFlow.steps.length ? getNextApprovalStatusCode(currentLevel) : 1) : 0;
            let nextApprover = status === 1 && currentLevel + 1 < mrr.approvalFlow.steps.length ? mrr.approvalFlow.steps[currentLevel + 1].approverId : '';
            setDocumentNonBlocking(doc(mrrColRef, id), { approvalStatus: nextStatus, currentApproverId: nextApprover, approvalHistory: [...(mrr.approvalHistory || []), newHistoryEntry] }, { merge: true });
        });
        setSelectedRows([]);
        toast({ title: 'Success' });
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search MRR#, Supplier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                        </div>
                        {selectedRows.length > 0 && (
                            <div className="flex items-center gap-2 ml-4">
                                <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => handleBulkApproval(1)}><Check className="mr-2 h-4 w-4" /> Approve Selected ({selectedRows.length})</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}><X className="mr-2 h-4 w-4" /> Reject</Button>
                            </div>
                        )}
                    </div>
                    <Button variant="outline" className="text-primary border-primary hover:bg-primary/5 animate-scale-in" onClick={() => setIsGuideOpen(true)}><HelpCircle className="mr-2 h-4 w-4" /> User Guide</Button>
                </div>

                <div className="border rounded-lg overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[50px]"><Checkbox checked={approvableItems.length > 0 && selectedRows.length === approvableItems.length} onCheckedChange={(c) => setSelectedRows(c ? approvableItems.map(i => i.id) : [])} /></TableHead>
                                <TableHead className="font-bold">MRR Details</TableHead>
                                <TableHead className="font-bold">GP Concern</TableHead>
                                <TableHead className="font-bold">Supplier</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="w-[160px] text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
                            ) : filteredMrrs.length > 0 ? (
                                filteredMrrs.map(mrr => {
                                    const isWaitingForFinalize = mrr.approvalStatus === 2 && (isSuperAdmin || mrr.createdBy === currentUserEmployee?.id);
                                    const isWaitingForApproval = currentUserEmployee && mrr.currentApproverId === currentUserEmployee.id && mrr.approvalStatus > 2;
                                    const isApprovable = approvableItems.some(i => i.id === mrr.id);
                                    const isFinalApproved = mrr.approvalStatus === 1;

                                    return (
                                        <TableRow key={mrr.id} className={cn("hover:bg-muted/30 transition-colors", (isWaitingForFinalize || isWaitingForApproval) ? 'bg-orange-500/5' : '')}>
                                            <TableCell><Checkbox checked={selectedRows.includes(mrr.id)} onCheckedChange={() => setSelectedRows(p => p.includes(mrr.id) ? p.filter(r => r !== mrr.id) : [...p, mrr.id])} disabled={!isApprovable} /></TableCell>
                                            <TableCell><div className="flex flex-col"><span className="font-bold">{mrr.mrrNumber}</span><span className="text-[10px] text-muted-foreground">PO: {mrr.poId}</span></div></TableCell>
                                            <TableCell><span className="text-xs">{employees?.find(e => e.id === mrr.createdBy)?.fullName}</span></TableCell>
                                            <TableCell><span className="text-xs">{mrr.supplierName}</span></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={mrr.approvalStatus === 1 ? 'default' : 'secondary'}>{getMRRStatusText(mrr)}</Badge>
                                                    {isWaitingForFinalize && <Badge className="bg-orange-500 text-white animate-pulse">⚠️ Finalize Required</Badge>}
                                                    {isWaitingForApproval && <Badge className="bg-orange-500 text-white animate-pulse">⚠️ Approve Report</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {isWaitingForFinalize && <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 animate-pulse" onClick={() => { setSelectedMrrForFinal(mrr); setIsFinalizeOpen(true); }}><FilePlus className="h-4 w-4" /></Button>}
                                                    {isFinalApproved && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => window.open(`/procurement/local-purchase/mrrs/${mrr.id}/print`, '_blank')}>
                                                                        <Printer className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="animate-scale-in">Open in New Tab & Print</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedMrrForStatus(mrr); setIsStatusModalOpen(true); }}><Info className="h-4 w-4 text-blue-500"/></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/mrrs/${mrr.id}`}><Eye className="h-4 w-4"/></Link></Button>
                                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => mrrColRef && deleteDocumentNonBlocking(doc(mrrColRef, mrr.id))}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No reports found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <FinalizeMrrDialog mrr={selectedMrrForFinal} isOpen={isFinalizeOpen} onOpenChange={setIsFinalizeOpen} onFinalize={handleFinalize} employees={employees || []} demandNotes={demandNotes || []} />
            
            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-md animate-dialog-in">
                    <DialogHeader><DialogTitle>MRR Approval Flow</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedMrrForStatus?.approvalFlow?.steps.map((step: any, index: number) => {
                            const historyEntry = selectedMrrForStatus.approvalHistory?.find((h:any) => h.level === index);
                            const approver = employees?.find(e => e.id === step.approverId);
                            const isPending = selectedMrrForStatus.currentApproverId === step.approverId && selectedMrrForStatus.approvalStatus > 2;
                            return (
                                <li key={index} className="flex items-center gap-4 list-none">
                                    {historyEntry ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : (isPending ? <Hourglass className="h-6 w-6 text-orange-500 animate-spin" /> : <MoreHorizontal className="h-6 w-6 text-muted-foreground" />)}
                                    <div className="flex-1 flex gap-3 items-center">
                                        <Avatar className="h-10 w-10 border"><AvatarFallback>{approver?.fullName?.charAt(0)}</AvatarFallback></Avatar>
                                        <div><p className="font-semibold text-sm">{step.stepName}</p><p className="text-xs text-muted-foreground">{approver?.fullName}</p></div>
                                    </div>
                                </li>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            <MRRUserGuide isOpen={isGuideOpen} onOpenChange={setIsGuideOpen} />
        </TooltipProvider>
    );
}