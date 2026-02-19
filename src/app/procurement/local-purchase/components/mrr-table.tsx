
"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { 
    Search, Eye, Trash2, Copy, FileText, PackageCheck, Calendar, 
    Truck, CheckCircle2, AlertCircle, User, Hash, Clock, FilePlus, 
    UserCheck, Upload, X, Check, HelpCircle, Info, ListOrdered, 
    ShieldCheck, Box, Tag, ChevronsUpDown, Hourglass, MoreHorizontal
} from 'lucide-react';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import type { MRR } from './mrr-entry-form';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, imageToDataUrl } from '@/lib/utils';
import { getMRRStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { UploadedFile } from './po-entry-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const MRRUserGuide = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
                <div className="flex items-center gap-2 text-primary">
                    <HelpCircle className="h-6 w-6" />
                    <DialogTitle className="text-xl">MRR User Guide</DialogTitle>
                </div>
                <DialogDescription>Instructions for high-fidelity Material Receiving Reports.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow pr-4">
                <div className="space-y-6 py-4">
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><Info className="h-4 w-4"/> Objective</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            The Material Receiving Report (MRR) serves as the official organizational record for the physical receipt of goods. It acts as the "Entry Audit" before items are accepted into inventory or delivered to the requesting department.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><Tag className="h-4 w-4"/> Information Flow</h4>
                        <p className="text-sm text-muted-foreground">
                            MRRs are generated from <Badge variant="outline">Purchase Orders</Badge> that have been officially sent to vendors. The system automatically pulls item quantities, unit prices, and department data to prevent manual entry errors.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4"/> The Finalization Phase</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                            To activate the approval flow, the <strong>GP Concern Officer</strong> must:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                            <li>Upload clear scans of the <strong>Vendor Bill/Invoice</strong>.</li>
                            <li>Upload scans of the <strong>Delivery Challan</strong>.</li>
                            <li>Select a <strong>Receiver Confirmant</strong> (the specific person who verified the physical goods).</li>
                        </ul>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><UserCheck className="h-4 w-4"/> 4-Stage Approval Chain</h4>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
                            <li><strong>GP Concern:</strong> Initial verification of document clarity and shipment data.</li>
                            <li><strong>Requested Dept. Manager:</strong> Confirms that the goods meet the original Demand Note requirements.</li>
                            <li><strong>Purchase Manager:</strong> Commercial and budget sign-off.</li>
                            <li><strong>Purchase Department TA:</strong> Final technical and logistical validation.</li>
                        </ol>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><Box className="h-4 w-4"/> Quality Inspection</h4>
                        <p className="text-sm text-muted-foreground">
                            Users must record both <strong>Goods Condition</strong> and <strong>Package Condition</strong>. If anything is marked "Not Ok", the MRR status highlights the discrepancy for the approvers to review.
                        </p>
                    </section>
                </div>
            </ScrollArea>
            <DialogFooter>
                <Button onClick={() => onOpenChange(false)}>Understood</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

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
    employees: any[];
    demandNotes: any[];
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
            
            // Auto-default to Demand Note creator
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

    const removeFile = (type: 'bill' | 'challan', id: string) => {
        if (type === 'bill') setBillDocs(p => p.filter(f => f.id !== id));
        else setChallanDocs(p => p.filter(f => f.id !== id));
    };

    const handleConfirm = () => {
        if (!confirmantId) {
            toast({ variant: 'destructive', title: 'Missing Field', description: 'Please select a Receiver Confirmant.' });
            return;
        }
        if (billDocs.length === 0 || challanDocs.length === 0) {
            toast({ variant: 'destructive', title: 'Missing Evidence', description: 'Please upload at least one Bill and one Challan.' });
            return;
        }
        onFinalize({ bill: billDocs, challan: challanDocs, confirmantId });
    };

    if (!mrr) return null;

    const selectedEmployee = employees.find(e => e.id === confirmantId);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Finalize MRR: {mrr.mrrNumber}</DialogTitle>
                    <DialogDescription>Upload physical copies of the Bill/Invoice and Challan to initiate approval.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="flex justify-between font-bold text-xs uppercase tracking-tighter">Bill / Invoice <Label htmlFor="up-bill" className="text-primary hover:underline cursor-pointer flex items-center gap-1"><Upload className="h-3 w-3"/>Add</Label></Label>
                            <input id="up-bill" type="file" multiple className="hidden" onChange={handleFileChange('bill')} />
                            <div className="space-y-1 mt-2">
                                {billDocs.map(f => (
                                    <div key={f.id} className="flex items-center justify-between text-xs p-1.5 bg-muted rounded"><span className="truncate">{f.name}</span><Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFile('bill', f.id)}><X className="h-3 w-3"/></Button></div>
                                ))}
                                {billDocs.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2 border-2 border-dashed rounded">Required</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex justify-between font-bold text-xs uppercase tracking-tighter">Challan <Label htmlFor="up-challan" className="text-primary hover:underline cursor-pointer flex items-center gap-1"><Upload className="h-3 w-3"/>Add</Label></Label>
                            <input id="up-challan" type="file" multiple className="hidden" onChange={handleFileChange('challan')} />
                            <div className="space-y-1 mt-2">
                                {challanDocs.map(f => (
                                    <div key={f.id} className="flex items-center justify-between text-xs p-1.5 bg-muted rounded"><span className="truncate">{f.name}</span><Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFile('challan', f.id)}><X className="h-3 w-3"/></Button></div>
                                ))}
                                {challanDocs.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2 border-2 border-dashed rounded">Required</p>}
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-tighter">Receiver Confirmant (Defaulted to DN Creator)</Label>
                        <Popover open={openSearch} onOpenChange={setOpenSearch}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openSearch}
                                    className="w-full justify-between h-11"
                                >
                                    {selectedEmployee ? `${selectedEmployee.fullName} (${selectedEmployee.userIdCode})` : "Select verifyer..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search employee name or code..." />
                                    <CommandList>
                                        <CommandEmpty>No employee found.</CommandEmpty>
                                        <CommandGroup>
                                            {employees.map((emp) => (
                                                <CommandItem
                                                    key={emp.id}
                                                    value={`${emp.fullName} ${emp.userIdCode}`}
                                                    onSelect={() => {
                                                        setConfirmantId(emp.id);
                                                        setOpenSearch(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", confirmantId === emp.id ? "opacity-100" : "opacity-0")} />
                                                    {emp.fullName} ({emp.userIdCode})
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 font-bold"><Check className="mr-2 h-4 w-4"/> Finalize & Start Approval</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export function MRRTable() {
    const { mrrs, purchaseOrders, comparativeStatements, demandNotes, employees, sections, orgSettings, isLoading } = useProcurement();
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const mrrColRef = useMemoFirebase(() => firestore ? collection(firestore, 'mrrs') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [selectedMrrForFinal, setSelectedMrrForFinal] = useState<MRR | null>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedMrrForStatus, setSelectedMrrForStatus] = useState<MRR | null>(null);

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [user, employees]);
    const isSuperAdmin = user?.email === 'superadmin@galsolution.com';

    const filteredMrrs = useMemo(() => {
        const safeItems = Array.isArray(mrrs) ? mrrs : [];
        return safeItems.filter(mrr => {
            const lowerTerm = searchTerm.toLowerCase();
            let isVisible = isSuperAdmin || mrr.createdBy === currentUserEmployee?.id || mrr.currentApproverId === currentUserEmployee?.id || mrr.approvalHistory?.some(h => h.approverId === currentUserEmployee?.id);
            if (!isVisible) return false;

            return !searchTerm || 
                mrr.mrrNumber.toLowerCase().includes(lowerTerm) || 
                mrr.supplierName.toLowerCase().includes(lowerTerm) ||
                mrr.demandNoteNumber.toLowerCase().includes(lowerTerm);
        }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [mrrs, searchTerm, isSuperAdmin, currentUserEmployee]);

    const handleFinalize = (data: { bill: UploadedFile[], challan: UploadedFile[], confirmantId: string }) => {
        if (!selectedMrrForFinal || !mrrColRef || !orgSettings?.procurementSettings) return;

        const dn = demandNotes.find(d => d.demandNoteNumber === selectedMrrForFinal.demandNoteNumber);
        const { procurementSettings } = orgSettings;
        const { departmentHeads, csApprovalRoles } = procurementSettings;

        const requestedDeptHeadId = departmentHeads.find(dh => dh.sectionId === dn?.sectionId)?.headId;
        
        const steps = [
            { stepName: 'GP Concern', approverId: selectedMrrForFinal.createdBy },
            { stepName: 'Requested Dept. Manager', approverId: requestedDeptHeadId || '' },
            { stepName: 'Purchase Manager', approverId: csApprovalRoles?.purchaseManagerId || '' },
            { stepName: 'Purchase Dept. TA', approverId: csApprovalRoles?.purchaseDeptTaId || '' }
        ].filter(s => !!s.approverId);

        setDocumentNonBlocking(doc(mrrColRef, selectedMrrForFinal.id), {
            documents: { bill: data.bill, challan: data.challan },
            receiverConfirmantId: data.confirmantId,
            approvalFlow: { steps },
            approvalStatus: 3, 
            currentApproverId: steps[0].approverId,
        }, { merge: true });

        setIsFinalizeOpen(false);
        toast({ title: 'MRR Finalized', description: 'Internal approval workflow has been initiated.' });
    };

    const handleDelete = (id: string) => {
        if (!mrrColRef) return;
        deleteDocumentNonBlocking(doc(mrrColRef, id));
        toast({ title: 'Deleted', description: 'MRR has been removed.' });
    };

    const formatDateTime = (ts: string | undefined) => {
        if (!ts) return 'N/A';
        try { return new Date(ts).toLocaleString(); } catch { return ts; }
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search MRR#, Supplier, DN#..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                    </div>
                    <Button variant="outline" className="text-primary border-primary hover:bg-primary/5" onClick={() => setIsGuideOpen(true)}><HelpCircle className="mr-2 h-4 w-4" /> User Guide</Button>
                </div>

                <div className="border rounded-lg overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-bold"><FileText className="h-4 w-4 inline mr-2" />MRR Details</TableHead>
                                <TableHead className="font-bold"><Hash className="h-4 w-4 inline mr-2" />CS/PO Link</TableHead>
                                <TableHead className="font-bold"><User className="h-4 w-4 inline mr-2" />GP Concern</TableHead>
                                <TableHead className="font-bold"><Truck className="h-4 w-4 inline mr-2" />Supplier</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10">Loading Material Receiving Reports...</TableCell></TableRow>
                            ) : filteredMrrs.length > 0 ? (
                                filteredMrrs.map(mrr => {
                                    const po = purchaseOrders.find(p => p.id === mrr.poId);
                                    const cs = comparativeStatements.find(c => c.id === po?.csId);
                                    const dn = demandNotes.find(d => d.id === po?.demandNoteId);
                                    const concern = employees.find(e => e.id === mrr.createdBy);
                                    
                                    const isWaitingForFinalize = mrr.approvalStatus === 2 && (isSuperAdmin || mrr.createdBy === currentUserEmployee?.id);
                                    const isWaitingForApproval = mrr.currentApproverId === currentUserEmployee?.id && mrr.approvalStatus > 2;

                                    return (
                                        <TableRow key={mrr.id} className={cn("hover:bg-muted/30 transition-colors", (isWaitingForFinalize || isWaitingForApproval) && "bg-orange-500/5")}>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-primary">{mrr.mrrNumber}</span>
                                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 opacity-50" onClick={() => { navigator.clipboard.writeText(mrr.mrrNumber); toast({ title: 'Copied!' }); }}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Copy MRR#</TooltipContent></Tooltip>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="h-3 w-3" />{formatDateTime(mrr.createdAt)}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-[10px]">
                                                    <span className="font-semibold">CS: {cs?.csNumber || 'N/A'}</span>
                                                    <span className="text-muted-foreground">PO: {po?.poNumber || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col"><span className="text-xs font-semibold">{concern?.fullName || 'N/A'}</span><span className="text-[9px] text-muted-foreground">Officer</span></div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col"><span className="font-semibold text-xs">{mrr.supplierName}</span><span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{mrr.supplierAddress}</span></div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={mrr.approvalStatus === 1 ? 'default' : 'secondary'}>{getMRRStatusText(mrr)}</Badge>
                                                    {isWaitingForFinalize && <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap">⚠️ Finalize MRR</Badge>}
                                                    {isWaitingForApproval && <Badge className="bg-orange-500 animate-pulse text-white whitespace-nowrap">⚠️ Need Approval</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {isWaitingForFinalize && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 animate-pulse" onClick={() => { setSelectedMrrForFinal(mrr); setIsFinalizeOpen(true); }}><FilePlus className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Upload Evidence & Finalize</TooltipContent></Tooltip>}
                                                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => { setSelectedMrrForStatus(mrr); setIsStatusModalOpen(true); }}><Info className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Approval Flow</TooltipContent></Tooltip>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/procurement/local-purchase/mrrs/${mrr.id}`}><Eye className="h-4 w-4"/></Link></Button>
                                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(mrr.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">No reports found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <FinalizeMrrDialog 
                mrr={selectedMrrForFinal} 
                isOpen={isFinalizeOpen} 
                onOpenChange={setIsFinalizeOpen} 
                onFinalize={handleFinalize} 
                employees={employees || []} 
                demandNotes={demandNotes || []}
            />
            
            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>MRR Approval Flow: {selectedMrrForStatus?.mrrNumber}</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <ul className="space-y-4">
                            {selectedMrrForStatus?.approvalFlow?.steps.map((step, index) => {
                                const historyEntry = selectedMrrForStatus.approvalHistory?.find((h:any) => h.level === index);
                                const approver = employees?.find(e => e.id === step.approverId);
                                const isPending = selectedMrrForStatus.currentApproverId === step.approverId && selectedMrrForStatus.approvalStatus > 2;
                                let status: 'approved' | 'pending' | 'upcoming' = historyEntry ? 'approved' : (isPending ? 'pending' : 'upcoming');
                                return (
                                    <li key={index} className="flex items-start gap-4">
                                        {status === 'approved' ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : (status === 'pending' ? <Hourglass className="h-6 w-6 text-orange-500 animate-spin" /> : <MoreHorizontal className="h-6 w-6 text-muted-foreground" />)}
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

            <MRRUserGuide isOpen={isGuideOpen} onOpenChange={setIsGuideOpen} />
        </TooltipProvider>
    );
}
