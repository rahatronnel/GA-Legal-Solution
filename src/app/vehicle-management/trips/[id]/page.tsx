
'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
import { ArrowLeft, Download, Printer, Car, User, Flag, Calendar, Clock, Route, Milestone, Info, Hash, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ExpenseType } from '../../components/expense-type-table';
import { Separator } from '@/components/ui/separator';

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


const InfoItem: React.FC<{icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean}> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <p className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</p>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
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
      trips = [],
      vehicles = [],
      drivers = [],
      purposes = [],
      locations = [],
      expenseTypes = []
  } = data;


  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const { handlePrint } = usePrint();

  useEffect(() => {
    if (typeof id !== 'string') return;
    if (trips.length > 0) {
      const foundTrip = trips.find((t: Trip) => t.id === id);
      setTrip(foundTrip || null);
    }
  }, [id, trips]);

  const { vehicle, driver, purpose, totalDistance, totalExpenses, itinerary } = useMemo(() => {
    if (!trip) return {};
    const vehicle = vehicles.find((v: Vehicle) => v.id === trip.vehicleId);
    const driver = drivers.find((d: Driver) => d.id === trip.driverId);
    const purpose = purposes.find((p: TripPurpose) => p.id === trip.purposeId);
    const totalDistance = (trip.endingMeter > trip.startingMeter) ? trip.endingMeter - trip.startingMeter : 0;
    const totalExpenses = trip.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
    const itinerary = trip.stops?.map(stop => locations.find(l => l.id === stop.locationId)?.name).filter(Boolean);
    
    return { vehicle, driver, purpose, totalDistance, totalExpenses, itinerary };
  }, [trip, vehicles, drivers, purposes, locations]);
  
  const getExpenseTypeName = (id: string) => expenseTypes.find((et: ExpenseType) => et.id === id)?.name || 'N/A';

  if (trip === undefined) {
      return <div className="flex justify-center items-center h-full"><p>Loading trip profile...</p></div>;
  }

  if (trip === null) {
      notFound();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader className="text-center">
                    <Route className="mx-auto h-16 w-16 text-muted-foreground" />
                    <CardTitle className="text-2xl pt-4">{trip.tripId}</CardTitle>
                    <CardDescription>{purpose?.name || 'Trip'}</CardDescription>
                    <Badge variant={getStatusVariant(trip.tripStatus)} className="mx-auto mt-2 text-base">{trip.tripStatus}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Button onClick={() => handlePrint(trip, 'trip')} className="w-full"><Printer className="mr-2 h-4 w-4"/>Print Trip</Button>
                     <Button variant="outline" onClick={() => router.back()} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Key Details</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <InfoItem icon={Car} label="Vehicle" value={vehicle?.registrationNumber} />
                    <InfoItem icon={User} label="Driver" value={driver?.name} />
                    <InfoItem icon={Calendar} label="Start Date" value={`${trip.startDate} ${trip.startTime}`} />
                    <InfoItem icon={Hash} label="Total Distance" value={`${totalDistance} km`} />
                    <InfoItem icon={DollarSign} label="Total Expenses" value={totalExpenses?.toFixed(2)} />
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
                    <CardHeader><CardTitle>Itinerary</CardTitle></CardHeader>
                    <CardContent>
                        {itinerary && itinerary.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                                {itinerary.map((locationName, index) => (
                                    <React.Fragment key={index}>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-base">{locationName}</Badge>
                                        </div>
                                        {index < itinerary.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        ): ( <p className="text-sm text-muted-foreground">No itinerary defined.</p> )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                        <InfoItem icon={Clock} label="End Date & Time" value={`${trip.endDate} ${trip.endTime}`} />
                        <InfoItem icon={Flag} label="Purpose" value={purpose?.name} />
                        <InfoItem icon={Milestone} label="Starting Meter" value={`${trip.startingMeter} km`} />
                        <InfoItem icon={Milestone} label="Ending Meter" value={`${trip.endingMeter} km`} />
                        <InfoItem icon={Info} label="Remarks" value={trip.remarks} fullWidth/>
                    </CardContent>
                 </Card>
                 {trip.expenses && trip.expenses.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Expenses</CardTitle></CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>
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
        </div>
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
