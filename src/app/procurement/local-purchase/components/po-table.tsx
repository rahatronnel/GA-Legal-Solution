"use client";

import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useProcurement } from './procurement-provider';
import type { PurchaseOrder } from './po-entry-form';

export function PurchaseOrderTable() {
    const { purchaseOrders, vendors, demandNotes, employees, isLoading } = useProcurement();
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
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleString();
        } catch {
            return 'N/A';
        }
    }

    if (isLoading) return <p>Loading Purchase Orders...</p>;

    return (
        <div className="space-y-4">
            {/* Search/Filter UI will go here */}
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
                        {purchaseOrders && purchaseOrders.length > 0 ? (
                            purchaseOrders.map((po: PurchaseOrder) => (
                                <TableRow key={po.id}>
                                    <TableCell>{po.poNumber}</TableCell>
                                    <TableCell>{formatDateTime(po.createdAt)}</TableCell>
                                    <TableCell>{getDemandNoteNumber(po.demandNoteId)}</TableCell>
                                    <TableCell>{getVendorName(po.vendorId)}</TableCell>
                                    <TableCell>{getGPConcernName(po)}</TableCell>
                                    <TableCell>{formatCurrency(po.netPayableAmount)}</TableCell>
                                    <TableCell>{po.status}</TableCell>
                                    <TableCell className="text-right">
                                        {/* Actions buttons will go here */}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={8} className="h-24 text-center">No Purchase Orders found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
