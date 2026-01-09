
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
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { VendorEntryForm, type Vendor } from './vendor-entry-form';

export function VendorTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const vendorsRef = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors, isLoading } = useCollection<Vendor>(vendorsRef);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Vendor> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const safeVendors = useMemo(() => Array.isArray(vendors) ? vendors : [], [vendors]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return safeVendors;
    const lowercasedTerm = searchTerm.toLowerCase();
    return safeVendors.filter(p => 
        (p.vendorName && p.vendorName.toLowerCase().includes(lowercasedTerm)) ||
        (p.vendorId && p.vendorId.toLowerCase().includes(lowercasedTerm)) ||
        (p.email && p.email.toLowerCase().includes(lowercasedTerm)) ||
        (p.mobileNumber && p.mobileNumber.includes(lowercasedTerm))
    );
  }, [safeVendors, searchTerm]);

  const handleAdd = () => {
    setCurrentItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Vendor) => {
    setCurrentItem(item);
    setIsFormOpen(true);
  };
  
  const handleSave = (vendorData: Partial<Vendor>) => {
    if (!vendorsRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        return;
    }

    if (vendorData.id) {
        const { id, ...dataToSave } = vendorData;
        setDocumentNonBlocking(doc(vendorsRef, id), dataToSave, { merge: true });
        toast({ title: 'Success', description: 'Vendor updated successfully.' });
    } else {
        addDocumentNonBlocking(vendorsRef, vendorData);
        toast({ title: 'Success', description: 'Vendor added successfully.' });
    }
  };

  const handleDelete = (item: Vendor) => {
    setCurrentItem(item);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentItem?.id && vendorsRef) {
        deleteDocumentNonBlocking(doc(vendorsRef, currentItem.id));
        toast({ title: 'Success', description: 'Vendor deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    setCurrentItem(null);
  };

  return (
    <TooltipProvider>
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by name, ID, email..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Vendor</Button>
            </div>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Vendor ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    Array.from({length: 5}).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 float-right" /></TableCell>
                      </TableRow>
                    ))
                ) : filteredItems && filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.vendorName}</TableCell>
                        <TableCell>{item.vendorId}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.mobileNumber}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Vendor</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Vendor</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No vendors found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>

        <VendorEntryForm 
            isOpen={isFormOpen}
            setIsOpen={setIsFormOpen}
            onSave={handleSave}
            vendor={currentItem}
        />
      
       <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the vendor "{currentItem?.vendorName}".
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
