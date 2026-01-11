
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useBillData } from '../components/bill-flow-provider';
import { differenceInDays, parseISO } from 'date-fns';
import { getBillStatusText } from '../lib/status-helper';

function VendorBillSummary() {
    const { bills, vendors, isLoading } = useBillData();

    const summary = React.useMemo(() => {
        if (isLoading || !bills || !vendors) return [];
        const vendorMap: { [key: string]: { name: string; count: number; amount: number } } = {};
        
        vendors.forEach(v => {
            vendorMap[v.id] = { name: v.vendorName, count: 0, amount: 0 };
        });

        bills.forEach(bill => {
            if (vendorMap[bill.vendorId]) {
                vendorMap[bill.vendorId].count++;
                vendorMap[bill.vendorId].amount += bill.totalPayableAmount;
            }
        });

        return Object.values(vendorMap).filter(v => v.count > 0).sort((a,b) => b.amount - a.amount);
    }, [bills, vendors, isLoading]);

    if (isLoading) return <p>Loading vendor summary...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Vendor-wise Bill Summary</CardTitle>
                <CardDescription>Total bills and amounts for each vendor.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Total Bills</TableHead><TableHead className="text-right">Total Amount</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {summary.map(v => (
                            <TableRow key={v.name}>
                                <TableCell>{v.name}</TableCell>
                                <TableCell>{v.count}</TableCell>
                                <TableCell className="text-right">{v.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function BillStatusReport() {
    const { bills, isLoading } = useBillData();

    const summary = React.useMemo(() => {
        if (isLoading || !bills) return { approved: 0, pending: 0, rejected: 0 };
        return bills.reduce((acc, bill) => {
            if (bill.approvalStatus === 1) acc.approved++;
            else if (bill.approvalStatus === 0) acc.rejected++;
            else acc.pending++;
            return acc;
        }, { approved: 0, pending: 0, rejected: 0 });
    }, [bills, isLoading]);

    if (isLoading) return <p>Loading status report...</p>;
    
    return (
         <Card>
            <CardHeader><CardTitle>Bill Status Overview</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-bold">{summary.pending}</p><p className="text-sm text-muted-foreground">Pending</p></div>
                <div><p className="text-2xl font-bold">{summary.approved}</p><p className="text-sm text-muted-foreground">Approved</p></div>
                <div><p className="text-2xl font-bold">{summary.rejected}</p><p className="text-sm text-muted-foreground">Rejected</p></div>
            </CardContent>
        </Card>
    );
}

function BillAgingReport() {
    const { bills, isLoading } = useBillData();

    const agingBuckets = React.useMemo(() => {
        if (isLoading || !bills) return { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        const today = new Date();
        const pendingBills = bills.filter(b => b.approvalStatus !== 1 && b.approvalStatus !== 0);

        return pendingBills.reduce((acc, bill) => {
            const daysPending = differenceInDays(today, parseISO(bill.billDate));
            if (daysPending <= 30) acc['0-30']++;
            else if (daysPending <= 60) acc['31-60']++;
            else if (daysPending <= 90) acc['61-90']++;
            else acc['90+']++;
            return acc;
        }, { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 });
    }, [bills, isLoading]);

    if (isLoading) return <p>Loading aging report...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bill Aging Report (Pending)</CardTitle>
                <CardDescription>Number of pending bills by age.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-4 text-center">
                <div><p className="text-2xl font-bold">{agingBuckets['0-30']}</p><p className="text-sm text-muted-foreground">0-30 Days</p></div>
                <div><p className="text-2xl font-bold">{agingBuckets['31-60']}</p><p className="text-sm text-muted-foreground">31-60 Days</p></div>
                <div><p className="text-2xl font-bold">{agingBuckets['61-90']}</p><p className="text-sm text-muted-foreground">61-90 Days</p></div>
                <div><p className="text-2xl font-bold">{agingBuckets['90+']}</p><p className="text-sm text-muted-foreground">90+ Days</p></div>
            </CardContent>
        </Card>
    );
}

function PaymentAdvisoryReport() {
    const { bills, vendors, isLoading } = useBillData();

    const readyForPayment = React.useMemo(() => {
        if (isLoading || !bills || !vendors) return [];
        return bills.filter(b => b.approvalStatus === 1);
    }, [bills, isLoading, vendors]);
    
    const getVendorName = (vendorId: string) => vendors?.find(v => v.id === vendorId)?.vendorName || 'N/A';

    if (isLoading) return <p>Loading payment advisory...</p>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment Advisory</CardTitle>
                <CardDescription>Bills fully approved and ready for payment.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Bill Ref No.</TableHead><TableHead>Vendor</TableHead><TableHead>Bill Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {readyForPayment.length > 0 ? readyForPayment.map(bill => (
                            <TableRow key={bill.id}>
                                <TableCell>{bill.billReferenceNumber}</TableCell>
                                <TableCell>{getVendorName(bill.vendorId)}</TableCell>
                                <TableCell>{bill.billDate}</TableCell>
                                <TableCell className="text-right">{bill.totalPayableAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                            </TableRow>
                        )) : <TableRow><TableCell colSpan={4} className="text-center">No bills are ready for payment.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export default function BillFlowReportsPage() {
    return (
        <div className="space-y-6">
            <VendorBillSummary />
            <BillStatusReport />
            <BillAgingReport />
            <PaymentAdvisoryReport />
        </div>
    );
}
