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
import { useLocalStorage } from '@/hooks/use-local-storage';
import * as XLSX from 'xlsx';
import { Download, Upload, PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Location } from './location-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type Route = {
  id: string;
  name: string;
  routeCode: string;
  startLocationId: string;
  endLocationId: string;
};

interface RouteTableProps {
  locations: Location[];
}

export function RouteTable({ locations }: RouteTableProps) {
  const { toast } = useToast();
  const [routes, setRoutes] = useLocalStorage<Route[]>('routes', []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Partial<Route> | null>(null);
  const [routeData, setRouteData] = useState({ routeCode: '', startLocationId: '', endLocationId: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getRouteName = (startId: string, endId: string) => {
    const start = locations.find(l => l.id === startId);
    const end = locations.find(l => l.id === endId);
    if (start && end) {
      return `${start.name} to ${end.name}`;
    }
    return 'Unknown Route';
  };

  const filteredRoutes = useMemo(() => {
    if (!searchTerm) return routes;
    const lowercasedTerm = searchTerm.toLowerCase();
    return routes.filter(route => 
        route.routeCode.toLowerCase().includes(lowercasedTerm) ||
        getRouteName(route.startLocationId, route.endLocationId).toLowerCase().includes(lowercasedTerm)
    );
  }, [routes, searchTerm, locations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setRouteData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: 'startLocationId' | 'endLocationId') => (value: string) => {
    setRouteData(prev => ({ ...prev, [field]: value }));
  };
  
  const resetForm = () => {
    setCurrentRoute(null);
    setRouteData({ routeCode: '', startLocationId: '', endLocationId: '' });
  }

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (route: Route) => {
    setCurrentRoute(route);
    setRouteData({ routeCode: route.routeCode, startLocationId: route.startLocationId, endLocationId: route.endLocationId });
    setIsDialogOpen(true);
  };

  const handleDelete = (route: Route) => {
    setCurrentRoute(route);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentRoute?.id) {
        setRoutes(prev => prev.filter(r => r.id !== currentRoute.id));
        toast({ title: 'Success', description: 'Route deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!routeData.routeCode.trim() || !routeData.startLocationId || !routeData.endLocationId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Route Code, Start Location, and Destination are required.' });
      return;
    }
    if (routeData.startLocationId === routeData.endLocationId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Start and Destination locations cannot be the same.' });
        return;
    }

    const routeName = getRouteName(routeData.startLocationId, routeData.endLocationId);
    
    if (currentRoute?.id) {
      setRoutes(prev => prev.map(r => r.id === currentRoute.id ? { ...r, ...routeData, name: routeName } : r));
      toast({ title: 'Success', description: 'Route updated successfully.' });
    } else {
      const newRoute = { id: Date.now().toString(), name: routeName, ...routeData };
      setRoutes(prev => [...prev, newRoute]);
      toast({ title: 'Success', description: 'Route added successfully.' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ routeCode: '', startLocationCode: '', endLocationCode: '' }]);
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

          const requiredHeaders = ['routeCode', 'startLocationCode', 'endLocationCode'];
          if (!json[0] || !requiredHeaders.every(h => h in json[0])) {
             throw new Error('Invalid Excel file format. Expecting columns: routeCode, startLocationCode, endLocationCode.');
          }

          const newItems = json
            .map((item: any) => {
              const startLocation = locations.find(l => l.locationCode === String(item.startLocationCode || '').trim());
              const endLocation = locations.find(l => l.locationCode === String(item.endLocationCode || '').trim());
              const routeCode = String(item.routeCode || '').trim();

              if (!startLocation || !endLocation || !routeCode) return null;

              return {
                id: Date.now().toString() + routeCode,
                routeCode,
                startLocationId: startLocation.id,
                endLocationId: endLocation.id,
                name: `${startLocation.name} to ${endLocation.name}`
              }
            })
            .filter((item): item is Route => item !== null);
          
          if(newItems.length > 0) {
            setRoutes(prev => [...prev, ...newItems]);
            toast({ title: 'Success', description: `${newItems.length} routes uploaded successfully.` });
          } else {
            toast({ variant: 'destructive', title: 'Upload Error', description: 'No valid routes found or location codes did not match.' });
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
                    placeholder="Search routes..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Route</Button>
                <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                <Label htmlFor="upload-excel-routes" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Upload Excel
                </Label>
                <Input id="upload-excel-routes" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </div>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Route Name</TableHead>
                    <TableHead>Route Code</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                    </TableRow>
                ) : filteredRoutes && filteredRoutes.length > 0 ? (
                    filteredRoutes.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{getRouteName(item.startLocationId, item.endLocationId)}</TableCell>
                        <TableCell>{item.routeCode}</TableCell>
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
                    <TableCell colSpan={3} className="h-24 text-center">No routes found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentRoute?.id ? 'Edit' : 'Add'} Route</DialogTitle>
            <DialogDescription>
              {currentRoute?.id ? 'Update the details of the route.' : 'Create a new route.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="routeCode">Route Code</Label>
              <Input id="routeCode" value={routeData.routeCode} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label>Start Location</Label>
              <Select value={routeData.startLocationId} onValueChange={handleSelectChange('startLocationId')}>
                <SelectTrigger><SelectValue placeholder="Select a starting location" /></SelectTrigger>
                <SelectContent>
                    {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label>Destination Location</Label>
              <Select value={routeData.endLocationId} onValueChange={handleSelectChange('endLocationId')}>
                <SelectTrigger><SelectValue placeholder="Select a destination" /></SelectTrigger>
                <SelectContent>
                    {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {routeData.startLocationId && routeData.endLocationId && (
                <div className="text-sm text-muted-foreground">
                    <strong>Generated Route Name:</strong> {getRouteName(routeData.startLocationId, routeData.endLocationId)}
                </div>
            )}
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
              This action cannot be undone. This will permanently delete the route "{currentRoute?.name}".
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
