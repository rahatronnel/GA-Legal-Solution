
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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
import { PlusCircle, Edit, Trash2, Search, Download, Upload, Printer, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { VendorEntryForm, type Vendor } from './vendor-entry-form';
import * as XLSX from 'xlsx';
import type { VendorCategory } from './vendor-category-table';
import type { VendorNatureOfBusiness } from './vendor-nature-of-business-table';
import { usePrint } from '@/app/vehicle-management/components/print-provider';

export function VendorTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { handlePrint } = usePrint();
  
  const vendorsRef = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors, isLoading: isLoadingVendors } = useCollection<Vendor>(vendorsRef);
  
  const categoriesRef = useMemoFirebase(() => firestore ? collection(firestore, 'vendorCategories') : null, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<VendorCategory>(categoriesRef);

  const naturesRef = useMemoFirebase(() => firestore ? collection(firestore, 'vendorNatureOfBusiness') : null, [firestore]);
  const { data: naturesOfBusiness, isLoading: isLoadingNatures } = useCollection<VendorNatureOfBusiness>(naturesRef);

  const isLoading = isLoadingVendors || isLoadingCategories || isLoadingNatures;

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
        const newVendorData = {
          ...vendorData,
          vendorId: `V-${Date.now()}`
        };
        addDocumentNonBlocking(vendorsRef, newVendorData);
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

  const handleDownloadTemplate = () => {
    const wsData = [
      {
        vendorName: "Example Corp",
        vendorShortName: "Example",
        vendorType: "Company",
        vendorCategoryCode: "CAT-001",
        vendorSubCategory: "Sub",
        natureOfBusinessCode: "NOB-001",
        yearsOfExperience: 5,
        contactPersonName: "John Doe",
        contactPersonDesignation: "Manager",
        mobileNumber: "1234567890",
        alternateMobileNumber: "0987654321",
        email: "john.doe@example.com",
        officePhone: "111222333",
        whatsAppNumber: "1234567890",
        officeAddress: "123 Main St, Anytown",
        factoryAddress: "456 Factory Rd, Anytown",
        country: "USA",
        city: "Anytown",
        tradeLicenseNumber: "TL-123",
        tradeLicenseExpiryDate: "2025-12-31",
        tinNumber: "TIN-456",
        vatBinNumber: "VAT-789",
        nidOrCompanyRegNumber: "REG-101",
        incorporationDate: "2019-01-01",
        bankName: "Example Bank",
        branchName: "Main Branch",
        accountName: "Example Corp",
        accountNumber: "123456789",
        routingNumber: "987654321",
        paymentMethod: "Bank",
        mobileBankingProvider: "",
        paymentTerms: "Net 30",
        creditLimit: 10000,
        currency: "USD",
        taxDeductionApplicable: "Yes",
        vatApplicable: "No",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendors');
    XLSX.writeFile(wb, 'VendorTemplate.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && vendorsRef && categories && naturesOfBusiness) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as any[];

          const requiredHeaders = ['vendorName', 'vendorType', 'vendorCategoryCode', 'email'];
          const headers = Object.keys(json[0] || {});
          if (!requiredHeaders.every(h => headers.includes(h))) {
            throw new Error(`Invalid Excel format. Required columns are: ${requiredHeaders.join(', ')}.`);
          }

          toast({ title: 'Upload Started', description: `Processing ${json.length} records. This may take a moment.` });

          for (const item of json) {
            if (!item.vendorName || !item.email) continue;
            
            const category = categories.find(c => c.code === item.vendorCategoryCode);
            const nature = naturesOfBusiness.find(n => n.code === item.natureOfBusinessCode);

            const newVendor: Partial<Omit<Vendor, 'id'>> = {
                vendorId: `V-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                vendorName: item.vendorName,
                vendorShortName: item.vendorShortName || '',
                vendorType: item.vendorType || 'Company',
                vendorCategoryId: category?.id || '',
                vendorSubCategory: item.vendorSubCategory || '',
                natureOfBusinessId: nature?.id || '',
                yearsOfExperience: Number(item.yearsOfExperience) || 0,
                contactPersonName: item.contactPersonName || '',
                contactPersonDesignation: item.contactPersonDesignation || '',
                mobileNumber: String(item.mobileNumber || ''),
                alternateMobileNumber: String(item.alternateMobileNumber || ''),
                email: item.email,
                officePhone: String(item.officePhone || ''),
                whatsAppNumber: String(item.whatsAppNumber || ''),
                officeAddress: item.officeAddress || '',
                factoryAddress: item.factoryAddress || '',
                country: item.country || '',
                city: item.city || '',
                tradeLicenseNumber: item.tradeLicenseNumber || '',
                tradeLicenseExpiryDate: item.tradeLicenseExpiryDate instanceof Date ? item.tradeLicenseExpiryDate.toISOString().split('T')[0] : '',
                tinNumber: item.tinNumber || '',
                vatBinNumber: item.vatBinNumber || '',
                nidOrCompanyRegNumber: item.nidOrCompanyRegNumber || '',
                incorporationDate: item.incorporationDate instanceof Date ? item.incorporationDate.toISOString().split('T')[0] : '',
                bankName: item.bankName || '',
                branchName: item.branchName || '',
                accountName: item.accountName || '',
                accountNumber: String(item.accountNumber || ''),
                routingNumber: String(item.routingNumber || ''),
                paymentMethod: item.paymentMethod || '',
                mobileBankingProvider: item.mobileBankingProvider || '',
                paymentTerms: item.paymentTerms || '',
                creditLimit: Number(item.creditLimit) || 0,
                currency: item.currency || 'USD',
                taxDeductionApplicable: ['yes', 'true', '1'].includes(String(item.taxDeductionApplicable).toLowerCase()),
                vatApplicable: ['yes', 'true', '1'].includes(String(item.vatApplicable).toLowerCase()),
                suppliedItems: [],
                documents: {
                    tradeLicense: '', bankChequeCopy: '', contractAgreement: '', 
                    vatCertificate: '', complianceCertificates: '', other: ''
                },
                loginId: item.email,
                createdDate: new Date().toISOString(),
                vendorStatus: 'Pending',
            };
            addDocumentNonBlocking(vendorsRef, newVendor);
          }
          
          toast({ title: 'Success', description: `Finished processing ${json.length} vendors.` });

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
                    placeholder="Search by name, ID, email..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2 flex-wrap">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Vendor</Button>
                <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
                <label htmlFor="upload-excel-vendors" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Upload Excel
                </label>
                <Input id="upload-excel-vendors" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
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
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
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
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <Link href={`/billflow/vendors/${item.id}`}><Eye className="h-4 w-4" /></Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Vendor</TooltipContent>
                            </Tooltip>
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
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(item, 'vendor')}>
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Print Vendor Profile</TooltipContent>
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
