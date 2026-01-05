
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Car, User, Wrench, Calendar, Building, FileText, Package, Tag, DollarSign, Text, MapPin, Clock, Shield, AlertTriangle, CheckSquare, XSquare, Landmark, Route, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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


const DocumentViewer = ({ doc, label }: { doc: {label: string, file: string}; label: string }) => {
    if (!doc || !doc.file) return null;
  
    const isImage = doc.file.startsWith('data:image/');
    const fileName = `${label.replace(/\s+/g, '_')}.${doc.file.substring(doc.file.indexOf('/') + 1, doc.file.indexOf(';'))}`;
  
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{doc.label}</CardTitle>
                <Button variant="outline" size="sm" asChild>
                    <Link href={doc.file} download={fileName} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4"/>Download</Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="mt-4 border rounded-lg overflow-hidden flex justify-center items-center bg-muted/50" style={{minHeight: '400px'}}>
                    {isImage ? (
                        <Image src={doc.file} alt={doc.label} width={800} height={600} className="object-contain" />
                    ) : (
                        <div className="p-8 text-center">
                            <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                            <p className="font-semibold mt-4">Preview not available</p>
                            <p className="text-sm text-muted-foreground">Download the file to view its contents.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
};

const InfoItem: React.FC<{icon: React.ElementType, label: string, value: React.ReactNode}> = ({ icon: Icon, label, value }) => (
    <li className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
        <div>
            <p className="font-medium">{label}</p>
            <p className="text-muted-foreground">{value || 'N/A'}</p>
        </div>
    </li>
);


export default function AccidentProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [accidents] = useLocalStorage<Accident[]>('accidents', []);
  const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [drivers] = useLocalStorage<Driver[]>('drivers', []);
  const [employees] = useLocalStorage<Employee[]>('employees', []);
  const [routes] = useLocalStorage<RouteType[]>('routes', []);
  const [trips] = useLocalStorage<Trip[]>('trips', []);
  const [accidentTypes] = useLocalStorage<AccidentType[]>('accidentTypes', []);
  const [severityLevels] = useLocalStorage<SeverityLevel[]>('severityLevels', []);
  const [faultStatuses] = useLocalStorage<FaultStatus[]>('faultStatuses', []);
  const [serviceCenters] = useLocalStorage<ServiceCenter[]>('serviceCenters', []);

  const [accident, setAccident] = useState<Accident | null>(null);

  useEffect(() => {
    if (id && accidents.length > 0) {
      const foundRecord = accidents.find(t => t.id === id);
      if (foundRecord) setAccident(foundRecord);
      else notFound();
    }
  }, [id, accidents]);

  const { vehicle, driver, employee, route, trip, accidentType, severityLevel, faultStatus, repairedBy } = useMemo(() => {
    if (!accident) return {};
    return {
        vehicle: vehicles.find(v => v.id === accident.vehicleId),
        driver: drivers.find(d => d.id === accident.driverId),
        employee: employees.find(e => e.id === accident.employeeId),
        route: routes.find(r => r.id === accident.routeId),
        trip: trips.find(t => t.id === accident.tripId),
        accidentType: accidentTypes.find(t => t.id === accident.accidentTypeId),
        severityLevel: severityLevels.find(sl => sl.id === accident.severityLevelId),
        faultStatus: faultStatuses.find(fs => fs.id === accident.faultStatusId),
        repairedBy: serviceCenters.find(sc => sc.id === accident.repairedById)
    };
  }, [accident, vehicles, drivers, employees, routes, trips, accidentTypes, severityLevels, faultStatuses, serviceCenters]);
  

  if (!accident) return <div className="flex justify-center items-center h-full"><p>Loading accident record...</p></div>;

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back to Accident List</Button>
       </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="text-3xl">Accident Record: {accident.accidentId}</CardTitle>
            <CardDescription>Vehicle: {vehicle?.registrationNumber || 'N/A'} on {accident.accidentDate}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="legal">Legal & Insurance</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Incident Details</h3>
                    <ul className="space-y-4 text-sm">
                        <InfoItem icon={Car} label="Vehicle" value={vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'N/A'} />
                        <InfoItem icon={User} label="Driver" value={driver?.name} />
                        <InfoItem icon={User} label="Reporting Employee" value={employee?.fullName} />
                        <InfoItem icon={Calendar} label="Accident Date" value={accident.accidentDate} />
                        <InfoItem icon={Clock} label="Accident Time" value={accident.accidentTime} />
                        <InfoItem icon={MapPin} label="Location" value={accident.location} />
                        <InfoItem icon={Route} label="Route" value={route?.name} />
                        <InfoItem icon={Fingerprint} label="Trip ID" value={trip?.tripId} />
                        <InfoItem icon={Text} label="Description" value={accident.description} />
                    </ul>
                </div>
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Classification</h3>
                     <ul className="space-y-4 text-sm">
                        <InfoItem icon={Tag} label="Accident Type" value={accidentType?.name} />
                        <InfoItem icon={AlertTriangle} label="Severity Level" value={severityLevel?.name} />
                        <InfoItem icon={Shield} label="Fault Status" value={faultStatus?.name} />
                    </ul>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Damage Details</h3>
                     <ul className="space-y-2 text-sm list-disc list-inside">
                        <li>No details specified.</li>
                    </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="financial" className="mt-6">
                 <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Financial Information</h3>
                 <ul className="space-y-4 text-sm max-w-md">
                    <InfoItem icon={DollarSign} label="Estimated Repair Cost" value={accident.estimatedRepairCost?.toLocaleString('en-US', { style: 'currency', currency: 'USD'})} />
                    <InfoItem icon={DollarSign} label="Actual Repair Cost" value={accident.actualRepairCost?.toLocaleString('en-US', { style: 'currency', currency: 'USD'})} />
                    <InfoItem icon={DollarSign} label="Third-Party Damage Cost" value={accident.thirdPartyDamageCost?.toLocaleString('en-US', { style: 'currency', currency: 'USD'})} />
                    <InfoItem icon={Building} label="Repaired By (Garage)" value={repairedBy?.name} />
                    <InfoItem icon={Package} label="Repair Payment Status" value={accident.repairPaymentStatus} />
                 </ul>
            </TabsContent>

            <TabsContent value="legal" className="mt-6">
                <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Legal & Insurance Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-semibold">Police Report</h4>
                        <ul className="space-y-4 text-sm">
                           <InfoItem icon={accident.policeReportFiled ? CheckSquare : XSquare} label="Report Filed?" value={accident.policeReportFiled ? 'Yes' : 'No'} />
                            {accident.policeReportFiled && <>
                               <InfoItem icon={FileText} label="Report Number" value={accident.policeReportNumber} />
                               <InfoItem icon={Landmark} label="Police Station" value={accident.policeStation} />
                            </>}
                        </ul>
                    </div>
                     <div className="space-y-4">
                        <h4 className="font-semibold">Insurance Claim</h4>
                         <ul className="space-y-4 text-sm">
                           <InfoItem icon={accident.insuranceClaimFiled ? CheckSquare : XSquare} label="Claim Filed?" value={accident.insuranceClaimFiled ? 'Yes' : 'No'} />
                            {accident.insuranceClaimFiled && <>
                               <InfoItem icon={FileText} label="Claim Number" value={accident.insuranceClaimNumber} />
                               <InfoItem icon={Building} label="Insurance Company" value={accident.insuranceCompany} />
                            </>}
                        </ul>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="documents" className="pt-4">
                 <div className="grid md:grid-cols-2 gap-4">
                    {accident.documents && accident.documents.length > 0 ? accident.documents.map(doc => (
                        <DocumentViewer key={doc.id} doc={doc} label={doc.label} />
                    )) : (
                        <p className="text-sm text-muted-foreground col-span-2">No documents were uploaded for this record.</p>
                    )}
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
