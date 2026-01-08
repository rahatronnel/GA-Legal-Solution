
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
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export type ServiceCenter = {
  id: string;
  name: string;
  code: string;
  address: string;
  mobileNumber: string;
  ownerName: string;
};

const initialData = {
    name: '',
    code: '',
    address: '',
    mobileNumber: '',
    ownerName: '',
}

export function ServiceCenterTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const serviceCentersRef = useMemoFirebase(() => firestore ? collection(firestore, 'serviceCenters') : null, [firestore]);
  const { data: serviceCenters, isLoading } = useCollection<ServiceCenter>(serviceCentersRef);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ServiceCenter> | null>(null);
  const [formData, setFormData] = useState<Omit<ServiceCenter, 'id'>>(initialData);
  const [searchTerm, setSearchTerm] = useState('');

  const safeServiceCenters = useMemo(() => Array.isArray(serviceCenters) ? serviceCenters : [], [serviceCenters]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return safeServiceCenters;
    const lowercasedTerm = searchTerm.toLowerCase();
    return safeServiceCenters.filter(item => 
        item.name.toLowerCase().includes(lowercasedTerm) ||
        item.code.toLowerCase().includes(lowercasedTerm) ||
        item.ownerName.toLowerCase().includes(lowercasedTerm) ||
        item.mobileNumber.toLowerCase().includes(lowercasedTerm)
    );
  }, [safeServiceCenters, searchTerm]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const resetForm = () => {
    setCurrentItem(null);
    setFormData(initialData);
  }

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (item: ServiceCenter) => {
    setCurrentItem(item);
    setFormData({ name: item.name, code: item.code, address: item.address, mobileNumber: item.mobileNumber, ownerName: item.ownerName });
    setIsDialogOpen(true);
  };

  const handleDelete = (item: ServiceCenter) => {
    setCurrentItem(item);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentItem?.id && serviceCentersRef) {
        deleteDocumentNonBlocking(doc(serviceCentersRef, currentItem.id));
        toast({ title: 'Success', description: 'Service Center deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Garage Name and Code are required.' });
      return;
    }
    if (!serviceCentersRef) return;

    if (currentItem?.id) {
      setDocumentNonBlocking(doc(serviceCentersRef, currentItem.id), formData, { merge: true });
      toast({ title: 'Success', description: 'Service Center updated successfully.' });
    } else {
      addDocumentNonBlocking(serviceCentersRef, formData);
      toast({ title: 'Success', description: 'Service Center added successfully.' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: '', code: '', address: '', mobileNumber: '', ownerName: '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ServiceCenters');
    XLSX.writeFile(wb, 'ServiceCenterTemplate.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && serviceCentersRef) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, {raw: false});

          if (!json[0] || !('name' in json[0]) || !('code' in json[0])) {
             throw new Error('Invalid Excel file format. Expecting columns "name" and "code".');
          }

          const newItems = json
            .map((item: any) => ({ 
                name: String(item.name || '').trim(),
                code: String(item.code || '').trim(),
                address: String(item.address || '').trim(),
                mobileNumber: String(item.mobileNumber || '').trim(),
                ownerName: String(item.ownerName || '').trim(),
            }))
            .filter(item => item.name && item.code)

          if(newItems.length > 0) {
            newItems.forEach(item => addDocumentNonBlocking(serviceCentersRef, item));
            toast({ title: 'Success', description: `${newItems.length} service centers uploaded successfully.` });
          } else {
            toast({ variant: 'destructive', title: 'Upload Error', description: 'No valid service centers found in the file.' });
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
                    placeholder="Search by name, code, owner..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Service Center</Button>
                <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                <label htmlFor="upload-excel-service-centers" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Upload Excel
                </label>
                <Input id="upload-excel-service-centers" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </div>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Garage Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Owner Name</TableHead>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    Array.from({length: 3}).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 float-right" /></TableCell>
                      </TableRow>
                    ))
                ) : filteredItems && filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{item.ownerName}</TableCell>
                        <TableCell>{item.mobileNumber}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Service Center</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Service Center</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No service centers found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentItem?.id ? 'Edit' : 'Add'} Service Center</DialogTitle>
            <DialogDescription>
              {currentItem?.id ? 'Update the details of the service center.' : 'Create a new service center.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Garage Name</Label>
              <Input id="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={formData.code} onChange={handleInputChange} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input id="ownerName" value={formData.ownerName} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input id="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" value={formData.address} onChange={handleInputChange} />
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
              This action cannot be undone. This will permanently delete "{currentItem?.name}".
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

    