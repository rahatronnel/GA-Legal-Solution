
"use client";

import React, { useState, useEffect } from 'react';
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
import { Upload, X, CalendarIcon, PlusCircle, Trash2, File as FileIcon } from 'lucide-react';
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
  file: string; // data URL
}

type DocType = 'tradeLicense' | 'bankChequeCopy' | 'contractAgreement' | 'vatCertificate' | 'complianceCertificates' | 'other';
const documentLabels: Record<DocType, string> = {
    tradeLicense: 'Trade License',
    bankChequeCopy: 'Bank Cheque Copy',
    contractAgreement: 'Contract Agreement',
    vatCertificate: 'VAT Certificate',
    complianceCertificates: 'Compliance Certificates',
    other: 'Any Other Supporting Document'
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
  vatApplicable: false, loginId: '', createdBy: '', createdDate: '', lastUpdatedBy: ''
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

    const [step, setStep] = useState(1);
    const [vendorData, setVendorData] = useState(initialVendorData);
    const [suppliedItems, setSuppliedItems] = useState<SuppliedItem[]>([]);
    const [documents, setDocuments] = useState(initialDocuments);
    
    // Date states
    const [tradeLicenseExpiryDate, setTradeLicenseExpiryDate] = useState<Date|undefined>();
    const [incorporationDate, setIncorporationDate] = useState<Date|undefined>();
    const [contractStartDate, setContractStartDate] = useState<Date|undefined>();
    const [contractEndDate, setContractEndDate] = useState<Date|undefined>();

    const isEditing = vendor && vendor.id;
    const totalSteps = 7;
    const progress = Math.round((step / totalSteps) * 100);

    const setDateIfValid = (dateStr: string | undefined, setter: (d: Date | undefined) => void) => {
        if(dateStr) {
           const parsed = parseISO(dateStr);
           if (!isNaN(parsed.valueOf())) {
             setter(parsed);
           }
        } else {
            setter(undefined);
        }
    }

    useEffect(() => {
        if (isOpen) {
          setStep(1);
          if (isEditing && vendor) {
            const initialData = { ...initialVendorData, ...vendor };
            setVendorData(initialData);
            setSuppliedItems(vendor.suppliedItems || []);
            setDocuments(vendor.documents || initialDocuments);
            setDateIfValid(vendor.tradeLicenseExpiryDate, setTradeLicenseExpiryDate);
            setDateIfValid(vendor.incorporationDate, setIncorporationDate);
            setDateIfValid(vendor.contractStartDate, setContractStartDate);
            setDateIfValid(vendor.contractEndDate, setContractEndDate);
          } else {
            setVendorData({...initialVendorData, loginId: '', password: ''});
            setSuppliedItems([]);
            setDocuments(initialDocuments);
            setTradeLicenseExpiryDate(undefined);
            setIncorporationDate(undefined);
            setContractStartDate(undefined);
            setContractEndDate(undefined);
          }
        }
      }, [isOpen, vendor, isEditing]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        const newVendorData = { ...vendorData, [id]: type === 'number' ? parseFloat(value) || 0 : value };
        if (id === 'email') {
            newVendorData.loginId = value;
        }
        setVendorData(newVendorData);
    };

    const handleSelectChange = (id: keyof Omit<Vendor, 'id'|'documents'|'suppliedItems'>) => (value: string) => {
        setVendorData(prev => ({ ...prev, [id]: value }));
    };

    const handleCheckboxChange = (id: 'taxDeductionApplicable' | 'vatApplicable') => (checked: boolean) => {
        setVendorData(prev => ({ ...prev, [id]: checked }));
    };

    const handleDateChange = (setter: (date: Date | undefined) => void, field: keyof Omit<Vendor, 'id'|'documents'|'suppliedItems'>) => (date: Date | undefined) => {
        setter(date);
        setVendorData(prev => ({...prev, [field]: date ? format(date, 'yyyy-MM-dd') : ''}))
    }

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

    // Supplied Items Handlers
    const addSuppliedItem = () => setSuppliedItems(prev => [...prev, { id: Date.now().toString(), name: '', unitOfMeasure: '', rate: 0, minOrderQuantity: 0, leadTimeDays: 0, deliveryLocation: '', deliveryFrequency: '' }]);
    const removeSuppliedItem = (id: string) => setSuppliedItems(prev => prev.filter(item => item.id !== id));
    const updateSuppliedItem = (id: string, field: keyof SuppliedItem, value: string | number) => {
        setSuppliedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };


    const validateStep = (currentStep: number): string[] => {
        const missingFields: string[] = [];
        if (currentStep === 1) {
            if (!vendorData.vendorName.trim()) missingFields.push('Vendor Name');
            if (!vendorData.vendorType) missingFields.push('Vendor Type');
            if (!vendorData.vendorCategoryId) missingFields.push('Vendor Category');
            if (!vendorData.email.trim()) missingFields.push('Email Address');
        }
        // Add validations for other steps here if needed
        return missingFields;
    }

    const nextStep = () => {
        const missing = validateStep(step);
        if (missing.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Missing Required Fields',
                description: `Please fill in: ${missing.join(', ')}.`
            });
            return;
        }
        setStep(s => s + 1);
    };
    const prevStep = () => setStep(s => s - 1);

    const handleSave = () => {
        const missing = validateStep(1); // Final check on the most critical fields
        if (missing.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Missing Required Fields',
                description: `Please go back and fill in: ${missing.join(', ')}.`
            });
            return;
        }
        const dataToSave: Partial<Vendor> = {
            ...vendorData,
            suppliedItems,
            documents,
        };
        
        if (isEditing && vendor.id) {
            dataToSave.id = vendor.id;
        } else {
            dataToSave.vendorId = `V-${Date.now()}`;
        }
        onSave(dataToSave);
        setIsOpen(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>{isEditing ? `Edit Vendor: ${vendor?.vendorName}` : 'Add New Vendor'}</DialogTitle>
                    <DialogDescription>Follow the steps to add or update vendor information.</DialogDescription>
                    <Progress value={progress} className="w-full mt-2" />
                </DialogHeader>

                <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
                    {/* Step 1: Basic Information */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 1: Basic Vendor Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Vendor Name <MandatoryIndicator/></Label><Input id="vendorName" value={vendorData.vendorName} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Vendor Short Name</Label><Input id="vendorShortName" value={vendorData.vendorShortName} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Vendor Type <MandatoryIndicator/></Label><Select value={vendorData.vendorType} onValueChange={handleSelectChange('vendorType')}><SelectTrigger><SelectValue placeholder="Select Type"/></SelectTrigger><SelectContent><SelectItem value="Individual">Individual</SelectItem><SelectItem value="Company">Company</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Vendor Category <MandatoryIndicator/></Label><Select value={vendorData.vendorCategoryId} onValueChange={handleSelectChange('vendorCategoryId')}><SelectTrigger><SelectValue placeholder="Select Category"/></SelectTrigger><SelectContent>{(categories || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>Vendor Sub-Category</Label><Input id="vendorSubCategory" value={vendorData.vendorSubCategory} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Nature of Business</Label><Select value={vendorData.natureOfBusinessId} onValueChange={handleSelectChange('natureOfBusinessId')}><SelectTrigger><SelectValue placeholder="Select Nature of Business"/></SelectTrigger><SelectContent>{(naturesOfBusiness || []).map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>Years of Experience</Label><Input id="yearsOfExperience" type="number" value={vendorData.yearsOfExperience} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Email Address <MandatoryIndicator/></Label><Input id="email" type="email" value={vendorData.email} onChange={handleInputChange} /></div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Contact Details */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 2: Contact & Communication Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Contact Person Name</Label><Input id="contactPersonName" value={vendorData.contactPersonName} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Contact Person Designation</Label><Input id="contactPersonDesignation" value={vendorData.contactPersonDesignation} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Mobile Number</Label><Input id="mobileNumber" value={vendorData.mobileNumber} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Alternate Mobile Number</Label><Input id="alternateMobileNumber" value={vendorData.alternateMobileNumber} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Office Phone</Label><Input id="officePhone" value={vendorData.officePhone} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>WhatsApp Number</Label><Input id="whatsAppNumber" value={vendorData.whatsAppNumber} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Country</Label><Input id="country" value={vendorData.country} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>City</Label><Input id="city" value={vendorData.city} onChange={handleInputChange} /></div>
                                <div className="space-y-2 md:col-span-2"><Label>Office Address</Label><Textarea id="officeAddress" value={vendorData.officeAddress} onChange={handleInputChange} /></div>
                                <div className="space-y-2 md:col-span-2"><Label>Factory / Warehouse Address</Label><Textarea id="factoryAddress" value={vendorData.factoryAddress} onChange={handleInputChange} /></div>
                            </div>
                        </div>
                    )}
                    
                    {/* Step 3: Legal Information */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 3: Legal & Registration Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Trade License Number</Label><Input id="tradeLicenseNumber" value={vendorData.tradeLicenseNumber} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Trade License Expiry</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{tradeLicenseExpiryDate ? format(tradeLicenseExpiryDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={tradeLicenseExpiryDate} onSelect={handleDateChange(setTradeLicenseExpiryDate, 'tradeLicenseExpiryDate')} /></PopoverContent></Popover></div>
                                <div className="space-y-2"><Label>TIN Number</Label><Input id="tinNumber" value={vendorData.tinNumber} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>VAT / BIN Number</Label><Input id="vatBinNumber" value={vendorData.vatBinNumber} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>National ID / Company Reg. No</Label><Input id="nidOrCompanyRegNumber" value={vendorData.nidOrCompanyRegNumber} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Incorporation Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{incorporationDate ? format(incorporationDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={incorporationDate} onSelect={handleDateChange(setIncorporationDate, 'incorporationDate')} /></PopoverContent></Popover></div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Banking Information */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 4: Banking & Payment Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Bank Name</Label><Input id="bankName" value={vendorData.bankName} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Branch Name</Label><Input id="branchName" value={vendorData.branchName} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Account Name</Label><Input id="accountName" value={vendorData.accountName} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Account Number</Label><Input id="accountNumber" value={vendorData.accountNumber} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Routing Number</Label><Input id="routingNumber" value={vendorData.routingNumber} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Payment Method</Label><Select value={vendorData.paymentMethod} onValueChange={handleSelectChange('paymentMethod')}><SelectTrigger><SelectValue placeholder="Select Method"/></SelectTrigger><SelectContent><SelectItem value="Bank">Bank</SelectItem><SelectItem value="Cheque">Cheque</SelectItem><SelectItem value="Mobile Banking">Mobile Banking</SelectItem></SelectContent></Select></div>
                                {vendorData.paymentMethod === 'Mobile Banking' && <div className="space-y-2"><Label>Mobile Banking Provider</Label><Input id="mobileBankingProvider" value={vendorData.mobileBankingProvider} onChange={handleInputChange} /></div>}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Contract Information */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 5: Contract & Commercial Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Contract Start Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{contractStartDate ? format(contractStartDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={contractStartDate} onSelect={handleDateChange(setContractStartDate, 'contractStartDate')} /></PopoverContent></Popover></div>
                                <div className="space-y-2"><Label>Contract End Date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{contractEndDate ? format(contractEndDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={contractEndDate} onSelect={handleDateChange(setContractEndDate, 'contractEndDate')} /></PopoverContent></Popover></div>
                                <div className="space-y-2"><Label>Payment Terms</Label><Input id="paymentTerms" value={vendorData.paymentTerms} onChange={handleInputChange} placeholder="e.g., Net 30" /></div>
                                <div className="space-y-2"><Label>Credit Limit</Label><Input id="creditLimit" type="number" value={vendorData.creditLimit} onChange={handleInputChange} /></div>
                                <div className="space-y-2"><Label>Currency</Label><Input id="currency" value={vendorData.currency} onChange={handleInputChange} /></div>
                                <div className="flex items-center space-x-2 pt-4"><Checkbox id="taxDeductionApplicable" checked={vendorData.taxDeductionApplicable} onCheckedChange={handleCheckboxChange('taxDeductionApplicable')}/><Label htmlFor="taxDeductionApplicable">Tax Deduction Applicable?</Label></div>
                                <div className="flex items-center space-x-2 pt-4"><Checkbox id="vatApplicable" checked={vendorData.vatApplicable} onCheckedChange={handleCheckboxChange('vatApplicable')}/><Label htmlFor="vatApplicable">VAT Applicable?</Label></div>
                            </div>
                        </div>
                    )}
                    
                    {/* Step 6: Pricing */}
                    {step === 6 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 6: Pricing & Supply Details</h3>
                            <div className="flex justify-between items-center"><h4 className="font-medium">Supplied Items / Services</h4><Button variant="outline" size="sm" onClick={addSuppliedItem}><PlusCircle className="mr-2 h-4 w-4"/>Add Item</Button></div>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {suppliedItems.map((item, index) => (
                                    <div key={item.id} className="p-3 border rounded-lg space-y-2">
                                         <div className="flex justify-between items-center"><Label className="text-base">Item {index + 1}</Label><Button variant="ghost" size="icon" onClick={() => removeSuppliedItem(item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
                                         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            <div className="space-y-1"><Label>Item/Service Name</Label><Input value={item.name} onChange={(e) => updateSuppliedItem(item.id, 'name', e.target.value)} /></div>
                                            <div className="space-y-1"><Label>Unit</Label><Input value={item.unitOfMeasure} onChange={(e) => updateSuppliedItem(item.id, 'unitOfMeasure', e.target.value)} /></div>
                                            <div className="space-y-1"><Label>Rate</Label><Input type="number" value={item.rate} onChange={(e) => updateSuppliedItem(item.id, 'rate', parseFloat(e.target.value) || 0)} /></div>
                                            <div className="space-y-1"><Label>Min. Order Qty</Label><Input type="number" value={item.minOrderQuantity} onChange={(e) => updateSuppliedItem(item.id, 'minOrderQuantity', parseInt(e.target.value) || 0)} /></div>
                                            <div className="space-y-1"><Label>Lead Time (Days)</Label><Input type="number" value={item.leadTimeDays} onChange={(e) => updateSuppliedItem(item.id, 'leadTimeDays', parseInt(e.target.value) || 0)} /></div>
                                            <div className="space-y-1"><Label>Delivery Location</Label><Input value={item.deliveryLocation} onChange={(e) => updateSuppliedItem(item.id, 'deliveryLocation', e.target.value)} /></div>
                                            <div className="space-y-1 md:col-span-2"><Label>Delivery Frequency</Label><Input value={item.deliveryFrequency} onChange={(e) => updateSuppliedItem(item.id, 'deliveryFrequency', e.target.value)} /></div>
                                         </div>
                                    </div>
                                ))}
                                {suppliedItems.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No items added yet.</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 7: Documents */}
                    {step === 7 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 7: Document Upload Section</h3>
                            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                                {(Object.keys(documentLabels) as DocType[]).map(docType => (
                                    <div key={docType} className="space-y-2 p-3 border rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <Label className="font-medium">{documentLabels[docType]}</Label>
                                            <Label htmlFor={`file-upload-${docType}`} className="cursor-pointer text-sm text-primary hover:underline">Add File(s)</Label>
                                            <Input id={`file-upload-${docType}`} type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileChange(docType)} />
                                        </div>
                                        <div className="space-y-1">
                                            {documents[docType]?.length > 0 ? (
                                                documents[docType].map(file => (
                                                    <div key={file.id} className="flex items-center justify-between text-sm p-1.5 bg-muted rounded-md">
                                                        <div className="flex items-center gap-2 truncate"><FileIcon className="h-4 w-4 flex-shrink-0" /><span className="truncate">{file.name}</span></div>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDocument(docType, file.id)}><X className="h-4 w-4" /></Button>
                                                    </div>
                                                ))
                                            ) : ( <p className="text-xs text-muted-foreground text-center py-2">No files uploaded.</p> )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between w-full pt-4 border-t">
                    <div>{step > 1 && <Button variant="outline" onClick={prevStep}>Previous</Button>}</div>
                    <div>{step < totalSteps ? <Button onClick={nextStep}>Next</Button> : <Button onClick={handleSave}>{isEditing ? 'Update Vendor' : 'Save Vendor'}</Button>}</div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
