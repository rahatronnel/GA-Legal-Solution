
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { MaintenanceRecord } from '../../components/maintenance-entry-form';
import type { Vehicle } from '../../components/vehicle-table';
import type { MaintenanceType } from '../../components/maintenance-type-table';
import type { Driver } from '../../components/driver-entry-form';

export default function PreventiveMaintenanceDuePage() {
    const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
    const [maintenanceTypes] = useLocalStorage<MaintenanceType[]>('maintenanceTypes', []);
    const [drivers] = useLocalStorage<Driver[]>('drivers', []);
    
    const [days, setDays] = useState(30);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>();
    const [selectedMaintenanceTypeId, setSelectedMaintenanceTypeId] = useState<string | undefined>();
    const [vehiclePopoverOpen, setVehiclePopoverOpen] = useState(false);
    const [typePopoverOpen, setTypePopoverOpen] = useState(false);

    const [reportData, setReportData] = useState<any[] | null>(null);

    const getCurrentDriver = (vehicle: Vehicle) => {
        if (!vehicle || !vehicle.driverAssignmentHistory || vehicle.driverAssignmentHistory.length === 0) return null;
        const sortedHistory = [...vehicle.driverAssignmentHistory]
            .filter(h => h.effectiveDate && h.driverId)
            .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
        if (sortedHistory.length === 0) return null;
        return drivers.find(d => d.id === sortedHistory[0].driverId) || null;
    };

    const handleGenerateReport = () => {
        const today = new Date();
        const data = maintenanceRecords
            .filter(rec => {
                if (!rec.upcomingServiceDate) return false;
                if (selectedVehicleId && rec.vehicleId !== selectedVehicleId) return false;
                if (selectedMaintenanceTypeId && rec.maintenanceTypeId !== selectedMaintenanceTypeId) return false;
                
                const daysUntilDue = differenceInDays(parseISO(rec.upcomingServiceDate), today);
                return daysUntilDue <= days;
            })
            .map(rec => {
                const vehicle = vehicles.find(v => v.id === rec.vehicleId);
                const maintenanceType = maintenanceTypes.find(mt => mt.id === rec.maintenanceTypeId);
                const driver = vehicle ? getCurrentDriver(vehicle) : null;
                return { 
                    ...rec, 
                    dueDate: parseISO(rec.upcomingServiceDate), 
                    daysUntilDue: differenceInDays(parseISO(rec.upcomingServiceDate), today),
                    vehicle,
                    maintenanceType,
                    driver,
                };
            })
            .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
        setReportData(data);
    };

    const getStatusBadge = (days: number) => {
        if (days < 0) return <Badge variant="destructive">Overdue by {-days} day(s)</Badge>;
        if (days === 0) return <Badge variant="secondary">Due Today</Badge>;
        if (days <= 7) return <Badge className="bg-yellow-500 text-white">Due in {days} day(s)</Badge>;
        return <Badge>Due in {days} day(s)</Badge>;
    };

    return (
         <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Preventive Maintenance Due Report</CardTitle>
                    <CardDescription>Find vehicles with upcoming or overdue maintenance based on your criteria.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="days" className="whitespace-nowrap">Due within (days):</Label>
                        <Input id="days" type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-24"/>
                    </div>
                     <Popover open={vehiclePopoverOpen} onOpenChange={setVehiclePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={vehiclePopoverOpen} className="w-[250px] justify-between">
                                {selectedVehicleId ? vehicles.find(v => v.id === selectedVehicleId)?.registrationNumber : "Filter by Vehicle..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                            <Command>
                                <CommandInput placeholder="Search vehicle..." />
                                <CommandList>
                                <CommandEmpty>No vehicle found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem onSelect={() => { setSelectedVehicleId(undefined); setVehiclePopoverOpen(false); }}>All Vehicles</CommandItem>
                                    {vehicles.map((v) => (
                                    <CommandItem key={v.id} value={v.registrationNumber} onSelect={() => {setSelectedVehicleId(v.id); setVehiclePopoverOpen(false);}}>
                                        <Check className={cn("mr-2 h-4 w-4", selectedVehicleId === v.id ? "opacity-100" : "opacity-0")} />
                                        {v.registrationNumber}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={typePopoverOpen} className="w-[250px] justify-between">
                                {selectedMaintenanceTypeId ? maintenanceTypes.find(t => t.id === selectedMaintenanceTypeId)?.name : "Filter by Maintenance Type..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                            <Command>
                                <CommandInput placeholder="Search type..." />
                                <CommandList>
                                <CommandEmpty>No type found.</CommandEmpty>
                                <CommandGroup>
                                     <CommandItem onSelect={() => { setSelectedMaintenanceTypeId(undefined); setTypePopoverOpen(false); }}>All Types</CommandItem>
                                    {maintenanceTypes.map((t) => (
                                    <CommandItem key={t.id} value={t.name} onSelect={() => {setSelectedMaintenanceTypeId(t.id); setTypePopoverOpen(false);}}>
                                        <Check className={cn("mr-2 h-4 w-4", selectedMaintenanceTypeId === t.id ? "opacity-100" : "opacity-0")} />
                                        {t.name}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

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
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Current Driver</TableHead>
                                        <TableHead>Maintenance Type</TableHead>
                                        <TableHead>Upcoming Service Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Service Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.map(rec => (
                                        <TableRow key={rec.id}>
                                            <TableCell>
                                                <Link href={`/vehicle-management/vehicles/${rec.vehicleId}`} className="font-medium text-primary hover:underline">
                                                    {rec.vehicle?.make} {rec.vehicle?.model} ({rec.vehicle?.registrationNumber})
                                                </Link>
                                            </TableCell>
                                            <TableCell>{rec.driver?.name || 'N/A'}</TableCell>
                                            <TableCell>{rec.maintenanceType?.name || 'N/A'}</TableCell>
                                            <TableCell>{format(rec.dueDate, 'PPP')}</TableCell>
                                            <TableCell>{getStatusBadge(rec.daysUntilDue)}</TableCell>
                                            <TableCell>{rec.serviceDate ? format(parseISO(rec.serviceDate), 'PPP') : 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No vehicles have maintenance due within the specified criteria.</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
