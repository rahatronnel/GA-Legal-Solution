
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
import { format, parse, isValid } from 'date-fns';


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
      setDriver(undefined);
      return;
    }
    if (drivers.length > 0) {
      const foundDriver = drivers.find((d: Driver) => d.id === id);
      setDriver(foundDriver || null);
    } else if (data) {
      const timer = setTimeout(() => setDriver(null), 200);
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
    return <div className="flex justify-center items-center h-full"><p>Loading driver profile...</p></div>;
  }

  if (driver === null) {
      notFound();
  }
  
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';

  const assignedVehicle = vehicles && driver.assignedVehicleId ? vehicles.find((v: Vehicle) => v.id === driver.assignedVehicleId) : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
        const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
        if(isValid(parsedDate)) return format(parsedDate, 'PPP');
        const parsedDate2 = parse(dateString, 'dd-MM-yyyy', new Date());
        if(isValid(parsedDate2)) return format(parsedDate2, 'PPP');
        return dateString;
    } catch(e) { return dateString; }
  }

  const getMaintenanceTypeName = (typeId: string) => (maintenanceTypes || []).find((t: MaintenanceType) => t.id === typeId)?.name || 'N/A';
  const getAccidentTypeName = (typeId: string) => (accidentTypes || []).find((t: AccidentType) => t.id === typeId)?.name || 'N/A';
  const getVehicleRegFromId = (vehicleId: string) => (vehicles || []).find((v: Vehicle) => v.id === vehicleId)?.registrationNumber || 'N/A';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
      {/* Left Column */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <Avatar className="mx-auto h-32 w-32 border-2 border-primary">
                <AvatarImage src={driver.profilePicture} alt={driver.name} />
                <AvatarFallback className="text-4xl">{getInitials(driver.name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl pt-4">{driver.name}</CardTitle>
            <CardDescription>Driver ID: {driver.driverIdCode}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <Button onClick={() => handlePrint(driver, 'driver')} className="w-full"><Printer className="mr-2 h-4 w-4"/>Print Profile</Button>
              <Button variant="outline" onClick={() => router.back()} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Button>
          </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
                <InfoItem icon={Phone} label="Mobile" value={driver.mobileNumber} />
                <InfoItem icon={Phone} label="Alternate Mobile" value={driver.alternateMobileNumber} />
                <InfoItem icon={Home} label="Present Address" value={driver.presentAddress} />
            </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-2 space-y-6">
        <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
                <Card>
                    <CardHeader><CardTitle>Personal & License Details</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                        <InfoItem icon={UserSquare2} label="Father's/Guardian's Name" value={driver.fatherOrGuardianName} />
                        <InfoItem icon={Cake} label="Date of Birth" value={formatDate(driver.dateOfBirth)} />
                        <InfoItem icon={VenetianMask} label="Gender" value={driver.gender} />
                        <InfoItem icon={FileText} label="National ID / Passport" value={driver.nationalIdOrPassport} />
                        <InfoItem icon={ShieldCheck} label="Driving License Number" value={driver.drivingLicenseNumber} />
                        <InfoItem icon={ShieldCheck} label="License Type" value={driver.licenseType} />
                        <InfoItem icon={Calendar} label="License Issue Date" value={formatDate(driver.licenseIssueDate)} />
                        <InfoItem icon={Calendar} label="License Expiry Date" value={formatDate(driver.licenseExpiryDate)} />
                        <InfoItem icon={Briefcase} label="Issuing Authority" value={driver.issuingAuthority} fullWidth />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                        <InfoItem icon={Calendar} label="Joining Date" value={formatDate(driver.joiningDate)} />
                        <InfoItem icon={Briefcase} label="Employment Type" value={driver.employmentType} />
                        <InfoItem icon={Building} label="Department / Unit" value={driver.department} />
                        <InfoItem icon={Clock} label="Duty Shift / Schedule" value={driver.dutyShift} />
                        <InfoItem icon={Users} label="Supervisor" value={driver.supervisor} />
                        <InfoItem icon={Car} label="Currently Assigned Vehicle" value={assignedVehicle?.registrationNumber || 'None'} />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-6 mt-6">
                <Card>
                    <CardHeader><CardTitle>Accident History</CardTitle></CardHeader>
                    <CardContent>
                        {driverAccidentHistory.length > 0 ? (
                            <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Vehicle</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {driverAccidentHistory.map(accident => (
                                        <TableRow key={accident.id}><TableCell>{accident.accidentDate}</TableCell><TableCell>{getVehicleRegFromId(accident.vehicleId)}</TableCell><TableCell>{getAccidentTypeName(accident.accidentTypeId)}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" asChild><Link href={`/vehicle-management/accidents/${accident.id}`}><Eye className="h-4 w-4" /></Link></Button></TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : <p className="text-sm text-muted-foreground text-center py-4">No accidents recorded.</p>}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="documents" className="pt-4 space-y-6">
                <DocumentViewer doc={driver.documents.drivingLicense} label="Driving License" />
                <DocumentViewer doc={driver.documents.nid} label="National ID (NID)" />
                <DocumentViewer doc={driver.documents.other} label="Other Document" />
            </TabsContent>
        </Tabs>
      </div>
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
