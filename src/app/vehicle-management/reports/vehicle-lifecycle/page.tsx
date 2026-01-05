
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Car, Users, Calendar, Fuel, Hash, Building, GitCommitHorizontal, Wrench, AlertTriangle, Route, ChevronsUpDown, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/app/vehicle-management/components/vehicle-entry-form';
import type { Trip } from '@/app/vehicle-management/components/trip-entry-form';
import type { MaintenanceRecord } from '@/app/vehicle-management/components/maintenance-entry-form';
import type { Accident } from '@/app/vehicle-management/components/accident-entry-form';
import type { Driver } from '@/app/vehicle-management/components/driver-entry-form';
import type { VehicleBrand } from '@/app/vehicle-management/components/vehicle-brand-table';
import type { TripPurpose } from '@/app/vehicle-management/components/trip-purpose-table';
import type { MaintenanceType } from '@/app/vehicle-management/components/maintenance-type-table';
import type { AccidentType } from '@/app/vehicle-management/components/accident-type-table';
import type { Part } from '@/app/vehicle-management/components/part-table';

const InfoItem: React.FC<{icon: React.ElementType, label: string, value: React.ReactNode}> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-2 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
            <p className="font-semibold">{label}</p>
            <p className="text-muted-foreground">{value || 'N/A'}</p>
        </div>
    </div>
);

