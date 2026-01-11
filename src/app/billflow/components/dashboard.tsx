
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useBillFlow } from './bill-flow-provider';
import { useUser } from '@/firebase';
import { Eye, FileText, Hourglass, CheckCircle, Users } from 'lucide-react';
import { getBillStatusText } from '../lib/status-helper';
import { format, isThisMonth } from 'date-fns';

const StatCard: React.FC<{ title: string, value: string | number, description?: string, icon: React.ElementType }> = ({ title, value, description, icon: Icon }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function BillFlowDashboard() {
    const billFlowData = useBillFlow();
    if (!billFlowData) return <p>Loading...</p>;
    const { data: { bills, vendors, employees }, isLoading } = billFlowData;
    const { user } = useUser();

    const currentUserEmployee = React.useMemo(() => {
        if (!user || !employees) return null;
        return employees.find(e => e.email === user.email);
    }, [user, employees]);

    const dashboardStats = React.useMemo(() => {
        const isSuperAdmin = user?.email === 'superadmin@galsolution.com';

        const allPendingBills = (bills || []).filter(b => b.approvalStatus !== 1 && b.approvalStatus !== 0);
        
        const myPendingBills = isSuperAdmin 
            ? allPendingBills 
            : (allPendingBills || []).filter(b => b.currentApproverId === currentUserEmployee?.id);
        
        const completedThisMonth = (bills || []).filter(b => 
            b.approvalStatus === 1 && 
            b.approvalHistory && 
            b.approvalHistory.length > 0 &&
            isThisMonth(new Date(b.approvalHistory[b.approvalHistory.length - 1].timestamp))
        );

        return {
            myPendingCount: myPendingBills.length,
            myPendingAmount: myPendingBills.reduce((acc, b) => acc + b.totalPayableAmount, 0),
            completedMonthCount: completedThisMonth.length,
            completedMonthAmount: completedThisMonth.reduce((acc, b) => acc + b.totalPayableAmount, 0),
            totalVendors: (vendors || []).length,
            myPendingBillsList: myPendingBills.slice(0, 5),
            recentBills: (bills || []).sort((a,b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()).slice(0, 5)
        };
    }, [bills, vendors, currentUserEmployee, user]);

    const getVendorName = (vendorId: string) => vendors.find(v => v.id === vendorId)?.vendorName || 'N/A';
    
    const getStatusVariant = (status: number) => {
        if (status === 1) return 'default';
        if (status === 0) return 'destructive';
        return 'secondary';
    }

    if (isLoading) {
        return <p>Loading dashboard data...</p>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard 
                    title="Bills Awaiting Your Approval" 
                    value={dashboardStats.myPendingCount} 
                    description={formatCurrency(dashboardStats.myPendingAmount)}
                    icon={Hourglass} 
                />
                <StatCard 
                    title="Completed This Month" 
                    value={dashboardStats.completedMonthCount} 
                    description={formatCurrency(dashboardStats.completedMonthAmount)}
                    icon={CheckCircle} 
                />
                <StatCard 
                    title="Total Vendors" 
                    value={dashboardStats.totalVendors} 
                    description="Registered suppliers"
                    icon={Users} 
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Bills Awaiting Your Approval</CardTitle></CardHeader>
                    <CardContent>
                         {dashboardStats.myPendingBillsList.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>Bill ID</TableHead><TableHead>Vendor</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">View</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {dashboardStats.myPendingBillsList.map(bill => (
                                        <TableRow key={bill.id}>
                                            <TableCell>{bill.billId}</TableCell>
                                            <TableCell>{getVendorName(bill.vendorId)}</TableCell>
                                            <TableCell>{formatCurrency(bill.totalPayableAmount)}</TableCell>
                                            <TableCell className="text-right"><Button variant="ghost" size="icon" asChild><Link href={`/billflow/bills/${bill.id}`}><Eye className="h-4 w-4"/></Link></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         ) : (
                            <p className="text-sm text-center text-muted-foreground py-4">You have no bills pending your approval.</p>
                         )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Recent Bills</CardTitle></CardHeader>
                    <CardContent>
                         {dashboardStats.recentBills.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>Bill ID</TableHead><TableHead>Vendor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">View</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {dashboardStats.recentBills.map(bill => (
                                        <TableRow key={bill.id}>
                                            <TableCell>{bill.billId}</TableCell>
                                            <TableCell>{getVendorName(bill.vendorId)}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(bill.approvalStatus)}>{getBillStatusText(bill)}</Badge></TableCell>
                                            <TableCell className="text-right"><Button variant="ghost" size="icon" asChild><Link href={`/billflow/bills/${bill.id}`}><Eye className="h-4 w-4"/></Link></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         ) : (
                            <p className="text-sm text-center text-muted-foreground py-4">No bills have been submitted yet.</p>
                         )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
