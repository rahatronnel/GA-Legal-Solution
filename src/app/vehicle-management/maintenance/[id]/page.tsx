
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { VehicleManagementProvider, useVehicleManagement } from '@/app/vehicle-management/components/vehicle-management-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Car, User, Wrench, Calendar, Building, FileText, Package, DollarSign, Text } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

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


const InfoItem: React.FC<{icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean}> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <p className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</p>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
);


function MaintenanceProfileContent() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { data } = useVehicleManagement();
  const {
      maintenanceRecords,
      vehicles,
      drivers,
      parts,
      maintenanceTypes,
      serviceCenters,
      employees,
      maintenanceExpenseTypes,
  } = data;


  const [record, setRecord] = useState<MaintenanceRecord | null | undefined>(undefined);

  useEffect(() => {
    if (typeof id !== 'string' || !maintenanceRecords) {
        return; // Wait for data
    }
    
    if (maintenanceRecords.length > 0) {
        const foundRecord = maintenanceRecords.find((t: MaintenanceRecord) => t.id === id);
        setRecord(foundRecord || null);
    }
  }, [id, maintenanceRecords]);

  const { vehicle, maintenanceType, serviceCenter, employee, driver, totalCost, totalPartsCost, totalExpensesCost } = useMemo(() => {
    if (!record) return {};
    const vehicle = vehicles.find((v: Vehicle) => v.id === record.vehicleId);
    const maintenanceType = maintenanceTypes.find((t: MaintenanceType) => t.id === record.maintenanceTypeId);
    const serviceCenter = serviceCenters.find((sc: ServiceCenter) => sc.id === record.serviceCenterId);
    const employee = employees.find((e: Employee) => e.id === record.monitoringEmployeeId);
    const driver = drivers.find((d: Driver) => d.id === record.driverId);
    const partsCost = record.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
    const expensesCost = record.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
    return { vehicle, maintenanceType, serviceCenter, employee, driver, totalCost: partsCost + expensesCost, totalPartsCost: partsCost, totalExpensesCost: expensesCost };
  }, [record, vehicles, maintenanceTypes, serviceCenters, employees, drivers]);
  
  const getExpenseTypeName = (id: string) => maintenanceExpenseTypes.find((et: MaintenanceExpenseType) => et.id === id)?.name || 'N/A';
  const getPartName = (partId: string) => parts.find((p: PartType) => p.id === partId)?.name || 'N/A';
  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  if (record === undefined) {
      return <div className="flex justify-center items-center h-full"><p>Loading maintenance record...</p></div>;
  }
  
  if (record === null) {
      notFound();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader className="text-center">
                    <Wrench className="mx-auto h-16 w-16 text-muted-foreground" />
                    <CardTitle className="text-2xl pt-4">{maintenanceType?.name || 'Maintenance Record'}</CardTitle>
                    <CardDescription>
                        {vehicle?.registrationNumber || 'N/A'} on {record.serviceDate}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" onClick={() => router.back()} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Cost Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Parts:</span><span>{formatCurrency(totalPartsCost)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Expenses:</span><span>{formatCurrency(totalExpensesCost)}</span></div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-base"><span className="text-foreground">Total:</span><span>{formatCurrency(totalCost)}</span></div>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
             <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="parts">Parts</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                            <InfoItem icon={Car} label="Vehicle" value={vehicle ? `${vehicle.make} ${vehicle.model}` : ''} />
                            <InfoItem icon={User} label="Driver During Service" value={driver?.name} />
                            <InfoItem icon={Building} label="Service Center" value={serviceCenter?.name} />
                            <InfoItem icon={User} label="Monitoring Employee" value={employee?.fullName} />
                            <InfoItem icon={Calendar} label="Service Date" value={record.serviceDate} />
                            <InfoItem icon={Calendar} label="Upcoming Service Date" value={record.upcomingServiceDate} />
                            <InfoItem icon={Text} label="Description" value={record.description} fullWidth />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="parts" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Parts Used</CardTitle></CardHeader>
                        <CardContent>
                            {record.parts && record.parts.length > 0 ? (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Part Name</TableHead><TableHead>Brand</TableHead><TableHead>Quantity</TableHead><TableHead>Price</TableHead><TableHead>Warranty</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {record.parts.map(part => (
                                            <TableRow key={part.id}><TableCell>{getPartName(part.partId)}</TableCell><TableCell>{part.brand}</TableCell><TableCell>{part.quantity}</TableCell><TableCell>{formatCurrency(part.price)}</TableCell><TableCell>{part.warranty}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : <p className="text-sm text-muted-foreground">No parts were recorded.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="expenses" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Additional Expenses</CardTitle></CardHeader>
                        <CardContent>
                            {record.expenses && record.expenses.length > 0 ? (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Expense Type</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {record.expenses.map(exp => (
                                            <TableRow key={exp.id}><TableCell>{getExpenseTypeName(exp.expenseTypeId)}</TableCell><TableCell className="text-right">{formatCurrency(exp.amount)}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : <p className="text-sm text-muted-foreground">No additional expenses were recorded.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents" className="pt-4">
                    <div className="space-y-6">
                        {(Object.keys(documentCategories) as (keyof MaintenanceRecord['documents'])[]).map(key => (
                            record.documents[key] && record.documents[key].length > 0 && (
                                <DocumentViewer key={key} files={record.documents[key]} categoryLabel={documentCategories[key]} />
                            )
                        ))}
                        {Object.values(record.documents).every(arr => !arr || arr.length === 0) && (
                            <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No documents were uploaded for this record.</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    </div>
  );
}

export default function MaintenanceProfilePage() {
    return (
        <VehicleManagementProvider>
            <MaintenanceProfileContent />
        </VehicleManagementProvider>
    )
}
