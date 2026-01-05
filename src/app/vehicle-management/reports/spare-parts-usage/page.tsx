
"use client";

import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';

import type { MaintenanceRecord } from '../../components/maintenance-entry-form';

export default function SparePartsUsagePage() {
    const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [reportData, setReportData] = useState<any[] | null>(null);

    const handleGenerateReport = () => {
        let filteredRecords = maintenanceRecords;
        if (dateRange?.from && dateRange?.to) {
            filteredRecords = maintenanceRecords.filter(rec => {
                 const serviceDate = parseISO(rec.serviceDate);
                 return isWithinInterval(serviceDate, { start: dateRange.from!, end: dateRange.to! });
            });
        }
        
        const usage: { [key: string]: { name: string; brand: string; quantity: number; totalCost: number } } = {};

        filteredRecords.forEach(rec => {
            rec.parts?.forEach(part => {
                const key = `${part.name}-${part.brand}`;
                if (!usage[key]) {
                    usage[key] = { name: part.name, brand: part.brand, quantity: 0, totalCost: 0 };
                }
                usage[key].quantity += part.quantity;
                usage[key].totalCost += part.quantity * part.price;
            });
        });

        const data = Object.values(usage).sort((a, b) => b.quantity - a.quantity);
        setReportData(data);
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Spare Parts Usage Report</CardTitle>
                    <CardDescription>An aggregated report on spare parts used in maintenance jobs within a date range.</CardDescription>
                </CardHeader>
                 <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    <Button onClick={handleGenerateReport}>Generate Report</Button>
                </CardContent>
            </Card>

            {reportData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Report Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {reportData.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>Part Name</TableHead><TableHead>Brand</TableHead><TableHead>Total Quantity Used</TableHead><TableHead>Total Cost</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {reportData.map(part => (
                                        <TableRow key={`${part.name}-${part.brand}`}><TableCell>{part.name}</TableCell><TableCell>{part.brand}</TableCell><TableCell>{part.quantity}</TableCell><TableCell>{formatCurrency(part.totalCost)}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground">No spare parts usage data found for the selected criteria.</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
