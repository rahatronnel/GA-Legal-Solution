
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Car, Users, Calendar, Fuel, Hash, Building, GitCommitHorizontal, Wrench, AlertTriangle, Route, ChevronsUpDown, Check, DollarSign, Image as ImageIcon, Eye, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import type { Vehicle } from '@/app/vehicle-management/components/vehicle-entry-form';
import type { Trip } from '@/app/vehicle-management/components/trip-entry-form';
import type { MaintenanceRecord } from '@/app/vehicle-management/components/maintenance-entry-form';
import type { Accident } from '@/app/vehicle-management/components/accident-entry-form';
import type { Driver } from '@/app/vehicle-management/components/driver-entry-form';
import type { VehicleBrand } from '@/app/vehicle-management/components/vehicle-brand-table';
import type { TripPurpose } from '@/app/vehicle-management/components/trip-purpose-table';
import type { MaintenanceType } from '@/app/vehicle-management/components/maintenance-type-table';
import type { AccidentType } from '@/app/vehicle-management/components/accident-type-table';
import type { Part as PartType } from '@/app/vehicle-management/components/part-table';
import type { ServiceCenter } from '@/app/vehicle-management/components/service-center-table';
import type { Location } from '@/app/vehicle-management/components/location-table';
import type { SeverityLevel } from '@/app/vehicle-management/components/severity-level-table';
import type { ExpenseType } from '@/app/vehicle-management/components/expense-type-table';

// --- Helper Components ---

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
    <Card className="print:border-none print:shadow-none print-no-break">
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

const documentLabels: Record<string, string> = {
    approvalDoc: 'Approval Document', fuelReceipt: 'Fuel Receipt/Memo', parkingBill: 'Parking Bill',
    tollBill: 'Toll Bill', miscExpense: 'Miscellaneous Expenses Bill', lunchBill: 'Lunch Bill',
    otherDoc: 'Other Document', damagePhoto: 'Damage Photo', routePermit: 'Route Permit Photo',
    specialApprove: 'Special Approval Document', workOrder: 'Work Order / Job Card', repairInvoice: 'Repair Invoice / Bill',
    partsInvoice: 'Parts Replacement Invoice', quotation: 'Quotation / Estimate', paymentProof: 'Payment Proof',
    checklist: 'Maintenance Checklist / Service Report', beforeAfterPhotos: 'Before & After Photos',
    accidentPhotos: 'Accident Photos', policeReport: 'Police Report', insuranceClaimForm: 'Insurance Claim Form',
    workshopQuotation: 'Workshop Quotation', medicalReport: 'Medical Report',
};

// --- Detail View Dialogs ---

