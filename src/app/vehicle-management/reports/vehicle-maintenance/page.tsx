
"use client";

import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { MaintenanceRecord } from '../../components/maintenance-entry-form';
import type { Vehicle } from '../../components/vehicle-table';
import type { MaintenanceType } from '../../components/maintenance-type-table';

export default function VehicleMaintenanceReportPage() {
    const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
    const [maintenanceTypes] = useLocalStorage<MaintenanceType[]>('maintenanceTypes', []);
    
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [reportData, setReportData] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    const handleGenerateReport = () => {
        let filteredVehicles = vehicles;
        if (selectedVehicleId) {
            filteredVehicles = vehicles.filter(v => v.id === selectedVehicleId);
        }

        const data = filteredVehicles.map(vehicle => {
            let vehicleMaintenance = maintenanceRecords.filter(rec => rec.vehicleId === vehicle.id);

            if (dateRange?.from && dateRange?.to) {
                vehicleMaintenance = vehicleMaintenance.filter(rec => {
                    const serviceDate = parseISO(rec.serviceDate);
                    return isWithinInterval(serviceDate, { start: dateRange.from!, end: dateRange.to! });
                });
            }
            return { ...vehicle, maintenance: vehicleMaintenance };
        }).filter(v => v.maintenance.length > 0);

        setReportData(data);
    };

    const getMaintenanceTypeName = (typeId: string) => maintenanceTypes.find(t => t.id === typeId)?.name || 'N/A';
    
    const calculateTotalCost = (record: MaintenanceRecord) => {
        const partsCost = record.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
        const expensesCost = record.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
        return partsCost + expensesCost;
    }

    return (
         <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Vehicle-wise Maintenance History</CardTitle>
                    <CardDescription>Filter and view maintenance history for specific vehicles and date ranges.</CardDescription>
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
                                <CommandInput placeholder="Search vehicle..." />
                                <CommandEmpty>No vehicle found.</CommandEmpty>
                                <CommandList><CommandGroup>
                                    {vehicles.map((vehicle) => (
                                    <CommandItem key={vehicle.id} value={vehicle.registrationNumber} onSelect={() => {
                                        setSelectedVehicleId(vehicle.id === selectedVehicleId ? undefined : vehicle.id);
                                        setOpen(false);
                                    }}>
                                        <Check className={cn("mr-2 h-4 w-4", selectedVehicleId === vehicle.id ? "opacity-100" : "opacity-0")} />
                                        {vehicle.registrationNumber}
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
                    <CardHeader><CardTitle>Report Results</CardTitle></CardHeader>
                    <CardContent>
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
                                            <TableHeader><TableRow><TableHead>Service Date</TableHead><TableHead>Type</TableHead><TableHead>Cost</TableHead><TableHead className="text-right">View</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {vehicle.maintenance.map((rec: MaintenanceRecord) => (
                                                    <TableRow key={rec.id}>
                                                        <TableCell>{rec.serviceDate}</TableCell>
                                                        <TableCell>{getMaintenanceTypeName(rec.maintenanceTypeId)}</TableCell>
                                                        <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculateTotalCost(rec))}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" asChild><Link href={`/vehicle-management/maintenance/${rec.id}`}><Eye className="h-4 w-4" /></Link></Button>
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
