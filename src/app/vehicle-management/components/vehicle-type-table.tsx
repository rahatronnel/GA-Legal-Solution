
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
import * as XLSX from 'xlsx';
import { MoreHorizontal, Download, Upload, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useVehicleManagement } from './vehicle-management-provider';

type VehicleType = {
  id: string;
  name: string;
  vehicleTypeCode: string;
};

export function VehicleTypeTable() {
  const { toast } = useToast();
  const { data, setData } = useVehicleManagement();
  const { vehicleTypes } = data;

  const setVehicleTypes = (updater: React.SetStateAction<VehicleType[]>) => {
    setData(prev => ({...prev, vehicleTypes: typeof updater === 'function' ? updater(prev.vehicleTypes || []) : updater }));
  }

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentVehicleType, setCurrentVehicleType] = useState<Partial<VehicleType> | null>(null);
  const [typeData, setTypeData] = useState({ name: '', vehicleTypeCode: '' });
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const safeVehicleTypes = Array.isArray(vehicleTypes) ? vehicleTypes : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setTypeData(prev => ({ ...prev, [id]: value }));
  };
  
  const resetForm = () => {
    setCurrentVehicleType(null);
    setTypeData({ name: '', vehicleTypeCode: '' });
  }

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (vehicleType: VehicleType) => {
    setCurrentVehicleType(vehicleType);
    setTypeData({ name: vehicleType.name, vehicleTypeCode: vehicleType.vehicleTypeCode });
    setIsDialogOpen(true);
  };

  const handleDelete = (vehicleType: VehicleType) => {
    setCurrentVehicleType(vehicleType);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentVehicleType?.id) {
        setVehicleTypes(prev => (prev || []).filter(vt => vt.id !== currentVehicleType.id));
        toast({ title: 'Success', description: 'Vehicle type deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!typeData.name.trim() || !typeData.vehicleTypeCode.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'All fields are required.' });
      return;
    }

    if (currentVehicleType?.id) {
      setVehicleTypes(prev => (prev || []).map(vt => vt.id === currentVehicleType.id ? { ...vt, ...typeData } as VehicleType : vt));
      toast({ title: 'Success', description: 'Vehicle type updated successfully.' });
    } else {
      const newVehicleType = { id: Date.now().toString(), ...typeData };
      setVehicleTypes(prev => [...(prev || []), newVehicleType]);
      toast({ title: 'Success', description: 'Vehicle type added successfully.' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: '', vehicleTypeCode: '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VehicleTypes');
    XLSX.writeFile(wb, 'VehicleTypeTemplate.xlsx');
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
          const json = XLSX.utils.sheet_to_json(worksheet, { raw: false });

          if (!json[0] || !('name' in json[0]) || !('vehicleTypeCode' in json[0])) {
             throw new Error('Invalid Excel file format. Expecting columns with headers "name" and "vehicleTypeCode".');
          }

          const newTypes = json
            .map((item: any) => ({
                name: String(item.name || '').trim(),
                vehicleTypeCode: String(item.vehicleTypeCode || '').trim()
            }))
            .filter(item => item.name && item.vehicleTypeCode)
            .map(item => ({ 
              id: Date.now().toString() + item.name, 
              name: item.name, 
              vehicleTypeCode: item.vehicleTypeCode 
            }));
          
          if(newTypes.length > 0) {
            setVehicleTypes(prev => [...(prev || []), ...newTypes]);
            toast({ title: 'Success', description: 'Vehicle types uploaded successfully.' });
          } else {
            toast({ variant: 'destructive', title: 'Upload Error', description: 'No valid vehicle types found in the file.' });
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
    <div className="space-y-4">
        <div className="flex justify-end gap-2">
            <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Type</Button>
            <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
            <label htmlFor="upload-excel-types" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Upload Excel
            </label>
            <Input id="upload-excel-types" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Vehicle Type</TableHead>
                    <TableHead>Vehicle Type Code</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                    </TableRow>
                ) : safeVehicleTypes && safeVehicleTypes.length > 0 ? (
                    safeVehicleTypes.map((vt) => (
                    <TableRow key={vt.id}>
                        <TableCell>{vt.name}</TableCell>
                        <TableCell>{vt.vehicleTypeCode}</TableCell>
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
                    <TableCell colSpan={3} className="text-center">No vehicle types found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentVehicleType?.id ? 'Edit' : 'Add'} Vehicle Type</DialogTitle>
            <DialogDescription>
              {currentVehicleType?.id ? 'Update the details of the vehicle type.' : 'Create a new vehicle type.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={typeData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicleTypeCode" className="text-right">
                Type Code
              </Label>
              <Input id="vehicleTypeCode" value={typeData.vehicleTypeCode} onChange={handleInputChange} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
