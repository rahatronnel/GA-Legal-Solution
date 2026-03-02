
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
import { 
    Upload, X, Calendar as CalendarIcon, PlusCircle, Trash2, File as FileIcon, ChevronsUpDown, Check, 
    User, Hash, FileText, Tag, Clock, Building, DollarSign, Receipt, Calculator, ListOrdered, Milestone,
    ShieldCheck, Inbox, Box
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn, imageToDataUrl } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useBillFlow, useMasterData } from './bill-flow-provider';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { OrganizationSettings } from '@/app/settings/page';
import type { Vendor } from './vendor-entry-form';
import type { BillType } from './bill-type-table';
import type { Section } from '@/app/user-management/components/section-table';


type UploadedFile = {
  id: string;
  name: string;
  file: string; 
}

type DocType = 'vendorInvoice' | 'deliveryChallan' | 'workCompletionCert' | 'poCopy' | 'contractCopy' | 'supportingDocs' | 'remarksDoc';
const documentLabels: Record<DocType, string> = {
    vendorInvoice: 'Vendor Invoice',
    deliveryChallan: 'Delivery Challan',
    workCompletionCert: 'Completion Cert',
    poCopy: 'PO/WO Copy',
    contractCopy: 'Agreement Copy',
    supportingDocs: 'Support Docs',
    remarksDoc: 'Remarks Doc',
};

export type BillItem = {
    id: string;
    billItemMasterId?: string; 
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
  entryBy: string; 
  items: BillItem[];
  vatApplicable: boolean;
  vatPercentage: number;
  vatAmount: number;
  tdsApplicable: boolean;
  tdsPercentage: number;
  tdsAmount: number;
  otherCharges: number;
  descriptionAmount: number;
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
  approvalFlow: OrganizationSettings['approvalFlow'];
  approvalStatus: number; 
  approvalHistory: any[];
  currentApproverId: string;
  deductionAmount: number;
};

