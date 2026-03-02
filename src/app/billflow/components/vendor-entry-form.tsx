
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
    Upload, X, Calendar as CalendarIcon, PlusCircle, Trash2, File as FileIcon, 
    User, Mail, Phone, MapPin, Building, Briefcase, Hash, DollarSign, Tag, 
    ShieldCheck, Globe, CheckCircle2, Milestone, ListOrdered, Contact, AlertTriangle
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn, imageToDataUrl } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

import type { VendorCategory } from './vendor-category-table';
import type { VendorNatureOfBusiness } from './vendor-nature-of-business-table';
import { Employee } from '@/app/user-management/components/employee-entry-form';


type SuppliedItem = {
    id: string;
    name: string;
    unitOfMeasure: string;
    rate: number;
    minOrderQuantity: number;
    leadTimeDays: number;
    deliveryLocation: string;
    deliveryFrequency: string;
};

type UploadedFile = {
  id: string;
  name: string;
  file: string; 
}

type DocType = 'tradeLicense' | 'bankChequeCopy' | 'contractAgreement' | 'vatCertificate' | 'complianceCertificates' | 'other';
const documentLabels: Record<DocType, string> = {
    tradeLicense: 'Trade License',
    bankChequeCopy: 'Bank Cheque Copy',
    contractAgreement: 'Contract Agreement',
    vatCertificate: 'VAT Certificate',
    complianceCertificates: 'Compliance Certificates',
    other: 'Other Support Doc'
};


export type Vendor = {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorShortName: string;
  vendorType: 'Individual' | 'Company' | '';
  vendorCategoryId: string;
  vendorSubCategory: string;
  natureOfBusinessId: string;
  yearsOfExperience: number;
  contactPersonName: string;
  contactPersonDesignation: string;
  mobileNumber: string;
  alternateMobileNumber: string;
  email: string;
  officePhone: string;
  whatsAppNumber: string;
  officeAddress: string;
  factoryAddress: string;
  country: string;
  city: string;
  tradeLicenseNumber: string;
  tradeLicenseExpiryDate: string;
  tinNumber: string;
  vatBinNumber: string;
  nidOrCompanyRegNumber: string;
  incorporationDate: string;
  bankName: string;
  branchName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  paymentMethod: 'Bank' | 'Cheque' | 'Mobile Banking' | '';
  mobileBankingProvider: string;
  contractStartDate: string;
  contractEndDate: string;
  paymentTerms: string;
  creditLimit: number;
  currency: string;
  taxDeductionApplicable: boolean;
  vatApplicable: boolean;
  suppliedItems: SuppliedItem[];
  documents: Record<DocType, UploadedFile[]>;
  loginId: string;
  password?: string;
  createdBy: string;
  createdDate: string;
  lastUpdatedBy: string;
  vendorStatus: 'Pending' | 'Active' | 'Suspended' | 'Blacklisted' | '';
  approvedBy: string;
  approvalDate: string;
  reviewFrequency: string;
  riskLevel: 'Low' | 'Medium' | 'High' | '';
};

const initialVendorData: Omit<Vendor, 'id' | 'vendorId' | 'documents' | 'suppliedItems'> = {
  vendorName: '', vendorShortName: '', vendorType: '', vendorCategoryId: '', vendorSubCategory: '',
  natureOfBusinessId: '', yearsOfExperience: 0, contactPersonName: '', contactPersonDesignation: '',
  mobileNumber: '', alternateMobileNumber: '', email: '', officePhone: '', whatsAppNumber: '',
  officeAddress: '', factoryAddress: '', country: '', city: '', tradeLicenseNumber: '',
  tradeLicenseExpiryDate: '', tinNumber: '', vatBinNumber: '', nidOrCompanyRegNumber: '',
  incorporationDate: '', bankName: '', branchName: '', accountName: '', accountNumber: '',
  routingNumber: '', paymentMethod: '', mobileBankingProvider: '', contractStartDate: '',
  contractEndDate: '', paymentTerms: '', creditLimit: 0, currency: 'USD', taxDeductionApplicable: false,
  vatApplicable: false, loginId: '', createdBy: '', createdDate: '', lastUpdatedBy: '',
  vendorStatus: 'Pending', approvedBy: '', approvalDate: '', reviewFrequency: '', riskLevel: ''
};

const initialDocuments = Object.keys(documentLabels).reduce((acc, key) => ({...acc, [key]: []}), {} as Record<DocType, UploadedFile[]>);

const MandatoryIndicator = () => <span className="text-red-500 ml-1">*</span>;


