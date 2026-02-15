
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
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export type ProcessCode = {
  id: string;
  name: string;
  code: string;
};

export function ProcessCodeTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const dataRef = useMemoFirebase(() => firestore ? collection(firestore, 'processCodes') : null, [firestore]);
  const { data: items, isLoading } = useCollection<ProcessCode>(dataRef);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ProcessCode> | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const safeItems = useMemo(() => Array.isArray(items) ? items : [], [items]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return safeItems;
    const lowercasedTerm = searchTerm.toLowerCase();
    return safeItems.filter(p => 
        p.name.toLowerCase().includes(lowercasedTerm) ||
        p.code.toLowerCase().includes(lowercasedTerm)
    );
  }, [safeItems, searchTerm]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const resetForm = () => {
    setCurrentItem(null);
    setFormData({ name: '', code: '' });
  }

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (item: ProcessCode) => {
    setCurrentItem(item);
    setFormData({ name: item.name, code: item.code });
    setIsDialogOpen(true);
  };

  const handleDelete = (item: ProcessCode) => {
    setCurrentItem(item);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentItem?.id && dataRef) {
        deleteDocumentNonBlocking(doc(dataRef, currentItem.id));
        toast({ title: 'Success', description: 'Process Code deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name and Code are required.' });
      return;
    }

    if (!dataRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        return;
    }

    if (currentItem?.id) {
      setDocumentNonBlocking(doc(dataRef, currentItem.id), formData, { merge: true });
      toast({ title: 'Success', description: 'Process Code updated successfully.' });
    } else {
      addDocumentNonBlocking(dataRef, formData);
      toast({ title: 'Success', description: 'Process Code added successfully.' });
    }

    setIsDialogOpen(false);
    resetForm();
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
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Code</Button>
            </div>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    Array.from({length: 3}).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 float-right" /></TableCell>
                      </TableRow>
                    ))
                ) : filteredItems && filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
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
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">No process codes found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentItem?.id ? 'Edit' : 'Add'} Process Code</DialogTitle>
            <DialogDescription>
              {currentItem?.id ? 'Update the details.' : 'Create a new process code.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={formData.name} onChange={handleInputChange} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={formData.code} onChange={handleInputChange} />
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
