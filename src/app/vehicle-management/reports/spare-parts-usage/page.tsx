
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
import type { Part as PartType } from '../../components/part-table';

export default function SparePartsUsagePage() {
    const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [allParts] = useLocalStorage<PartType[]>('parts', []);
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [reportData, setReportData] = useState<any[] | null>(null);
    
    const getPartName = (partId: string) => allParts.find(p => p.id === partId)?.name || 'Unknown Part';

    const handleGenerateReport = () => {
        let filteredRecords = maintenanceRecords;
        if (dateRange?.from && dateRange?.to) {
            filteredRecords = maintenanceRecords.filter(rec => {
                 if (!rec.serviceDate) return false;
                 const serviceDate = parseISO(rec.serviceDate);
                 return isWithinInterval(serviceDate, { start: dateRange.from!, end: dateRange.to! });
            });
        }
        
        const usage: { [key: string]: { name: string; brand: string; quantity: number; totalCost: number } } = {};

        filteredRecords.forEach(rec => {
            if (!rec.parts) return;
            rec.parts.forEach(part => {
                const key = `${part.partId}-${part.brand}`;
                if (!usage[key]) {
                    usage[key] = { name: getPartName(part.partId), brand: part.brand, quantity: 0, totalCost: 0 };
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

    React.useEffect(() => {
        handleGenerateReport();
    }, [maintenanceRecords, allParts]);

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
                                <TableHeader><TableRow><TableHead>Part Name</TableHead><TableHead>Brand</TableHead><TableHead>Total Quantity Used</TableHead><TableHead className="text-right">Total Cost</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {reportData.map(part => (
                                        <TableRow key={`${part.name}-${part.brand}`}><TableCell>{part.name}</TableCell><TableCell>{part.brand}</TableCell><TableCell>{part.quantity}</TableCell><TableCell className="text-right">{formatCurrency(part.totalCost)}</TableCell></TableRow>
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
