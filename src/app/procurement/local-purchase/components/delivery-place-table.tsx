
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
import { Download, Upload, PlusCircle, Edit, Trash2, Search, MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

export type DeliveryPlace = {
  id: string;
  name: string;
  code: string;
  address: string;
};

export function DeliveryPlaceTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const deliveryPlacesRef = useMemoFirebase(() => firestore ? collection(firestore, 'deliveryPlaces') : null, [firestore]);
  const { data: deliveryPlaces, isLoading } = useCollection<DeliveryPlace>(deliveryPlacesRef);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<DeliveryPlace> | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', address: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const safeItems = useMemo(() => Array.isArray(deliveryPlaces) ? deliveryPlaces : [], [deliveryPlaces]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return safeItems;
    const lowercasedTerm = searchTerm.toLowerCase();
    return safeItems.filter(loc => 
        loc.name.toLowerCase().includes(lowercasedTerm) ||
        loc.code.toLowerCase().includes(lowercasedTerm) ||
        loc.address.toLowerCase().includes(lowercasedTerm)
    );
  }, [safeItems, searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const resetForm = () => {
    setCurrentItem(null);
    setFormData({ name: '', code: '', address: '' });
  }

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (item: DeliveryPlace) => {
    setCurrentItem(item);
    setFormData({ name: item.name, code: item.code, address: item.address || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = (item: DeliveryPlace) => {
    setCurrentItem(item);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentItem?.id && deliveryPlacesRef) {
        deleteDocumentNonBlocking(doc(deliveryPlacesRef, currentItem.id));
        toast({ title: 'Success', description: 'Delivery office deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.code.trim() || !formData.address.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name, Code, and Physical Address are mandatory.' });
      return;
    }
    if (!deliveryPlacesRef) return;

    if (currentItem?.id) {
      setDocumentNonBlocking(doc(deliveryPlacesRef, currentItem.id), formData, { merge: true });
      toast({ title: 'Success', description: 'Delivery office updated successfully.' });
    } else {
      addDocumentNonBlocking(deliveryPlacesRef, formData);
      toast({ title: 'Success', description: 'Delivery office added successfully.' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: '', code: '', address: '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DeliveryPlaces');
    XLSX.writeFile(wb, 'DeliveryPlaceTemplate.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && deliveryPlacesRef) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: false });

          if (!json[0] || typeof json[0] !== "object" || !("name" in json[0]) || !("code" in json[0]) || !("address" in json[0])) {
             throw new Error('Invalid Excel file format. Expecting columns "name", "code", and "address".');
          }

          const newItems = json
            .map((item: any) => ({
              name: String(item.name || '').trim(),
              code: String(item.code || '').trim(),
              address: String(item.address || '').trim()
            }))
            .filter(item => item.name && item.code);
          
          if(newItems.length > 0) {
            newItems.forEach(item => addDocumentNonBlocking(deliveryPlacesRef, item));
            toast({ title: 'Success', description: 'Delivery offices uploaded successfully.' });
          } else {
            toast({ variant: 'destructive', title: 'Upload Error', description: 'No valid delivery places found in the file.' });
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
                    placeholder="Search offices or addresses..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Delivery Office</Button>
                <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                <label htmlFor="upload-excel-delivery-places" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Upload Excel
                </label>
                <Input id="upload-excel-delivery-places" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </div>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Office Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Physical Address</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    Array.from({length: 3}).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 float-right" /></TableCell>
                      </TableRow>
                    ))
                ) : filteredItems && filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-bold">{item.name}</TableCell>
                        <TableCell>{item.code}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{item.address}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Office</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Office</TooltipContent>
                              </Tooltip>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No delivery offices found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md animate-dialog-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> {currentItem?.id ? 'Edit' : 'Add'} Delivery Office</DialogTitle>
            <DialogDescription>
              Provide the office identity and physical shipping address.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase font-black tracking-widest text-muted-foreground">Office Name</Label>
              <Input id="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs uppercase font-black tracking-widest text-muted-foreground">Internal Code</Label>
              <Input id="code" value={formData.code} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs uppercase font-black tracking-widest text-muted-foreground">Physical Shipping Address</Label>
              <Textarea id="address" value={formData.address} onChange={handleInputChange} placeholder="Enter full address for Purchase Orders..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Office Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="animate-dialog-in">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the office "{currentItem?.name}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Office</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
