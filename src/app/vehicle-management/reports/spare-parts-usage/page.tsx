
"use client";

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';

import type { MaintenanceRecord } from '../../components/maintenance-entry-form';
import type { Part as PartType } from '../../components/part-table';
import { useVehicleManagement } from '../../components/vehicle-management-provider';

export default function SparePartsUsagePage() {
    const vm = useVehicleManagement();
    if (!vm) return null; // Build-safe guard
    const { data, isLoading } = vm;
    const { maintenanceRecords = [], parts: allParts = [] } = data;
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [reportData, setReportData] = useState<any[] | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    
    const getPartName = (partId: string) => (allParts.find((p: PartType) => p.id === partId) as PartType)?.name || 'Unknown Part';

    const handleGenerateReport = () => {
        let filteredRecords = maintenanceRecords;
        if (dateRange?.from && dateRange?.to) {
            filteredRecords = maintenanceRecords.filter((rec: MaintenanceRecord) => {
                 if (!rec.serviceDate) return false;
                 const serviceDate = parseISO(rec.serviceDate);
                 return isWithinInterval(serviceDate, { start: dateRange.from!, end: dateRange.to! });
            });
        }
        
        const usage: { [key: string]: { name: string; brand: string; quantity: number; totalCost: number } } = {};

        filteredRecords.forEach((rec: MaintenanceRecord) => {
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
        if (!isLoading) {
            handleGenerateReport();
        }
    }, [maintenanceRecords, allParts, isLoading]);

    if (!mounted || isLoading) {
        return <p>Loading report data...</p>;
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
