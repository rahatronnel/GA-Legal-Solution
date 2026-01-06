
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { VehicleManagementProvider, useVehicleManagement } from '@/app/vehicle-management/components/vehicle-management-provider';
import { type Driver } from '@/app/vehicle-management/components/driver-entry-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, User, FileText, Phone, Cake, VenetianMask, UserSquare2, Download, Printer,
    Home, Mail, ShieldCheck, Calendar, Briefcase, Car, Users, Clock, Wrench, AlertTriangle, Eye
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import type { Vehicle } from '../../components/vehicle-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Accident } from '../../components/accident-entry-form';
import type { MaintenanceRecord } from '../../components/maintenance-entry-form';
import type { MaintenanceType } from '../../components/maintenance-type-table';
import type { AccidentType } from '../../components/accident-type-table';


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
    const fileName = `${label.replace(/\s+/g, '_')}.${mimeType.split('/')[1]}`;
  
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

function DriverProfileContent() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { data } = useVehicleManagement();
  const { 
      drivers,
      vehicles,
      accidents,
      maintenanceRecords,
      maintenanceTypes,
      accidentTypes
  } = data;
  
  const [driver, setDriver] = useState<Driver | null | undefined>(undefined);
  const { handlePrint } = usePrint();

  useEffect(() => {
    if (typeof id !== 'string' || !drivers) {
      setDriver(undefined); // Still loading
      return;
    }

    if (drivers.length > 0) {
      const foundDriver = drivers.find((d: Driver) => d.id === id);
      setDriver(foundDriver || null); // Set to null if not found after data is loaded
    } else if (data) { // This handles when data is loaded but drivers array is empty.
      const timer = setTimeout(() => setDriver(null), 200); // Delay to prevent flicker
      return () => clearTimeout(timer);
    }
  }, [id, drivers, data]);


  const driverAccidentHistory = useMemo(() => {
    if (!id || !accidents) return [];
    return accidents.filter((accident: Accident) => accident.driverId === id);
  }, [id, accidents]);

  const driverMaintenanceHistory = useMemo(() => {
      if (!id || !vehicles || !maintenanceRecords) return [];
      const assignedVehicleIds = vehicles.filter((v: Vehicle) => {
          const currentDriver = v.driverAssignmentHistory?.sort((a,b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())[0];
          return currentDriver?.driverId === id;
      }).map((v: Vehicle) => v.id);

      if (assignedVehicleIds.length === 0) return [];
      return maintenanceRecords.filter((record: MaintenanceRecord) => assignedVehicleIds.includes(record.vehicleId));
  }, [id, vehicles, maintenanceRecords]);

  if (driver === undefined) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading driver profile...</p>
      </div>
    );
  }

  if (driver === null) {
      notFound();
  }
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const assignedVehicle = vehicles.find((v: Vehicle) => v.id === driver.assignedVehicleId);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  const getMaintenanceTypeName = (typeId: string) => (maintenanceTypes || []).find((t: MaintenanceType) => t.id === typeId)?.name || 'N/A';
  const getAccidentTypeName = (typeId: string) => (accidentTypes || []).find((t: AccidentType) => t.id === typeId)?.name || 'N/A';
  const getVehicleRegFromId = (vehicleId: string) => (vehicles || []).find((v: Vehicle) => v.id === vehicleId)?.registrationNumber || 'N/A';


  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Driver List
        </Button>
        <Button onClick={() => handlePrint(driver, 'driver')}>
          <Printer className="mr-2 h-4 w-4" />
          Print Profile
        </Button>
       </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
                <AvatarImage src={driver.profilePicture} alt={driver.name} />
                <AvatarFallback className="text-3xl">{getInitials(driver.name)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-3xl">{driver.name}</CardTitle>
                <CardDescription>Driver ID: {driver.driverIdCode}</CardDescription>
                <CardDescription className="mt-1">Department: {driver.department || 'N/A'}</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="accidents">Accident History</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Personal Information</h3>
                    <ul className="space-y-4 text-sm">
                        <InfoItem icon={UserSquare2} label="Father's/Guardian's Name" value={driver.fatherOrGuardianName} />
                        <InfoItem icon={Cake} label="Date of Birth" value={formatDate(driver.dateOfBirth)} />
                        <InfoItem icon={VenetianMask} label="Gender" value={driver.gender} />
                        <InfoItem icon={FileText} label="National ID / Passport" value={driver.nationalIdOrPassport} />
                    </ul>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Contact Information</h3>
                     <ul className="space-y-4 text-sm">
                        <InfoItem icon={Phone} label="Mobile Number" value={driver.mobileNumber} />
                        <InfoItem icon={Mail} label="Alternate Mobile Number" value={driver.alternateMobileNumber} />
                        <InfoItem icon={Home} label="Present Address" value={driver.presentAddress} />
                        <InfoItem icon={Home} label="Permanent Address" value={driver.permanentAddress} />
                    </ul>
                </div>
                
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">License Information</h3>
                     <ul className="space-y-4 text-sm">
                        <InfoItem icon={ShieldCheck} label="Driving License Number" value={driver.drivingLicenseNumber} />
                        <InfoItem icon={ShieldCheck} label="License Type" value={driver.licenseType} />
                        <InfoItem icon={Calendar} label="License Issue Date" value={formatDate(driver.licenseIssueDate)} />
                        <InfoItem icon={Calendar} label="License Expiry Date" value={formatDate(driver.licenseExpiryDate)} />
                        <InfoItem icon={Briefcase} label="Issuing Authority" value={driver.issuingAuthority} />
                    </ul>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Employment Details</h3>
                     <ul className="space-y-4 text-sm">
                        <InfoItem icon={Calendar} label="Joining Date" value={formatDate(driver.joiningDate)} />
                        <InfoItem icon={Briefcase} label="Employment Type" value={driver.employmentType} />
                        <InfoItem icon={Briefcase} label="Department / Unit" value={driver.department} />
                        <InfoItem icon={Clock} label="Duty Shift / Schedule" value={driver.dutyShift} />
                        <InfoItem icon={Users} label="Supervisor" value={driver.supervisor} />
                        <InfoItem icon={Car} label="Assigned Vehicle" value={assignedVehicle?.registrationNumber || 'None'} />
                    </ul>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="accidents" className="mt-6">
                <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Accident History</h3>
                {driverAccidentHistory.length > 0 ? (
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Accident Date</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Accident Type</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {driverAccidentHistory.map(accident => (
                                <TableRow key={accident.id}>
                                    <TableCell>{accident.accidentDate}</TableCell>
                                    <TableCell>{getVehicleRegFromId(accident.vehicleId)}</TableCell>
                                    <TableCell>{getAccidentTypeName(accident.accidentTypeId)}</TableCell>
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
                    <p className="text-sm text-muted-foreground text-center py-8">No accident history found for this driver.</p>
                )}
            </TabsContent>
             <TabsContent value="maintenance" className="mt-6">
                 <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Maintenance History on Assigned Vehicles</h3>
                {driverMaintenanceHistory.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service Date</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Maintenance Type</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {driverMaintenanceHistory.map(record => (
                                <TableRow key={record.id}>
                                    <TableCell>{record.serviceDate}</TableCell>
                                    <TableCell>{getVehicleRegFromId(record.vehicleId)}</TableCell>
                                    <TableCell>{getMaintenanceTypeName(record.maintenanceTypeId)}</TableCell>
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
                    <p className="text-sm text-muted-foreground text-center py-8">No maintenance history found for vehicles assigned to this driver.</p>
                )}
            </TabsContent>
             <TabsContent value="documents">
                <div className="space-y-6 pt-4">
                    <DocumentViewer doc={driver.documents.drivingLicense} label="Driving License" />
                    <DocumentViewer doc={driver.documents.nid} label="National ID (NID)" />
                    <DocumentViewer doc={driver.documents.other} label="Other Document" />
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DriverProfilePageWrapper() {
    return (
        <VehicleManagementProvider>
            <DriverProfileContent />
        </VehicleManagementProvider>
    )
}

    