
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useVehicleManagement } from '@/app/vehicle-management/components/vehicle-management-provider';
import { type Vehicle } from '@/app/vehicle-management/components/vehicle-entry-form';
import { type Driver } from '@/app/vehicle-management/components/driver-entry-form';
import { type VehicleType } from '@/app/vehicle-management/components/vehicle-type-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, Car, FileText, Download, Printer, Users, Wrench,
    Calendar, Fuel, Info, Hash, Palette, Building, CheckCircle, Eye, AlertTriangle, User as UserIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import type { MaintenanceRecord } from '../../components/maintenance-entry-form';
import type { Accident } from '../../components/accident-entry-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MaintenanceType } from '../../components/maintenance-type-table';
import type { AccidentType } from '../../components/accident-type-table';
import type { VehicleBrand } from '../../components/vehicle-brand-table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';


const DocumentViewer = ({ doc, label }: { doc: string; label: string }) => {
    if (!doc) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">This document has not been uploaded.</p>
            </CardContent>
        </Card>
      );
    }
  
    const mimeType = doc.substring(doc.indexOf(':') + 1, doc.indexOf(';'));
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';
    const fileName = `${label.replace(/\s+/g, '_')}.${isPdf ? 'pdf' : mimeType.split('/')[1]}`;
  
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{label}</CardTitle>
                <Button variant="outline" size="sm" asChild>
                    <Link href={doc} download={fileName} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4"/>
                        Download
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="mt-4 border rounded-lg overflow-hidden flex justify-center items-center bg-muted/50" style={{minHeight: '400px'}}>
                    {isImage ? (
                        <Image src={doc} alt={`${label} document`} width={800} height={600} className="object-contain" />
                    ) : isPdf ? (
                        <object data={doc} type="application/pdf" width="100%" height="800px">
                            <p className="p-4 text-center">Your browser does not support PDFs. Please <Link href={doc} download={fileName} className="text-primary underline">download the PDF</Link> to view it.</p>
                        </object>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="font-semibold">Preview not available</p>
                            <p className="text-sm text-muted-foreground mb-4">You can download the file to view it.</p>
                            <Button asChild>
                                <Link href={doc} download={fileName}>
                                    <Download className="mr-2 h-4 w-4"/>
                                    Download File
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
};


const InfoItem: React.FC<{icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean}> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <p className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</p>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
);