interface VendorEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: Partial<Vendor>) => void;
  vendor: Partial<Vendor> | null;
}

export function VendorEntryForm({ isOpen, setIsOpen, onSave, vendor }: VendorEntryFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { data: categories } = useCollection<VendorCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorCategories') : null, [firestore]));
    const { data: naturesOfBusiness } = useCollection<VendorNatureOfBusiness>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorNatureOfBusiness') : null, [firestore]));
    const { data: employees } = useCollection<Employee>(useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]));

    const [step, setStep] = useState(1);
    const [vData, setVData] = useState(initialVendorData);
    const [suppliedItems, setSuppliedItems] = useState<SuppliedItem[]>([]);
    const [documents, setDocuments] = useState(initialDocuments);
    
    const [expiryDt, setExpiryDt] = useState<Date | undefined>();
    const [incorpDt, setIncorpDt] = useState<Date | undefined>();
    const [startDt, setStartDt] = useState<Date | undefined>();
    const [endDt, setEndDt] = useState<Date | undefined>();
    const [apprDt, setApprDt] = useState<Date | undefined>();

    const isEditing = vendor && vendor.id;
    const totalSteps = 8;
    const progress = Math.round((step / totalSteps) * 100);

    useEffect(() => {
        if (isOpen) {
          setStep(1);
          if (isEditing && vendor) {
            setVData({ ...initialVendorData, ...vendor } as any);
            setSuppliedItems(vendor.suppliedItems || []);
            setDocuments(vendor.documents || initialDocuments);
            setExpiryDt(vendor.tradeLicenseExpiryDate ? parseISO(vendor.tradeLicenseExpiryDate) : undefined);
            setIncorpDt(vendor.incorporationDate ? parseISO(vendor.incorporationDate) : undefined);
            setStartDt(vendor.contractStartDate ? parseISO(vendor.contractStartDate) : undefined);
            setEndDt(vendor.contractEndDate ? parseISO(vendor.contractEndDate) : undefined);
            setApprDt(vendor.approvalDate ? parseISO(vendor.approvalDate) : undefined);
          } else {
            setVData({...initialVendorData, loginId: '', password: ''} as any);
            setSuppliedItems([]);
            setDocuments(initialDocuments);
            setExpiryDt(undefined); setIncorpDt(undefined); setStartDt(undefined); setEndDt(undefined); setApprDt(undefined);
          }
        }
      }, [isOpen, vendor, isEditing]);

    const handleSelectChange = (id: keyof typeof vData) => (value: string) => {
        setVData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = () => {
        onSave({ ...vData, suppliedItems, documents });
        setIsOpen(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Vendor Identity' : 'Onboard New Vendor'}</DialogTitle>
                    <DialogDescription>Input official supplier credentials, legal filings, and financial details.</DialogDescription>
                    <Progress value={progress} className="w-full mt-2" />
                </DialogHeader>

                <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> Step 1: Corporate Identity</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Full Legal Name <MandatoryIndicator/></Label><Input id="vendorName" value={vData.vendorName} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, vendorName: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Corporate Alias</Label><Input id="vendorShortName" value={vData.vendorShortName} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, vendorShortName: e.target.value})} /></div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Tag className="h-3 w-3" /> Type <MandatoryIndicator/></Label>
                                    <Select value={vData.vendorType} onValueChange={handleSelectChange('vendorType')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="Individual">Sole Proprietor</SelectItem><SelectItem value="Company">Private Limited Company</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Briefcase className="h-3 w-3" /> Category <MandatoryIndicator/></Label>
                                    <Select value={vData.vendorCategoryId} onValueChange={handleSelectChange('vendorCategoryId')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{(categories || []).map((c: VendorCategory) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Globe className="h-3 w-3" /> Business Nature</Label>
                                    <Select value={vData.natureOfBusinessId} onValueChange={handleSelectChange('natureOfBusinessId')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{(naturesOfBusiness || []).map((n: VendorNatureOfBusiness) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Mail className="h-3 w-3" /> Business Email <MandatoryIndicator/></Label><Input id="email" type="email" value={vData.email} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, email: e.target.value})} /></div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Contact className="h-5 w-5 text-primary" /> Step 2: Communication Ports</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> POC Name</Label><Input value={vData.contactPersonName} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, contactPersonName: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Briefcase className="h-3 w-3" /> POC Designation</Label><Input value={vData.contactPersonDesignation} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, contactPersonDesignation: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Phone className="h-3 w-3" /> Mobile</Label><Input value={vData.mobileNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, mobileNumber: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><MapPin className="h-3 w-3" /> Office Address</Label><Textarea value={vData.officeAddress} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>setVData({...vData, officeAddress: e.target.value})} /></div>
                            </div>
                        </div>
                    )}
                    
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Step 3: Legal Verification</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> Trade License Number</Label><Input value={vData.tradeLicenseNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, tradeLicenseNumber: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> TIN Number</Label><Input value={vData.tinNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, tinNumber: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> VAT / BIN</Label><Input value={vData.vatBinNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, vatBinNumber: e.target.value})} /></div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Step 4: Financial Remittance</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Bank Name</Label><Input value={vData.bankName} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, bankName: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> Account Number</Label><Input value={vData.accountNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, accountNumber: e.target.value})} /></div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><DollarSign className="h-3 w-3" /> Settlement Method</Label>
                                    <Select value={vData.paymentMethod} onValueChange={handleSelectChange('paymentMethod')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="Bank">EFT / Bank Transfer</SelectItem><SelectItem value="Cheque">Bank Cheque</SelectItem><SelectItem value="Mobile Banking">Digital Wallet</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Milestone className="h-5 w-5 text-primary" /> Step 5: Commercial Terms</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Clock className="h-3 w-3" /> Payment Cycle (Terms)</Label><Input value={vData.paymentTerms} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, paymentTerms: e.target.value})} /></div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><DollarSign className="h-3 w-3" /> Credit Limit</Label><Input type="number" value={vData.creditLimit} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setVData({...vData, creditLimit: parseFloat(e.target.value) || 0})} /></div>
                            </div>
                        </div>
                    )}
                    
                    {step === 6 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><ListOrdered className="h-5 w-5 text-primary" /> Step 6: Core Supplies</h3>
                            <div className="space-y-3">
                                {suppliedItems.map((item, idx) => (
                                    <div key={item.id} className="p-3 border rounded-lg grid grid-cols-2 gap-2 bg-muted/10">
                                        <Input value={item.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSuppliedItems(prev => prev.map(si => si.id === item.id ? {...si, name: e.target.value} : si))} placeholder="Item Name" className="h-8" />
                                        <Input type="number" value={item.rate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSuppliedItems(prev => prev.map(si => si.id === item.id ? {...si, rate: parseFloat(e.target.value) || 0} : si))} placeholder="Rate" className="h-8" />
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => setSuppliedItems([...suppliedItems, {id: Date.now().toString(), name: '', unitOfMeasure: '', rate: 0, minOrderQuantity: 0, leadTimeDays: 0, deliveryLocation: '', deliveryFrequency: ''}])}><PlusCircle className="h-4 w-4 mr-2"/>Add Supply</Button>
                            </div>
                        </div>
                    )}

                    {step === 7 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Step 7: Document Archive</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(Object.keys(documentLabels) as DocType[]).map(key => (
                                    <div key={key} className="p-3 border rounded-lg bg-muted/5 flex justify-between items-center">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> {documentLabels[key]}</Label>
                                        <Label htmlFor={`up-v-${key}`} className="text-xs text-primary font-bold hover:underline cursor-pointer"><Upload className="h-3 w-3 inline mr-1"/>Upload</Label>
                                        <Input id={`up-v-${key}`} type="file" className="hidden" onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                            if (e.target.files?.[0]) {
                                                const url = await imageToDataUrl(e.target.files[0]);
                                                setDocuments({...documents, [key]: [{id: Date.now().toString(), name: e.target.files[0].name, file: url}]});
                                            }
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {step === 8 && (
                        <div className="space-y-6">
                             <h3 className="font-semibold text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Step 8: System Controls</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><ShieldCheck className="h-3 w-3" /> Current Lifecycle Status</Label>
                                    <Select value={vData.vendorStatus} onValueChange={handleSelectChange('vendorStatus')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="Pending">Pending Audit</SelectItem><SelectItem value="Active">Authorized</SelectItem><SelectItem value="Suspended">Suspended</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><AlertTriangle className="h-3 w-3" /> Risk Assessment</Label>
                                    <Select value={vData.riskLevel} onValueChange={handleSelectChange('riskLevel')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="Low">Low Risk</SelectItem><SelectItem value="Medium">Medium Risk</SelectItem><SelectItem value="High">High Risk</SelectItem></SelectContent>
                                    </Select>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between w-full pt-4 border-t">
                    <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>Previous</Button>
                    {step < totalSteps ? (
                        <Button onClick={() => setStep(s => s + 1)}>Continue</Button>
                    ) : (
                        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">{isEditing ? 'Sync Vendor File' : 'Onboard Vendor'}</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
