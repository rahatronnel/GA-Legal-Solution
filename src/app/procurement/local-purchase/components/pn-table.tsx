
"use client";

import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Eye, Printer, Trash2, Check, X, Info, Copy, Wallet, Clock, Hourglass, CheckCircle, MoreHorizontal } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { getPNStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function PaymentNoteTable() {
    const { paymentNotes, mrrs, employees, isLoading, orgSettings } = useProcurement();
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const pnColRef = useMemoFirebase(() => firestore ? collection(firestore, 'paymentNotes') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedPnForStatus, setSelectedPnForStatus] = useState<any>(null);

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

    const filteredPNs = useMemo(() => {
        const safeItems = Array.isArray(paymentNotes) ? paymentNotes : [];
        return safeItems.filter(pn => {
            const mrr = mrrs.find(m => m.id === pn.mrrId);
            const lowerTerm = searchTerm.toLowerCase();
            const termMatch = !searchTerm || pn.pnNumber.toLowerCase().includes(lowerTerm) || mrr?.mrrNumber.toLowerCase().includes(lowerTerm) || mrr?.supplierName.toLowerCase().includes(lowerTerm);
            
            // Access Logic: Admin, GPO, and Managers see everything. Concerns see their own.
            let isVisible = isSuperAdmin || roleData.isGPOfficer || roleData.isManager;
            
            if (!isVisible && currentUserEmployee) {
                if (pn.createdBy === currentUserEmployee.id || pn.currentApproverId === currentUserEmployee.id || pn.approvalHistory?.some((h:any) => h.approverId === currentUserEmployee.id)) {
                    isVisible = true;
                }
            }

            return termMatch && isVisible;
        }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [paymentNotes, mrrs, searchTerm, isSuperAdmin, roleData, currentUserEmployee]);

    const handleApproval = (pnId: string, status: number) => {
        if (!firestore || !currentUserEmployee || !pnColRef) return;
        const pn = paymentNotes.find(p => p.id === pnId);
        if (!pn) return;

        const newHistoryEntry = { 
            approverId: currentUserEmployee.id, 
            status: status === 1 ? 'Approved' : 'Rejected', 
            timestamp: new Date().toISOString(), 
            level: pn.approvalHistory?.length || 0, 
            remarks: 'Direct action' 
        };

        setDocumentNonBlocking(doc(pnColRef, pnId), {
            approvalStatus: status,
            currentApproverId: '',
            approvalHistory: [...(pn.approvalHistory || []), newHistoryEntry]
        }, { merge: true });
        
        toast({ title: status === 1 ? 'Approved' : 'Rejected' });
    };

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search PN#, MRR#, Supplier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
                    </div>
                </div>

                <div className="border rounded-lg overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-bold">PN Number</TableHead>
                                <TableHead className="font-bold">MRR Reference</TableHead>
                                <TableHead className="font-bold">Supplier</TableHead>
                                <TableHead className="font-bold">Type / Mode</TableHead>
                                <TableHead className="font-bold text-right">Amount (BDT)</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="w-[140px] text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-10">Loading notes...</TableCell></TableRow>
                            ) : filteredPNs.length > 0 ? (
                                filteredPNs.map(pn => {
                                    const mrr = mrrs.find(m => m.id === pn.mrrId);
                                    const isWaitingForApproval = currentUserEmployee && pn.currentApproverId === currentUserEmployee.id && pn.approvalStatus !== 1 && pn.approvalStatus !== 0;

                                    return (
                                        <TableRow key={pn.id} className={cn("hover:bg-muted/30 transition-colors", isWaitingForApproval && 'bg-orange-500/5')}>
                                            <TableCell className="font-bold text-xs">{pn.pnNumber}</TableCell>
                                            <TableCell className="text-xs">{mrr?.mrrNumber}</TableCell>
                                            <TableCell className="text-xs font-semibold">{mrr?.supplierName}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline" className="text-[9px] h-4">{pn.paymentType}</Badge>
                                                    <Badge variant="outline" className="text-[9px] h-4 bg-blue-50/50">{pn.paymentMode}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-primary">{pn.amount?.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge variant={pn.approvalStatus === 1 ? 'default' : 'secondary'} className="text-[9px] h-4">{getPNStatusText(pn)}</Badge>
                                                    {isWaitingForApproval && <Badge className="bg-orange-500 text-white animate-pulse text-[9px] h-4">⚠️ Purchase Mgr Audit</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {isWaitingForApproval && (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleApproval(pn.id, 1)}><Check className="h-4 w-4"/></Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleApproval(pn.id, 0)}><X className="h-4 w-4"/></Button>
                                                        </>
                                                    )}
                                                    {pn.approvalStatus === 1 && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => window.open(`/procurement/local-purchase/payment-notes/${pn.id}/print`, '_blank')}>
                                                                    <Printer className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Print Payment Note</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedPnForStatus(pn); setIsStatusModalOpen(true); }}><Info className="h-4 w-4 text-blue-500"/></Button>
                                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => pnColRef && deleteDocumentNonBlocking(doc(pnColRef, pn.id))}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">No Payment Notes found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-md animate-dialog-in">
                    <DialogHeader><DialogTitle>PN Approval Status</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <li className="flex items-center gap-4 list-none">
                            {selectedPnForStatus?.approvalStatus === 1 ? <CheckCircle className="h-6 w-6 text-green-500" /> : (selectedPnForStatus?.approvalStatus === 0 ? <X className="h-6 w-6 text-destructive" /> : <Hourglass className="h-6 w-6 text-orange-500 animate-spin" />)}
                            <div className="flex-1">
                                <p className="font-bold text-sm">Purchase Manager Signature</p>
                                <p className="text-xs text-muted-foreground">{employees.find(e => e.id === selectedPnForStatus?.currentApproverId || e.id === selectedPnForStatus?.approvalHistory?.[0]?.approverId)?.fullName || 'Awaiting Action'}</p>
                            </div>
                        </li>
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
