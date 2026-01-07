
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
import { PlusCircle, Edit, Trash2, Search, Eye, X } from 'lucide-react';
import { MaintenanceEntryForm, type MaintenanceRecord } from './maintenance-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import { useVehicleManagement } from './vehicle-management-provider';

export function MaintenanceRecordTable() {
  const { toast } = useToast();
  const { data, setData } = useVehicleManagement();
  const { maintenanceRecords: records, vehicles = [], maintenanceTypes = [], drivers = [], serviceCenters = [], employees = [] } = data;
  
  const setRecords = (updater: React.SetStateAction<MaintenanceRecord[]>) => {
    setData(prev => ({...prev, maintenanceRecords: typeof updater === 'function' ? updater(prev.maintenanceRecords || []) : updater }));
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MaintenanceRecord> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [serviceCenterFilter, setServiceCenterFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const getVehicleReg = (vehicleId: string) => vehicles.find((v:any) => v.id === vehicleId)?.registrationNumber || 'N/A';
  const getMaintenanceTypeName = (typeId: string) => maintenanceTypes.find((t:any) => t.id === typeId)?.name || 'N/A';
  const calculateTotalCost = (record: MaintenanceRecord) => {
    const partsCost = record.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
    const expensesCost = record.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
    return partsCost + expensesCost;
  }

  const safeRecords = Array.isArray(records) ? records : [];

  const filteredRecords = useMemo(() => {
    if (!safeRecords) return [];
    return safeRecords.filter(record => {
        const searchTermMatch = searchTerm === '' || 
            getVehicleReg(record.vehicleId).toLowerCase().includes(searchTerm.toLowerCase()) ||
            getMaintenanceTypeName(record.maintenanceTypeId).toLowerCase().includes(searchTerm.toLowerCase());

        const vehicleMatch = vehicleFilter === 'all' || record.vehicleId === vehicleFilter;
        const typeMatch = typeFilter === 'all' || record.maintenanceTypeId === typeFilter;
        const driverMatch = driverFilter === 'all' || record.driverId === driverFilter;
        const serviceCenterMatch = serviceCenterFilter === 'all' || record.serviceCenterId === serviceCenterFilter;
        
        let dateMatch = true;
        if (dateRangeFilter?.from && record.serviceDate) {
            const serviceDate = parseISO(record.serviceDate);
            const toDate = dateRangeFilter.to || dateRangeFilter.from; // if no 'to' date, use 'from' as single day filter
            dateMatch = isWithinInterval(serviceDate, { start: dateRangeFilter.from, end: toDate });
        }

        return searchTermMatch && vehicleMatch && typeMatch && driverMatch && serviceCenterMatch && dateMatch;
    });
  }, [records, searchTerm, vehicleFilter, typeFilter, driverFilter, serviceCenterFilter, dateRangeFilter, vehicles, maintenanceTypes]);


  const handleAdd = () => {
    setCurrentItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setCurrentItem(record);
    setIsFormOpen(true);
  };

  const handleSave = (data: Partial<MaintenanceRecord>, id?: string) => {
    if (id) {
        setRecords(prev => (prev || []).map(rec => (rec.id === id ? { ...rec, ...data } as MaintenanceRecord : rec)));
        toast({ title: 'Success', description: 'Maintenance record updated successfully.' });
    } else {
        const newRecord: MaintenanceRecord = { 
            id: Date.now().toString(), 
            ...initialMaintenanceData,
            ...data,
            parts: data.parts || [],
            expenses: data.expenses || [],
            documents: data.documents || {},
        } as MaintenanceRecord;
        setRecords(prev => [...(prev || []), newRecord]);
        toast({ title: 'Success', description: 'Maintenance record added successfully.' });
    }
  };

  const initialMaintenanceData = {
    vehicleId: '',
    maintenanceTypeId: '',
    serviceCenterId: '',
    serviceDate: '',
    upcomingServiceDate: '',
    description: '',
    monitoringEmployeeId: '',
    driverId: '',
  };

  const handleDelete = (record: MaintenanceRecord) => {
    setCurrentItem(record);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentItem?.id) {
        setRecords(prev => (prev || []).filter(t => t.id !== currentItem.id));
        toast({ title: 'Success', description: 'Maintenance record deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    setCurrentItem(null);
  };

  const clearFilters = () => {
      setSearchTerm('');
      setVehicleFilter('all');
      setTypeFilter('all');
      setDriverFilter('all');
      setServiceCenterFilter('all');
      setDateRangeFilter(undefined);
  }
  
  return (
    <TooltipProvider>
        <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
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
             <div className="flex flex-wrap gap-2">
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Vehicle..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Vehicles</SelectItem>
                        {(vehicles || []).map((v:any) => <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Type..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {(maintenanceTypes || []).map((t:any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={driverFilter} onValueChange={setDriverFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Driver..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Drivers</SelectItem>
                        {(drivers || []).map((d:any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={serviceCenterFilter} onValueChange={setServiceCenterFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Garage..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Garages</SelectItem>
                        {(serviceCenters || []).map((sc:any) => <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <DateRangePicker date={dateRangeFilter} onDateChange={setDateRangeFilter} />
                 <Button variant="ghost" onClick={clearFilters}><X className="mr-2 h-4 w-4" /> Clear</Button>
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
        employees={employees}
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

