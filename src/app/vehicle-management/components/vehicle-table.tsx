
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
import { PlusCircle, Edit, Trash2, Download, Upload, Search, Eye, Printer } from 'lucide-react';
import { VehicleEntryForm, type Vehicle } from './vehicle-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePrint } from './print-provider';
import type { Driver } from './driver-entry-form';
import { format, parseISO } from 'date-fns';

type VehicleType = {
  id: string;
  name: string;
};

// Helper function to get the current driver for a vehicle
const getCurrentDriver = (vehicle: Vehicle, drivers: Driver[]) => {
    if (!vehicle.driverAssignmentHistory || vehicle.driverAssignmentHistory.length === 0) {
        return null;
    }
    const sortedHistory = [...vehicle.driverAssignmentHistory].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    const latestAssignment = sortedHistory[0];
    return drivers.find(d => d.id === latestAssignment.driverId) || null;
};


export function VehicleTable() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [drivers] = useLocalStorage<Driver[]>('drivers', []);
  const [vehicleTypes] = useLocalStorage<VehicleType[]>('vehicleTypes', []);
  const { handlePrint } = usePrint();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Partial<Vehicle> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Faking a loading state
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return vehicles;
    const lowercasedTerm = searchTerm.toLowerCase();
    return vehicles.filter(vehicle => 
      (vehicle.vehicleIdCode && vehicle.vehicleIdCode.toLowerCase().includes(lowercasedTerm)) ||
      (vehicle.registrationNumber && vehicle.registrationNumber.toLowerCase().includes(lowercasedTerm)) ||
      (vehicle.make && vehicle.make.toLowerCase().includes(lowercasedTerm)) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(lowercasedTerm))
    );
  }, [vehicles, searchTerm]);


  const handleAdd = () => {
    setCurrentVehicle(null);
    setIsFormOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleSave = (data: Omit<Vehicle, 'id'>, id?: string) => {
    if (id) {
        setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...data } as Vehicle : v));
        toast({ title: 'Success', description: 'Vehicle updated successfully.' });
    } else {
        const newVehicle: Vehicle = { id: Date.now().toString(), ...data };
        setVehicles(prev => [...prev, newVehicle]);
        toast({ title: 'Success', description: 'Vehicle added successfully.' });
    }
  };

  const handleDelete = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentVehicle?.id) {
        setVehicles(prev => prev.filter(v => v.id !== currentVehicle.id));
        toast({ title: 'Success', description: 'Vehicle deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    setCurrentVehicle(null);
  };
  
  const getStatusVariant = (status: Vehicle['status']) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Under Maintenance': return 'secondary';
      case 'Inactive': return 'destructive';
      default: return 'outline';
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 
      vehicleIdCode: '',
      registrationNumber: '',
      vehicleCategory: '', // Name for user-friendliness
      engineNumber: '',
      chassisNumber: '',
      make: '', // Brand
      model: '',
      manufactureYear: '',
      fuelType: 'Petrol/Diesel/CNG/LPG/Electric',
      capacity: '',
      ownership: 'Company/Rental',
      status: 'Active/Under Maintenance/Inactive',
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vehicles');
    XLSX.writeFile(wb, 'VehicleTemplate.xlsx');
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

          const requiredHeaders = ['vehicleIdCode', 'registrationNumber', 'make', 'model'];
          const headers = Object.keys(json[0] || {});
          if (!requiredHeaders.every(h => headers.includes(h))) {
             throw new Error('Invalid Excel file format. Expecting columns: vehicleIdCode, registrationNumber, make, model.');
          }

          const newVehicles: Vehicle[] = json
            .filter(item => item.vehicleIdCode && item.registrationNumber)
            .map(item => {
              const vehicleType = vehicleTypes.find(vt => vt.name === item.vehicleCategory);

              return {
                id: Date.now().toString() + item.vehicleIdCode, 
                vehicleIdCode: item.vehicleIdCode?.toString() || '',
                registrationNumber: item.registrationNumber?.toString() || '',
                vehicleTypeId: vehicleType?.id || '',
                engineNumber: item.engineNumber?.toString() || '',
                chassisNumber: item.chassisNumber?.toString() || '',
                make: item.make?.toString() || '',
                model: item.model?.toString() || '',
                manufactureYear: item.manufactureYear?.toString() || '',
                fuelType: item.fuelType?.toString() || '',
                capacity: item.capacity?.toString() || '',
                ownership: item.ownership?.toString() || '',
                status: item.status?.toString() || '',
                driverAssignmentHistory: [], // Driver history can't be imported this way
                documents: {
                    registration: '',
                    insurance: '',
                    fitness: '',
                    taxToken: '',
                    routePermit: '',
                    other: ''
                }
              }
            });
          
          if(newVehicles.length > 0) {
            setVehicles(prev => [...prev, ...newVehicles]);
            toast({ title: 'Success', description: `${newVehicles.length} vehicles uploaded successfully.` });
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
    <Card>
        <CardHeader>
            <CardTitle>Vehicles</CardTitle>
            <CardDescription>Manage all vehicles in your organization.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row justify-between gap-2 mb-4">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by ID, Reg. No..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                  <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle</Button>
                  <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                  <label htmlFor="upload-excel-vehicles" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" /> Upload
                  </label>
                  <Input id="upload-excel-vehicles" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
              </div>
            </div>
          <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Vehicle ID</TableHead>
                    <TableHead>Registration No.</TableHead>
                    <TableHead>Brand & Model</TableHead>
                    <TableHead>Assigned Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[160px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                    </TableRow>
                ) : filteredVehicles && filteredVehicles.length > 0 ? (
                    filteredVehicles.map((v) => (
                    <TableRow key={v.id}>
                        <TableCell>{v.vehicleIdCode}</TableCell>
                        <TableCell>{v.registrationNumber}</TableCell>
                        <TableCell>{v.make} {v.model}</TableCell>
                        <TableCell>{getCurrentDriver(v, drivers)?.name || 'N/A'}</TableCell>
                        <TableCell>
                           <Badge variant={getStatusVariant(v.status)}>{v.status || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <Link href={`/vehicle-management/vehicles/${v.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Vehicle</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(v)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Vehicle</TooltipContent>
                            </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(v, 'vehicle')}>
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Print</TooltipContent>
                              </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(v)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Vehicle</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                       {searchTerm ? `No vehicles found for "${searchTerm}".` : "No vehicles found."}
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
    </Card>

      <VehicleEntryForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        onSave={handleSave}
        vehicle={currentVehicle}
      />

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the vehicle with registration "{currentVehicle?.registrationNumber}".
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
