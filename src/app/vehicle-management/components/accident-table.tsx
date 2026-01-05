
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
import { PlusCircle, Edit, Trash2, Search, Eye } from 'lucide-react';
import { AccidentEntryForm, type Accident } from './accident-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { Vehicle } from './vehicle-table';
import type { Driver } from './driver-entry-form';
import type { AccidentType } from './accident-type-table';


export function AccidentTable() {
  const { toast } = useToast();
  const [accidents, setAccidents] = useLocalStorage<Accident[]>('accidents', []);
  const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [drivers] = useLocalStorage<Driver[]>('drivers', []);
  const [accidentTypes] = useLocalStorage<AccidentType[]>('accidentTypes', []);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Accident> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getVehicleReg = (vehicleId: string) => vehicles.find(v => v.id === vehicleId)?.registrationNumber || 'N/A';
  const getDriverName = (driverId: string) => drivers.find(d => d.id === driverId)?.name || 'N/A';
  const getAccidentTypeName = (typeId: string) => accidentTypes.find(t => t.id === typeId)?.name || 'N/A';

  const filteredAccidents = useMemo(() => {
    if (!searchTerm) return accidents;
    const lowercasedTerm = searchTerm.toLowerCase();
    return accidents.filter(acc => 
      getVehicleReg(acc.vehicleId).toLowerCase().includes(lowercasedTerm) ||
      getDriverName(acc.driverId).toLowerCase().includes(lowercasedTerm) ||
      getAccidentTypeName(acc.accidentTypeId).toLowerCase().includes(lowercasedTerm) ||
      (acc.accidentId && acc.accidentId.toLowerCase().includes(lowercasedTerm))
    );
  }, [accidents, searchTerm, vehicles, drivers, accidentTypes]);


  const handleAdd = () => {
    setCurrentItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (accident: Accident) => {
    setCurrentItem(accident);
    setIsFormOpen(true);
  };

  const handleSave = (data: Omit<Accident, 'id'>, id?: string) => {
    if (id) {
        setAccidents(prev => prev.map(acc => (acc.id === id ? { ...acc, ...data } : acc)));
        toast({ title: 'Success', description: 'Accident record updated successfully.' });
    } else {
        const newRecord: Accident = { 
            id: Date.now().toString(), 
            ...data,
            documents: data.documents || {},
        };
        setAccidents(prev => [...prev, newRecord]);
        toast({ title: 'Success', description: 'Accident record added successfully.' });
    }
  };

  const handleDelete = (accident: Accident) => {
    setCurrentItem(accident);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentItem?.id) {
        setAccidents(prev => prev.filter(t => t.id !== currentItem.id));
        toast({ title: 'Success', description: 'Accident record deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    setCurrentItem(null);
  };
  
  return (
    <TooltipProvider>
        <div className="flex flex-col sm:flex-row justify-between gap-2 mb-4">
            <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by Vehicle, Driver..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            <div className="flex gap-2">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Record</Button>
            </div>
        </div>
        <div className="border rounded-lg">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Accident ID</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Accident Type</TableHead>
                <TableHead>Accident Date</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
            ) : filteredAccidents && filteredAccidents.length > 0 ? (
                filteredAccidents.map((accident) => (
                <TableRow key={accident.id}>
                    <TableCell>{accident.accidentId}</TableCell>
                    <TableCell>{getVehicleReg(accident.vehicleId)}</TableCell>
                    <TableCell>{getDriverName(accident.driverId)}</TableCell>
                    <TableCell>{getAccidentTypeName(accident.accidentTypeId)}</TableCell>
                    <TableCell>{accident.accidentDate}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/vehicle-management/accidents/${accident.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>View Record</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(accident)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit Record</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(accident)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Delete Record</TooltipContent></Tooltip>
                        </div>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">{searchTerm ? `No records found for "${searchTerm}".` : "No accident records found."}</TableCell></TableRow>
            )}
            </TableBody>
        </Table>
        </div>

      <AccidentEntryForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        onSave={handleSave}
        accident={currentItem}
      />

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete the accident record for "{currentItem?.accidentId}".</DialogDescription>
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
