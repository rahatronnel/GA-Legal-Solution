
"use client";

import React from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

import type { MaintenanceRecord } from '../../components/maintenance-entry-form';
import type { Vehicle } from '../../components/vehicle-table';
import type { MaintenanceType } from '../../components/maintenance-type-table';

export function VehicleMaintenanceReport() {
    const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
    const [maintenanceTypes] = useLocalStorage<MaintenanceType[]>('maintenanceTypes', []);

    const reportData = React.useMemo(() => {
        return vehicles.map(vehicle => {
            const vehicleMaintenance = maintenanceRecords.filter(rec => rec.vehicleId === vehicle.id);
            return {
                ...vehicle,
                maintenance: vehicleMaintenance,
            };
        }).filter(v => v.maintenance.length > 0);
    }, [maintenanceRecords, vehicles]);

    const getMaintenanceTypeName = (typeId: string) => maintenanceTypes.find(t => t.id === typeId)?.name || 'N/A';
    
    const calculateTotalCost = (record: MaintenanceRecord) => {
        const partsCost = record.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
        const expensesCost = record.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
        return partsCost + expensesCost;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Vehicle-wise Maintenance History</CardTitle>
                <CardDescription>A breakdown of all maintenance jobs, grouped by vehicle.</CardDescription>
            </CardHeader>
            <CardContent>
                {reportData.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {reportData.map(vehicle => (
                            <AccordionItem value={vehicle.id} key={vehicle.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4">
                                        <span>{vehicle.make} {vehicle.model} ({vehicle.registrationNumber})</span>
                                        <span className="text-sm text-muted-foreground">{vehicle.maintenance.length} job(s)</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Service Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Cost</TableHead>
                                                <TableHead className="text-right">View</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {vehicle.maintenance.map(rec => (
                                                <TableRow key={rec.id}>
                                                    <TableCell>{rec.serviceDate}</TableCell>
                                                    <TableCell>{getMaintenanceTypeName(rec.maintenanceTypeId)}</TableCell>
                                                    <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculateTotalCost(rec))}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={`/vehicle-management/maintenance/${rec.id}`}><Eye className="h-4 w-4" /></Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-center text-muted-foreground">No maintenance data available to generate this report.</p>
                )}
            </CardContent>
        </Card>
    );
}
