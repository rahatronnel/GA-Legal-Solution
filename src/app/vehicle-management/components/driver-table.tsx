
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { PlusCircle, Edit, Trash2, Download, Upload, Eye, User, Printer, Search, Trash } from 'lucide-react';
import { DriverEntryForm, type Driver } from './driver-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePrint } from './print-provider';
import type { Vehicle } from './vehicle-table';
import { useDriverData } from './vehicle-management-provider';
import { useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export function DriverTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { drivers, vehicles, isLoading } = useDriverData();
  const { handlePrint } = usePrint();
  
  const driversRef = useMemoFirebase(() => firestore ? collection(firestore, 'drivers') : null, [firestore]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Partial<Driver> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];

  const filteredDrivers = useMemo(() => {
    if (!searchTerm) return safeDrivers;
    const lowercasedTerm = searchTerm.toLowerCase();
    return safeDrivers.filter(driver => 
      (driver.name && driver.name.toLowerCase().includes(lowercasedTerm)) ||
      (driver.driverIdCode && driver.driverIdCode.toLowerCase().includes(lowercasedTerm)) ||
      (driver.mobileNumber && driver.mobileNumber.toLowerCase().includes(lowercasedTerm)) ||
      (driver.drivingLicenseNumber && driver.drivingLicenseNumber.toLowerCase().includes(lowercasedTerm))
    );
  }, [safeDrivers, searchTerm]);

  const handleAdd = () => {
    setCurrentDriver(null);
    setIsFormOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setCurrentDriver(driver);
    setIsFormOpen(true);
  };

  const handleSave = (data: Omit<Driver, 'id'>, id?: string) => {
    if (!driversRef) {
        toast({ variant: "destructive", title: "Error", description: "Database not connected." });
        return;
    }

    if (id) {
        setDocumentNonBlocking(doc(driversRef, id), data, { merge: true });
        toast({ title: 'Success', description: 'Driver updated successfully.' });
    } else {
        const newDriver: Omit<Driver, 'id'> = { ...data };
        addDocumentNonBlocking(driversRef, newDriver);
        toast({ title: 'Success', description: 'Driver added successfully.' });
    }
  };

  const handleDelete = (driver: Driver) => {
    setCurrentDriver(driver);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentDriver?.id && driversRef) {
        deleteDocumentNonBlocking(doc(driversRef, currentDriver.id));
        toast({ title: 'Success', description: 'Driver deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    setCurrentDriver(null);
  };
  
  const confirmDeleteAll = () => {
     if (!driversRef) return;
     safeDrivers.forEach(driver => {
         deleteDocumentNonBlocking(doc(driversRef, driver.id));
     });
    toast({ title: 'Success', description: 'All driver records are being deleted.' });
    setIsDeleteAllConfirmOpen(false);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 
      driverIdCode: '',
      name: '',
      fatherOrGuardianName: '',
      dateOfBirth: 'YYYY-MM-DD',
      gender: 'Male/Female/Other',
      mobileNumber: '',
      alternateMobileNumber: '',
      nationalIdOrPassport: '',
      drivingLicenseNumber: '',
      licenseType: 'Light/Heavy/Professional',
      licenseIssueDate: 'YYYY-MM-DD',
      licenseExpiryDate: 'YYYY-MM-DD',
      issuingAuthority: '',
      presentAddress: '',
      permanentAddress: '',
      joiningDate: 'YYYY-MM-DD',
      employmentType: 'Permanent/Contract/Temporary',
      department: '',
      dutyShift: '',
      supervisor: '',
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Drivers');
    XLSX.writeFile(wb, 'DriverTemplate.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && driversRef) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { dateNF: 'yyyy-mm-dd', cellDates: true }) as any[];

          const requiredHeaders = ['driverIdCode', 'name', 'mobileNumber'];
          const headers = Object.keys(json[0] || {});
          if (!requiredHeaders.every(h => headers.includes(h))) {
             throw new Error('Invalid Excel file format. Expecting columns: driverIdCode, name, mobileNumber.');
          }

          const newDrivers: Omit<Driver, 'id'>[] = json
            .filter(item => item.name && item.name.toString().trim() && item.driverIdCode)
            .map(item => ({ 
              driverIdCode: item.driverIdCode?.toString().trim() || '',
              name: item.name?.toString().trim() || '',
              fatherOrGuardianName: item.fatherOrGuardianName?.toString().trim() || '',
              dateOfBirth: item.dateOfBirth?.toString().trim() || '',
              gender: item.gender?.toString().trim() || '',
              mobileNumber: item.mobileNumber?.toString().trim() || '',
              alternateMobileNumber: item.alternateMobileNumber?.toString().trim() || '',
              profilePicture: '',
              documents: { drivingLicense: '', nid: '', other: '' },
              nationalIdOrPassport: item.nationalIdOrPassport?.toString().trim() || '',
              drivingLicenseNumber: item.drivingLicenseNumber?.toString().trim() || '',
              licenseType: item.licenseType?.toString().trim() || '',
              licenseIssueDate: item.licenseIssueDate?.toString().trim() || '',
              licenseExpiryDate: item.licenseExpiryDate?.toString().trim() || '',
              issuingAuthority: item.issuingAuthority?.toString().trim() || '',
              presentAddress: item.presentAddress?.toString().trim() || '',
              permanentAddress: item.permanentAddress?.toString().trim() || '',
              joiningDate: item.joiningDate?.toString().trim() || '',
              employmentType: item.employmentType?.toString().trim() || '',
              department: item.department?.toString().trim() || '',
              dutyShift: item.dutyShift?.toString().trim() || '',
              assignedVehicleId: '', // Cannot be imported from Excel easily
              supervisor: item.supervisor?.toString().trim() || '',
            }));
          
          if(newDrivers.length > 0) {
            newDrivers.forEach(driver => {
                addDocumentNonBlocking(driversRef, driver);
            });
            toast({ title: 'Success', description: `${newDrivers.length} drivers uploaded successfully.` });
          } else {
            toast({ variant: 'destructive', title: 'Upload Error', description: 'No valid drivers found in the file.' });
          }

        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Upload Error', description: error.message });
        }
      };
      reader.readAsArrayBuffer(file);
    }
    event.target.value = '';
  };


  return (
    <TooltipProvider>
      <div className="flex flex-col sm:flex-row justify-between gap-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, ID, mobile..."
            className="w-full rounded-lg bg-background pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
            <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Driver</Button>
            <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
            <label htmlFor="upload-excel-drivers" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Upload
            </label>
            <Input id="upload-excel-drivers" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
             <AlertDialog open={isDeleteAllConfirmOpen} onOpenChange={setIsDeleteAllConfirmOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={safeDrivers.length === 0}>
                        <Trash className="mr-2 h-4 w-4" /> Delete All
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all {safeDrivers.length} driver records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteAll}>
                            Yes, delete all
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Driver ID</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Employment Type</TableHead>
              <TableHead className="w-[160px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
              ))
            ) : filteredDrivers.length > 0 ? (
              filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                       {driver.profilePicture ? (
                           <Image src={driver.profilePicture} alt={driver.name} width={40} height={40} className="object-cover" />
                       ) : (
                           <User className="h-6 w-6 text-muted-foreground" />
                       )}
                    </div>
                    {driver.name}
                  </TableCell>
                  <TableCell>{driver.driverIdCode}</TableCell>
                  <TableCell>{driver.mobileNumber}</TableCell>
                  <TableCell>{driver.employmentType}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                             <Link href={`/vehicle-management/drivers/${driver.id}`}>
                               <Eye className="h-4 w-4" />
                             </Link>
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Profile</TooltipContent>
                      </Tooltip>
                       <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(driver)}>
                             <Edit className="h-4 w-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Driver</TooltipContent>
                      </Tooltip>
                       <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(driver, 'driver')}>
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Print</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(driver)}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Driver</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                    {searchTerm ? `No drivers found for "${searchTerm}".` : "No drivers found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DriverEntryForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        onSave={handleSave}
        driver={currentDriver}
        vehicles={safeVehicles}
      />

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the driver "{currentDriver?.name}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
