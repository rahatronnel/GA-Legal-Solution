
"use client";

import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { MaintenanceRecord } from '../../components/maintenance-entry-form';
import type { Vehicle } from '../../components/vehicle-table';

export default function PreventiveMaintenanceDuePage() {
    const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
    
    const [days, setDays] = useState(30);
    const [reportData, setReportData] = useState<any[] | null>(null);

    const handleGenerateReport = () => {
        const today = new Date();
        const data = maintenanceRecords
            .filter(rec => rec.upcomingServiceDate)
            .map(rec => {
                const dueDate = parseISO(rec.upcomingServiceDate);
                const daysUntilDue = differenceInDays(dueDate, today);
                const vehicle = vehicles.find(v => v.id === rec.vehicleId);
                return { ...rec, dueDate, daysUntilDue, vehicle };
            })
            .filter(rec => rec.daysUntilDue <= days)
            .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
        setReportData(data);
    };

    const getStatusBadge = (days: number) => {
        if (days < 0) return <Badge variant="destructive">Overdue by {-days} day(s)</Badge>;
        if (days === 0) return <Badge variant="secondary">Due Today</Badge>;
        return <Badge>Due in {days} day(s)</Badge>;
    };

    return (
         <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Preventive Maintenance Due Report</CardTitle>
                    <CardDescription>Find vehicles with upcoming or overdue maintenance.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <label htmlFor="days">Due within (days):</label>
                        <Input id="days" type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-24"/>
                    </div>
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
                                <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Upcoming Service Date</TableHead><TableHead>Status</TableHead><TableHead>Last Service Date</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {reportData.map(rec => (
                                        <TableRow key={rec.id}>
                                            <TableCell><Link href={`/vehicle-management/vehicles/${rec.vehicleId}`} className="text-primary hover:underline">{rec.vehicle?.make} {rec.vehicle?.model} ({rec.vehicle?.registrationNumber})</Link></TableCell>
                                            <TableCell>{format(rec.dueDate, 'PPP')}</TableCell>
                                            <TableCell>{getStatusBadge(rec.daysUntilDue)}</TableCell>
                                            <TableCell>{rec.serviceDate ? format(parseISO(rec.serviceDate), 'PPP') : 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground">No vehicles have maintenance due within the specified timeframe.</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
