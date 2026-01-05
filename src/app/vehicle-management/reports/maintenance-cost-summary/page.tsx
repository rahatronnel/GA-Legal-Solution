
"use client";

import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { DollarSign, Wrench, Package } from 'lucide-react';
import type { MaintenanceRecord } from '../../components/maintenance-entry-form';
import { isWithinInterval, parseISO } from 'date-fns';

export default function MaintenanceCostSummaryPage() {
    const [records] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [filteredSummary, setFilteredSummary] = useState<any>(null);

    const handleGenerateReport = () => {
        let filteredRecords = records;

        if (dateRange?.from && dateRange?.to) {
            filteredRecords = records.filter(rec => {
                const serviceDate = parseISO(rec.serviceDate);
                return isWithinInterval(serviceDate, { start: dateRange.from!, end: dateRange.to! });
            });
        }
        
        let totalPartsCost = 0;
        let totalExpensesCost = 0;

        filteredRecords.forEach(rec => {
            totalPartsCost += rec.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
            totalExpensesCost += rec.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
        });
        
        const totalMaintenanceCost = totalPartsCost + totalExpensesCost;

        setFilteredSummary({
            totalRecords: filteredRecords.length,
            totalMaintenanceCost,
            totalPartsCost,
            totalExpensesCost,
        });
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Maintenance Cost Summary</CardTitle>
                    <CardDescription>Filter costs by date range to see an aggregated summary.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    <Button onClick={handleGenerateReport}>Generate Report</Button>
                </CardContent>
            </Card>
            
            {filteredSummary && (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Maintenance Jobs</CardTitle><Wrench className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{filteredSummary.totalRecords}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Maintenance Cost</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{formatCurrency(filteredSummary.totalMaintenanceCost)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Parts Cost</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{formatCurrency(filteredSummary.totalPartsCost)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Additional Expenses</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{formatCurrency(filteredSummary.totalExpensesCost)}</div></CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
