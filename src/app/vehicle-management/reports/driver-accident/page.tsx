
"use client";

import React, { useState, useEffect } from 'react';
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
import { useReportsData } from '../../components/vehicle-management-provider';

export default function DriverAccidentReportPage() {
    const reportsData = useReportsData();
    const { accidents = [], vehicles = [], drivers = [] } = reportsData?.data || {};
    const { isLoading } = reportsData || { isLoading: true };

    const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [reportData, setReportData] = useState<any[]>([]);
    
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            handleGenerateReport();
        }
    }, [isLoading, accidents, drivers, vehicles]);


    const handleGenerateReport = () => {
        let filteredDrivers = drivers;
        if (selectedDriverId) {
            filteredDrivers = drivers.filter(d => d.id === selectedDriverId);
        }

        const data = filteredDrivers.map(driver => {
            let driverAccidents = accidents.filter(acc => acc.driverId === driver.id);

            if (dateRange?.from && dateRange?.to) {
                driverAccidents = driverAccidents.filter(acc => {
                    if (!acc.accidentDate) return false;
                    const accDate = parseISO(acc.accidentDate);
                    return isWithinInterval(accDate, { start: dateRange.from!, end: dateRange.to! });
                });
            }
            
            return { ...driver, accidents: driverAccidents };
        }).filter(d => d.accidents.length > 0);

        setReportData(data);
    };

    const getVehicleReg = (vehicleId: string) => vehicles.find(v => v.id === vehicleId)?.registrationNumber || 'N/A';

    if (!mounted || isLoading) {
        return <p>Loading report data...</p>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Driver-wise Accident Report</CardTitle>
                    <CardDescription>Filter and view accidents grouped by driver.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
                                {selectedDriverId ? drivers.find(d => d.id === selectedDriverId)?.name : "Select Driver (Optional)"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                            <Command>
                                <CommandInput placeholder="Search driver..." />
                                <CommandEmpty>No driver found.</CommandEmpty>
                                <CommandList>
                                <CommandGroup>
                                    <CommandItem onSelect={() => { setSelectedDriverId(undefined); setOpen(false); }}>All Drivers</CommandItem>
                                    {drivers.map((driver) => (
                                    <CommandItem
                                        key={driver.id}
                                        value={driver.name}
                                        onSelect={() => {
                                            setSelectedDriverId(driver.id === selectedDriverId ? undefined : driver.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", selectedDriverId === driver.id ? "opacity-100" : "opacity-0")} />
                                        {driver.name}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
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
                                            <TableHeader><TableRow><TableHead>Accident ID</TableHead><TableHead>Date</TableHead><TableHead>Vehicle</TableHead><TableHead className="text-right">View</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {driver.accidents.map((acc: Accident) => (
                                                    <TableRow key={acc.id}>
                                                        <TableCell>{acc.accidentId}</TableCell>
                                                        <TableCell>{acc.accidentDate}</TableCell>
                                                        <TableCell>{getVehicleReg(acc.vehicleId)}</TableCell>
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
