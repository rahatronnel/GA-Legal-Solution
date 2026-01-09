
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
    name: string;
    category: 'Raw Material' | 'Spare' | 'Service' | 'Logistics' | '';
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
    const { data } = useBillFlow();
    const { vendors, billTypes, billCategories, employees, sections } = data;
    
    const [step, setStep] = useState(1);
    const [billData, setBillData] = useState(initialBillData);
    const [items, setItems] = useState<BillItem[]>([]);
    const [documents, setDocuments] = useState(initialDocuments);
    
    const [billDate, setBillDate] = useState<Date|undefined>();
    const [billReceivedDate, setBillReceivedDate] = useState<Date|undefined>();
    const [invoiceDate, setInvoiceDate] = useState<Date|undefined>();
    const [billingPeriodFrom, setBillingPeriodFrom] = useState<Date|undefined>();
    const [billingPeriodTo, setBillingPeriodTo] = useState<Date|undefined>();

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
            setBillData({...initialBillData, entryDate: format(new Date(), 'yyyy-MM-dd')});
            setItems([]);
            setDocuments(initialDocuments);
            setBillDate(undefined); setBillReceivedDate(undefined); setInvoiceDate(undefined);
            setBillingPeriodFrom(undefined); setBillingPeriodTo(undefined);
          }
        }
      }, [isOpen, bill, isEditing]);
      
      const nextStep = () => setStep(s => s + 1);
      const prevStep = () => setStep(s => s - 1);

    const handleSave = () => {
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
                    {/* Placeholder for steps */}
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Bill Entry Form (Steps 1-6) will be built here.</p>
                    </div>
                </div>

                <DialogFooter className="flex justify-between w-full pt-4 border-t">
                    <div>{step > 1 && <Button variant="outline" onClick={prevStep}>Previous</Button>}</div>
                    <div>{step < totalSteps ? <Button onClick={nextStep}>Next</Button> : <Button onClick={handleSave}>{isEditing ? 'Update Bill' : 'Save Bill'}</Button>}</div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
