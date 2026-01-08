
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
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export type TripPurpose = {
  id: string;
  name: string;
};

export function TripPurposeTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const purposesRef = useMemoFirebase(() => firestore ? collection(firestore, 'tripPurposes') : null, [firestore]);
  const { data: tripPurposes, isLoading } = useCollection<TripPurpose>(purposesRef);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentPurpose, setCurrentPurpose] = useState<Partial<TripPurpose> | null>(null);
  const [purposeName, setPurposeName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const safePurposes = useMemo(() => Array.isArray(tripPurposes) ? tripPurposes : [], [tripPurposes]);

  const filteredPurposes = useMemo(() => {
    if (!searchTerm) return safePurposes;
    const lowercasedTerm = searchTerm.toLowerCase();
    return safePurposes.filter(p => p.name.toLowerCase().includes(lowercasedTerm));
  }, [safePurposes, searchTerm]);
  
  const resetForm = () => {
    setCurrentPurpose(null);
    setPurposeName('');
  }

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (purpose: TripPurpose) => {
    setCurrentPurpose(purpose);
    setPurposeName(purpose.name);
    setIsDialogOpen(true);
  };

  const handleDelete = (purpose: TripPurpose) => {
    setCurrentPurpose(purpose);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentPurpose?.id && purposesRef) {
        deleteDocumentNonBlocking(doc(purposesRef, currentPurpose.id));
        toast({ title: 'Success', description: 'Trip purpose deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!purposeName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Purpose name is required.' });
      return;
    }
    if (!purposesRef) return;

    if (currentPurpose?.id) {
      setDocumentNonBlocking(doc(purposesRef, currentPurpose.id), { name: purposeName }, { merge: true });
      toast({ title: 'Success', description: 'Trip purpose updated successfully.' });
    } else {
      addDocumentNonBlocking(purposesRef, { name: purposeName });
      toast({ title: 'Success', description: 'Trip purpose added successfully.' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TripPurposes');
    XLSX.writeFile(wb, 'TripPurposeTemplate.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && purposesRef) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, {raw: false});

          if (!json[0] || !('name' in json[0])) {
             throw new Error('Invalid Excel file format. Expecting a column with header "name".');
          }

          const newItems = json
            .map((item: any) => ({ name: String(item.name || '').trim() }))
            .filter(item => item.name);
          
          if(newItems.length > 0) {
            newItems.forEach(item => addDocumentNonBlocking(purposesRef, item));
            toast({ title: 'Success', description: 'Trip purposes uploaded successfully.' });
          } else {
            toast({ variant: 'destructive', title: 'Upload Error', description: 'No valid purposes found in the file.' });
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
                    placeholder="Search purposes..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Purpose</Button>
                <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                <label htmlFor="upload-excel-purposes" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Upload Excel
                </label>
                <Input id="upload-excel-purposes" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
            </div>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Purpose Name</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    Array.from({length: 3}).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 float-right" /></TableCell>
                      </TableRow>
                    ))
                ) : filteredPurposes && filteredPurposes.length > 0 ? (
                    filteredPurposes.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Purpose</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Purpose</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">No trip purposes found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentPurpose?.id ? 'Edit' : 'Add'} Trip Purpose</DialogTitle>
            <DialogDescription>
              {currentPurpose?.id ? 'Update the details of the purpose.' : 'Create a new purpose.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={purposeName} onChange={(e) => setPurposeName(e.target.value)} className="col-span-3" />
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
              This action cannot be undone. This will permanently delete the purpose "{currentPurpose?.name}".
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
