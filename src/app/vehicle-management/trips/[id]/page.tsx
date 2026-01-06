
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { VehicleManagementProvider, useVehicleManagement } from '@/app/vehicle-management/components/vehicle-management-provider';
import { type Trip } from '@/app/vehicle-management/components/trip-entry-form';
import { type Vehicle } from '@/app/vehicle-management/components/vehicle-table';
import { type Driver } from '@/app/vehicle-management/components/driver-entry-form';
import { type TripPurpose } from '@/app/vehicle-management/components/trip-purpose-table';
import { type Location } from '@/app/vehicle-management/components/location-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, Car, User, Flag, Calendar, Clock, Route, Milestone, Info, Hash } from 'lucide-react';
import Link from 'next/link';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ExpenseType } from '../../components/expense-type-table';


const documentLabels: Record<keyof Omit<Trip['documents'], 'id'>, string> = {
    approvalDoc: 'Approval Document', fuelReceipt: 'Fuel Receipt/Memo', parkingBill: 'Parking Bill',
    tollBill: 'Toll Bill', miscExpense: 'Miscellaneous Expenses Bill', lunchBill: 'Lunch Bill',
    otherDoc: 'Other Document', damagePhoto: 'Damage Photo', routePermit: 'Route Permit Photo',
    specialApprove: 'Special Approval Document',
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


const InfoItem: React.FC<{icon: React.ElementType, label: string, value: React.ReactNode}> = ({ icon: Icon, label, value }) => (
    <li className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
        <div>
            <p className="font-medium">{label}</p>
            <p className="text-muted-foreground">{value || 'N/A'}</p>
        </div>
    </li>
);

const getStatusVariant = (status: Trip['tripStatus']) => {
    switch (status) {
        case 'Completed': return 'default';
        case 'Ongoing': return 'secondary';
        case 'Cancelled': return 'destructive';
        default: return 'outline';
    }
};

function TripProfileContent() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { data } = useVehicleManagement();
  const {
      trips,
      vehicles,
      drivers,
      purposes,
      locations,
      expenseTypes
  } = data;


  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const { handlePrint } = usePrint();

  useEffect(() => {
    if (typeof id !== 'string' || !trips) {
        setTrip(undefined);
        return;
    }
    
    const foundTrip = trips.find((t: Trip) => t.id === id);
    
    if (foundTrip) {
        setTrip(foundTrip);
    } else {
        notFound();
    }
  }, [id, trips]);

  const { vehicle, driver, purpose, startLocation, endLocation, totalDistance, totalExpenses } = useMemo(() => {
    if (!trip) return {};
    const vehicle = vehicles.find((v: Vehicle) => v.id === trip.vehicleId);
    const driver = drivers.find((d: Driver) => d.id === trip.driverId);
    const purpose = purposes.find((p: TripPurpose) => p.id === trip.purposeId);
    const startLocation = locations.find((l: Location) => l.id === trip.startLocationId);
    const endLocation = locations.find((l: Location) => l.id === trip.destinationLocationId);
    const totalDistance = (trip.endingMeter > trip.startingMeter) ? trip.endingMeter - trip.startingMeter : 0;
    const totalExpenses = trip.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
    return { vehicle, driver, purpose, startLocation, endLocation, totalDistance, totalExpenses };
  }, [trip, vehicles, drivers, purposes, locations]);
  
  const getExpenseTypeName = (id: string) => expenseTypes.find((et: ExpenseType) => et.id === id)?.name || 'N/A';

  if (trip === undefined) {
      return <div className="flex justify-center items-center h-full"><p>Loading trip profile...</p></div>;
  }

  if (trip === null) {
      notFound();
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back to Trip List</Button>
         <Button onClick={() => handlePrint(trip, 'trip')}><Printer className="mr-2 h-4 w-4" />Print Trip</Button>
       </div>
      
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-3xl">Trip ID: {trip.tripId}</CardTitle>
                    <CardDescription>Vehicle: {vehicle?.registrationNumber || 'N/A'}</CardDescription>
                </div>
                 <Badge variant={getStatusVariant(trip.tripStatus)} className="text-base">{trip.tripStatus}</Badge>
            </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Primary Details</h3>
                    <ul className="space-y-4 text-sm">
                        <InfoItem icon={Car} label="Vehicle" value={vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'N/A'} />
                        <InfoItem icon={User} label="Driver" value={driver?.name} />
                        <InfoItem icon={Flag} label="Purpose" value={purpose?.name} />
                        <InfoItem icon={Info} label="Remarks" value={trip.remarks} />
                    </ul>
                </div>
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Timeline</h3>
                     <ul className="space-y-4 text-sm">
                        <InfoItem icon={Calendar} label="Start Date" value={`${trip.startDate} ${trip.startTime}`} />
                        <InfoItem icon={Clock} label="End Date" value={`${trip.endDate} ${trip.endTime}`} />
                    </ul>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Route & Distance</h3>
                     <ul className="space-y-4 text-sm">
                        <InfoItem icon={Route} label="Route" value={`${startLocation?.name || 'N/A'} to ${endLocation?.name || 'N/A'}`} />
                        <InfoItem icon={Milestone} label="Starting Meter" value={`${trip.startingMeter} km`} />
                        <InfoItem icon={Milestone} label="Ending Meter" value={`${trip.endingMeter} km`} />
                        <InfoItem icon={Hash} label="Total Distance" value={`${totalDistance} km`} />
                    </ul>
                </div>
              </div>
               {trip.expenses && trip.expenses.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Expenses</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trip.expenses.map(exp => (
                                <TableRow key={exp.id}>
                                    <TableCell>{getExpenseTypeName(exp.expenseTypeId)}</TableCell>
                                    <TableCell>{exp.date}</TableCell>
                                    <TableCell className="text-right">{exp.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell colSpan={2}>Total Expenses</TableCell>
                                <TableCell className="text-right">{totalExpenses?.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
               )}
            </TabsContent>
            <TabsContent value="documents" className="pt-4">
                 <div className="space-y-6">
                    {(Object.keys(documentLabels) as (keyof Trip['documents'])[]).map(key => (
                        trip.documents[key] && trip.documents[key].length > 0 && (
                             <DocumentViewer key={key} files={trip.documents[key]} categoryLabel={documentLabels[key]} />
                        )
                    ))}
                    {Object.values(trip.documents).every(arr => !arr || arr.length === 0) && (
                         <p className="text-sm text-muted-foreground text-center py-8">No documents were uploaded for this trip.</p>
                    )}
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TripProfilePage() {
    return (
        <VehicleManagementProvider>
            <TripProfileContent />
        </VehicleManagementProvider>
    );
}
