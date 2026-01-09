
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, CalendarIcon, PlusCircle, Trash2, File as FileIcon, ChevronsUpDown, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn, imageToDataUrl } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useBillFlow } from './bill-flow-provider';
import type { Vendor } from './vendor-entry-form';
import type { BillType } from './bill-type-table';
import type { BillCategory } from './bill-category-table';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import type { BillItemMaster } from './bill-item-master-table';
import { useUser } from '@/firebase';


type UploadedFile = {
  id: string;
  name: string;
  file: string; // data URL
}

type DocType = 'vendorInvoice' | 'deliveryChallan' | 'workCompletionCert' | 'poCopy' | 'contractCopy' | 'supportingDocs' | 'remarksDoc';
const documentLabels: Record<DocType, string> = {
    vendorInvoice: 'Vendor Invoice',
    deliveryChallan: 'Delivery Challan',
    workCompletionCert: 'Work Completion Certificate',
    poCopy: 'Purchase Order Copy',
    contractCopy: 'Agreement / Contract Copy',
    supportingDocs: 'Supporting Documents',
    remarksDoc: 'Remarks Document',
};

export type BillItem = {
    id: string;
    billItemMasterId?: string; // Link to master item
    name: string;
    billItemCategoryId: string;
    description: string;
    unitOfMeasure: string;
    quantity: number;
    unitPrice: number;
    grossAmount: number;
    discountAmount: number;
    netAmount: number;
};

export type Bill = {
  id: string;
  billId: string;
  billReferenceNumber: string;
  vendorId: string;
  billTypeId: string;
  billCategoryId: string;
  billSubCategory: string;
  billDate: string;
  billReceivedDate: string;
  entryDate: string;
  entryBy: string; // Employee ID
  
  items: BillItem[];
  
  vatApplicable: boolean;
  vatPercentage: number;
  vatAmount: number;
  tdsApplicable: boolean;
  tdsPercentage: number;
  tdsAmount: number;
  otherCharges: number;
  deductionAmount: number;
  totalPayableAmount: number;
  
  billingPeriodFrom: string;
  billingPeriodTo: string;
  poNumber: string;
  woNumber: string;
  grnNumber: string;
  gatePassNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  
  departmentCode: string;
  departmentName: string;
  costCenter: string;
  project: string;
  machineNumber: string;
  budgetHead: string;
  budgetRef: string;
  
  documents: Record<DocType, UploadedFile[]>;
};

const initialBillData: Omit<Bill, 'id' | 'billId' | 'items' | 'documents'> = {
  billReferenceNumber: '', vendorId: '', billTypeId: '', billCategoryId: '',
  billSubCategory: '', billDate: '', billReceivedDate: '', entryDate: '', entryBy: '',
  vatApplicable: false, vatPercentage: 0, vatAmount: 0, tdsApplicable: false,
  tdsPercentage: 0, tdsAmount: 0, otherCharges: 0, deductionAmount: 0, totalPayableAmount: 0,
  billingPeriodFrom: '', billingPeriodTo: '', poNumber: '', woNumber: '', grnNumber: '',
  gatePassNumber: '', invoiceNumber: '', invoiceDate: '', departmentCode: '', departmentName: '',
  costCenter: '', project: '', machineNumber: '', budgetHead: '', budgetRef: '',
};

const initialDocuments = Object.keys(documentLabels).reduce((acc, key) => ({...acc, [key]: []}), {} as Record<DocType, UploadedFile[]>);

const MandatoryIndicator = () => <span className="text-red-500 ml-1">*</span>;

interface BillEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: Partial<Bill>) => void;
  bill: Partial<Bill> | null;
}

