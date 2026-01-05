
"use client";

import React from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

import type { Accident } from '../../components/accident-entry-form';
import type { Vehicle } from '../../components/vehicle-table';
import type { Driver } from '../../components/driver-entry-form';

export function VehicleAccidentReport() {
    const [accidents] = useLocalStorage<Accident[]>('accidents', []);
    const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
    const [drivers] = useLocalStorage<Driver[]>('drivers', []);

    const reportData = React.useMemo(() => {
        return vehicles.map(vehicle => {
            const vehicleAccidents = accidents.filter(acc => acc.vehicleId === vehicle.id);
            return {
                ...vehicle,
                accidents: vehicleAccidents,
            };
        }).filter(v => v.accidents.length > 0);
    }, [accidents, vehicles]);

    const getDriverName = (driverId: string) => drivers.find(d => d.id === driverId)?.name || 'N/A';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Vehicle-wise Accident History</CardTitle>
                <CardDescription>A breakdown of all accidents, grouped by vehicle.</CardDescription>
            </CardHeader>
            <CardContent>
                {reportData.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {reportData.map(vehicle => (
                            <AccordionItem value={vehicle.id} key={vehicle.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4">
                                        <span>{vehicle.make} {vehicle.model} ({vehicle.registrationNumber})</span>
                                        <span className="text-sm text-muted-foreground">{vehicle.accidents.length} accident(s)</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Accident ID</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Driver</TableHead>
                                                <TableHead className="text-right">View</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {vehicle.accidents.map(acc => (
                                                <TableRow key={acc.id}>
                                                    <TableCell>{acc.accidentId}</TableCell>
                                                    <TableCell>{acc.accidentDate}</TableCell>
                                                    <TableCell>{getDriverName(acc.driverId)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={`/vehicle-management/accidents/${acc.id}`}><Eye className="h-4 w-4" /></Link>
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
                    <p className="text-center text-muted-foreground">No accident data available to generate this report.</p>
                )}
            </CardContent>
        </Card>
    );
}
