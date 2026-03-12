
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { 
    Upload, X, Calendar as CalendarIcon, PlusCircle, Trash2, ChevronsUpDown, Check, 
    File as FileIcon, User, Wrench, Building, Hash, Clock, DollarSign, ListOrdered, Tag, 
    Layers, Settings, Info, Box, Image as ImageIcon, ShieldCheck, CheckCircle2, Car
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn, imageToDataUrl } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useVehicleManagement } from './vehicle-management-provider';

import type { Vehicle } from './vehicle-entry-form';
import type { MaintenanceType } from './maintenance-type-table';
import type { ServiceCenter } from './service-center-table';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { MaintenanceExpenseType } from './maintenance-expense-type-table';
import type { Driver } from './driver-entry-form';
import type { Part as PartType } from './part-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


type Part = {
  id: string;
  partId: string;
  price: number;
  brand: string;
  quantity: number;
  warranty: string;
  expiryDate: string;
}

type Expense = {
  id: string;
  expenseTypeId: string;
  amount: number;
};

type UploadedFile = {
  id: string;
  name: string;
  file: string; 
}

type MaintenanceDocumentType = 'workOrder' | 'repairInvoice' | 'partsInvoice' | 'quotation' | 'paymentProof' | 'checklist' | 'beforeAfterPhotos';

const documentCategories: Record<MaintenanceDocumentType, string> = {
    workOrder: 'Job Card / Work Order',
    repairInvoice: 'Service Bill',
    partsInvoice: 'Parts Bill',
    quotation: 'Estimation',
    paymentProof: 'Voucher Copy',
    checklist: 'Inspection Form',
    beforeAfterPhotos: 'Visual Evidence',
};

export type MaintenanceRecord = {
  id: string;
  vehicleId: string;
  maintenanceTypeId: string;
  serviceCenterId: string;
  serviceDate: string;
  upcomingServiceDate: string;
  description: string;
  monitoringEmployeeId: string;
  driverId: string;
  parts: Part[];
  expenses: Expense[];
  documents: Record<MaintenanceDocumentType, UploadedFile[]>;
};

const initialDocuments: Record<MaintenanceDocumentType, UploadedFile[]> = {
    workOrder: [],
    repairInvoice: [],
    partsInvoice: [],
    quotation: [],
    paymentProof: [],
    checklist: [],
    beforeAfterPhotos: [],
};

const initialMaintenanceData: Omit<MaintenanceRecord, 'id' | 'parts' | 'expenses' | 'documents'> = {
  vehicleId: '',
  maintenanceTypeId: '',
  serviceCenterId: '',
  serviceDate: '',
  upcomingServiceDate: '',
  description: '',
  monitoringEmployeeId: '',
  driverId: '',
};

const MandatoryIndicator = () => <span className="text-red-500 ml-1">*</span>;

interface MaintenanceEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (record: Partial<MaintenanceRecord>, id?: string) => void;
  record: Partial<MaintenanceRecord> | null;
  employees: Employee[];
}

