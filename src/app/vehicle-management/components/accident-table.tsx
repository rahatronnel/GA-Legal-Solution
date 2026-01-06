
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
import { AccidentEntryForm, type Accident } from './accident-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { Vehicle } from './vehicle-table';
import type { Driver } from './driver-entry-form';
import type { AccidentType } from './accident-type-table';
import type { SeverityLevel } from './severity-level-table';
import type { Route } from './route-table';
import type { FaultStatus } from './fault-status-table';

interface AccidentTableProps {
    accidents: Accident[];
    setAccidents: React.Dispatch<React.SetStateAction<Accident[]>>;
}

export function AccidentTable({ accidents, setAccidents }: AccidentTableProps) {
  const { toast } = useToast();
  
  const [vehicleManagementData] = useLocalStorage<any>('vehicleManagementData', {});
  const {
      vehicles = [],
      drivers = [],
      accidentTypes = [],
      severityLevels = [],
      routes = [],
      faultStatuses = [],
  } = vehicleManagementData;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Accident> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [faultStatusFilter, setFaultStatusFilter] = useState('all');


  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getVehicleReg = (vehicleId: string) => vehicles.find((v: Vehicle) => v.id === vehicleId)?.registrationNumber || 'N/A';
  const getDriverName = (driverId: string) => drivers.find((d: Driver) => d.id === driverId)?.name || 'N/A';
  const getAccidentTypeName = (typeId: string) => accidentTypes.find((t: AccidentType) => t.id === typeId)?.name || 'N/A';

  const filteredAccidents = useMemo(() => {
    return accidents.filter(acc => {
        const searchTermMatch = searchTerm === '' ||
            getVehicleReg(acc.vehicleId).toLowerCase().includes(searchTerm.toLowerCase()) ||
            getDriverName(acc.driverId).toLowerCase().includes(searchTerm.toLowerCase()) ||
            getAccidentTypeName(acc.accidentTypeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (acc.accidentId && acc.accidentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (acc.tripId && acc.tripId.toLowerCase().includes(searchTerm.toLowerCase()));

        const vehicleMatch = vehicleFilter === 'all' || acc.vehicleId === vehicleFilter;
        const driverMatch = driverFilter === 'all' || acc.driverId === driverFilter;
        const typeMatch = typeFilter === 'all' || acc.accidentTypeId === typeFilter;
        const severityMatch = severityFilter === 'all' || acc.severityLevelId === severityFilter;
        const routeMatch = routeFilter === 'all' || acc.routeId === routeFilter;
        const faultStatusMatch = faultStatusFilter === 'all' || acc.faultStatusId === faultStatusFilter;

        return searchTermMatch && vehicleMatch && driverMatch && typeMatch && severityMatch && routeMatch && faultStatusMatch;
    });
  }, [accidents, searchTerm, vehicleFilter, driverFilter, typeFilter, severityFilter, routeFilter, faultStatusFilter, vehicles, drivers, accidentTypes]);


  const handleAdd = () => {
    setCurrentItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (accident: Accident) => {
    setCurrentItem(accident);
    setIsFormOpen(true);
  };

  const handleSave = (data: Partial<Accident>) => {
    if (data.id) {
        setAccidents(prev => prev.map(acc => (acc.id === data.id ? { ...acc, ...data } as Accident : acc)));
        toast({ title: 'Success', description: 'Accident record updated successfully.' });
    } else {
        const newRecord: Accident = { 
            id: Date.now().toString(),
            accidentId: `ACC-${Date.now()}`,
            vehicleId: data.vehicleId || '',
            driverId: data.driverId || '',
            employeeId: data.employeeId || '',
            accidentDate: data.accidentDate || '',
            accidentTime: data.accidentTime || '',
            location: data.location || '',
            accidentTypeId: data.accidentTypeId || '',
            severityLevelId: data.severityLevelId || '',
            faultStatusId: data.faultStatusId || '',
            routeId: data.routeId || '',
            tripId: data.tripId || '',
            description: data.description || '',
            vehicleDamageDescription: data.vehicleDamageDescription || '',
            thirdPartyDamage: data.thirdPartyDamage || '',
            humanInjury: data.humanInjury || '',
            vehicleStatusAfterAccident: data.vehicleStatusAfterAccident || '',
            estimatedRepairCost: data.estimatedRepairCost || 0,
            actualRepairCost: data.actualRepairCost || 0,
            thirdPartyDamageCost: data.thirdPartyDamageCost || 0,
            repairedById: data.repairedById || '',
            repairPaymentStatus: data.repairPaymentStatus || '',
            policeReportFiled: data.policeReportFiled || false,
            policeReportNumber: data.policeReportNumber || '',
            policeStation: data.policeStation || '',
            insuranceClaimFiled: data.insuranceClaimFiled || false,
            insuranceClaimNumber: data.insuranceClaimNumber || '',
            insuranceCompany: data.insuranceCompany || '',
            documents: data.documents || {
                accidentPhotos: [],
                policeReport: [],
                insuranceClaimForm: [],
                workshopQuotation: [],
                repairInvoice: [],
                medicalReport: [],
            },
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
  
  const clearFilters = () => {
      setSearchTerm('');
      setVehicleFilter('all');
      setDriverFilter('all');
      setTypeFilter('all');
      setSeverityFilter('all');
      setRouteFilter('all');
      setFaultStatusFilter('all');
  };

  return (
    <TooltipProvider>
        <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
                <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by ID, Trip, Vehicle..."
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
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}><SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Filter by Vehicle..." /></SelectTrigger><SelectContent><SelectItem value="all">All Vehicles</SelectItem>{vehicles.map((v:Vehicle) => <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>)}</SelectContent></Select>
                <Select value={driverFilter} onValueChange={setDriverFilter}><SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Filter by Driver..." /></SelectTrigger><SelectContent><SelectItem value="all">All Drivers</SelectItem>{drivers.map((d:Driver) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Filter by Type..." /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{accidentTypes.map((t:AccidentType) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}><SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Filter by Severity..." /></SelectTrigger><SelectContent><SelectItem value="all">All Severity Levels</SelectItem>{severityLevels.map((s:SeverityLevel) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                <Select value={routeFilter} onValueChange={setRouteFilter}><SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Filter by Route..." /></SelectTrigger><SelectContent><SelectItem value="all">All Routes</SelectItem>{routes.map((r:Route) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select>
                <Select value={faultStatusFilter} onValueChange={setFaultStatusFilter}><SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Filter by Fault..." /></SelectTrigger><SelectContent><SelectItem value="all">All Fault Statuses</SelectItem>{faultStatuses.map((f:FaultStatus) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select>
                <Button variant="ghost" onClick={clearFilters}><X className="mr-2 h-4 w-4" /> Clear</Button>
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
            <DialogDescription>This action cannot be undone. This will permanently delete the accident record "{currentItem?.accidentId}".</DialogDescription>
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

    