
"use client";

import React, { useMemo, useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useProcurement } from './procurement-provider';
import type { PurchaseOrder } from './po-entry-form';
import { useUser, useFirestore, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, XCircle, FilePlus, Eye, Printer, Check, Copy } from 'lucide-react';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PurchaseOrderForm } from './po-entry-form';
import { useToast } from '@/hooks/use-toast';
import { collection } from 'firebase/firestore';
import { usePrint } from '@/app/vehicle-management/components/print-provider';

export function PurchaseOrderTable() {
    const { purchaseOrders, vendors, demandNotes, employees, comparativeStatements, isLoading, orgSettings } = useProcurement();
    const { user } = useUser();
    const { toast } = useToast();
    const { handlePrint } = usePrint();
    const firestore = useFirestore();
    const poCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]);

    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('all');
    const [concernFilter, setConcernFilter] = useState('all');
    
    const [isPrepareDialogOpen, setIsPrepareDialogOpen] = useState(false);
    const [isPoFormOpen, setIsPoFormOpen] = useState(false);
    const [selectedCsForPo, setSelectedCsForPo] = useState<any>(null);

    const currentUserEmployee = useMemo(() => {
        if (!user || !employees) return null;
        return employees.find(e => e.email === user.email);
    }, [user, employees]);

    const { isSuperAdmin, isGPOfficer, isGPConcern } = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        const superAdmin = user?.email === 'superadmin@galsolution.com';
        if (!settings || !currentUserEmployee) return { isSuperAdmin: superAdmin, isGPOfficer: false, isGPConcern: false };

        const GPO = settings.generalPurchaseOfficerId === currentUserEmployee.id;
        const GPC = !!settings.gpConcernOfficerIds?.includes(currentUserEmployee.id);

        return { isSuperAdmin: superAdmin, isGPOfficer: GPO, isGPConcern: GPC };
    }, [orgSettings, currentUserEmployee, user]);

    const userRoleText = useMemo(() => {
        if (isSuperAdmin) return "Role: Superadmin";
        if (isGPOfficer) return "Role: GP Officer";
        if (isGPConcern) return "Role: GP Concern Officer";
        return "Role: Viewer";
    }, [isSuperAdmin, isGPOfficer, isGPConcern]);
    
    const gpConcernOfficers = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        if (!settings || !employees) return [];
        return (settings.gpConcernOfficerIds || [])
            .map(id => employees.find(e => e.id === id))
            .filter(Boolean) as Employee[];
    }, [orgSettings, employees]);

    const approvedCsWaitingPo = useMemo(() => {
        if (!comparativeStatements || !purchaseOrders) return [];
        return comparativeStatements.filter(cs => {
            if (cs.approvalStatus !== 1) return false;
            const alreadyHasPo = purchaseOrders.some(po => po.csId === cs.id);
            if (alreadyHasPo) return false;

            if (isSuperAdmin || isGPOfficer) return true;
            const dn = demandNotes.find(d => d.id === cs.demandNoteId);
            return dn?.gpConcernOfficerId === currentUserEmployee?.id;
        });
    }, [comparativeStatements, purchaseOrders, isSuperAdmin, isGPOfficer, demandNotes, currentUserEmployee]);

    const getVendorName = (vendorId: string) => vendors?.find((v:any) => v.id === vendorId)?.vendorName || 'N/A';
    const getDemandNoteNumber = (dnId: string) => demandNotes?.find(dn => dn.id === dnId)?.demandNoteNumber || 'N/A';
    const getGPConcernName = (dnId: string) => {
        const dn = demandNotes?.find(d => d.id === dnId);
        if (!dn?.gpConcernOfficerId) return 'N/A';
        return employees?.find(e => e.id === dn.gpConcernOfficerId)?.fullName || 'N/A';
    };

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number') return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return { date: 'N/A', time: 'N/A' };
        try {
            const d = new Date(isoString);
            return {
                date: d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
                time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        } catch { return { date: 'N/A', time: 'N/A' }; }
    }
    
    const safePOs = useMemo(() => Array.isArray(purchaseOrders) ? purchaseOrders : [], [purchaseOrders]);

    const filteredPOs = useMemo(() => {
        return safePOs.filter(po => {
            const lowerTerm = searchTerm.toLowerCase();
            const demandNote = demandNotes?.find(dn => dn.id === po.demandNoteId);
            const cs = comparativeStatements?.find(cs => cs.id === po.csId);
            
            const searchTermMatch = !searchTerm ||
                po.poNumber.toLowerCase().includes(lowerTerm) ||
                (demandNote && demandNote.demandNoteNumber.toLowerCase().includes(lowerTerm)) ||
                (cs && cs.csNumber.toLowerCase().includes(lowerTerm));

            const vendorMatch = vendorFilter === 'all' || po.vendorId === vendorFilter;
            const concernMatch = concernFilter === 'all' || (demandNote && demandNote.gpConcernOfficerId === concernFilter);

            return searchTermMatch && vendorMatch && concernMatch;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [safePOs, searchTerm, vendorFilter, concernFilter, demandNotes, comparativeStatements]);
    
    const handlePreparePo = (cs: any) => {
        setSelectedCsForPo(cs);
        setIsPrepareDialogOpen(false);
        setIsPoFormOpen(true);
    };

    const handleSavePO = (poData: Partial<PurchaseOrder>) => {
        if (!poCollectionRef) return;
        addDocumentNonBlocking(poCollectionRef, poData);
        toast({ title: 'Success', description: `Purchase Order ${poData.poNumber} has been created.` });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setVendorFilter('all');
        setConcernFilter('all');
    }

    if (isLoading) return <div className="p-8 text-center"><p>Loading Purchase Orders...</p></div>;

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search PO, DN, CS Number..."
                                className="w-full rounded-lg bg-background pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={vendorFilter} onValueChange={setVendorFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Vendors" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Vendors</SelectItem>{(vendors || []).map(v => <SelectItem key={v.id} value={v.id}>{v.vendorName}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={concernFilter} onValueChange={setConcernFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All GP Concerns" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All GP Concerns</SelectItem>{gpConcernOfficers.map(officer => (<SelectItem key={officer.id} value={officer.id}>{officer.fullName}</SelectItem>))}</SelectContent>
                        </Select>
                        <Button variant="ghost" onClick={clearFilters}><XCircle className="mr-2 h-4 w-4" /> Clear</Button>
                    </div>
                    <div className="flex justify-end items-center gap-2">
                        <Badge variant="outline" className="mr-2">{userRoleText}</Badge>
                        {(isSuperAdmin || isGPOfficer || isGPConcern) && (
                            <Button onClick={() => setIsPrepareDialogOpen(true)} className="bg-primary">
                                <FilePlus className="mr-2 h-4 w-4" /> Prepare New PO
                            </Button>
                        )}
                    </div>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO Number</TableHead>
                                <TableHead>PO Date</TableHead>
                                <TableHead>Demand Note #</TableHead>
                                <TableHead>Awarded Vendor</TableHead>
                                <TableHead>GP Concern</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPOs && filteredPOs.length > 0 ? (
                                filteredPOs.map((po: PurchaseOrder) => {
                                    const {date, time} = formatDateTime(po.createdAt);
                                    return (
                                    <TableRow key={po.id}>
                                        <TableCell className="font-medium">{po.poNumber}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>{date}</span>
                                                <span className="text-xs text-muted-foreground">{time}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/procurement/local-purchase/demand-notes/${po.demandNoteId}`} className="text-primary hover:underline">{getDemandNoteNumber(po.demandNoteId)}</Link>
                                        </TableCell>
                                        <TableCell>{getVendorName(po.vendorId)}</TableCell>
                                        <TableCell>{getGPConcernName(po.demandNoteId)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(po.netPayableAmount)}</TableCell>
                                        <TableCell><Badge variant="outline">{po.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>View PO</TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(po, 'purchase-order')}><Printer className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Print PO</TooltipContent></Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )})
                            ) : (
                                <TableRow><TableCell colSpan={8} className="h-24 text-center">No Purchase Orders found. Click "Prepare New PO" to start.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Dialog to select approved CS */}
                <Dialog open={isPrepareDialogOpen} onOpenChange={setIsPrepareDialogOpen}>
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Prepare Purchase Order</DialogTitle>
                            <DialogDescription>Select a fully approved Comparative Statement to generate a formal Purchase Order.</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh] mt-4 border rounded-md">
                            <Table>
                                <TableHeader><TableRow><TableHead>CS Number</TableHead><TableHead>Demand Note</TableHead><TableHead>Vendor</TableHead><TableHead className="text-right">Select</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {approvedCsWaitingPo.length > 0 ? approvedCsWaitingPo.map(cs => (
                                        <TableRow key={cs.id}>
                                            <TableCell className="font-semibold">{cs.csNumber}</TableCell>
                                            <TableCell>{getDemandNoteNumber(cs.demandNoteId)}</TableCell>
                                            <TableCell>{getVendorName(cs.selectedVendorId)}</TableCell>
                                            <TableCell className="text-right"><Button size="sm" onClick={() => handlePreparePo(cs)}>Select</Button></TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No approved Comparative Statements are currently awaiting a PO.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        <DialogFooter><Button variant="outline" onClick={() => setIsPrepareDialogOpen(false)}>Close</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                <PurchaseOrderForm 
                    isOpen={isPoFormOpen}
                    setIsOpen={setIsPoFormOpen}
                    onSave={handleSavePO}
                    cs={selectedCsForPo}
                />
            </div>
        </TooltipProvider>
    );
}
