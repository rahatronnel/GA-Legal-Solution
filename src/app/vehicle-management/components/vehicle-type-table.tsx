"use client";

import React, { useState, useMemo } from 'react';
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
import * as XLSX from 'xlsx';
import { MoreHorizontal, Download, Upload, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type VehicleType = {
  id: string;
  name: string;
};

export function VehicleTypeTable() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentVehicleType, setCurrentVehicleType] = useState<Partial<VehicleType> | null>(null);
  const [typeName, setTypeName] = useState('');

  const vehicleTypesCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'vehicleTypes') : null),
    [firestore]
  );

  const { data: vehicleTypes, isLoading } = useCollection<VehicleType>(vehicleTypesCollection);
  
  const handleAdd = () => {
    setCurrentVehicleType(null);
    setTypeName('');
    setIsDialogOpen(true);
  };

  const handleEdit = (vehicleType: VehicleType) => {
    setCurrentVehicleType(vehicleType);
    setTypeName(vehicleType.name);
    setIsDialogOpen(true);
  };

  const handleDelete = (vehicleType: VehicleType) => {
    setCurrentVehicleType(vehicleType);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (firestore && currentVehicleType?.id) {
      try {
        await deleteDoc(doc(firestore, 'vehicleTypes', currentVehicleType.id));
        toast({ title: 'Success', description: 'Vehicle type deleted successfully.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    }
    setIsDeleteConfirmOpen(false);
    setCurrentVehicleType(null);
  };

  const handleSave = async () => {
    if (!typeName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Vehicle type name cannot be empty.' });
      return;
    }

    if (firestore && vehicleTypesCollection) {
      try {
        if (currentVehicleType?.id) {
          // Update
          const docRef = doc(firestore, 'vehicleTypes', currentVehicleType.id);
          await updateDoc(docRef, { name: typeName });
          toast({ title: 'Success', description: 'Vehicle type updated successfully.' });
        } else {
          // Create
          await addDoc(vehicleTypesCollection, { name: typeName });
          toast({ title: 'Success', description: 'Vehicle type added successfully.' });
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    }
    setIsDialogOpen(false);
    setCurrentVehicleType(null);
    setTypeName('');
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VehicleTypes');
    XLSX.writeFile(wb, 'VehicleTypeTemplate.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && firestore && vehicleTypesCollection) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json: { name: string }[] = XLSX.utils.sheet_to_json(worksheet);

          if (!json[0] || !('name' in json[0])) {
             throw new Error('Invalid Excel file format. Expecting a single column with header "name".');
          }

          for (const item of json) {
             if(item.name && item.name.trim()) {
                await addDoc(vehicleTypesCollection, { name: item.name });
             }
          }
          toast({ title: 'Success', description: 'Vehicle types uploaded successfully.' });
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Upload Error', description: error.message });
        }
      };
      reader.readAsArrayBuffer(file);
    }
    // Reset file input to allow uploading the same file again
    event.target.value = '';
  };


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Vehicle Types</CardTitle>
                    <CardDescription>Manage the different types of vehicles available.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Type</Button>
                    <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                    <Label htmlFor="upload-excel" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" /> Upload Excel
                    </Label>
                    <Input id="upload-excel" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Type</TableHead>
                <TableHead className="w-[50px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : vehicleTypes && vehicleTypes.length > 0 ? (
                vehicleTypes.map((vt) => (
                  <TableRow key={vt.id}>
                    <TableCell>{vt.name}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(vt)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(vt)} className="text-destructive">
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
                  <TableCell colSpan={2} className="text-center">No vehicle types found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentVehicleType?.id ? 'Edit' : 'Add'} Vehicle Type</DialogTitle>
            <DialogDescription>
              {currentVehicleType?.id ? 'Update the name of the vehicle type.' : 'Create a new vehicle type.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={typeName} onChange={(e) => setTypeName(e.target.value)} className="col-span-3" />
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
              This action cannot be undone. This will permanently delete the vehicle type "{currentVehicleType?.name}".
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
