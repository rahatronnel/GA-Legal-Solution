
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Car, User, Wrench, Calendar, Building, FileText, Package, Tag, DollarSign, Text, MapPin, Clock, Shield, AlertTriangle, CheckSquare, XSquare, Landmark, Route, Fingerprint, HeartPulse, ShieldQuestion, Printer } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrint } from '../../components/print-provider';

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
            <CardContent className="grid gap-4">
                {files.map((doc, index) => {
                    const isImage = doc.file.startsWith('data:image/');
                    const fileName = doc.name;
                    return (
                        <div key={index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-medium text-sm truncate">{fileName}</p>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={doc.file} download={fileName} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4"/>Download</Link>
                                </Button>
                            </div>
                             {isImage && (
                                <div className="mt-2 rounded-lg overflow-hidden flex justify-center items-center bg-muted/50" style={{maxHeight: '400px'}}>
                                    <Image src={doc.file} alt={fileName} width={600} height={400} className="object-contain" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
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
  const { handlePrint } = usePrint();

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

  const [accident, setAccident] = useState<Accident | null | undefined>(undefined);

  useEffect(() => {
    if (id && accidents) {
      const foundRecord = accidents.find(t => t.id === id);
      if (foundRecord) {
        setAccident(foundRecord);
      } else if (accidents.length > 0) {
        const timer = setTimeout(() => {
          const recheck = accidents.find(t => t.id === id);
          if(!recheck) notFound();
        }, 500); 
        return () => clearTimeout(timer);
      }
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
  

  if (accident === undefined) {
    return <div className="flex justify-center items-center h-full"><p>Loading accident record...</p></div>;
  }

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back to Accident List</Button>
         <Button onClick={() => handlePrint(accident, 'accident')}><Printer className="mr-2 h-4 w-4" />Print Report</Button>
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
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-8">
              <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-primary border-b pb-2">Incident Details</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                      <ul className="space-y-4 text-sm">
                          <InfoItem icon={Car} label="Vehicle" value={vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'N/A'} />
                          <InfoItem icon={User} label="Driver" value={driver?.name} />
                          <InfoItem icon={User} label="Reporting Employee" value={employee?.fullName} />
                          <InfoItem icon={Text} label="Description" value={accident.description} />
                      </ul>
                      <ul className="space-y-4 text-sm">
                           <InfoItem icon={Calendar} label="Accident Date" value={accident.accidentDate} />
                           <InfoItem icon={Clock} label="Accident Time" value={accident.accidentTime} />
                           <InfoItem icon={MapPin} label="Location" value={accident.location} />
                      </ul>
                       <ul className="space-y-4 text-sm">
                           <InfoItem icon={Route} label="Route" value={route?.name} />
                           <InfoItem icon={Fingerprint} label="Trip ID" value={trip?.tripId} />
                      </ul>
                  </div>
              </div>

               <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-primary border-b pb-2">Classification & Damage</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                      <ul className="space-y-4 text-sm">
                          <InfoItem icon={Tag} label="Accident Type" value={accidentType?.name} />
                          <InfoItem icon={AlertTriangle} label="Severity Level" value={severityLevel?.name} />
                          <InfoItem icon={Shield} label="Fault Status" value={faultStatus?.name} />
                      </ul>
                       <ul className="space-y-4 text-sm">
                          <InfoItem icon={Wrench} label="Vehicle Damage" value={accident.vehicleDamageDescription} />
                          <InfoItem icon={Car} label="Vehicle Status After Accident" value={accident.vehicleStatusAfterAccident} />
                          <InfoItem icon={ShieldQuestion} label="Third-Party Damage" value={accident.thirdPartyDamage} />
                          <InfoItem icon={HeartPulse} label="Human Injury" value={accident.humanInjury} />
                       </ul>
                  </div>
              </div>

               <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-primary border-b pb-2">Financial & Legal</h3>
                   <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                      <ul className="space-y-4 text-sm">
                          <InfoItem icon={DollarSign} label="Estimated Repair Cost" value={formatCurrency(accident.estimatedRepairCost)} />
                          <InfoItem icon={DollarSign} label="Actual Repair Cost" value={formatCurrency(accident.actualRepairCost)} />
                          <InfoItem icon={DollarSign} label="Third-Party Damage Cost" value={formatCurrency(accident.thirdPartyDamageCost)} />
                          <InfoItem icon={Building} label="Repaired By (Garage)" value={repairedBy?.name} />
                          <InfoItem icon={Package} label="Repair Payment Status" value={accident.repairPaymentStatus} />
                      </ul>
                      <ul className="space-y-4 text-sm">
                           <InfoItem icon={accident.policeReportFiled ? CheckSquare : XSquare} label="Police Report Filed?" value={accident.policeReportFiled ? 'Yes' : 'No'} />
                            {accident.policeReportFiled && <>
                               <InfoItem icon={FileText} label="Report Number" value={accident.policeReportNumber} />
                               <InfoItem icon={Landmark} label="Police Station" value={accident.policeStation} />
                            </>}
                      </ul>
                       <ul className="space-y-4 text-sm">
                           <InfoItem icon={accident.insuranceClaimFiled ? CheckSquare : XSquare} label="Insurance Claim Filed?" value={accident.insuranceClaimFiled ? 'Yes' : 'No'} />
                            {accident.insuranceClaimFiled && <>
                               <InfoItem icon={FileText} label="Claim Number" value={accident.insuranceClaimNumber} />
                               <InfoItem icon={Building} label="Insurance Company" value={accident.insuranceCompany} />
                            </>}
                      </ul>
                   </div>
              </div>

            </TabsContent>

            <TabsContent value="documents" className="pt-4">
                 <div className="grid md:grid-cols-1 gap-6">
                    {(Object.keys(documentCategories) as (keyof Accident['documents'])[]).map(key => (
                        accident.documents[key] && accident.documents[key].length > 0 && (
                             <DocumentViewer key={key} files={accident.documents[key]} categoryLabel={documentCategories[key]} />
                        )
                    ))}
                    {Object.values(accident.documents).every(arr => arr.length === 0) && (
                         <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No documents were uploaded for this record.</p>
                    )}
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

    