
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

export function DriverAccidentReport() {
    const [accidents] = useLocalStorage<Accident[]>('accidents', []);
    const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
    const [drivers] = useLocalStorage<Driver[]>('drivers', []);

    const reportData = React.useMemo(() => {
        return drivers.map(driver => {
            const driverAccidents = accidents.filter(acc => acc.driverId === driver.id);
            return {
                ...driver,
                accidents: driverAccidents,
            };
        }).filter(d => d.accidents.length > 0);
    }, [accidents, drivers]);

    const getVehicleReg = (vehicleId: string) => vehicles.find(v => v.id === vehicleId)?.registrationNumber || 'N/A';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Driver-wise Accident Report</CardTitle>
                <CardDescription>A breakdown of all accidents, grouped by driver.</CardDescription>
            </CardHeader>
            <CardContent>
                {reportData.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {reportData.map(driver => (
                            <AccordionItem value={driver.id} key={driver.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4">
                                        <span>{driver.name} ({driver.driverIdCode})</span>
                                        <span className="text-sm text-muted-foreground">{driver.accidents.length} accident(s)</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Accident ID</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Vehicle</TableHead>
                                                <TableHead className="text-right">View</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {driver.accidents.map(acc => (
                                                <TableRow key={acc.id}>
                                                    <TableCell>{acc.accidentId}</TableCell>
                                                    <TableCell>{acc.accidentDate}</TableCell>
                                                    <TableCell>{getVehicleReg(acc.vehicleId)}</TableCell>
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