export function MaintenanceEntryForm({ isOpen, setIsOpen, onSave, record, employees }: MaintenanceEntryFormProps) {
  const { toast } = useToast();
  const { data } = useVehicleManagement();
  
  // High-Fidelity Type Alignment: Explicitly casting data to definitive types
  const vehicles = (data.vehicles || []) as Vehicle[];
  const drivers = (data.drivers || []) as Driver[];
  const allParts = (data.parts || []) as PartType[];
  const maintenanceTypes = (data.maintenanceTypes || []) as MaintenanceType[];
  const serviceCenters = (data.serviceCenters || []) as ServiceCenter[];
  
  const [step, setStep] = useState(1);
  const [mData, setMData] = useState(initialMaintenanceData);
  const [parts, setParts] = useState<Part[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [documents, setDocuments] = useState<Record<MaintenanceDocumentType, UploadedFile[]>>(initialDocuments);
  
  const [serviceDate, setServiceDate] = useState<Date | undefined>();
  const [upcomingDate, setUpcomingDate] = useState<Date | undefined>();

  const isEditing = record && record.id;
  const progress = Math.round((step / 3) * 100);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEditing && record) {
        setMData({ ...initialMaintenanceData, ...(record as any) });
        setParts(record.parts || []);
        setExpenses(record.expenses || []);
        setDocuments(record.documents || initialDocuments);
        setServiceDate(record.serviceDate ? parseISO(record.serviceDate) : undefined);
        setUpcomingDate(record.upcomingServiceDate ? parseISO(record.upcomingServiceDate) : undefined);
      } else {
        setMData(initialMaintenanceData);
        setParts([]);
        setExpenses([]);
        setDocuments(initialDocuments);
        setServiceDate(undefined);
        setUpcomingDate(undefined);
      }
    }
  }, [isOpen, record, isEditing]);

  const handleSelectChange = (id: keyof typeof mData) => (value: string) => {
    setMData(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (setter: (d: Date|undefined) => void, field: keyof typeof mData) => (date: Date|undefined) => {
      setter(date);
      setMData(prev => ({...prev, [field]: date ? format(date, 'yyyy-MM-dd') : ''}))
  }

  const addPart = () => setParts(p => [...p, {id: Date.now().toString(), partId: '', price: 0, brand: '', quantity: 1, warranty: '', expiryDate: ''}])
  const updatePart = (id: string, field: keyof Part, value: string | number) => {
    setParts(p => p.map(part => {
        if (part.id === id) {
            const updated = { ...part, [field]: value };
            if (field === 'partId') {
                const pInfo = allParts.find((ap: any) => ap.id === value);
                if (pInfo) { updated.price = pInfo.price; updated.brand = pInfo.brand; }
            }
            return updated;
        }
        return part;
    }));
  };

  const handleFileChange = (docType: MaintenanceDocumentType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newFiles: UploadedFile[] = [];
      for (const file of files) {
        try {
          const dataUrl = await imageToDataUrl(file);
          newFiles.push({ id: Date.now().toString() + Math.random(), name: file.name, file: dataUrl });
        } catch (error) { toast({ variant: 'destructive', title: 'File Error' }); }
      }
      setDocuments(prev => ({ ...prev, [docType]: [...prev[docType], ...newFiles] }));
    }
    e.target.value = '';
  };

  const handleSave = () => {
    onSave({ ...mData, parts, expenses, documents }, record?.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Update Service Record' : 'Record New Maintenance activity'}</DialogTitle>
          <DialogDescription>Document technical repairs, parts replacement, and workshop audits.</DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Step 1: Job Identification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Car className="h-3 w-3" /> Vehicle Registration<MandatoryIndicator/></Label>
                        <Select value={mData.vehicleId} onValueChange={handleSelectChange('vehicleId')}>
                            <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                            <SelectContent>{vehicles.map((v: Vehicle) => <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Tag className="h-3 w-3" /> Service Type<MandatoryIndicator/></Label>
                        <Select value={mData.maintenanceTypeId} onValueChange={handleSelectChange('maintenanceTypeId')}>
                            <SelectTrigger><SelectValue placeholder="Choose Type" /></SelectTrigger>
                            <SelectContent>{maintenanceTypes.map((t: MaintenanceType) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Authorized Service Center<MandatoryIndicator/></Label>
                        <Select value={mData.serviceCenterId} onValueChange={handleSelectChange('serviceCenterId')}>
                            <SelectTrigger><SelectValue placeholder="Choose Garage" /></SelectTrigger>
                            <SelectContent>{serviceCenters.map((sc: ServiceCenter) => <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> Monitoring Official</Label>
                        <Select value={mData.monitoringEmployeeId} onValueChange={handleSelectChange('monitoringEmployeeId')}>
                            <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                            <SelectContent>{employees.map((e: Employee) => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarIcon className="h-3 w-3" /> Actual Service Date<MandatoryIndicator/></Label>
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{serviceDate?format(serviceDate,"PPP"):"Select date"}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={serviceDate} onSelect={handleDateChange(setServiceDate, 'serviceDate')} initialFocus/></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Clock className="h-3 w-3" /> Forecasted Next Service</Label>
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{upcomingDate?format(upcomingDate,"PPP"):"Predict date"}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={upcomingDate} onSelect={handleDateChange(setUpcomingDate, 'upcomingServiceDate')} initialFocus/></PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Info className="h-3 w-3" /> Detailed Job Description</Label>
                  <Textarea value={mData.description} onChange={(e) => setMData({...mData, description: e.target.value})} rows={3} placeholder="Describe the mechanical issues or parts changed..." />
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-semibold text-lg flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Step 2: Parts & Associated Costs</h3><Button variant="outline" size="sm" onClick={addPart}><PlusCircle className="mr-2 h-4 w-4"/>Add Part</Button></div>
                    <div className="space-y-3">
                        {parts.map((part) => (
                            <div key={part.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center p-3 rounded-md border bg-primary/5">
                                <Select value={part.partId} onValueChange={(v) => updatePart(part.id, 'partId', v)}>
                                    <SelectTrigger className="h-8"><SelectValue placeholder="Part Name"/></SelectTrigger>
                                    <SelectContent>{allParts.map((ap: PartType) => <SelectItem key={ap.id} value={ap.id}>{ap.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Input placeholder="Price" type="number" value={part.price} onChange={(e) => updatePart(part.id, 'price', parseFloat(e.target.value) || 0)} className="h-8" />
                                <Input placeholder="Qty" type="number" value={part.quantity} onChange={(e) => updatePart(part.id, 'quantity', parseInt(e.target.value) || 0)} className="h-8" />
                                <Input placeholder="Warranty" value={part.warranty} onChange={(e) => updatePart(part.id, 'warranty', e.target.value)} className="h-8 md:col-span-2" />
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive ml-auto" onClick={() => setParts(p => p.filter(x => x.id !== part.id))}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            )}
            {step === 3 && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Step 3: Supporting Documents</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {(Object.keys(documentCategories) as MaintenanceDocumentType[]).map(docType => (
                            <div key={docType} className="space-y-2 p-3 border rounded-lg bg-muted/5 group">
                                <div className="flex justify-between items-center">
                                    <Label className="font-semibold text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> {documentCategories[docType]}</Label>
                                    <Label htmlFor={`m-file-${docType}`} className="cursor-pointer text-[10px] text-primary hover:underline flex items-center gap-1 font-bold"><Upload className="h-3 w-3"/>Add</Label>
                                    <Input id={`m-file-${docType}`} type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileChange(docType)} />
                                </div>
                                <div className="space-y-1">
                                    {documents[docType]?.map(file => (
                                        <div key={file.id} className="flex items-center justify-between text-[11px] p-1.5 bg-primary/5 rounded border border-primary/10"><span className="truncate font-medium">{file.name}</span><Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => setDocuments(prev => ({...prev, [docType]: prev[docType].filter(f => f.id !== file.id)}))}><X className="h-3 w-3"/></Button></div>
                                    ))}
                                    {documents[docType]?.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2 italic">No uploads</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            )}
        </div>

        <DialogFooter className="flex justify-between w-full pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>Previous</Button>
            {step < 3 ? (
                <Button onClick={() => setStep(s => s + 1)}>Continue</Button>
            ) : (
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">{isEditing ? 'Sync Record' : 'Log Maintenance'}</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
