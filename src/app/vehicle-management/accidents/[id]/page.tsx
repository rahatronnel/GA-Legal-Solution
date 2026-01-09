
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { VehicleManagementProvider, useVehicleManagement } from '@/app/vehicle-management/components/vehicle-management-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Car, User, Wrench, Calendar, Building, FileText, Package, Tag, DollarSign, Text, MapPin, Clock, Shield, AlertTriangle, CheckSquare, XSquare, Landmark, Route, Fingerprint, HeartPulse, ShieldQuestion, Printer } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrint } from '../../components/print-provider';
import { Separator } from '@/components/ui/separator';

import type { Accident } from '../../components/accident-entry-form';
import type { Vehicle } from '../../components/vehicle-table';
import type { Driver } from '../../components/driver-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Route as RouteType } from '../../components/route-table';
import type { Trip } from '../../components/trip-entry-form';
import type { AccidentType } from '../../components/accident-type-table';
import type { SeverityLevel } from '../../components/severity-level-table';
import type { FaultStatus } from '../../components/fault-status-table';
import type { ServiceCenter } from '../../components/service-center-table';

const documentCategories: Record<keyof Accident['documents'], string> = {
    accidentPhotos: 'Accident Photos',
    policeReport: 'Police Report',
    insuranceClaimForm: 'Insurance Claim Form',
    workshopQuotation: 'Workshop Quotation',
    repairInvoice: 'Repair Invoice',
    medicalReport: 'Medical Report (if any)',
};

