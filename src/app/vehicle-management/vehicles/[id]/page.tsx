
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { VehicleManagementProvider, useVehicleManagement } from '@/app/vehicle-management/components/vehicle-management-provider';
import { type Vehicle } from '@/app/vehicle-management/components/vehicle-entry-form';
import { type Driver } from '@/app/vehicle-management/components/driver-entry-form';
import { type VehicleType } from '@/app/vehicle-management/components/vehicle-type-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, Car, FileText, Download, Printer, Users, Wrench,
    Calendar, Fuel, Info, Hash, Palette, Building, CheckCircle, Eye, AlertTriangle
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


const InfoItem: React.FC<{icon: React.ElementType, label: string, value: React.ReactNode}> = ({ icon: Icon, label, value }) => (
    <li className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
        <div>
            <p className="font-medium">{label}</p>
            <p className="text-muted-foreground">{value || 'N/A'}</p>
        </div>
    </li>
);

function VehicleProfileContent() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { data } = useVehicleManagement();
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

  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined);
  const { handlePrint } = usePrint();

  useEffect(() => {
    if (typeof id !== 'string' || !vehicles) {
        setVehicle(undefined);
        return;
    }
    
    const foundVehicle = vehicles.find((v: Vehicle) => v.id === id);
    if (foundVehicle) {
        setVehicle(foundVehicle);
    } else {
        notFound();
    }
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


  if (vehicle === undefined) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading vehicle profile...</p>
      </div>
    );
  }

  if (vehicle === null) {
      notFound();
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

  const documentLabels: Record<keyof Vehicle['documents'], string> = {
    registration: "Registration Certificate (RC / Blue Book)",
    insurance: "Insurance Certificate",
    fitness: "Fitness Certificate",
    taxToken: "Tax Token / Road Tax Receipt",
    routePermit: "Route Permit",
    other: "Other Document"
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-wrap justify-between items-center gap-4">
         <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Vehicle List
        </Button>
        <Button variant="outline" onClick={() => handlePrint(vehicle, 'vehicle')}>
          <Printer className="mr-2 h-4 w-4" />
          Print Profile
        </Button>
       </div>
      
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-3xl">{vehicleBrand?.name} {vehicle.model}</CardTitle>
                    <CardDescription>Reg No: {vehicle.registrationNumber}</CardDescription>
                    <CardDescription className="mt-1">Vehicle ID: {vehicle.vehicleIdCode}</CardDescription>
                </div>
                 <Badge variant={getStatusVariant(vehicle.status)} className="text-base">{vehicle.status}</Badge>
            </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
              <TabsTrigger value="accidents">Accident History</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Vehicle Details</h3>
                    <ul className="space-y-4 text-sm">
                        <InfoItem icon={Car} label="Category" value={vehicleType?.name} />
                        <InfoItem icon={Palette} label="Brand & Model" value={`${vehicleBrand?.name} ${vehicle.model}`} />
                        <InfoItem icon={Calendar} label="Manufacture Year" value={vehicle.manufactureYear} />
                        <InfoItem icon={Fuel} label="Fuel Type" value={vehicle.fuelType} />
                        <InfoItem icon={Users} label="Capacity" value={vehicle.capacity} />
                    </ul>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Identification</h3>
                     <ul className="space-y-4 text-sm">
                        <InfoItem icon={Hash} label="Engine Number" value={vehicle.engineNumber} />
                        <InfoItem icon={Hash} label="Chassis Number" value={vehicle.chassisNumber} />
                        <InfoItem icon={Building} label="Ownership" value={vehicle.ownership} />
                        <InfoItem icon={Users} label="Current Driver" value={currentDriver?.name} />
                        <InfoItem icon={CheckCircle} label="Status" value={vehicle.status} />
                    </ul>
                </div>
              </div>
            </TabsContent>

             <TabsContent value="maintenance" className="mt-6">
                 <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Maintenance History</h3>
                {vehicleMaintenanceHistory.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service Date</TableHead>
                                <TableHead>Maintenance Type</TableHead>
                                <TableHead>Total Cost</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicleMaintenanceHistory.map((record: MaintenanceRecord) => (
                                <TableRow key={record.id}>
                                    <TableCell>{record.serviceDate}</TableCell>
                                    <TableCell>{getMaintenanceTypeName(record.maintenanceTypeId)}</TableCell>
                                    <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculateMaintenanceTotalCost(record))}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/vehicle-management/maintenance/${record.id}`}><Eye className="h-4 w-4" /></Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No maintenance history found for this vehicle.</p>
                )}
            </TabsContent>

             <TabsContent value="accidents" className="mt-6">
                 <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Accident History</h3>
                {vehicleAccidentHistory.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Accident Date</TableHead>
                                <TableHead>Accident Type</TableHead>
                                <TableHead>Driver</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicleAccidentHistory.map((accident: Accident) => (
                                <TableRow key={accident.id}>
                                    <TableCell>{accident.accidentDate}</TableCell>
                                    <TableCell>{getAccidentTypeName(accident.accidentTypeId)}</TableCell>
                                    <TableCell>{drivers.find((d: Driver) => d.id === accident.driverId)?.name || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/vehicle-management/accidents/${accident.id}`}><AlertTriangle className="h-4 w-4 text-destructive" /></Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                     <p className="text-sm text-muted-foreground text-center py-8">No accident history found for this vehicle.</p>
                )}
            </TabsContent>
            
            <TabsContent value="documents">
                <div className="space-y-6 pt-4">
                    {(Object.keys(documentLabels) as (keyof Vehicle['documents'])[]).map(key => (
                        <DocumentViewer key={key} doc={vehicle.documents[key]} label={documentLabels[key]} />
                    ))}
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VehicleProfilePage() {
    return (
        <VehicleManagementProvider>
            <VehicleProfileContent />
        </VehicleManagementProvider>
    );
}
