
"use client";

import React, { useState } from 'react';
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
import { MoreHorizontal, Download, Upload, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


export type Section = {
  id: string;
  name: string;
  sectionCode: string;
};

interface SectionTableProps {
  sections: Section[];
  isLoading: boolean;
}

export function SectionTable({ sections, isLoading }: SectionTableProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const sectionsRef = firestore ? collection(firestore, 'sections') : null;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<Partial<Section> | null>(null);
  const [sectionData, setSectionData] = useState({ name: '', sectionCode: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSectionData(prev => ({ ...prev, [id]: value }));
  };
  
  const resetForm = () => {
    setCurrentSection(null);
    setSectionData({ name: '', sectionCode: '' });
  }

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (section: Section) => {
    setCurrentSection(section);
    setSectionData({ name: section.name, sectionCode: section.sectionCode });
    setIsDialogOpen(true);
  };

  const handleDelete = (section: Section) => {
    setCurrentSection(section);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentSection?.id && sectionsRef) {
        const docRef = doc(sectionsRef, currentSection.id);
        deleteDocumentNonBlocking(docRef);
        toast({ title: 'Success', description: 'Section deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!sectionData.name.trim() || !sectionData.sectionCode.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'All fields are required.' });
      return;
    }

    if (!sectionsRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database connection not available.' });
        return;
    }

    if (currentSection?.id) {
      const docRef = doc(sectionsRef, currentSection.id);
      setDocumentNonBlocking(docRef, sectionData, { merge: true });
      toast({ title: 'Success', description: 'Section updated successfully.' });
    } else {
      addDocumentNonBlocking(sectionsRef, sectionData);
      toast({ title: 'Success', description: 'Section added successfully.' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: '', sectionCode: '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sections');
    XLSX.writeFile(wb, 'SectionTemplate.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && sectionsRef) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, {raw: false});

          if (!json[0] || !('name' in json[0]) || !('sectionCode' in json[0])) {
             throw new Error('Invalid Excel file format. Expecting columns with headers "name" and "sectionCode".');
          }

          const newItems = json
            .map((item: any) => ({
              name: String(item.name || '').trim(),
              sectionCode: String(item.sectionCode || '').trim()
            }))
            .filter(item => item.name && item.sectionCode);
          
          if(newItems.length > 0) {
            newItems.forEach(item => {
                addDocumentNonBlocking(sectionsRef, item);
            });
            toast({ title: 'Success', description: `${newItems.length} sections uploaded successfully.` });
          } else {
             toast({ variant: 'destructive', title: 'Upload Error', description: 'No valid sections found in the file.' });
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
    <div className="space-y-4">
        <div className="flex justify-end gap-2">
            <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Section</Button>
            <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
            <Label htmlFor="upload-excel-sections" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Upload Excel
            </Label>
            <Input id="upload-excel-sections" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Section Name</TableHead>
                    <TableHead>Section Code</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
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
                ) : sections && sections.length > 0 ? (
                    sections.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.sectionCode}</TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">No sections found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentSection?.id ? 'Edit' : 'Add'} Section</DialogTitle>
            <DialogDescription>
              {currentSection?.id ? 'Update the details of the section.' : 'Create a new section.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={sectionData.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sectionCode" className="text-right">
                Section Code
              </Label>
              <Input id="sectionCode" value={sectionData.sectionCode} onChange={handleInputChange} className="col-span-3" />
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
              This action cannot be undone. This will permanently delete the section "{currentSection?.name}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
