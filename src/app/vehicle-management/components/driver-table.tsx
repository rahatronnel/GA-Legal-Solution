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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/hooks';
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

type Driver = {
  id: string;
  name: string;
  licenseNumber: string;
  contactNumber: string;
};

export function DriverTable() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Partial<Driver> | null>(null);
  const [driverData, setDriverData] = useState({ name: '', licenseNumber: '', contactNumber: '' });

  const driversCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'drivers') : null),
    [firestore]
  );

  const { data: drivers, isLoading } = useCollection<Driver>(driversCollection);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setDriverData(prev => ({ ...prev, [id]: value }));
  };

  const resetForm = () => {
    setCurrentDriver(null);
    setDriverData({ name: '', licenseNumber: '', contactNumber: '' });
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setCurrentDriver(driver);
    setDriverData({ name: driver.name, licenseNumber: driver.licenseNumber, contactNumber: driver.contactNumber });
    setIsDialogOpen(true);
  };

  const handleDelete = (driver: Driver) => {
    setCurrentDriver(driver);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (firestore && currentDriver?.id) {
      try {
        await deleteDoc(doc(firestore, 'drivers', currentDriver.id));
        toast({ title: 'Success', description: 'Driver deleted successfully.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    }
    setIsDeleteConfirmOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!driverData.name.trim() || !driverData.licenseNumber.trim() || !driverData.contactNumber.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'All fields are required.' });
      return;
    }

    if (firestore && driversCollection) {
      try {
        if (currentDriver?.id) {
          const docRef = doc(firestore, 'drivers', currentDriver.id);
          await updateDoc(docRef, driverData);
          toast({ title: 'Success', description: 'Driver updated successfully.' });
        } else {
          await addDoc(driversCollection, driverData);
          toast({ title: 'Success', description: 'Driver added successfully.' });
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    }
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Driver</Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>License Number</TableHead>
              <TableHead>Contact Number</TableHead>
              <TableHead className="w-[50px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : drivers && drivers.length > 0 ? (
              drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>{driver.name}</TableCell>
                  <TableCell>{driver.licenseNumber}</TableCell>
                  <TableCell>{driver.contactNumber}</TableCell>
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
                <TableCell colSpan={4} className="text-center">No drivers found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentDriver?.id ? 'Edit' : 'Add'} Driver</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={driverData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="licenseNumber" className="text-right">License No.</Label>
              <Input id="licenseNumber" value={driverData.licenseNumber} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactNumber" className="text-right">Contact No.</Label>
              <Input id="contactNumber" value={driverData.contactNumber} onChange={handleInputChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