const initialBillData: Omit<Bill, 'id' | 'billId' | 'items' | 'documents' | 'approvalStatus' | 'approvalHistory' | 'currentApproverId' | 'approvalFlow' | 'deductionAmount'> = {
  billReferenceNumber: '', vendorId: '', billTypeId: '', billCategoryId: '',
  billSubCategory: '', billDate: '', billReceivedDate: '', entryDate: '', entryBy: '',
  vatApplicable: false, vatPercentage: 0, vatAmount: 0, tdsApplicable: false,
  tdsPercentage: 0, tdsAmount: 0, otherCharges: 0, descriptionAmount: 0, totalPayableAmount: 0,
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
    const firestore = useFirestore();
    const bFlow = useBillFlow();
    const { vendors = [], billTypes = [], billCategories = [], employees = [], sections = [] } = bFlow?.data || {};
    const { billItemMasters = [], billItemCategories = [] } = useMasterData();

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
    const { data: orgSettings } = useDoc<OrganizationSettings>(settingsRef);
    
    const [step, setStep] = useState(1);
    const [billData, setBillData] = useState(initialBillData);
    const [items, setItems] = useState<BillItem[]>([]);
    const [documents, setDocuments] = useState(initialDocuments);
    const [bDate, setBDate] = useState<Date | undefined>();
    const [rDate, setRDate] = useState<Date | undefined>();
    const [vPopOpen, setVPopOpen] = useState(false);

    const isEditing = bill && bill.id;
    const totalSteps = 6;
    const progress = Math.round((step / totalSteps) * 100);

    useEffect(() => {
        if (isOpen) {
          setStep(1);
          if (isEditing && bill) {
            setBillData({ ...initialBillData, ...bill } as any);
            setItems(bill.items || []);
            setDocuments(bill.documents || initialDocuments);
            setBDate(bill.billDate ? parseISO(bill.billDate) : undefined);
            setRDate(bill.billReceivedDate ? parseISO(bill.billReceivedDate) : undefined);
          } else {
            setBillData(initialBillData as any);
            setItems([]);
            setDocuments(initialDocuments);
            setBDate(new Date()); setRDate(undefined);
          }
        }
      }, [isOpen, bill, isEditing]);

    const handleSave = () => {
        onSave({ ...billData, items, documents });
        setIsOpen(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>{isEditing ? 'Audit Bill Record' : 'Record New Vendor Bill'}</DialogTitle>
                    <DialogDescription>Document financial liabilities, taxes, and procurement evidence.</DialogDescription>
                    <Progress value={progress} className="w-full mt-2" />
                </DialogHeader>

                <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> Step 1: Core Bill Data</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                  <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> Issuing Vendor<MandatoryIndicator/></Label>
                                  <Popover open={vPopOpen} onOpenChange={setVPopOpen}>
                                    <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between">{billData.vendorId ? vendors.find((v: Vendor) => v.id === billData.vendorId)?.vendorName : "Search Vendor..."}<ChevronsUpDown className="h-4 w-4 opacity-50" /></Button></PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search name..." /><CommandList><CommandEmpty>No vendor.</CommandEmpty><CommandGroup>{vendors.map((v: Vendor)=><CommandItem key={v.id} value={v.vendorName} onSelect={()=>{setBillData({...billData, vendorId: v.id}); setVPopOpen(false);}}><Check className={cn("mr-2 h-4 w-4", billData.vendorId === v.id ? "opacity-100" : "opacity-0")} />{v.vendorName}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
                                  </Popover>
                                </div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> Manual Ref No.</Label><Input value={billData.billReferenceNumber} onChange={(e)=>setBillData({...billData, billReferenceNumber:e.target.value})} /></div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Tag className="h-3 w-3" /> Bill Class<MandatoryIndicator/></Label>
                                    <Select value={billData.billTypeId} onValueChange={(v)=>setBillData({...billData, billTypeId: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{billTypes.map((t: BillType)=><SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarIcon className="h-3 w-3" /> Bill Date<MandatoryIndicator/></Label>
                                    <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{bDate?format(bDate,"PPP"):"Pick date"}</Button></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={bDate} onSelect={(d)=>{setBDate(d); setBillData({...billData, billDate: d?format(d,'yyyy-MM-dd'):''})}} /></PopoverContent></Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Clock className="h-3 w-3" /> Received Date</Label>
                                    <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{rDate?format(rDate,"PPP"):"Pick date"}</Button></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={rDate} onSelect={(d)=>{setRDate(d); setBillData({...billData, billReceivedDate: d?format(d,'yyyy-MM-dd'):''})}} /></PopoverContent></Popover>
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                         <div className="space-y-4">
                            <div className="flex justify-between items-center"><h3 className="font-semibold text-lg flex items-center gap-2"><ListOrdered className="h-5 w-5 text-primary" /> Step 2: Line Items</h3><Button variant="outline" size="sm" onClick={() => setItems([...items, { id: Date.now().toString(), name: '', billItemCategoryId: '', description: '', unitOfMeasure: '', quantity: 1, unitPrice: 0, grossAmount: 0, discountAmount: 0, netAmount: 0 }])}><PlusCircle className="h-4 w-4 mr-2"/>Add Row</Button></div>
                            <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <div key={item.id} className="p-3 border rounded-lg space-y-2 bg-muted/5">
                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                            <Input placeholder="Item Name" value={item.name} onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? {...i, name: e.target.value} : i))} className="h-8" />
                                            <Input placeholder="Qty" type="number" value={item.quantity} onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0, netAmount: (parseFloat(e.target.value)||0) * i.unitPrice} : i))} className="h-8" />
                                            <Input placeholder="Rate" type="number" value={item.unitPrice} onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? {...i, unitPrice: parseFloat(e.target.value) || 0, netAmount: i.quantity * (parseFloat(e.target.value)||0)} : i))} className="h-8" />
                                         </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Step 3: Tax & Adjustments</h3>
                            <div className="p-4 border rounded-lg space-y-4 bg-muted/5">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><DollarSign className="h-3 w-3" /> VAT Amount</Label><Input type="number" value={billData.vatAmount} onChange={(e)=>setBillData({...billData, vatAmount: parseFloat(e.target.value)||0})} /></div>
                                   <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><DollarSign className="h-3 w-3" /> TDS (Tax Deducted)</Label><Input type="number" value={billData.tdsAmount} onChange={(e)=>setBillData({...billData, tdsAmount: parseFloat(e.target.value)||0})} /></div>
                               </div>
                            </div>
                        </div>
                    )}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Milestone className="h-5 w-5 text-primary" /> Step 4: Audit Tracking</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> PO / WO Link</Label><Input value={billData.poNumber} onChange={(e)=>setBillData({...billData, poNumber: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> GRN Number</Label><Input value={billData.grnNumber} onChange={(e)=>setBillData({...billData, grnNumber: e.target.value})} /></div>
                            </div>
                        </div>
                    )}
                    {step === 5 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> Step 5: Cost Attribution</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Attributed Department</Label>
                                <Select value={billData.departmentName} onValueChange={(v)=>setBillData({...billData, departmentName:v})}><SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{sections.map((s: Section)=><SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Inbox className="h-3 w-3" /> Budget Head</Label><Input value={billData.budgetHead} onChange={(e)=>setBillData({...billData, budgetHead:e.target.value})} /></div>
                            </div>
                        </div>
                    )}
                    {step === 6 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Step 6: Evidence Repository</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {(Object.keys(documentLabels) as DocType[]).map(key => (
                                    <div key={key} className="p-3 border rounded-lg bg-muted/5 flex justify-between items-center group">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> {documentLabels[key]}</Label>
                                        <Label htmlFor={`up-b-${key}`} className="text-[10px] text-primary font-bold hover:underline cursor-pointer"><Upload className="h-3 w-3 inline mr-1"/>Upload</Label>
                                        <Input id={`up-b-${key}`} type="file" className="hidden" onChange={async (e) => {
                                            if (e.target.files?.[0]) {
                                                const url = await imageToDataUrl(e.target.files[0]);
                                                setDocuments({...documents, [key]: [...documents[key], {id: Date.now().toString(), name: e.target.files[0].name, file: url}]});
                                            }
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between w-full pt-4 border-t">
                    <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>Previous</Button>
                    {step < totalSteps ? (
                        <Button onClick={() => setStep(s => s + 1)}>Continue</Button>
                    ) : (
                        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">{isEditing ? 'Sync Bill' : 'Commit Bill'}</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