export function BillEntryForm({ isOpen, setIsOpen, onSave, bill }: BillEntryFormProps) {
    const { toast } = useToast();
    const { user } = useUser();
    const { data } = useBillFlow();
    const { vendors, billTypes, billCategories, employees, sections, billItemMasters, billItemCategories } = data;
    
    const [step, setStep] = useState(1);
    const [billData, setBillData] = useState(initialBillData);
    const [items, setItems] = useState<BillItem[]>([]);
    const [documents, setDocuments] = useState(initialDocuments);
    
    const [billDate, setBillDate] = useState<Date|undefined>(new Date());
    const [billReceivedDate, setBillReceivedDate] = useState<Date|undefined>();
    const [invoiceDate, setInvoiceDate] = useState<Date|undefined>();
    const [billingPeriodFrom, setBillingPeriodFrom] = useState<Date|undefined>();
    const [billingPeriodTo, setBillingPeriodTo] = useState<Date|undefined>();
    
    const [vendorPopoverOpen, setVendorPopoverOpen] = useState(false);

    const isEditing = bill && bill.id;
    const totalSteps = 6;
    const progress = Math.round((step / totalSteps) * 100);

    const setDateIfValid = (dateStr: string | undefined, setter: (d: Date | undefined) => void) => {
        if(dateStr) {
           const parsed = parseISO(dateStr);
           if (!isNaN(parsed.valueOf())) setter(parsed);
        } else {
            setter(undefined);
        }
    }

    useEffect(() => {
        if (isOpen) {
          setStep(1);
          if (isEditing && bill) {
            setBillData({ ...initialBillData, ...bill });
            setItems(bill.items || []);
            setDocuments(bill.documents || initialDocuments);
            setDateIfValid(bill.billDate, setBillDate);
            setDateIfValid(bill.billReceivedDate, setBillReceivedDate);
            setDateIfValid(bill.invoiceDate, setInvoiceDate);
            setDateIfValid(bill.billingPeriodFrom, setBillingPeriodFrom);
            setDateIfValid(bill.billingPeriodTo, setBillingPeriodTo);
          } else {
            const today = new Date();
            const loggedInEmployee = employees.find(e => e.email === user?.email);

            setBillData({...initialBillData, entryDate: format(today, 'yyyy-MM-dd'), billDate: format(today, 'yyyy-MM-dd'), entryBy: loggedInEmployee?.id || ''});
            setItems([]);
            setDocuments(initialDocuments);
            setBillDate(today); 
            setBillReceivedDate(undefined); 
            setInvoiceDate(undefined);
            setBillingPeriodFrom(undefined); 
            setBillingPeriodTo(undefined);
          }
        }
      }, [isOpen, bill, isEditing, user, employees]);

      
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setBillData(prev => ({...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
    
    const handleSelectChange = (id: keyof Omit<Bill, 'id' | 'items' | 'documents'>) => (value: string) => {
        const newBillData = { ...billData, [id]: value };
        if (id === 'vendorId') {
            const selectedVendor = vendors.find(v => v.id === value);
            if (selectedVendor) {
                newBillData.billCategoryId = selectedVendor.vendorCategoryId || '';
                newBillData.billSubCategory = selectedVendor.vendorSubCategory || '';
            }
        }
        setBillData(newBillData);
    }
    
    const handleCheckboxChange = (id: 'vatApplicable' | 'tdsApplicable') => (checked: boolean) => {
        setBillData(prev => ({ ...prev, [id]: checked }));
    };

    const handleDateChange = (setter: (date: Date | undefined) => void, field: keyof Omit<Bill, 'id' | 'items' | 'documents'>) => (date: Date | undefined) => {
        setter(date);
        setBillData(prev => ({...prev, [field]: date ? format(date, 'yyyy-MM-dd') : ''}))
    }
    
    // Item handlers
    const addItem = () => setItems(prev => [...prev, { id: Date.now().toString(), billItemMasterId: '', name: '', billItemCategoryId: '', description: '', unitOfMeasure: '', quantity: 1, unitPrice: 0, grossAmount: 0, discountAmount: 0, netAmount: 0 }]);
    const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));
    const updateItem = (id: string, field: keyof BillItem, value: string | number) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const newItem = { ...item, [field]: value };

                if (field === 'billItemMasterId') {
                    const masterItem = billItemMasters.find(m => m.id === value);
                    if (masterItem) {
                        newItem.name = masterItem.name;
                        newItem.billItemCategoryId = masterItem.billItemCategoryId;
                        newItem.description = masterItem.description;
                        newItem.unitOfMeasure = masterItem.unitOfMeasure;
                        newItem.unitPrice = masterItem.unitPrice;
                    }
                }

                if (['quantity', 'unitPrice', 'discountAmount'].includes(field as string)) {
                    newItem.grossAmount = newItem.quantity * newItem.unitPrice;
                    newItem.netAmount = newItem.grossAmount - newItem.discountAmount;
                }
                return newItem;
            }
            return item;
        }));
    };
    
    // Calculations
    const totalNetAmount = useMemo(() => items.reduce((sum, item) => sum + item.netAmount, 0), [items]);
    
    useEffect(() => {
        const vatAmount = billData.vatApplicable ? totalNetAmount * (billData.vatPercentage / 100) : 0;
        const tdsAmount = billData.tdsApplicable ? totalNetAmount * (billData.tdsPercentage / 100) : 0;
        const totalPayable = totalNetAmount + vatAmount - tdsAmount + (billData.otherCharges || 0) - (billData.deductionAmount || 0);

        setBillData(prev => ({
            ...prev,
            vatAmount,
            tdsAmount,
            totalPayableAmount: totalPayable
        }));
    }, [totalNetAmount, billData.vatApplicable, billData.vatPercentage, billData.tdsApplicable, billData.tdsPercentage, billData.otherCharges, billData.deductionAmount]);
    
    // Document handlers
    const handleFileChange = (docType: DocType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            try {
              const dataUrl = await imageToDataUrl(file);
              setDocuments(prev => ({...prev, [docType]: [...(prev[docType] || []), { id: Date.now().toString(), name: file.name, file: dataUrl }] }));
            } catch (error) {
               console.error("Error processing document:", error);
               toast({ variant: 'destructive', title: 'File Error', description: `Could not process ${file.name}.` });
            }
        }
    };
    const removeDocument = (docType: DocType, fileId: string) => {
        setDocuments(prev => ({ ...prev, [docType]: prev[docType].filter(doc => doc.id !== fileId)}));
    };

    const validateStep = (currentStep: number): boolean => {
        const missingFields: string[] = [];
        if (currentStep === 1) {
            if (!billData.vendorId) missingFields.push('Vendor');
            if (!billData.billTypeId) missingFields.push('Bill Type');
            if (!billData.billDate) missingFields.push('Bill Date');
            if (!billData.billReceivedDate) missingFields.push('Bill Received Date');
        }
        if (missingFields.length > 0) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: `Please fill: ${missingFields.join(', ')}` });
            return false;
        }
        return true;
    }
      
    const nextStep = () => {
        if (!validateStep(step)) return;
        setStep(s => s + 1);
    };
    const prevStep = () => setStep(s => s - 1);

    const handleSave = () => {
        if (!validateStep(1)) {
            toast({ variant: 'destructive', title: 'Missing Required Fields', description: 'Please go back and fill in all required fields in Step 1.'});
            return;
        }
        const dataToSave: Partial<Bill> = {
            ...billData,
            items,
            documents,
        };
        
        if (isEditing && bill.id) dataToSave.id = bill.id;
        
        onSave(dataToSave);
        setIsOpen(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Bill' : 'Add New Bill'}</DialogTitle>
                    <DialogDescription>Follow the steps to add or update bill information.</DialogDescription>
                    <Progress value={progress} className="w-full mt-2" />
                </DialogHeader>

                <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 1: Bill Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Vendor<MandatoryIndicator/></Label>
                                  <Popover open={vendorPopoverOpen} onOpenChange={setVendorPopoverOpen}>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {billData.vendorId ? vendors.find(v => v.id === billData.vendorId)?.vendorName : "Select vendor..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                      <Command>
                                        <CommandInput placeholder="Search vendor..." />
                                        <CommandEmpty>No vendor found.</CommandEmpty>
                                        <CommandList><CommandGroup>
                                          {vendors.map(v => 
                                            <CommandItem key={v.id} value={v.vendorName} onSelect={() => {
                                                handleSelectChange('vendorId')(v.id);
                                                setVendorPopoverOpen(false);
                                            }}>
                                              <Check className={cn("mr-2 h-4 w-4", billData.vendorId === v.id ? "opacity-100" : "opacity-0")} />
                                              {v.vendorName}
                                            </CommandItem>
                                          )}
                                        </CommandGroup></CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div className="space-y-2"><Label>Bill Reference Number</Label><Input id="billReferenceNumber" value={billData.billReferenceNumber} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Bill Type<MandatoryIndicator/></Label><Select value={billData.billTypeId} onValueChange={handleSelectChange('billTypeId')}><SelectTrigger><SelectValue placeholder="Select type"/></SelectTrigger><SelectContent>{billTypes.map(t=><SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>Bill Category</Label><Select value={billData.billCategoryId} onValueChange={handleSelectChange('billCategoryId')}><SelectTrigger><SelectValue placeholder="Select category"/></SelectTrigger><SelectContent>{billCategories.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>Bill Sub-Category</Label><Input id="billSubCategory" value={billData.billSubCategory} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Bill Date<MandatoryIndicator/></Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{billDate ? format(billDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={billDate} onSelect={handleDateChange(setBillDate, 'billDate')} /></PopoverContent></Popover></div>
                                <div className="space-y-2"><Label>Bill Received Date<MandatoryIndicator/></Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{billReceivedDate ? format(billReceivedDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={billReceivedDate} onSelect={handleDateChange(setBillReceivedDate, 'billReceivedDate')} /></PopoverContent></Popover></div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                         <div className="space-y-4">
                            <div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Step 2: Purchase / Service Details</h3><Button variant="outline" size="sm" onClick={addItem}><PlusCircle className="mr-2 h-4 w-4"/>Add Item</Button></div>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                {items.map((item, index) => (
                                    <div key={item.id} className="p-3 border rounded-lg space-y-2">
                                         <div className="flex justify-between items-center"><Label className="text-base">Item {index + 1}</Label><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Item/Service Name</Label>
                                                <Select value={item.billItemMasterId} onValueChange={(v) => updateItem(item.id, 'billItemMasterId', v)}>
                                                    <SelectTrigger><SelectValue placeholder="Select from master list..."/></SelectTrigger>
                                                    <SelectContent>{billItemMasters.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Item Category</Label>
                                                <Select value={item.billItemCategoryId} onValueChange={(v) => updateItem(item.id, 'billItemCategoryId', v)}>
                                                    <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                                                    <SelectContent>{billItemCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2 md:col-span-3"><Label>Description</Label><Input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} /></div>
                                         </div>
                                         <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                            <div className="space-y-1"><Label>Unit</Label><Input value={item.unitOfMeasure} onChange={(e) => updateItem(item.id, 'unitOfMeasure', e.target.value)} /></div>
                                            <div className="space-y-1"><Label>Quantity</Label><Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} /></div>
                                            <div className="space-y-1"><Label>Unit Price</Label><Input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} /></div>
                                            <div className="space-y-1"><Label>Discount</Label><Input type="number" value={item.discountAmount} onChange={(e) => updateItem(item.id, 'discountAmount', parseFloat(e.target.value) || 0)} /></div>
                                            <div className="space-y-1"><Label>Net Amount</Label><Input value={item.netAmount.toFixed(2)} disabled /></div>
                                         </div>
                                    </div>
                                ))}
                                {items.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No items added yet.</p>}
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 3: Tax & Adjustment Information</h3>
                            <div className="p-4 border rounded-lg space-y-4">
                               <p className="text-right font-medium">Net Bill Amount: {totalNetAmount.toFixed(2)}</p>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                   <div className="flex items-center space-x-2"><Checkbox id="vatApplicable" checked={billData.vatApplicable} onCheckedChange={(c) => handleCheckboxChange('vatApplicable')(c as boolean)}/><Label htmlFor="vatApplicable">VAT Applicable?</Label></div>
                                   <div className="space-y-2"><Label>VAT Percentage</Label><Input id="vatPercentage" type="number" value={billData.vatPercentage} onChange={handleInputChange} disabled={!billData.vatApplicable} /></div>
                                   <div className="space-y-2"><Label>VAT Amount</Label><Input id="vatAmount" value={billData.vatAmount.toFixed(2)} disabled /></div>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                   <div className="flex items-center space-x-2"><Checkbox id="tdsApplicable" checked={billData.tdsApplicable} onCheckedChange={(c) => handleCheckboxChange('tdsApplicable')(c as boolean)}/><Label htmlFor="tdsApplicable">TDS Applicable?</Label></div>
                                   <div className="space-y-2"><Label>TDS Percentage</Label><Input id="tdsPercentage" type="number" value={billData.tdsPercentage} onChange={handleInputChange} disabled={!billData.tdsApplicable} /></div>
                                   <div className="space-y-2"><Label>TDS Amount</Label><Input id="tdsAmount" value={billData.tdsAmount.toFixed(2)} disabled /></div>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                   <div className="space-y-2"><Label>Other Charges</Label><Input id="otherCharges" type="number" value={billData.otherCharges} onChange={handleInputChange} /></div>
                                   <div className="space-y-2"><Label>Deduction Amount</Label><Input id="deductionAmount" type="number" value={billData.deductionAmount} onChange={handleInputChange} /></div>
                               </div>
                               <div className="text-right font-bold text-lg pt-4 border-t">Total Payable: {billData.totalPayableAmount.toFixed(2)}</div>
                            </div>
                        </div>
                    )}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 4: Billing Period & Reference</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Billing Period From</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{billingPeriodFrom ? format(billingPeriodFrom, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={billingPeriodFrom} onSelect={handleDateChange(setBillingPeriodFrom, 'billingPeriodFrom')} /></PopoverContent></Popover></div>
                                <div className="space-y-2"><Label>Billing Period To</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{billingPeriodTo ? format(billingPeriodTo, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={billingPeriodTo} onSelect={handleDateChange(setBillingPeriodTo, 'billingPeriodTo')} /></PopoverContent></Popover></div>
                                <div className="space-y-2"><Label>Vendor Invoice Number</Label><Input id="invoiceNumber" value={billData.invoiceNumber} onChange={handleInputChange}/></div>
                                <div className="space-y-2"><Label>Vendor Invoice Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{invoiceDate ? format(invoiceDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={invoiceDate} onSelect={handleDateChange(setInvoiceDate, 'invoiceDate')} /></PopoverContent></Popover></div>
                                <div className="space-y-2"><Label>PO Number</Label><Input id="poNumber" value={billData.poNumber} onChange={handleInputChange}/></div>
                                <div className="space-y-2"><Label>WO Number</Label><Input id="woNumber" value={billData.woNumber} onChange={handleInputChange}/></div>
                                <div className="space-y-2"><Label>GRN / Challan Number</Label><Input id="grnNumber" value={billData.grnNumber} onChange={handleInputChange}/></div>
                                <div className="space-y-2"><Label>Gate Pass Number</Label><Input id="gatePassNumber" value={billData.gatePassNumber} onChange={handleInputChange}/></div>
                            </div>
                        </div>
                    )}
                    {step === 5 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 5: Department & Cost Control</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Department Name</Label><Select value={billData.departmentName} onValueChange={handleSelectChange('departmentName')}><SelectTrigger><SelectValue placeholder="Select department"/></SelectTrigger><SelectContent>{sections.map(s=><SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>Department Code</Label><Input value={sections.find(s=>s.name === billData.departmentName)?.sectionCode || ''} disabled/></div>
                                <div className="space-y-2"><Label>Cost Center</Label><Input id="costCenter" value={billData.costCenter} onChange={handleInputChange}/></div>
                                <div className="space-y-2"><Label>Project / Production Line</Label><Input id="project" value={billData.project} onChange={handleInputChange}/></div>
                                <div className="space-y-2"><Label>Machine / Line Number</Label><Input id="machineNumber" value={billData.machineNumber} onChange={handleInputChange}/></div>
                                <div className="space-y-2"><Label>Budget Head</Label><Input id="budgetHead" value={billData.budgetHead} onChange={handleInputChange}/></div>
                                <div className="space-y-2 col-span-2"><Label>Budget Reference</Label><Input id="budgetRef" value={billData.budgetRef} onChange={handleInputChange}/></div>
                            </div>
                        </div>
                    )}
                    {step === 6 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 6: Document Attachment Section</h3>
                            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                                {(Object.keys(documentLabels) as DocType[]).map(docType => (
                                    <div key={docType} className="space-y-2 p-3 border rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <Label className="font-medium">{documentLabels[docType]}</Label>
                                            <Label htmlFor={`file-upload-${docType}`} className="cursor-pointer text-sm text-primary hover:underline">Add File(s)</Label>
                                            <Input id={`file-upload-${docType}`} type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange(docType)} />
                                        </div>
                                        <div className="space-y-1">
                                            {(documents[docType] || []).map(file => (
                                                <div key={file.id} className="flex items-center justify-between text-sm p-1.5 bg-muted rounded-md">
                                                    <div className="flex items-center gap-2 truncate"><FileIcon className="h-4 w-4 flex-shrink-0" /><span className="truncate">{file.name}</span></div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDocument(docType, file.id)}><X className="h-4 w-4" /></Button>
                                                </div>
                                            ))}
                                            {(documents[docType] || []).length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No files uploaded.</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between w-full pt-4 border-t">
                    <div>{step > 1 && <Button variant="outline" onClick={prevStep}>Previous</Button>}</div>
                    <div>{step < totalSteps ? <Button onClick={nextStep}>Next</Button> : <Button onClick={handleSave}>{isEditing ? 'Update Bill' : 'Save Bill'}</Button>}</div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