const DocumentViewer = ({ files, categoryLabel }: { files: { name: string; file: string }[]; categoryLabel: string }) => {
    if (!files || files.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{categoryLabel}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                {files.map((doc, index) => {
                    const isImage = doc.file.startsWith('data:image/');
                    const fileName = doc.name;
                    return (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="font-medium text-sm truncate">{fileName}</p>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={doc.file} download={fileName} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4"/>Download</Link>
                                </Button>
                            </div>
                             {isImage && (
                                <div className="mt-2 rounded-lg overflow-hidden flex justify-center items-center bg-muted/50 aspect-video">
                                    <Image src={doc.file} alt={fileName} width={400} height={225} className="object-contain" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};


const InfoItem: React.FC<{icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean}> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <p className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</p>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
);


function AccidentProfileContent() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { handlePrint } = usePrint();

  const { data } = useVehicleManagement();
  const {
      accidents,
      vehicles,
      drivers,
      employees,
      routes,
      trips,
      accidentTypes,
      severityLevels,
      faultStatuses,
      serviceCenters,
  } = data;


  const [accident, setAccident] = useState<Accident | null | undefined>(undefined);

  useEffect(() => {
    if (typeof id !== 'string' || !accidents) {
        return; // Wait for data
    }

    if (accidents.length > 0) {
        const foundRecord = accidents.find((t: Accident) => t.id === id);
        setAccident(foundRecord || null);
    }
  }, [id, accidents]);


  const { vehicle, driver, employee, route, trip, accidentType, severityLevel, faultStatus, repairedBy } = useMemo(() => {
    if (!accident) return {};
    return {
        vehicle: vehicles.find((v: Vehicle) => v.id === accident.vehicleId),
        driver: drivers.find((d: Driver) => d.id === accident.driverId),
        employee: employees.find((e: Employee) => e.id === accident.employeeId),
        route: routes.find((r: RouteType) => r.id === accident.routeId),
        trip: trips.find((t: Trip) => t.id === accident.tripId),
        accidentType: accidentTypes.find((t: AccidentType) => t.id === accident.accidentTypeId),
        severityLevel: severityLevels.find((sl: SeverityLevel) => sl.id === accident.severityLevelId),
        faultStatus: faultStatuses.find((fs: FaultStatus) => fs.id === accident.faultStatusId),
        repairedBy: serviceCenters.find((sc: ServiceCenter) => sc.id === accident.repairedById)
    };
  }, [accident, vehicles, drivers, employees, routes, trips, accidentTypes, severityLevels, faultStatuses, serviceCenters]);
  

  if (accident === undefined) {
    return <div className="flex justify-center items-center h-full"><p>Loading accident record...</p></div>;
  }
  
  if (accident === null) {
      notFound();
  }

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
             <Card>
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-16 w-16 text-destructive" />
                    <CardTitle className="text-2xl pt-4">{accident.accidentId}</CardTitle>
                    <CardDescription>
                        {vehicle?.registrationNumber || 'N/A'} on {accident.accidentDate}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => handlePrint(accident, 'accident')} className="w-full"><Printer className="mr-2 h-4 w-4"/>Print Report</Button>
                    <Button variant="outline" onClick={() => router.back()} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Key Details</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <InfoItem icon={Car} label="Vehicle" value={vehicle ? `${vehicle.make} ${vehicle.model}` : ''} />
                    <InfoItem icon={User} label="Driver" value={driver?.name} />
                    <InfoItem icon={Calendar} label="Date & Time" value={`${accident.accidentDate} ${accident.accidentTime}`} />
                    <InfoItem icon={Tag} label="Type" value={accidentType?.name} />
                    <InfoItem icon={Shield} label="Severity" value={severityLevel?.name} />
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader><CardTitle>Incident Details</CardTitle></CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                            <InfoItem icon={MapPin} label="Location" value={accident.location} />
                            <InfoItem icon={User} label="Reporting Employee" value={employee?.fullName} />
                            <InfoItem icon={Route} label="Route" value={route?.name} />
                            <InfoItem icon={Fingerprint} label="Trip ID" value={trip?.tripId} />
                            <InfoItem icon={Text} label="Description" value={accident.description} fullWidth />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Classification & Damage</CardTitle></CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                            <InfoItem icon={ShieldQuestion} label="Fault Status" value={faultStatus?.name} />
                             <InfoItem icon={HeartPulse} label="Human Injury" value={accident.humanInjury} />
                            <InfoItem icon={Wrench} label="Vehicle Damage" value={accident.vehicleDamageDescription} fullWidth />
                            <InfoItem icon={Car} label="Vehicle Status After Accident" value={accident.vehicleStatusAfterAccident} />
                             <InfoItem icon={ShieldQuestion} label="Third-Party Damage" value={accident.thirdPartyDamage} />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Financial & Legal</CardTitle></CardHeader>
                         <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                            <InfoItem icon={DollarSign} label="Estimated Repair Cost" value={formatCurrency(accident.estimatedRepairCost)} />
                            <InfoItem icon={DollarSign} label="Actual Repair Cost" value={formatCurrency(accident.actualRepairCost)} />
                            <InfoItem icon={DollarSign} label="Third-Party Damage Cost" value={formatCurrency(accident.thirdPartyDamageCost)} />
                            <InfoItem icon={Building} label="Repaired By (Garage)" value={repairedBy?.name} />
                            <InfoItem icon={Package} label="Repair Payment Status" value={accident.repairPaymentStatus} />
                             <Separator className="col-span-2" />
                            <InfoItem icon={accident.policeReportFiled ? CheckSquare : XSquare} label="Police Report Filed?" value={accident.policeReportFiled ? `Yes (#${accident.policeReportNumber})` : 'No'} />
                            <InfoItem icon={Landmark} label="Police Station" value={accident.policeStation} />
                            <InfoItem icon={accident.insuranceClaimFiled ? CheckSquare : XSquare} label="Insurance Claim Filed?" value={accident.insuranceClaimFiled ? `Yes (#${accident.insuranceClaimNumber})` : 'No'} />
                            <InfoItem icon={Building} label="Insurance Company" value={accident.insuranceCompany} />
                         </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="documents" className="pt-4">
                    <div className="space-y-6">
                        {(Object.keys(documentCategories) as (keyof Accident['documents'])[]).map(key => (
                            accident.documents[key] && accident.documents[key].length > 0 && (
                                <DocumentViewer key={key} files={accident.documents[key]} categoryLabel={documentCategories[key]} />
                            )
                        ))}
                        {Object.values(accident.documents).every(arr => !arr || arr.length === 0) && (
                            <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No documents were uploaded for this record.</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    </div>
  );
}

export default function AccidentProfilePage() {
    return (
        <VehicleManagementProvider>
            <AccidentProfileContent />
        </VehicleManagementProvider>
    );
}
