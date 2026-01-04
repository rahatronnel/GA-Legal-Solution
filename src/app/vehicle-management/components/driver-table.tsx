"use client";

import React, { useState } from 'react';
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
import { useLocalStorage } from '@/hooks/use-local-storage';
import * as XLSX from 'xlsx';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Download, Upload } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DriverEntryForm, type Driver } from './driver-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function DriverTable() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useLocalStorage<Driver[]>('drivers', []);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Partial<Driver> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Faking a loading state
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAdd = () => {
    setCurrentDriver(null);
    setIsFormOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setCurrentDriver(driver);
    setIsFormOpen(true);
  };

  const handleSave = (data: Omit<Driver, 'id'>, id?: string) => {
    if (id) {
        setDrivers(prev => prev.map(d => d.id === id ? { id, ...data } : d));
        toast({ title: 'Success', description: 'Driver updated successfully.' });
    } else {
        const newDriver = { id: Date.now().toString(), ...data };
        setDrivers(prev => [...prev, newDriver]);
        toast({ title: 'Success', description: 'Driver added successfully.' });
    }
  };

  const handleDelete = (driver: Driver) => {
    setCurrentDriver(driver);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentDriver?.id) {
        setDrivers(prev => prev.filter(d => d.id !== currentDriver.id));
        toast({ title: 'Success', description: 'Driver deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    setCurrentDriver(null);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 
      driverIdCode: '',
      name: '',
      fatherOrGuardianName: '',
      dateOfBirth: '',
      gender: '',
      mobileNumber: '',
      alternateMobileNumber: '',
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Drivers');
    XLSX.writeFile(wb, 'DriverTemplate.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as any[];

          const requiredHeaders = ['driverIdCode', 'name', 'mobileNumber'];
          const headers = Object.keys(json[0] || {});
          if (!requiredHeaders.every(h => headers.includes(h))) {
             throw new Error('Invalid Excel file format. Expecting columns with headers like "driverIdCode", "name", etc.');
          }

          const newDrivers: Driver[] = json
            .filter(item => item.name && item.name.trim() && item.driverIdCode)
            .map(item => ({ 
              id: Date.now().toString() + item.driverIdCode, 
              driverIdCode: item.driverIdCode?.toString().trim() || '',
              name: item.name?.toString().trim() || '',
              fatherOrGuardianName: item.fatherOrGuardianName?.toString().trim() || '',
              dateOfBirth: item.dateOfBirth?.toString().trim() || '',
              gender: item.gender?.toString().trim() || '',
              mobileNumber: item.mobileNumber?.toString().trim() || '',
              alternateMobileNumber: item.alternateMobileNumber?.toString().trim() || '',
              documents: { drivingLicense: '', nid: '', other: '' },
            }));
          
          if(newDrivers.length > 0) {
            setDrivers(prev => [...prev, ...newDrivers]);
            toast({ title: 'Success', description: `${newDrivers.length} drivers uploaded successfully.` });
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
    <>
      <div className="flex justify-end gap-2 mb-4">
        <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Driver</Button>
        <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
        <Label htmlFor="upload-excel-drivers" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
            <Upload className="mr-2 h-4 w-4" /> Upload Excel
        </Label>
        <Input id="upload-excel-drivers" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead className="w-[50px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : drivers && drivers.length > 0 ? (
              drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>{driver.driverIdCode}</TableCell>
                  <TableCell>{driver.name}</TableCell>
                  <TableCell>{driver.mobileNumber}</TableCell>
                  <TableCell>{driver.gender}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(driver)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(driver)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No drivers found.</TableCell>
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
      />

      {/* Delete Confirmation Dialog */}
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
    </>
  );
}
