
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
import { Search, Eye, Trash2, Copy, FileText, PackageCheck, Calendar, Truck, CheckCircle2, AlertCircle, User, Hash, Clock, FilePlus, UserCheck, Upload, X, Check } from 'lucide-react';
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

/**
 * Dialog for GP Concern to finalize the MRR by uploading documents and selecting confirmant.
 */
const FinalizeMrrDialog = ({
    mrr,
    isOpen,
    onOpenChange,
    onFinalize,
    employees
}: {
    mrr: MRR | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onFinalize: (docData: { bill: UploadedFile[], challan: UploadedFile[], confirmantId: string }) => void;
    employees: any[];
}) => {
    const { toast } = useToast();
    const [billDocs, setBillDocs] = useState<UploadedFile[]>([]);
    const [challanDocs, setChallanDocs] = useState<UploadedFile[]>([]);
    const [confirmantId, setConfirmantId] = useState('');

    useEffect(() => {
        if (isOpen) {
            setBillDocs([]);
            setChallanDocs([]);
            setConfirmantId('');
        }
    }, [isOpen]);

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
                            <Label className="flex justify-between">Bill / Invoice <Label htmlFor="up-bill" className="text-primary hover:underline cursor-pointer flex items-center gap-1"><Upload className="h-3 w-3"/>Add</Label></Label>
                            <input id="up-bill" type="file" multiple className="hidden" onChange={handleFileChange('bill')} />
                            <div className="space-y-1 mt-2">
                                {billDocs.map(f => (
                                    <div key={f.id} className="flex items-center justify-between text-xs p-1.5 bg-muted rounded"><span className="truncate">{f.name}</span><Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFile('bill', f.id)}><X className="h-3 w-3"/></Button></div>
                                ))}
                                {billDocs.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2 border-2 border-dashed rounded">Required</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex justify-between">Challan <Label htmlFor="up-challan" className="text-primary hover:underline cursor-pointer flex items-center gap-1"><Upload className="h-3 w-3"/>Add</Label></Label>
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
                        <Label>Select Receiver Confirmant</Label>
                        <Select value={confirmantId} onValueChange={setConfirmantId}>
                            <SelectTrigger><SelectValue placeholder="Choose user who confirms receipt..." /></SelectTrigger>
                            <SelectContent>
                                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName} ({e.userIdCode})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700"><Check className="mr-2 h-4 w-4"/> Finalize & Start Approval</Button>
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

        // Build 4-Stage Approval Flow
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
            approvalStatus: 3, // Start stage 1
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
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search MRR#, Supplier, DN#..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
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

            <FinalizeMrrDialog mrr={selectedMrrForFinal} isOpen={isFinalizeOpen} onOpenChange={setIsFinalizeOpen} onFinalize={handleFinalize} employees={employees || []} />
        </TooltipProvider>
    );
}
