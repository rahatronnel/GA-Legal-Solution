
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
import { PlusCircle, Edit, Trash2, Search, Eye } from 'lucide-react';
import { MaintenanceEntryForm, type MaintenanceRecord } from './maintenance-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Vehicle } from './vehicle-table';
import type { MaintenanceType } from './maintenance-type-table';


export function MaintenanceRecordTable() {
  const { toast } = useToast();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles] = useState<Vehicle[]>([]);
  const [maintenanceTypes] = useState<MaintenanceType[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MaintenanceRecord> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const getVehicleReg = (vehicleId: string) => vehicles.find(v => v.id === vehicleId)?.registrationNumber || 'N/A';
  const getMaintenanceTypeName = (typeId: string) => maintenanceTypes.find(t => t.id === typeId)?.name || 'N/A';
  const calculateTotalCost = (record: MaintenanceRecord) => {
    const partsCost = record.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
    const expensesCost = record.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
    return partsCost + expensesCost;
  }

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const lowercasedTerm = searchTerm.toLowerCase();
    return records.filter(record => 
      (getVehicleReg(record.vehicleId).toLowerCase().includes(lowercasedTerm)) ||
      (getMaintenanceTypeName(record.maintenanceTypeId).toLowerCase().includes(lowercasedTerm))
    );
  }, [records, searchTerm, vehicles, maintenanceTypes]);


  const handleAdd = () => {
    setCurrentItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setCurrentItem(record);
    setIsFormOpen(true);
  };

  const handleSave = (data: Omit<MaintenanceRecord, 'id'>, id?: string) => {
    if (id) {
        setRecords(prev => prev.map(rec => (rec.id === id ? { ...rec, ...data } as MaintenanceRecord : rec)));
        toast({ title: 'Success', description: 'Maintenance record updated successfully.' });
    } else {
        const newRecord: MaintenanceRecord = { 
            id: Date.now().toString(), 
            ...data,
            parts: data.parts || [],
            expenses: data.expenses || [],
            documents: data.documents || {},
        } as MaintenanceRecord;
        setRecords(prev => [...prev, newRecord]);
        toast({ title: 'Success', description: 'Maintenance record added successfully.' });
    }
  };

  const handleDelete = (record: MaintenanceRecord) => {
    setCurrentItem(record);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentItem?.id) {
        setRecords(prev => prev.filter(t => t.id !== currentItem.id));
        toast({ title: 'Success', description: 'Maintenance record deleted successfully.' });
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
                placeholder="Search by Vehicle, Type..."
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
                <TableHead>Vehicle</TableHead>
                <TableHead>Maintenance Type</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
            ) : filteredRecords && filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                <TableRow key={record.id}>
                    <TableCell>{getVehicleReg(record.vehicleId)}</TableCell>
                    <TableCell>{getMaintenanceTypeName(record.maintenanceTypeId)}</TableCell>
                    <TableCell>{record.serviceDate}</TableCell>
                    <TableCell>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculateTotalCost(record))}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/vehicle-management/maintenance/${record.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>View Record</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(record)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit Record</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(record)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Delete Record</TooltipContent></Tooltip>
                        </div>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">{searchTerm ? `No records found for "${searchTerm}".` : "No maintenance records found."}</TableCell></TableRow>
            )}
            </TableBody>
        </Table>
        </div>

      <MaintenanceEntryForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        onSave={handleSave}
        record={currentItem}
      />

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete the maintenance record.</DialogDescription>
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