const TripDetailDialog: React.FC<{ trip: Trip; onOpenChange: (open: boolean) => void; parentData: any }> = ({ trip, onOpenChange, parentData }) => {
    const { purpose, driver, route, totalDistance, totalExpenses } = parentData;
    const getExpenseTypeName = (id: string) => parentData.expenseTypes.find((et:any) => et.id === id)?.name || 'N/A';

    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Trip Details: {trip.tripId}</DialogTitle>
                    <DialogDescription>Complete information for the selected trip.</DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[70vh] overflow-y-auto pr-4 grid gap-6">
                    <InfoItem icon={Car} label="Driver" value={driver} />
                    <InfoItem icon={Route} label="Route" value={route} />
                    <InfoItem icon={Calendar} label="Start" value={`${trip.startDate} ${trip.startTime}`} />
                    <InfoItem icon={Calendar} label="End" value={`${trip.endDate} ${trip.endTime}`} />
                    <InfoItem icon={Flag} label="Purpose" value={purpose} />
                    <InfoItem icon={Hash} label="Total Distance" value={`${totalDistance} km`} />
                    <InfoItem icon={DollarSign} label="Total Expenses" value={parentData.formatCurrency(totalExpenses)} />
                    <InfoItem icon={Info} label="Remarks" value={trip.remarks} />
                     {trip.expenses && trip.expenses.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">Expenses Breakdown</h4>
                            <Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {trip.expenses.map(exp => (
                                        <TableRow key={exp.id}><TableCell>{getExpenseTypeName(exp.expenseTypeId)}</TableCell><TableCell>{exp.date}</TableCell><TableCell className="text-right">{parentData.formatCurrency(exp.amount)}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const MaintenanceDetailDialog: React.FC<{ record: MaintenanceRecord; onOpenChange: (open: boolean) => void; parentData: any }> = ({ record, onOpenChange, parentData }) => {
    const { type, serviceCenter, totalCost } = parentData;
    const getPartName = (partId: string) => parentData.parts.find((p:any) => p.id === partId)?.name || 'N/A';
    
    return (
         <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Maintenance Details</DialogTitle>
                    <DialogDescription>Complete information for the service on {record.serviceDate}.</DialogDescription>
                </DialogHeader>
                 <div className="py-4 max-h-[70vh] overflow-y-auto pr-4 grid gap-6">
                    <InfoItem icon={Wrench} label="Maintenance Type" value={type} />
                    <InfoItem icon={Building} label="Service Center" value={serviceCenter} />
                    <InfoItem icon={Calendar} label="Service Date" value={record.serviceDate} />
                    <InfoItem icon={Calendar} label="Upcoming Service Date" value={record.upcomingServiceDate} />
                    <InfoItem icon={DollarSign} label="Total Cost" value={parentData.formatCurrency(totalCost)} />
                    <InfoItem icon={Info} label="Description" value={record.description} />

                    {record.parts && record.parts.length > 0 && (
                        <div>
                           <h4 className="font-semibold mb-2">Parts Used</h4>
                           <Table><TableHeader><TableRow><TableHead>Part</TableHead><TableHead>Brand</TableHead><TableHead>Qty</TableHead><TableHead>Price</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                           <TableBody>{record.parts.map(p => (<TableRow key={p.id}><TableCell>{getPartName(p.partId)}</TableCell><TableCell>{p.brand}</TableCell><TableCell>{p.quantity}</TableCell><TableCell>{parentData.formatCurrency(p.price)}</TableCell><TableCell>{parentData.formatCurrency(p.price * p.quantity)}</TableCell></TableRow>))}</TableBody>
                           </Table>
                        </div>
                    )}
                 </div>
            </DialogContent>
        </Dialog>
    );
};

const AccidentDetailDialog: React.FC<{ accident: Accident; onOpenChange: (open: boolean) => void; parentData: any }> = ({ accident, onOpenChange, parentData }) => {
    const { type, severity, driver } = parentData;
    
    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Accident Details: {accident.accidentId}</DialogTitle>
                    <DialogDescription>Complete information for the accident on {accident.accidentDate}.</DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[70vh] overflow-y-auto pr-4 grid gap-6">
                    <InfoItem icon={Calendar} label="Date & Time" value={`${accident.accidentDate} ${accident.accidentTime}`} />
                    <InfoItem icon={Car} label="Driver" value={driver} />
                    <InfoItem icon={AlertTriangle} label="Type & Severity" value={`${type} / ${severity}`} />
                    <InfoItem icon={Info} label="Description" value={accident.description} />
                    <InfoItem icon={Wrench} label="Vehicle Damage" value={accident.vehicleDamageDescription} />
                    <InfoItem icon={DollarSign} label="Estimated Repair Cost" value={parentData.formatCurrency(accident.estimatedRepairCost)} />
                    <InfoItem icon={DollarSign} label="Actual Repair Cost" value={parentData.formatCurrency(accident.actualRepairCost)} />
                    <InfoItem icon={DollarSign} label="Third-Party Damage Cost" value={parentData.formatCurrency(accident.thirdPartyDamageCost)} />
                </div>
            </DialogContent>
        </Dialog>
    );
};


// --- Main Page Component ---

export default function VehicleLifecycleReportPage() {
    const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
    const [trips] = useLocalStorage<Trip[]>('trips', []);
    const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [accidents] = useLocalStorage<Accident[]>('accidents', []);
    const [drivers] = useLocalStorage<Driver[]>('drivers', []);
    const [brands] = useLocalStorage<VehicleBrand[]>('vehicleBrands', []);
    const [purposes] = useLocalStorage<TripPurpose[]>('tripPurposes', []);
    const [maintenanceTypes] = useLocalStorage<MaintenanceType[]>('maintenanceTypes', []);
    const [accidentTypes] = useLocalStorage<AccidentType[]>('accidentTypes', []);
    const [parts] = useLocalStorage<PartType[]>('parts', []);
    const [serviceCenters] = useLocalStorage<ServiceCenter[]>('serviceCenters', []);
    const [locations] = useLocalStorage<Location[]>('locations', []);
    const [severityLevels] = useLocalStorage<SeverityLevel[]>('severityLevels', []);
    const [expenseTypes] = useLocalStorage<ExpenseType[]>('expenseTypes', []);
    
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>();
    const [reportData, setReportData] = useState<any | null>(null);
    const [open, setOpen] = useState(false);
    const [modalContent, setModalContent] = useState<{type: 'trip' | 'maintenance' | 'accident', data: any, parentData: any} | null>(null);

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

        const photoExtractor = (records: any[], prefix: string, idField: string) => {
            const photos: { src: string, label: string }[] = [];
            records.forEach(record => {
                if (!record.documents) return;
                for (const key in record.documents) {
                    if (Array.isArray(record.documents[key])) {
                        record.documents[key].forEach((doc: any) => {
                            if (doc.file && doc.file.startsWith('data:image/')) {
                                photos.push({ src: doc.file, label: `${prefix} ${record[idField]}: ${documentLabels[key] || key} - ${doc.name}` });
                            }
                        })
                    }
                }
            });
            return photos;
        }
        
        const maintenancePhotos = photoExtractor(vehicleMaintenance, "Maint.", "serviceDate");
        const accidentPhotos = photoExtractor(vehicleAccidents, "Acc.", "accidentId");
        const tripPhotos = photoExtractor(vehicleTrips, "Trip", "tripId");

        setReportData({
            vehicle,
            vehicleTrips,
            vehicleMaintenance,
            vehicleAccidents,
            brand,
            maintenancePhotos,
            accidentPhotos,
            tripPhotos
        });
    };
    
    const formatCurrency = (amount: number | undefined) => {
        if (typeof amount !== 'number') return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
    
    const getTripDetails = (trip: Trip) => {
        const purpose = purposes.find(p => p.id === trip.purposeId)?.name;
        const driver = drivers.find(d => d.id === trip.driverId)?.name;
        const startLocation = locations.find(l => l.id === trip.startLocationId)?.name;
        const endLocation = locations.find(l => l.id === trip.destinationLocationId)?.name;
        const route = startLocation && endLocation ? `${startLocation} to ${endLocation}` : 'N/A';
        const totalDistance = (trip.endingMeter > trip.startingMeter) ? trip.endingMeter - trip.startingMeter : 0;
        const totalExpenses = trip.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
        return { purpose, driver, route, totalDistance, totalExpenses, expenseTypes };
    }
    
    const getMaintenanceDetails = (maint: MaintenanceRecord) => {
        const type = maintenanceTypes.find(t => t.id === maint.maintenanceTypeId)?.name;
        const serviceCenter = serviceCenters.find(s => s.id === maint.serviceCenterId)?.name;
        const partsCost = maint.parts?.reduce((acc, p) => acc + (p.price * p.quantity), 0) || 0;
        const expensesCost = maint.expenses?.reduce((acc, e) => acc + e.amount, 0) || 0;
        const totalCost = partsCost + expensesCost;
        return { type, serviceCenter, totalCost, parts };
    }
    
    const getAccidentDetails = (acc: Accident) => {
        const type = accidentTypes.find(t => t.id === acc.accidentTypeId)?.name;
        const severity = severityLevels.find(s => s.id === acc.severityLevelId)?.name;
        const driver = drivers.find(d => d.id === acc.driverId)?.name;
        return { type, severity, driver };
    }


    return (
        <div className="space-y-6">
            <Card>
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
                <div id="report-content" className="space-y-6">
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
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Driver</TableHead><TableHead>Route</TableHead><TableHead>Distance</TableHead><TableHead>Expenses</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reportData.vehicleTrips.length > 0 ? reportData.vehicleTrips.map((trip: Trip) => {
                                    const details = getTripDetails(trip);
                                    return (
                                        <TableRow key={trip.id}>
                                            <TableCell>{trip.startDate}</TableCell>
                                            <TableCell>{details.driver}</TableCell>
                                            <TableCell>{details.route}</TableCell>
                                            <TableCell>{details.totalDistance} km</TableCell>
                                            <TableCell>{formatCurrency(details.totalExpenses)}</TableCell>
                                            <TableCell><Badge variant="outline">{trip.tripStatus}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setModalContent({type: 'trip', data: trip, parentData: {...details, formatCurrency}})}><Eye className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }) : <TableRow><TableCell colSpan={7} className="text-center">No trips found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </Section>

                    <Section icon={Wrench} title="Maintenance History">
                         <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Service Center</TableHead><TableHead>Cost</TableHead><TableHead>Remarks</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reportData.vehicleMaintenance.length > 0 ? reportData.vehicleMaintenance.map((maint: MaintenanceRecord) => {
                                    const details = getMaintenanceDetails(maint);
                                    return (
                                        <TableRow key={maint.id}>
                                            <TableCell>{maint.serviceDate}</TableCell>
                                            <TableCell>{details.type}</TableCell>
                                            <TableCell>{details.serviceCenter}</TableCell>
                                            <TableCell>{formatCurrency(details.totalCost)}</TableCell>
                                            <TableCell className="truncate max-w-xs">{maint.description}</TableCell>
                                             <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setModalContent({type: 'maintenance', data: maint, parentData: {...details, formatCurrency}})}><Eye className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }) : <TableRow><TableCell colSpan={6} className="text-center">No maintenance records found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </Section>

                    <Section icon={AlertTriangle} title="Accident History">
                         <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Driver</TableHead><TableHead>Type</TableHead><TableHead>Severity</TableHead><TableHead>Cost</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reportData.vehicleAccidents.length > 0 ? reportData.vehicleAccidents.map((acc: Accident) => {
                                     const details = getAccidentDetails(acc);
                                     return (
                                        <TableRow key={acc.id}>
                                            <TableCell>{acc.accidentDate}</TableCell>
                                            <TableCell>{details.driver}</TableCell>
                                            <TableCell>{details.type}</TableCell>
                                            <TableCell><Badge variant="destructive">{details.severity}</Badge></TableCell>
                                            <TableCell>{formatCurrency(acc.actualRepairCost)}</TableCell>
                                            <TableCell className="truncate max-w-xs">{acc.description}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setModalContent({type: 'accident', data: acc, parentData: {...details, formatCurrency}})}><Eye className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                     )
                                }) : <TableRow><TableCell colSpan={7} className="text-center">No accidents found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </Section>

                    {reportData.tripPhotos.length > 0 && (
                         <Section icon={Route} title="Trip Photos">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {reportData.tripPhotos.map((photo: {src: string, label: string}, index: number) => (
                                    <div key={index} className="border rounded-lg overflow-hidden group print-no-break">
                                        <div className="w-full aspect-video bg-muted relative">
                                            <Image src={photo.src} alt={photo.label} layout="fill" className="object-cover" />
                                        </div>
                                        <p className="text-xs text-muted-foreground p-2 truncate">{photo.label}</p>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {reportData.maintenancePhotos.length > 0 && (
                        <Section icon={Wrench} title="Maintenance Photos">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {reportData.maintenancePhotos.map((photo: {src: string, label: string}, index: number) => (
                                    <div key={index} className="border rounded-lg overflow-hidden group print-no-break">
                                        <div className="w-full aspect-video bg-muted relative">
                                            <Image src={photo.src} alt={photo.label} layout="fill" className="object-cover" />
                                        </div>
                                        <p className="text-xs text-muted-foreground p-2 truncate">{photo.label}</p>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {reportData.accidentPhotos.length > 0 && (
                         <Section icon={AlertTriangle} title="Accident Photos">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {reportData.accidentPhotos.map((photo: {src: string, label: string}, index: number) => (
                                    <div key={index} className="border rounded-lg overflow-hidden group print-no-break">
                                        <div className="w-full aspect-video bg-muted relative">
                                            <Image src={photo.src} alt={photo.label} layout="fill" className="object-cover" />
                                        </div>
                                        <p className="text-xs text-muted-foreground p-2 truncate">{photo.label}</p>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                </div>
            )}
            
            {modalContent && modalContent.type === 'trip' && (
                <TripDetailDialog trip={modalContent.data} onOpenChange={() => setModalContent(null)} parentData={modalContent.parentData} />
            )}
            {modalContent && modalContent.type === 'maintenance' && (
                <MaintenanceDetailDialog record={modalContent.data} onOpenChange={() => setModalContent(null)} parentData={modalContent.parentData} />
            )}
            {modalContent && modalContent.type === 'accident' && (
                <AccidentDetailDialog accident={modalContent.data} onOpenChange={() => setModalContent(null)} parentData={modalContent.parentData} />
            )}
        </div>
    );
}

