"use client";

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';

import type { MaintenanceRecord } from '../../components/maintenance-entry-form';
import type { ServiceCenter } from '../../components/service-center-table';

export default function WorkshopPerformancePage() {
    const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [serviceCenters] = useLocalStorage<ServiceCenter[]>('serviceCenters', []);
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [reportData, setReportData] = useState<any[] | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleGenerateReport = () => {
        let filteredRecords = maintenanceRecords;
        if (dateRange?.from && dateRange?.to) {
            filteredRecords = maintenanceRecords.filter(rec => {
                 if (!rec.serviceDate) return false;
                 const serviceDate = parseISO(rec.serviceDate);
                 return isWithinInterval(serviceDate, { start: dateRange.from!, end: dateRange.to! });
            });
        }
        
        const report: { [key: string]: { name: string; jobs: number; totalCost: number } } = {};

        serviceCenters.forEach(sc => {
            report[sc.id] = { name: sc.name, jobs: 0, totalCost: 0 };
        });

        filteredRecords.forEach(rec => {
            if (rec.serviceCenterId && report[rec.serviceCenterId]) {
                const partsCost = rec.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
                const expensesCost = rec.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
                
                report[rec.serviceCenterId].jobs++;
                report[rec.serviceCenterId].totalCost += partsCost + expensesCost;
            }
        });

        const data = Object.values(report).filter(r => r.jobs > 0).sort((a, b) => b.totalCost - a.totalCost);
        setReportData(data);
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
    
    React.useEffect(() => {
        handleGenerateReport();
    }, [maintenanceRecords, serviceCenters]);

    if (!mounted) {
        return null;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Workshop / Service Center Performance</CardTitle>
                    <CardDescription>Analyze jobs and costs for each workshop within a date range.</CardDescription>
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
                                <TableHeader><TableRow><TableHead>Workshop Name</TableHead><TableHead>Total Jobs</TableHead><TableHead>Total Billed Amount</TableHead><TableHead className="text-right">Average Cost Per Job</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {reportData.map(ws => (
                                        <TableRow key={ws.name}><TableCell>{ws.name}</TableCell><TableCell>{ws.jobs}</TableCell><TableCell>{formatCurrency(ws.totalCost)}</TableCell><TableCell className="text-right">{formatCurrency(ws.jobs > 0 ? ws.totalCost / ws.jobs : 0)}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground">No data available to generate workshop performance report for the selected criteria.</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
