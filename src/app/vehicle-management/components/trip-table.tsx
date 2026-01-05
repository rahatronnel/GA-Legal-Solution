
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
import { TripEntryForm, type Trip } from './trip-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePrint } from './print-provider';
import type { Vehicle } from './vehicle-table';
import type { Driver } from './driver-entry-form';
import type { TripPurpose } from './trip-purpose-table';
import type { Location } from './location-table';
import type { Route } from './route-table';
import type { ExpenseType } from './expense-type-table';

export function TripTable() {
  const { toast } = useToast();
  const [trips, setTrips] = useLocalStorage<Trip[]>('trips', []);
  const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [drivers] = useLocalStorage<Driver[]>('drivers', []);
  const [purposes] = useLocalStorage<TripPurpose[]>('tripPurposes', []);
  const [locations] = useLocalStorage<Location[]>('locations', []);
  const [routes] = useLocalStorage<Route[]>('routes', []);
  const [expenseTypes] = useLocalStorage<ExpenseType[]>('expenseTypes', []);
  const { handlePrint } = usePrint();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Partial<Trip> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const getVehicleReg = (vehicleId: string) => vehicles.find(v => v.id === vehicleId)?.registrationNumber || 'N/A';

  const filteredTrips = useMemo(() => {
    if (!searchTerm) return trips;
    const lowercasedTerm = searchTerm.toLowerCase();
    return trips.filter(trip => 
      (trip.tripId && trip.tripId.toLowerCase().includes(lowercasedTerm)) ||
      (getVehicleReg(trip.vehicleId).toLowerCase().includes(lowercasedTerm))
    );
  }, [trips, searchTerm, vehicles]);


  const handleAdd = () => {
    setCurrentTrip(null);
    setIsFormOpen(true);
  };

  const handleEdit = (trip: Trip) => {
    setCurrentTrip(trip);
    setIsFormOpen(true);
  };

  const handleSave = (data: Omit<Trip, 'id'>, id?: string) => {
    if (id) {
        setTrips(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
        toast({ title: 'Success', description: 'Trip updated successfully.' });
    } else {
        const newTrip: Trip = {
            id: Date.now().toString(),
            ...data,
        };
        setTrips(prev => [...prev, newTrip]);
        toast({ title: 'Success', description: 'Trip added successfully.' });
    }
  };

  const handleDelete = (trip: Trip) => {
    setCurrentTrip(trip);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentTrip?.id) {
        setTrips(prev => prev.filter(t => t.id !== currentTrip.id));
        toast({ title: 'Success', description: 'Trip deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    setCurrentTrip(null);
  };
  
  const getStatusVariant = (status: Trip['tripStatus']) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Ongoing': return 'secondary';
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const handleDownloadTemplate = () => {
    // This is complex due to relations. For now, we provide a simple template.
    const ws = XLSX.utils.json_to_sheet([{ 
      vehicleRegNo: '',
      driverIdCode: '',
      purposeName: '',
      routeCode: '',
      startDate: 'YYYY-MM-DD',
      startTime: 'HH:MM',
      endDate: 'YYYY-MM-DD',
      endTime: 'HH:MM',
      startingMeter: 0,
      endingMeter: 0,
      remarks: '',
      tripStatus: 'Planned/Ongoing/Completed/Cancelled'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trips');
    XLSX.writeFile(wb, 'TripTemplate.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Due to the complexity of relations (vehicles, drivers, routes),
    // a robust Excel upload requires more complex logic to map codes/names back to IDs.
    // For now, we show a toast message indicating this is a future feature.
    toast({
        title: 'Feature Coming Soon',
        description: 'Uploading trips via Excel is a complex operation and will be implemented in a future update.',
    });
    event.target.value = '';
  };


  return (
    <TooltipProvider>
        <div className="flex flex-col sm:flex-row justify-between gap-2 mb-4">
            <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by Trip ID, Vehicle..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            <div className="flex gap-2">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Trip</Button>
                <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                <label htmlFor="upload-excel-trips" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Upload
                </label>
                <Input id="upload-excel-trips" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </div>
        </div>
        <div className="border rounded-lg">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Trip ID</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
            ) : filteredTrips && filteredTrips.length > 0 ? (
                filteredTrips.map((t) => (
                <TableRow key={t.id}>
                    <TableCell>{t.tripId}</TableCell>
                    <TableCell>{getVehicleReg(t.vehicleId)}</TableCell>
                    <TableCell>{t.startDate}</TableCell>
                    <TableCell>{t.endDate}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(t.tripStatus)}>{t.tripStatus || 'N/A'}</Badge></TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/vehicle-management/trips/${t.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>View Trip</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(t)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit Trip</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(t, 'trip')}><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Print Trip</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(t)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Delete Trip</TooltipContent></Tooltip>
                        </div>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">{searchTerm ? `No trips found for "${searchTerm}".` : "No trips recorded."}</TableCell></TableRow>
            )}
            </TableBody>
        </Table>
        </div>

      <TripEntryForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        onSave={handleSave}
        trip={currentTrip}
        vehicles={vehicles || []}
        drivers={drivers || []}
        purposes={purposes || []}
        locations={locations || []}
        routes={routes || []}
        expenseTypes={expenseTypes || []}
      />

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete the trip "{currentTrip?.tripId}".</DialogDescription>
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

    