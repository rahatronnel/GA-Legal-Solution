
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
import { Download, Upload, PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Location } from './location-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVehicleManagement } from './vehicle-management-provider';


export type Route = {
  id: string;
  name: string;
  routeCode: string;
  startLocationId: string;
  endLocationId: string;
};

export function RouteTable() {
  const { toast } = useToast();
  const { data, setData } = useVehicleManagement();
  const { routes, locations } = data;
  
  const setRoutes = (updater: React.SetStateAction<Route[]>) => {
    setData(prev => ({...prev, routes: typeof updater === 'function' ? updater(prev.routes) : updater }));
  }

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Route> | null>(null);
  const [formData, setFormData] = useState<Omit<Route, 'id'>>({ name: '', routeCode: '', startLocationId: '', endLocationId: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getLocationName = (locationId: string) => locations.find((l: Location) => l.id === locationId)?.name || 'N/A';

  const filteredItems = useMemo(() => {
    const safeRoutes = Array.isArray(routes) ? routes : [];
    if (!searchTerm) return safeRoutes;
    const lowercasedTerm = searchTerm.toLowerCase();
    return safeRoutes.filter(item => 
        item.name.toLowerCase().includes(lowercasedTerm) ||
        item.routeCode.toLowerCase().includes(lowercasedTerm) ||
        getLocationName(item.startLocationId).toLowerCase().includes(lowercasedTerm) ||
        getLocationName(item.endLocationId).toLowerCase().includes(lowercasedTerm)
    );
  }, [routes, searchTerm, locations]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (field: 'startLocationId' | 'endLocationId') => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setCurrentItem(null);
    setFormData({ name: '', routeCode: '', startLocationId: '', endLocationId: '' });
  }

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Route) => {
    setCurrentItem(item);
    setFormData({ name: item.name, routeCode: item.routeCode, startLocationId: item.startLocationId, endLocationId: item.endLocationId });
    setIsDialogOpen(true);
  };

  const handleDelete = (item: Route) => {
    setCurrentItem(item);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentItem?.id) {
        setRoutes(prev => prev.filter(p => p.id !== currentItem.id));
        toast({ title: 'Success', description: 'Route deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.routeCode.trim() || !formData.startLocationId || !formData.endLocationId) {
      toast({ variant: 'destructive', title: 'Error', description: 'All fields are required.' });
      return;
    }

    if (currentItem?.id) {
      setRoutes(prev => prev.map(p => p.id === currentItem.id ? { ...p, ...formData } as Route : p));
      toast({ title: 'Success', description: 'Route updated successfully.' });
    } else {
      const newItem = { id: Date.now().toString(), ...formData };
      setRoutes(prev => [...prev, newItem]);
      toast({ title: 'Success', description: 'Route added successfully.' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: '', routeCode: '', startLocationCode: '', endLocationCode: '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Routes');
    XLSX.writeFile(wb, 'RouteTemplate.xlsx');
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
          const json = XLSX.utils.sheet_to_json(worksheet, {raw: false});

          if (!json[0] || !('name' in json[0]) || !('routeCode' in json[0]) || !('startLocationCode' in json[0]) || !('endLocationCode' in json[0])) {
             throw new Error('Invalid Excel file format. Expecting columns "name", "routeCode", "startLocationCode", and "endLocationCode".');
          }

          const newItems = json
            .map((item: any) => {
                const startLoc = locations.find(l => l.locationCode === String(item.startLocationCode || '').trim());
                const endLoc = locations.find(l => l.locationCode === String(item.endLocationCode || '').trim());
                return {
                    name: String(item.name || '').trim(),
                    routeCode: String(item.routeCode || '').trim(),
                    startLocationId: startLoc?.id || '',
                    endLocationId: endLoc?.id || ''
                }
            })
            .filter(item => item.name && item.routeCode && item.startLocationId && item.endLocationId)
            .map(item => ({ id: Date.now().toString() + item.name, ...item }));
          
          if(newItems.length > 0) {
            setRoutes(prev => [...prev, ...newItems]);
            toast({ title: 'Success', description: 'Routes uploaded successfully.' });
          } else {
            toast({ variant: 'destructive', title: 'Upload Error', description: 'No valid routes found or location codes could not be matched.' });
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
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by name or code..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Route</Button>
                <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                <label htmlFor="upload-excel-routes" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Upload Excel
                </label>
                <Input id="upload-excel-routes" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </div>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Route Name</TableHead>
                    <TableHead>Route Code</TableHead>
                    <TableHead>Start Location</TableHead>
                    <TableHead>End Location</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                ) : filteredItems && filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.routeCode}</TableCell>
                        <TableCell>{getLocationName(item.startLocationId)}</TableCell>
                        <TableCell>{getLocationName(item.endLocationId)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Route</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Route</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No routes found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentItem?.id ? 'Edit' : 'Add'} Route</DialogTitle>
            <DialogDescription>
              {currentItem?.id ? 'Update the details of the route.' : 'Create a new route.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={formData.name} onChange={handleInputChange} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="routeCode">Code</Label>
              <Input id="routeCode" value={formData.routeCode} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label>Start Location</Label>
              <Select value={formData.startLocationId} onValueChange={handleSelectChange('startLocationId')}>
                  <SelectTrigger><SelectValue placeholder="Select start location" /></SelectTrigger>
                  <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label>End Location</Label>
              <Select value={formData.endLocationId} onValueChange={handleSelectChange('endLocationId')}>
                  <SelectTrigger><SelectValue placeholder="Select end location" /></SelectTrigger>
                  <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
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
              This action cannot be undone. This will permanently delete the route "{currentItem?.name}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
