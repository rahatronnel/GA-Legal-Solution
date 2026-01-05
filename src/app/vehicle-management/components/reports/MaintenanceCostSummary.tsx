
"use client";

import React from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Wrench, Package } from 'lucide-react';
import type { MaintenanceRecord } from '../../components/maintenance-entry-form';

export function MaintenanceCostSummary() {
    const [records] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);

    const summary = React.useMemo(() => {
        let totalPartsCost = 0;
        let totalExpensesCost = 0;

        records.forEach(rec => {
            totalPartsCost += rec.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
            totalExpensesCost += rec.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
        });
        
        const totalMaintenanceCost = totalPartsCost + totalExpensesCost;

        return {
            totalRecords: records.length,
            totalMaintenanceCost,
            totalPartsCost,
            totalExpensesCost,
        };
    }, [records]);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Maintenance Jobs</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.totalRecords}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Maintenance Cost</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalMaintenanceCost)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Parts Cost</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalPartsCost)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Additional Expenses</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalExpensesCost)}</div>
                </CardContent>
            </Card>
        </div>
    );
}
