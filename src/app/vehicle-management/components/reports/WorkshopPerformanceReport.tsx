
"use client";

import React from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { MaintenanceRecord } from '../../components/maintenance-entry-form';
import type { ServiceCenter } from '../../components/service-center-table';

export function WorkshopPerformanceReport() {
    const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [serviceCenters] = useLocalStorage<ServiceCenter[]>('serviceCenters', []);

    const workshopReport = React.useMemo(() => {
        const report: { [key: string]: { name: string; jobs: number; totalCost: number } } = {};

        serviceCenters.forEach(sc => {
            report[sc.id] = { name: sc.name, jobs: 0, totalCost: 0 };
        });

        maintenanceRecords.forEach(rec => {
            if (rec.serviceCenterId && report[rec.serviceCenterId]) {
                const partsCost = rec.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
                const expensesCost = rec.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
                
                report[rec.serviceCenterId].jobs++;
                report[rec.serviceCenterId].totalCost += partsCost + expensesCost;
            }
        });

        return Object.values(report).filter(r => r.jobs > 0).sort((a, b) => b.totalCost - a.totalCost);
    }, [maintenanceRecords, serviceCenters]);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Workshop / Service Center Performance</CardTitle>
                <CardDescription>An overview of jobs and costs associated with each workshop.</CardDescription>
            </CardHeader>
            <CardContent>
                {workshopReport.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Workshop Name</TableHead>
                                <TableHead>Total Jobs</TableHead>
                                <TableHead>Total Billed Amount</TableHead>
                                <TableHead>Average Cost Per Job</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workshopReport.map(ws => (
                                <TableRow key={ws.name}>
                                    <TableCell>{ws.name}</TableCell>
                                    <TableCell>{ws.jobs}</TableCell>
                                    <TableCell>{formatCurrency(ws.totalCost)}</TableCell>
                                    <TableCell>{formatCurrency(ws.totalCost / ws.jobs)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground">No data available to generate workshop performance report.</p>
                )}
            </CardContent>
        </Card>
    );
}
