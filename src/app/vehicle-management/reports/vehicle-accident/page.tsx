"use client";

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';

import type { Accident } from '../../components/accident-entry-form';
import type { Vehicle } from '../../components/vehicle-table';
import type { Driver } from '../../components/driver-entry-form';

export default function VehicleAccidentReportPage() {
    const [accidents] = useLocalStorage<Accident[]>('accidents', []);
    const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
    const [drivers] = useLocalStorage<Driver[]>('drivers', []);
    
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [reportData, setReportData] = useState<any[]>([]);
    
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);


    const handleGenerateReport = () => {
        let filteredVehicles = vehicles;
        if (selectedVehicleId) {
            filteredVehicles = vehicles.filter(v => v.id === selectedVehicleId);
        }

        const data = filteredVehicles.map(vehicle => {
            let vehicleAccidents = accidents.filter(acc => acc.vehicleId === vehicle.id);

            if (dateRange?.from && dateRange?.to) {
                vehicleAccidents = vehicleAccidents.filter(acc => {
                    const accDate = parseISO(acc.accidentDate);
                    return isWithinInterval(accDate, { start: dateRange.from!, end: dateRange.to! });
                });
            }
            
            return { ...vehicle, accidents: vehicleAccidents };
        }).filter(v => v.accidents.length > 0);

        setReportData(data);
    };

    const getDriverName = (driverId: string) => drivers.find(d => d.id === driverId)?.name || 'N/A';

    if (!mounted) {
        return null;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Vehicle-wise Accident History</CardTitle>
                    <CardDescription>Filter and view accidents grouped by vehicle.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
                                {selectedVehicleId ? vehicles.find(v => v.id === selectedVehicleId)?.registrationNumber : "Select Vehicle (Optional)"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                            <Command>
                                <CommandInput placeholder="Search by Reg No or ID..." />
                                <CommandEmpty>No vehicle found.</CommandEmpty>
                                <CommandList><CommandGroup>
                                    {vehicles.map((vehicle) => (
                                    <CommandItem key={vehicle.id} value={`${vehicle.registrationNumber} ${vehicle.vehicleIdCode}`} onSelect={() => {
                                        setSelectedVehicleId(vehicle.id === selectedVehicleId ? undefined : vehicle.id);
                                        setOpen(false);
                                    }}>
                                        <Check className={cn("mr-2 h-4 w-4", selectedVehicleId === vehicle.id ? "opacity-100" : "opacity-0")} />
                                        {vehicle.registrationNumber} ({vehicle.vehicleIdCode})
                                    </CommandItem>
                                    ))}
                                </CommandGroup></CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    <Button onClick={handleGenerateReport}>Generate Report</Button>
                </CardContent>
            </Card>

            {reportData.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Report Results</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                                            <TableHeader><TableRow><TableHead>Accident ID</TableHead><TableHead>Date</TableHead><TableHead>Driver</TableHead><TableHead className="text-right">View</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {vehicle.accidents.map((acc: Accident) => (
                                                    <TableRow key={acc.id}>
                                                        <TableCell>{acc.accidentId}</TableCell>
                                                        <TableCell>{acc.accidentDate}</TableCell>
                                                        <TableCell>{getDriverName(acc.driverId)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" asChild><Link href={`/vehicle-management/accidents/${acc.id}`}><Eye className="h-4 w-4" /></Link></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