export default function VehicleProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { data, isLoading } = useVehicleManagement();
  const { 
      vehicles, 
      drivers, 
      vehicleTypes, 
      vehicleBrands, 
      maintenanceRecords, 
      maintenanceTypes, 
      accidents, 
      accidentTypes 
  } = data;

  const { handlePrint } = usePrint();

  const vehicle = useMemo(() => {
    if (!id || !vehicles) return undefined;
    return vehicles.find((v: Vehicle) => v.id === id) || null;
  }, [id, vehicles]);

  const vehicleMaintenanceHistory = useMemo(() => {
    if (!id || !maintenanceRecords) return [];
    return maintenanceRecords.filter((record: MaintenanceRecord) => record.vehicleId === id);
  }, [id, maintenanceRecords]);

  const vehicleAccidentHistory = useMemo(() => {
    if (!id || !accidents) return [];
    return accidents.filter((accident: Accident) => accident.vehicleId === id);
  }, [id, accidents]);

  const currentDriver = useMemo(() => {
    if (!vehicle || !vehicle.driverAssignmentHistory || vehicle.driverAssignmentHistory.length === 0 || !drivers) {
      return null;
    }
    const sortedHistory = [...vehicle.driverAssignmentHistory].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    const latestAssignment = sortedHistory[0];
    return drivers.find((d: Driver) => d.id === latestAssignment.driverId) || null;
  }, [vehicle, drivers]);
  
  const sortedDriverHistory = useMemo(() => {
    if (!vehicle || !vehicle.driverAssignmentHistory) return [];
    return [...vehicle.driverAssignmentHistory].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
  }, [vehicle]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><p>Loading vehicle profile...</p></div>;
  }

  if (vehicle === null) {
      notFound();
  }
  
  if (!vehicle) {
      return null;
  }
  
  const vehicleType = vehicleTypes.find((vt: VehicleType) => vt.id === vehicle.vehicleTypeId);
  const vehicleBrand = vehicleBrands.find((vb: VehicleBrand) => vb.id === vehicle.brandId);
  
  const getStatusVariant = (status: Vehicle['status']) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Under Maintenance': return 'secondary';
      case 'Inactive': return 'destructive';
      default: return 'outline';
    }
  };
  
  const getMaintenanceTypeName = (typeId: string) => maintenanceTypes.find((t: MaintenanceType) => t.id === typeId)?.name || 'N/A';
  const getAccidentTypeName = (typeId: string) => accidentTypes.find((t: AccidentType) => t.id === typeId)?.name || 'N/A';
  const calculateMaintenanceTotalCost = (record: MaintenanceRecord) => {
    const partsCost = record.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
    const expensesCost = record.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
    return partsCost + expensesCost;
  }
  const getDriverName = (driverId: string) => drivers.find((d: Driver) => d.id === driverId)?.name || 'N/A';

  const documentLabels: Record<keyof Vehicle['documents'], string> = {
    registration: "Registration Certificate",
    insurance: "Insurance Certificate",
    fitness: "Fitness Certificate",
    taxToken: "Tax Token",
    routePermit: "Route Permit",
    other: "Other Document"
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
      {/* Left Column */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <Car className="mx-auto h-16 w-16 text-muted-foreground" />
            <CardTitle className="text-2xl pt-4">{vehicleBrand?.name} {vehicle.model}</CardTitle>
            <CardDescription>{vehicle.registrationNumber}</CardDescription>
            <Badge variant={getStatusVariant(vehicle.status)} className="mx-auto mt-2 text-base">{vehicle.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
              <Button onClick={() => handlePrint(vehicle, 'vehicle')} className="w-full"><Printer className="mr-2 h-4 w-4"/>Print Profile</Button>
              <Button variant="outline" onClick={() => router.back()} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Button>
          </CardContent>
        </Card>
        {currentDriver && (
             <Card>
                <CardHeader><CardTitle>Current Driver</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={currentDriver.profilePicture} alt={currentDriver.name} />
                        <AvatarFallback className="text-2xl">{currentDriver.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{currentDriver.name}</p>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/vehicle-management/drivers/${currentDriver.id}`}><Eye className="mr-2 h-4 w-4" />View Driver Profile</Link>
                    </Button>
                </CardContent>
             </Card>
        )}
      </div>
      
      {/* Right Column */}
      <div className="lg:col-span-2 space-y-6">
        <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Driver History</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
              <TabsTrigger value="accidents">Accident History</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
                <Card>
                    <CardHeader><CardTitle>Vehicle Details</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                        <InfoItem icon={Car} label="Category" value={vehicleType?.name} />
                        <InfoItem icon={Palette} label="Brand & Model" value={`${vehicleBrand?.name} ${vehicle.model}`} />
                        <InfoItem icon={Calendar} label="Manufacture Year" value={vehicle.manufactureYear} />
                        <InfoItem icon={Fuel} label="Fuel Type" value={vehicle.fuelType} />
                        <InfoItem icon={Users} label="Capacity" value={vehicle.capacity} />
                        <InfoItem icon={Building} label="Ownership" value={vehicle.ownership} />
                        <InfoItem icon={Hash} label="Engine Number" value={vehicle.engineNumber} />
                        <InfoItem icon={Hash} label="Chassis Number" value={vehicle.chassisNumber} />
                    </CardContent>
                </Card>
            </TabsContent>
            
             <TabsContent value="history" className="mt-6">
                <Card>
                    <CardHeader><CardTitle>Driver Assignment History</CardTitle></CardHeader>
                    <CardContent>
                        {sortedDriverHistory.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>Driver Name</TableHead><TableHead>Effective Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {sortedDriverHistory.map(assignment => (
                                        <TableRow key={assignment.id}>
                                            <TableCell>{getDriverName(assignment.driverId)}</TableCell>
                                            <TableCell>{new Date(assignment.effectiveDate).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/vehicle-management/drivers/${assignment.driverId}`}><Eye className="h-4 w-4" /></Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : <p className="text-sm text-muted-foreground text-center py-4">No driver assignment history.</p>}
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="maintenance" className="mt-6">
                 <Card>
                    <CardHeader><CardTitle>Maintenance History</CardTitle></CardHeader>
                    <CardContent>
                        {vehicleMaintenanceHistory.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Cost</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {vehicleMaintenanceHistory.map(record => (
                                        <TableRow key={record.id}><TableCell>{record.serviceDate}</TableCell><TableCell>{getMaintenanceTypeName(record.maintenanceTypeId)}</TableCell><TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculateMaintenanceTotalCost(record))}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" asChild><Link href={`/vehicle-management/maintenance/${record.id}`}><Eye className="h-4 w-4" /></Link></Button></TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : <p className="text-sm text-muted-foreground text-center py-4">No maintenance records.</p>}
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="accidents" className="mt-6">
                <Card>
                    <CardHeader><CardTitle>Accident History</CardTitle></CardHeader>
                    <CardContent>
                        {vehicleAccidentHistory.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Driver</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {vehicleAccidentHistory.map(accident => (
                                        <TableRow key={accident.id}><TableCell>{accident.accidentDate}</TableCell><TableCell>{getAccidentTypeName(accident.accidentTypeId)}</TableCell><TableCell>{drivers.find((d: Driver) => d.id === accident.driverId)?.name || 'N/A'}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" asChild><Link href={`/vehicle-management/accidents/${accident.id}`}><AlertTriangle className="h-4 w-4 text-destructive" /></Link></Button></TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : <p className="text-sm text-muted-foreground text-center py-4">No accident records.</p>}
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="documents" className="pt-4 space-y-6">
                {(Object.keys(documentLabels) as (keyof Vehicle['documents'])[]).map(key => (
                    <DocumentViewer key={key} doc={vehicle.documents[key]} label={documentLabels[key]} />
                ))}
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}
