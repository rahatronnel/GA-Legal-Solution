
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
import { useVehicleManagement } from './vehicle-management-provider';

export type Location = {
  id: string;
  name: string;
  locationCode: string;
};

export function LocationTable() {
  const { toast } = useToast();
  const { data, setData } = useVehicleManagement();
  const { locations } = data;

  const setLocations = (updater: React.SetStateAction<Location[]>) => {
    setData(prev => ({...prev, locations: typeof updater === 'function' ? updater(prev.locations || []) : updater }));
  }

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Partial<Location> | null>(null);
  const [locationData, setLocationData] = useState({ name: '', locationCode: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const safeLocations = Array.isArray(locations) ? locations : [];

  const filteredLocations = useMemo(() => {
    if (!searchTerm) return safeLocations;
    const lowercasedTerm = searchTerm.toLowerCase();
    return safeLocations.filter(loc => 
        loc.name.toLowerCase().includes(lowercasedTerm) ||
        loc.locationCode.toLowerCase().includes(lowercasedTerm)
    );
  }, [safeLocations, searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setLocationData(prev => ({ ...prev, [id]: value }));
  };
  
  const resetForm = () => {
    setCurrentLocation(null);
    setLocationData({ name: '', locationCode: '' });
  }

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (location: Location) => {
    setCurrentLocation(location);
    setLocationData({ name: location.name, locationCode: location.locationCode });
    setIsDialogOpen(true);
  };

  const handleDelete = (location: Location) => {
    setCurrentLocation(location);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentLocation?.id) {
        setLocations(prev => (prev || []).filter(l => l.id !== currentLocation.id));
        toast({ title: 'Success', description: 'Location deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!locationData.name.trim() || !locationData.locationCode.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'All fields are required.' });
      return;
    }

    if (currentLocation?.id) {
      setLocations(prev => (prev || []).map(l => l.id === currentLocation.id ? { ...l, ...locationData } as Location : l));
      toast({ title: 'Success', description: 'Location updated successfully.' });
    } else {
      const newLocation = { id: Date.now().toString(), ...locationData };
      setLocations(prev => [...(prev || []), newLocation]);
      toast({ title: 'Success', description: 'Location added successfully.' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: '', locationCode: '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Locations');
    XLSX.writeFile(wb, 'LocationTemplate.xlsx');
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

          if (!json[0] || !('name' in json[0]) || !('locationCode' in json[0])) {
             throw new Error('Invalid Excel file format. Expecting columns with headers "name" and "locationCode".');
          }

          const newItems = json
            .map((item: any) => ({
              name: String(item.name || '').trim(),
              locationCode: String(item.locationCode || '').trim()
            }))
            .filter(item => item.name && item.locationCode)
            .map(item => ({
              id: Date.now().toString() + item.name,
              name: item.name,
              locationCode: item.locationCode
            }));
          
          if(newItems.length > 0) {
            setLocations(prev => [...(prev || []), ...newItems]);
            toast({ title: 'Success', description: 'Locations uploaded successfully.' });
          } else {
            toast({ variant: 'destructive', title: 'Upload Error', description: 'No valid locations found in the file.' });
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
                    placeholder="Search locations..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Location</Button>
                <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                <label htmlFor="upload-excel-locations" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Upload Excel
                </label>
                <Input id="upload-excel-locations" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </div>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Location Name</TableHead>
                    <TableHead>Location Code</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                    </TableRow>
                ) : filteredLocations && filteredLocations.length > 0 ? (
                    filteredLocations.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.locationCode}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Location</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Location</TooltipContent>
                              </Tooltip>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">No locations found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentLocation?.id ? 'Edit' : 'Add'} Location</DialogTitle>
            <DialogDescription>
              {currentLocation?.id ? 'Update the details of the location.' : 'Create a new location.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={locationData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="locationCode" className="text-right">
                Location Code
              </Label>
              <Input id="locationCode" value={locationData.locationCode} onChange={handleInputChange} className="col-span-3" />
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
              This action cannot be undone. This will permanently delete the location "{currentLocation?.name}".
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
