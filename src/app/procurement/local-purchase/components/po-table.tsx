
"use client";

import React, { useMemo, useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useProcurement } from './procurement-provider';
import type { PurchaseOrder } from './po-entry-form';
import { useUser } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, XCircle } from 'lucide-react';
import type { Employee } from '@/app/user-management/components/employee-entry-form';

export function PurchaseOrderTable() {
    const { purchaseOrders, vendors, demandNotes, employees, comparativeStatements, isLoading, orgSettings } = useProcurement();
    const { user } = useUser();

    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('all');
    const [concernFilter, setConcernFilter] = useState('all');
    
    const { isSuperAdmin, isGPOfficer, isManager, isGPConcern, isCsApprover } = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        const superAdmin = user?.email === 'superadmin@galsolution.com';
        if (!settings || !employees || employees.length === 0 || !user) {
          return { isSuperAdmin: superAdmin, isGPOfficer: false, isGPConcern: false, isManager: false, isCsApprover: false };
        }
        const currentUserEmployee = employees.find(e => e.email === user.email);
        if (!currentUserEmployee) {
          return { isSuperAdmin: superAdmin, isGPOfficer: false, isGPConcern: false, isManager: false, isCsApprover: false };
        }

        const GPO = settings.generalPurchaseOfficerId === currentUserEmployee.id;
        const GPC = !!settings.gpConcernOfficerIds?.includes(currentUserEmployee.id);
        const manager = 
            settings.managingDirectorId === currentUserEmployee.id ||
            settings.factoryDirectorId === currentUserEmployee.id ||
            settings.manufacturingDeptManagerId === currentUserEmployee.id ||
            settings.specializedDeptManagerId === currentUserEmployee.id;

        let csApproverCheck = false;
        // ... (rest of csApproverCheck logic if needed, or remove if not used here)

        return { isSuperAdmin: superAdmin, isGPOfficer: GPO, isGPConcern: GPC, isManager: manager, isCsApprover: csApproverCheck };
      }, [orgSettings, employees, user, isLoading]);

    const userRoleText = useMemo(() => {
        if (isSuperAdmin) return "Role: Superadmin";
        if (isGPOfficer) return "Role: GP Officer";
        if (isManager) return "Role: Manager";
        if (isGPConcern) return "Role: GP Concern Officer";
        if (isCsApprover) return "Role: CS Approver";
        return "Role: Employee";
    }, [isSuperAdmin, isGPOfficer, isGPConcern, isManager, isCsApprover]);
    
     const gpConcernOfficers = useMemo(() => {
        const settings = orgSettings?.procurementSettings;
        if (!settings || !employees) return [];
        return (settings.gpConcernOfficerIds || [])
            .map(id => employees.find(e => e.id === id))
            .filter(Boolean) as Employee[];
    }, [orgSettings, employees]);

    const getVendorName = (vendorId: string) => vendors?.find((v:any) => v.id === vendorId)?.vendorName || 'N/A';
    const getDemandNoteNumber = (dnId: string) => demandNotes?.find(dn => dn.id === dnId)?.demandNoteNumber || 'N/A';
    
    const getGPConcernName = (po: PurchaseOrder) => {
        const demandNote = demandNotes?.find(dn => dn.id === po.demandNoteId);
        if (!demandNote || !demandNote.gpConcernOfficerId) return 'N/A';
        const employee = employees?.find(emp => emp.id === demandNote.gpConcernOfficerId);
        return employee?.fullName || 'N/A';
    };

    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number') return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return { date: 'N/A', time: 'N/A' };
        try {
            const d = new Date(isoString);
            const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return { date, time };
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
        });
    }, [safePOs, searchTerm, vendorFilter, concernFilter, demandNotes, comparativeStatements]);
    
    const clearFilters = () => {
        setSearchTerm('');
        setVendorFilter('all');
        setConcernFilter('all');
    }

    if (isLoading) return <p>Loading Purchase Orders...</p>;

    return (
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
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Vendor..." /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Vendors</SelectItem>{(vendors || []).map(v => <SelectItem key={v.id} value={v.id}>{v.vendorName}</SelectItem>)}</SelectContent>
                    </Select>
                     <Select value={concernFilter} onValueChange={setConcernFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filter by GP Concern..." /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All GP Concerns</SelectItem>{gpConcernOfficers.map(officer => (<SelectItem key={officer.id} value={officer.id}>{officer.fullName}</SelectItem>))}</SelectContent>
                    </Select>
                    <Button variant="ghost" onClick={clearFilters}><XCircle className="mr-2 h-4 w-4" /> Clear</Button>
                </div>
                 <div className="flex justify-end items-center gap-2">
                    <Badge variant="outline">{userRoleText}</Badge>
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PO Number</TableHead>
                            <TableHead>PO Date</TableHead>
                            <TableHead>Demand Note #</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>GP Concern</TableHead>
                            <TableHead>Amount</TableHead>
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
                                    <TableCell>{po.poNumber}</TableCell>
                                    <TableCell><div className="flex flex-col"><span>{date}</span><span className="text-xs text-muted-foreground">{time}</span></div></TableCell>
                                    <TableCell>{getDemandNoteNumber(po.demandNoteId)}</TableCell>
                                    <TableCell>{getVendorName(po.vendorId)}</TableCell>
                                    <TableCell>{getGPConcernName(po)}</TableCell>
                                    <TableCell>{formatCurrency(po.netPayableAmount)}</TableCell>
                                    <TableCell><Badge>{po.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        {/* Actions buttons will go here */}
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow><TableCell colSpan={8} className="h-24 text-center">No Purchase Orders found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
