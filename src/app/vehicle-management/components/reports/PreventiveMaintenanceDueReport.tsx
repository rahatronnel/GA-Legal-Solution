
"use client";

import React from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

import type { MaintenanceRecord } from '../../components/maintenance-entry-form';
import type { Vehicle } from '../../components/vehicle-table';

export function PreventiveMaintenanceDueReport() {
    const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);

    const dueReport = React.useMemo(() => {
        const today = new Date();
        return maintenanceRecords
            .filter(rec => rec.upcomingServiceDate)
            .map(rec => {
                const dueDate = parseISO(rec.upcomingServiceDate);
                const daysUntilDue = differenceInDays(dueDate, today);
                const vehicle = vehicles.find(v => v.id === rec.vehicleId);
                return {
                    ...rec,
                    dueDate,
                    daysUntilDue,
                    vehicle,
                };
            })
            .filter(rec => rec.daysUntilDue <= 30) // Show services due in the next 30 days or overdue
            .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    }, [maintenanceRecords, vehicles]);

    const getStatusBadge = (days: number) => {
        if (days < 0) return <Badge variant="destructive">Overdue by {-days} day(s)</Badge>;
        if (days === 0) return <Badge variant="secondary">Due Today</Badge>;
        return <Badge>Due in {days} day(s)</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Preventive Maintenance Due Report</CardTitle>
                <CardDescription>Vehicles with upcoming or overdue maintenance within the next 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
                {dueReport.length > 0 ? (
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Upcoming Service Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Service Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dueReport.map(rec => (
                                <TableRow key={rec.id}>
                                    <TableCell>
                                        <Link href={`/vehicle-management/vehicles/${rec.vehicleId}`} className="text-primary hover:underline">
                                            {rec.vehicle?.make} {rec.vehicle?.model} ({rec.vehicle?.registrationNumber})
                                        </Link>
                                    </TableCell>
                                    <TableCell>{format(rec.dueDate, 'PPP')}</TableCell>
                                    <TableCell>{getStatusBadge(rec.daysUntilDue)}</TableCell>
                                    <TableCell>{rec.serviceDate ? format(parseISO(rec.serviceDate), 'PPP') : 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground">No vehicles have maintenance due soon.</p>
                )}
            </CardContent>
        </Card>
    );
}
