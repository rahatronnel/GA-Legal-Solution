
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
    ShieldCheck, Box, Tag, ChevronsUpDown, Hourglass, MoreHorizontal, Printer
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
import { Checkbox } from '@/components/ui/checkbox';

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
                            The Material Receiving Report (MRR) serves as the official organizational record for the physical receipt of goods. It acts as the "Entry Audit" before items are accepted into inventory.
                        </p>
                    </section>
                    <Separator />
                    <section className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-primary"><Tag className="h-4 w-4"/> Information Flow</h4>
                        <p className="text-sm text-muted-foreground">
                            MRRs are generated from <Badge variant="outline">Purchase Orders</Badge> that have been officially sent to vendors. The system automatically pulls item quantities, unit prices, and department data.
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
            <DialogContent className="sm:max-w-2xl">
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
                            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between">{selectedEmployee ? selectedEmployee.fullName : "Select verifyer..."}<ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" /></Button></PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search..." />
                                    <CommandList>
                                        <CommandEmpty>No one found.</CommandEmpty>
                                        <CommandGroup>
                                            {employees.map((emp) => (
                                                <CommandItem key={emp.id} onSelect={() => { setConfirmantId(emp.id); setOpenSearch(false); }}>
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
                                <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => handleBulkApproval(1)}><Check className="mr-2 h-4 w-4" /> Approve ({selectedRows.length})</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}><X className="mr-2 h-4 w-4" /> Reject</Button>
                            </div>
                        )}
                    </div>
                    <Button variant="outline" className="text-primary border-primary hover:bg-primary/5" onClick={() => setIsGuideOpen(true)}><HelpCircle className="mr-2 h-4 w-4" /> User Guide</Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[50px]"><Checkbox checked={approvableItems.length > 0 && selectedRows.length === approvableItems.length} onCheckedChange={(c) => setSelectedRows(c ? approvableItems.map(i => i.id) : [])} /></TableHead>
                                <TableHead>MRR Details</TableHead>
                                <TableHead>GP Concern</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
                            ) : filteredMrrs.length > 0 ? (
                                filteredMrrs.map(mrr => {
                                    const isWaitingForFinalize = mrr.approvalStatus === 2 && (isSuperAdmin || mrr.createdBy === currentUserEmployee?.id);
                                    const isWaitingForApproval = mrr.currentApproverId === currentUserEmployee?.id && mrr.approvalStatus > 2;
                                    const isApprovable = approvableItems.some(i => i.id === mrr.id);
                                    const isFinalApproved = mrr.approvalStatus === 1;

                                    return (
                                        <TableRow key={mrr.id} className={cn(isWaitingForFinalize || isWaitingForApproval ? 'bg-orange-500/5' : '')}>
                                            <TableCell><Checkbox checked={selectedRows.includes(mrr.id)} onCheckedChange={() => setSelectedRows(p => p.includes(mrr.id) ? p.filter(r => r !== mrr.id) : [...p, mrr.id])} disabled={!isApprovable} /></TableCell>
                                            <TableCell><div className="flex flex-col"><span className="font-bold">{mrr.mrrNumber}</span><span className="text-[10px] text-muted-foreground">PO: {mrr.poId}</span></div></TableCell>
                                            <TableCell><span className="text-xs">{employees?.find(e => e.id === mrr.createdBy)?.fullName}</span></TableCell>
                                            <TableCell><span className="text-xs">{mrr.supplierName}</span></TableCell>
                                            <TableCell>
                                                <Badge variant={mrr.approvalStatus === 1 ? 'default' : 'secondary'}>{getMRRStatusText(mrr)}</Badge>
                                                {isWaitingForFinalize && <Badge className="ml-2 bg-orange-500 text-white animate-pulse">Finalize Required</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {isWaitingForFinalize && <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => { setSelectedMrrForFinal(mrr); setIsFinalizeOpen(true); }}><FilePlus className="h-4 w-4" /></Button>}
                                                    {isFinalApproved && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => window.open(`/procurement/local-purchase/mrrs/${mrr.id}/print`, '_blank')}>
                                                                    <Printer className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Print Official MRR</TooltipContent>
                                                        </Tooltip>
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>MRR Approval Flow</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedMrrForStatus?.approvalFlow?.steps.map((step, index) => {
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
