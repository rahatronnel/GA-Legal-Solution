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
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/hooks';
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { VehicleEntryForm } from './vehicle-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  registrationNumber: string;
  ownership: 'Company Vehicle' | 'Rental Vehicle' | 'Covered Van' | '';
  vehicleTypeId: string;
  driverId: string;
  documents: string[];
};

type VehicleType = {
  id: string;
  name: string;
};

type Driver = {
    id: string;
    name: string;
};

export function VehicleTable() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Partial<Vehicle> | null>(null);

  const vehiclesCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'vehicles') : null),
    [firestore]
  );
  const driversCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'drivers') : null),
    [firestore]
  );
  const vehicleTypesCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'vehicleTypes') : null),
    [firestore]
  );

  const { data: vehicles, isLoading: isLoadingVehicles } = useCollection<Vehicle>(vehiclesCollection);
  const { data: drivers, isLoading: isLoadingDrivers } = useCollection<Driver>(driversCollection);
  const { data: vehicleTypes, isLoading: isLoadingVehicleTypes } = useCollection<VehicleType>(vehicleTypesCollection);
  
  const getDriverName = (driverId: string) => drivers?.find(d => d.id === driverId)?.name || 'N/A';
  const getVehicleTypeName = (typeId: string) => vehicleTypes?.find(vt => vt.id === typeId)?.name || 'N/A';

  const handleAdd = () => {
    setCurrentVehicle(null);
    setIsFormOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (firestore && currentVehicle?.id) {
      try {
        await deleteDoc(doc(firestore, 'vehicles', currentVehicle.id));
        toast({ title: 'Success', description: 'Vehicle deleted successfully.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    }
    setIsDeleteConfirmOpen(false);
    setCurrentVehicle(null);
  };

  const isLoading = isLoadingVehicles || isLoadingDrivers || isLoadingVehicleTypes;

  return (
    <>
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Vehicles</CardTitle>
                    <CardDescription>Manage all vehicles in your organization.</CardDescription>
                </div>
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle</Button>
            </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Registration No.</TableHead>
                    <TableHead>Make</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Ownership</TableHead>
                    <TableHead>Vehicle Type</TableHead>
                    <TableHead>Assigned Driver</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                    </TableRow>
                ) : vehicles && vehicles.length > 0 ? (
                    vehicles.map((v) => (
                    <TableRow key={v.id}>
                        <TableCell>{v.registrationNumber}</TableCell>
                        <TableCell>{v.make}</TableCell>
                        <TableCell>{v.model}</TableCell>
                        <TableCell>{v.ownership}</TableCell>
                        <TableCell>{getVehicleTypeName(v.vehicleTypeId)}</TableCell>
                        <TableCell>{getDriverName(v.driverId)}</TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(v)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(v)} className="text-destructive">
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
                    <TableCell colSpan={7} className="text-center">No vehicles found.</TableCell>
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
        vehicle={currentVehicle}
        drivers={drivers || []}
        vehicleTypes={vehicleTypes || []}
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
    </>
  );
}