const Section: React.FC<{icon: React.ElementType, title: string, children: React.ReactNode}> = ({icon: Icon, title, children}) => (
    <Card className="print:border-none print:shadow-none print:break-before-page">
        <CardHeader>
            <div className="flex items-center gap-3">
                <Icon className="h-6 w-6" />
                <CardTitle className="text-xl">{title}</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

export default function VehicleLifecycleReportPage() {
    const router = useRouter();
    
    const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
    const [trips] = useLocalStorage<Trip[]>('trips', []);
    const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [accidents] = useLocalStorage<Accident[]>('accidents', []);
    const [drivers] = useLocalStorage<Driver[]>('drivers', []);
    const [brands] = useLocalStorage<VehicleBrand[]>('vehicleBrands', []);
    const [purposes] = useLocalStorage<TripPurpose[]>('tripPurposes', []);
    const [maintenanceTypes] = useLocalStorage<MaintenanceType[]>('maintenanceTypes', []);
    const [accidentTypes] = useLocalStorage<AccidentType[]>('accidentTypes', []);
    const [parts] = useLocalStorage<Part[]>('parts', []);
    
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>();
    const [reportData, setReportData] = useState<any | null>(null);
    const [open, setOpen] = useState(false);

    const handleGenerateReport = () => {
        if (!selectedVehicleId) {
            setReportData(null);
            return;
        }

        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
        if (!vehicle) {
            setReportData(null);
            return;
        }

        const vehicleTrips = trips.filter(t => t.vehicleId === selectedVehicleId);
        const vehicleMaintenance = maintenanceRecords.filter(m => m.vehicleId === selectedVehicleId);
        const vehicleAccidents = accidents.filter(a => a.vehicleId === selectedVehicleId);
        const brand = brands.find(b => b.id === vehicle.brandId);

        const allPhotos: { src: string, label: string }[] = [];
        vehicleMaintenance.forEach(m => {
            m.documents?.beforeAfterPhotos?.forEach(p => allPhotos.push({ src: p.file, label: `Maintenance ${m.serviceDate}: ${p.name}` }));
        });
        vehicleAccidents.forEach(a => {
            a.documents?.accidentPhotos?.forEach(p => allPhotos.push({ src: p.file, label: `Accident ${a.accidentDate}: ${p.name}` }));
        });

        setReportData({
            vehicle,
            vehicleTrips,
            vehicleMaintenance,
            vehicleAccidents,
            brand,
            allPhotos
        });
    };

    return (
        <div className="space-y-6">
            <Card className="print:hidden">
                <CardHeader>
                    <CardTitle>Vehicle Lifecycle Report</CardTitle>
                    <CardDescription>Select a vehicle to generate its complete history report.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
                                {selectedVehicleId ? vehicles.find(v => v.id === selectedVehicleId)?.registrationNumber : "Select Vehicle..."}
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
                                        setSelectedVehicleId(vehicle.id);
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
                    <Button onClick={handleGenerateReport} disabled={!selectedVehicleId}>Generate Report</Button>
                     {reportData && <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print Report</Button>}
                </CardContent>
            </Card>

            {reportData && (
                <div className="p-4 print:p-0 space-y-6" id="report-content">
                    <Card className="print:border-none print:shadow-none">
                        <CardHeader>
                            <div className="flex flex-col items-center text-center">
                                <GitCommitHorizontal className="h-8 w-8 mb-2" />
                                <CardTitle className="text-3xl">Vehicle Lifecycle Report</CardTitle>
                                <CardDescription className="text-lg">{reportData.brand?.name} {reportData.vehicle.model} - {reportData.vehicle.registrationNumber}</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>

                    <Section icon={Car} title="Vehicle Information">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InfoItem icon={Hash} label="Registration No." value={reportData.vehicle.registrationNumber} />
                            <InfoItem icon={Users} label="Brand & Model" value={`${reportData.brand?.name || ''} ${reportData.vehicle.model}`} />
                            <InfoItem icon={Calendar} label="Manufacture Year" value={reportData.vehicle.manufactureYear} />
                            <InfoItem icon={Fuel} label="Fuel Type" value={reportData.vehicle.fuelType} />
                            <InfoItem icon={Hash} label="Engine Number" value={reportData.vehicle.engineNumber} />
                            <InfoItem icon={Hash} label="Chassis Number" value={reportData.vehicle.chassisNumber} />
                            <InfoItem icon={Building} label="Ownership" value={reportData.vehicle.ownership} />
                            <InfoItem icon={Car} label="Status" value={<Badge>{reportData.vehicle.status}</Badge>} />
                        </div>
                    </Section>
                    
                    <Section icon={Route} title="Trip History">
                        <Table>
                            <TableHeader><TableRow><TableHead>Trip ID</TableHead><TableHead>Date</TableHead><TableHead>Purpose</TableHead><TableHead>Driver</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reportData.vehicleTrips.length > 0 ? reportData.vehicleTrips.map((trip: Trip) => (
                                    <TableRow key={trip.id}><TableCell>{trip.tripId}</TableCell><TableCell>{trip.startDate}</TableCell><TableCell>{purposes.find(p => p.id === trip.purposeId)?.name}</TableCell><TableCell>{drivers.find(d => d.id === trip.driverId)?.name}</TableCell></TableRow>
                                )) : <TableRow><TableCell colSpan={4} className="text-center">No trips found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </Section>

                    <Section icon={Wrench} title="Maintenance History">
                         <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Parts Used</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reportData.vehicleMaintenance.length > 0 ? reportData.vehicleMaintenance.map((maint: MaintenanceRecord) => (
                                    <TableRow key={maint.id}><TableCell>{maint.serviceDate}</TableCell><TableCell>{maintenanceTypes.find(t => t.id === maint.maintenanceTypeId)?.name}</TableCell><TableCell>{maint.parts.map(p => parts.find(part => part.id === p.partId)?.name).join(', ')}</TableCell></TableRow>
                                )) : <TableRow><TableCell colSpan={3} className="text-center">No maintenance records found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </Section>

                    <Section icon={AlertTriangle} title="Accident History">
                         <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Driver</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reportData.vehicleAccidents.length > 0 ? reportData.vehicleAccidents.map((acc: Accident) => (
                                    <TableRow key={acc.id}><TableCell>{acc.accidentDate}</TableCell><TableCell>{accidentTypes.find(t => t.id === acc.accidentTypeId)?.name}</TableCell><TableCell>{drivers.find(d => d.id === acc.driverId)?.name}</TableCell></TableRow>
                                )) : <TableRow><TableCell colSpan={3} className="text-center">No accidents found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </Section>

                    <Section icon={Image} title="Associated Photos">
                        {reportData.allPhotos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {reportData.allPhotos.map((photo: {src: string, label: string}, index: number) => (
                                    <div key={index} className="border rounded-lg overflow-hidden group">
                                        <div className="w-full aspect-video bg-muted relative">
                                            <Image src={photo.src} alt={photo.label} layout="fill" className="object-cover" />
                                        </div>
                                        <p className="text-xs text-muted-foreground p-2 truncate">{photo.label}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground">No photos found in maintenance or accident records.</p>
                        )}
                    </Section>
                </div>
            )}
        </div>
    );
}
