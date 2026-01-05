
'use client';

import React, { useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Printer, Car, Users, Calendar, Fuel, Hash, Building, GitCommitHorizontal, Wrench, AlertTriangle, Route } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
    <Card className="print:border-none print:shadow-none">
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
    const params = useParams();
    const { id } = params;

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
    
    const vehicle = useMemo(() => vehicles.find(v => v.id === id), [id, vehicles]);

    const vehicleTrips = useMemo(() => trips.filter(t => t.vehicleId === id), [id, trips]);
    const vehicleMaintenance = useMemo(() => maintenanceRecords.filter(m => m.vehicleId === id), [id, maintenanceRecords]);
    const vehicleAccidents = useMemo(() => accidents.filter(a => a.vehicleId === id), [id, accidents]);

    const allPhotos = useMemo(() => {
        const photos: { src: string, label: string }[] = [];
        vehicleMaintenance.forEach(m => {
            m.documents?.beforeAfterPhotos?.forEach(p => photos.push({ src: p.file, label: `Maintenance ${m.serviceDate}: ${p.name}` }));
        });
        vehicleAccidents.forEach(a => {
            a.documents?.accidentPhotos?.forEach(p => photos.push({ src: p.file, label: `Accident ${a.accidentDate}: ${p.name}` }));
        });
        return photos;
    }, [vehicleMaintenance, vehicleAccidents]);

    if (!vehicle) {
        return notFound();
    }

    const brand = brands.find(b => b.id === vehicle.brandId);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 print:hidden">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Vehicle Profile
                </Button>
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                </Button>
            </div>

            <div className="p-4 print:p-0 space-y-6" id="report-content">
                <Card className="print:border-none print:shadow-none">
                    <CardHeader>
                        <div className="flex flex-col items-center text-center">
                            <GitCommitHorizontal className="h-8 w-8 mb-2" />
                            <CardTitle className="text-3xl">Vehicle Lifecycle Report</CardTitle>
                            <CardDescription className="text-lg">{brand?.name} {vehicle.model} - {vehicle.registrationNumber}</CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                <Section icon={Car} title="Vehicle Information">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InfoItem icon={Hash} label="Registration No." value={vehicle.registrationNumber} />
                        <InfoItem icon={Users} label="Brand & Model" value={`${brand?.name || ''} ${vehicle.model}`} />
                        <InfoItem icon={Calendar} label="Manufacture Year" value={vehicle.manufactureYear} />
                        <InfoItem icon={Fuel} label="Fuel Type" value={vehicle.fuelType} />
                        <InfoItem icon={Hash} label="Engine Number" value={vehicle.engineNumber} />
                        <InfoItem icon={Hash} label="Chassis Number" value={vehicle.chassisNumber} />
                        <InfoItem icon={Building} label="Ownership" value={vehicle.ownership} />
                        <InfoItem icon={Car} label="Status" value={<Badge>{vehicle.status}</Badge>} />
                    </div>
                </Section>
                
                <Section icon={Route} title="Trip History">
                    <Table>
                        <TableHeader><TableRow><TableHead>Trip ID</TableHead><TableHead>Date</TableHead><TableHead>Purpose</TableHead><TableHead>Driver</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {vehicleTrips.length > 0 ? vehicleTrips.map(trip => (
                                <TableRow key={trip.id}><TableCell>{trip.tripId}</TableCell><TableCell>{trip.startDate}</TableCell><TableCell>{purposes.find(p => p.id === trip.purposeId)?.name}</TableCell><TableCell>{drivers.find(d => d.id === trip.driverId)?.name}</TableCell></TableRow>
                            )) : <TableRow><TableCell colSpan={4} className="text-center">No trips found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </Section>

                <Section icon={Wrench} title="Maintenance History">
                     <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Parts Used</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {vehicleMaintenance.length > 0 ? vehicleMaintenance.map(maint => (
                                <TableRow key={maint.id}><TableCell>{maint.serviceDate}</TableCell><TableCell>{maintenanceTypes.find(t => t.id === maint.maintenanceTypeId)?.name}</TableCell><TableCell>{maint.parts.map(p => parts.find(part => part.id === p.partId)?.name).join(', ')}</TableCell></TableRow>
                            )) : <TableRow><TableCell colSpan={3} className="text-center">No maintenance records found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </Section>

                <Section icon={AlertTriangle} title="Accident History">
                     <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Driver</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {vehicleAccidents.length > 0 ? vehicleAccidents.map(acc => (
                                <TableRow key={acc.id}><TableCell>{acc.accidentDate}</TableCell><TableCell>{accidentTypes.find(t => t.id === acc.accidentTypeId)?.name}</TableCell><TableCell>{drivers.find(d => d.id === acc.driverId)?.name}</TableCell></TableRow>
                            )) : <TableRow><TableCell colSpan={3} className="text-center">No accidents found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </Section>

                <Section icon={Image} title="Associated Photos">
                    {allPhotos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allPhotos.map((photo, index) => (
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
        </div>
    );
}

