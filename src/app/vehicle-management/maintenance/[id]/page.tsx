
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Car, User, Wrench, Calendar, Building, FileText, Package, DollarSign, Text } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import type { MaintenanceRecord } from '../components/maintenance-entry-form';
import type { Vehicle } from '../components/vehicle-table';
import type { MaintenanceType } from '../components/maintenance-type-table';
import type { ServiceCenter } from '../components/service-center-table';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { MaintenanceExpenseType } from '../components/maintenance-expense-type-table';
import type { Part as PartType } from '../components/part-table';
import type { Driver } from '../components/driver-entry-form';

const documentCategories: Record<keyof MaintenanceRecord['documents'], string> = {
    workOrder: 'Work Order / Job Card',
    repairInvoice: 'Repair Invoice / Bill',
    partsInvoice: 'Parts Replacement Invoice (If separate)',
    quotation: 'Quotation / Estimate',
    paymentProof: 'Payment Proof',
    checklist: 'Maintenance Checklist / Service Report',
    beforeAfterPhotos: 'Before & After Photos',
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


export default function MaintenanceProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [vehicleManagementData] = useLocalStorage<any>('vehicleManagementData', {});
  const {
      maintenanceRecords = [],
      vehicles = [],
      drivers = [],
      parts = [],
      maintenanceTypes = [],
      serviceCenters = [],
      employees = [],
      maintenanceExpenseTypes = [],
  } = vehicleManagementData;


  const [record, setRecord] = useState<MaintenanceRecord | null | undefined>(undefined);

  useEffect(() => {
    if (typeof id !== 'string' || maintenanceRecords.length === 0) {
        setRecord(undefined); // Stay in loading state
        return;
    }
    
    const foundRecord = maintenanceRecords.find((t: MaintenanceRecord) => t.id === id);
    
    if (foundRecord) {
        setRecord(foundRecord);
    } else {
        notFound();
    }
  }, [id, maintenanceRecords, notFound]);

  const { vehicle, maintenanceType, serviceCenter, employee, driver, totalCost } = useMemo(() => {
    if (!record) return {};
    const vehicle = vehicles.find((v: Vehicle) => v.id === record.vehicleId);
    const maintenanceType = maintenanceTypes.find((t: MaintenanceType) => t.id === record.maintenanceTypeId);
    const serviceCenter = serviceCenters.find((sc: ServiceCenter) => sc.id === record.serviceCenterId);
    const employee = employees.find((e: Employee) => e.id === record.monitoringEmployeeId);
    const driver = drivers.find((d: Driver) => d.id === record.driverId);
    const partsCost = record.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
    const expensesCost = record.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
    return { vehicle, maintenanceType, serviceCenter, employee, driver, totalCost: partsCost + expensesCost };
  }, [record, vehicles, maintenanceTypes, serviceCenters, employees, drivers]);
  
  const getExpenseTypeName = (id: string) => maintenanceExpenseTypes.find((et: MaintenanceExpenseType) => et.id === id)?.name || 'N/A';
  const getPartName = (partId: string) => parts.find((p: PartType) => p.id === partId)?.name || 'N/A';

  if (record === undefined) {
      return <div className="flex justify-center items-center h-full"><p>Loading maintenance record...</p></div>;
  }
  
  if (record === null) {
      notFound();
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back to Maintenance List</Button>
       </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="text-3xl">Maintenance: {maintenanceType?.name || 'Record'}</CardTitle>
            <CardDescription>For Vehicle: {vehicle?.registrationNumber || 'N/A'} on {record.serviceDate}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="parts">Parts</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Service Details</h3>
                    <ul className="space-y-4 text-sm">
                        <InfoItem icon={Car} label="Vehicle" value={vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'N/A'} />
                        <InfoItem icon={Wrench} label="Maintenance Type" value={maintenanceType?.name} />
                        <InfoItem icon={Building} label="Service Center" value={serviceCenter?.name} />
                        <InfoItem icon={User} label="Monitoring Employee" value={employee?.fullName} />
                         <InfoItem icon={User} label="Driver During Service" value={driver?.name} />
                    </ul>
                </div>
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Dates & Description</h3>
                     <ul className="space-y-4 text-sm">
                        <InfoItem icon={Calendar} label="Service Date" value={record.serviceDate} />
                        <InfoItem icon={Calendar} label="Upcoming Service Date" value={record.upcomingServiceDate} />
                        <InfoItem icon={Text} label="Description / Remarks" value={record.description} />
                    </ul>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Cost Summary</h3>
                     <ul className="space-y-4 text-sm">
                         <InfoItem icon={DollarSign} label="Total Cost" value={totalCost?.toLocaleString('en-US', { style: 'currency', currency: 'USD'})} />
                    </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="parts" className="mt-6">
                 <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Parts Used</h3>
                 {record.parts && record.parts.length > 0 ? (
                    <Table>
                        <TableHeader><TableRow><TableHead>Part Name</TableHead><TableHead>Brand</TableHead><TableHead>Quantity</TableHead><TableHead>Price</TableHead><TableHead>Warranty</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {record.parts.map(part => (
                                <TableRow key={part.id}>
                                    <TableCell>{getPartName(part.partId)}</TableCell>
                                    <TableCell>{part.brand}</TableCell>
                                    <TableCell>{part.quantity}</TableCell>
                                    <TableCell>{part.price.toLocaleString('en-US', { style: 'currency', currency: 'USD'})}</TableCell>
                                    <TableCell>{part.warranty}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 ) : (
                    <p className="text-sm text-muted-foreground">No parts were recorded for this service.</p>
                 )}
            </TabsContent>

            <TabsContent value="expenses" className="mt-6">
                <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Expenses</h3>
                {record.expenses && record.expenses.length > 0 ? (
                <Table>
                    <TableHeader><TableRow><TableHead>Expense Type</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {record.expenses.map(exp => (
                            <TableRow key={exp.id}>
                                <TableCell>{getExpenseTypeName(exp.expenseTypeId)}</TableCell>
                                <TableCell className="text-right">{exp.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD'})}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                ) : (
                    <p className="text-sm text-muted-foreground">No additional expenses were recorded.</p>
                )}
            </TabsContent>

            <TabsContent value="documents" className="pt-4">
                 <div className="space-y-6">
                    {(Object.keys(documentCategories) as (keyof MaintenanceRecord['documents'])[]).map(key => (
                        record.documents[key] && record.documents[key].length > 0 && (
                             <DocumentViewer key={key} files={record.documents[key]} categoryLabel={documentCategories[key]} />
                        )
                    ))}
                    {Object.values(record.documents).every(arr => !arr || arr.length === 0) && (
                         <p className="text-sm text-muted-foreground text-center py-8">No documents were uploaded for this record.</p>
                    )}
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

    