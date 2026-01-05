
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

export type MaintenanceType = {
  id: string;
  name: string;
  code: string;
};

interface MaintenanceTypeTableProps {
  maintenanceTypes: MaintenanceType[];
  setMaintenanceTypes: React.Dispatch<React.SetStateAction<MaintenanceType[]>>;
}

export function MaintenanceTypeTable({ maintenanceTypes, setMaintenanceTypes }: MaintenanceTypeTableProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentMaintenanceType, setCurrentMaintenanceType] = useState<Partial<MaintenanceType> | null>(null);
  const [maintenanceTypeData, setMaintenanceTypeData] = useState({ name: '', code: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredMaintenanceTypes = useMemo(() => {
    if (!searchTerm) return maintenanceTypes;
    const lowercasedTerm = searchTerm.toLowerCase();
    return maintenanceTypes.filter(p => 
        p.name.toLowerCase().includes(lowercasedTerm) ||
        p.code.toLowerCase().includes(lowercasedTerm)
    );
  }, [maintenanceTypes, searchTerm]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setMaintenanceTypeData(prev => ({ ...prev, [id]: value }));
  };

  const resetForm = () => {
    setCurrentMaintenanceType(null);
    setMaintenanceTypeData({ name: '', code: '' });
  }

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (maintenanceType: MaintenanceType) => {
    setCurrentMaintenanceType(maintenanceType);
    setMaintenanceTypeData({ name: maintenanceType.name, code: maintenanceType.code });
    setIsDialogOpen(true);
  };

  const handleDelete = (maintenanceType: MaintenanceType) => {
    setCurrentMaintenanceType(maintenanceType);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentMaintenanceType?.id) {
        setMaintenanceTypes(prev => prev.filter(p => p.id !== currentMaintenanceType.id));
        toast({ title: 'Success', description: 'Maintenance type deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!maintenanceTypeData.name.trim() || !maintenanceTypeData.code.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name and Code are required.' });
      return;
    }

    if (currentMaintenanceType?.id) {
      setMaintenanceTypes(prev => prev.map(p => p.id === currentMaintenanceType.id ? { ...p, ...maintenanceTypeData } : p));
      toast({ title: 'Success', description: 'Maintenance type updated successfully.' });
    } else {
      const newMaintenanceType = { id: Date.now().toString(), ...maintenanceTypeData };
      setMaintenanceTypes(prev => [...prev, newMaintenanceType]);
      toast({ title: 'Success', description: 'Maintenance type added successfully.' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: '', code: '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MaintenanceTypes');
    XLSX.writeFile(wb, 'MaintenanceTypeTemplate.xlsx');
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

          if (!json[0] || !('name' in json[0]) || !('code' in json[0])) {
             throw new Error('Invalid Excel file format. Expecting columns with headers "name" and "code".');
          }

          const newItems = json
            .map((item: any) => ({ 
                name: String(item.name || '').trim(),
                code: String(item.code || '').trim(),
            }))
            .filter(item => item.name && item.code)
            .map(item => ({ id: Date.now().toString() + item.name, ...item }));
          
          if(newItems.length > 0) {
            setMaintenanceTypes(prev => [...prev, ...newItems]);
            toast({ title: 'Success', description: 'Maintenance types uploaded successfully.' });
          } else {
            toast({ variant: 'destructive', title: 'Upload Error', description: 'No valid maintenance types found in the file.' });
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
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Maintenance Type</Button>
                <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                <label htmlFor="upload-excel-maintenancetypes" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Upload Excel
                </label>
                <Input id="upload-excel-maintenancetypes" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </div>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Maintenance Type Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                    </TableRow>
                ) : filteredMaintenanceTypes && filteredMaintenanceTypes.length > 0 ? (
                    filteredMaintenanceTypes.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.code}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Maintenance Type</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Maintenance Type</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">No maintenance types found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentMaintenanceType?.id ? 'Edit' : 'Add'} Maintenance Type</DialogTitle>
            <DialogDescription>
              {currentMaintenanceType?.id ? 'Update the details of the maintenance type.' : 'Create a new maintenance type.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={maintenanceTypeData.name} onChange={handleInputChange} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={maintenanceTypeData.code} onChange={handleInputChange} />
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
              This action cannot be undone. This will permanently delete the maintenance type "{currentMaintenanceType?.name}".
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
