
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
import { Upload, X, CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLocalStorage } from '@/hooks/use-local-storage';

import type { Vehicle } from './vehicle-table';
import type { Driver } from './driver-entry-form';
import type { AccidentType } from './accident-type-table';
import type { SeverityLevel } from './severity-level-table';
import type { FaultStatus } from './fault-status-table';
import type { DamageDetail } from './damage-detail-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { ServiceCenter } from './service-center-table';


type DocType = 'accidentPhotos' | 'policeReport' | 'repairInvoice' | 'insuranceClaim';
const documentLabels: Record<DocType, string> = {
    accidentPhotos: 'Accident Photos',
    policeReport: 'Police Report',
    repairInvoice: 'Repair Invoice',
    insuranceClaim: 'Insurance Claim Document'
}

type AccidentDocument = {
  id: string;
  label: string;
  file: string; // data URL
}

export type Accident = {
  id: string;
  vehicleId: string;
  driverId: string;
  accidentDate: string;
  accidentTime: string;
  location: string;
  accidentTypeId: string;
  severityLevelId: string;
  faultStatusId: string;
  damageDetailIds: string[];
  description: string;
  
  // Financial
  estimatedRepairCost: number;
  actualRepairCost: number;
  thirdPartyDamageCost: number;
  repairedById: string;
  repairPaymentStatus: 'Paid' | 'Unpaid' | 'Pending' | '';

  // Legal
  policeReportFiled: boolean;
  policeReportNumber: string;
  policeStation: string;
  insuranceClaimFiled: boolean;
  insuranceClaimNumber: string;
  insuranceCompany: string;

  // Documents
  documents: AccidentDocument[];
};

const initialAccidentData: Omit<Accident, 'id' | 'damageDetailIds' | 'documents'> = {
  vehicleId: '',
  driverId: '',
  accidentDate: '',
  accidentTime: '',
  location: '',
  accidentTypeId: '',
  severityLevelId: '',
  faultStatusId: '',
  description: '',

  estimatedRepairCost: 0,
  actualRepairCost: 0,
  thirdPartyDamageCost: 0,
  repairedById: '',
  repairPaymentStatus: '',

  policeReportFiled: false,
  policeReportNumber: '',
  policeStation: '',
  insuranceClaimFiled: false,
  insuranceClaimNumber: '',
  insuranceCompany: '',
};

interface AccidentEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (record: Omit<Accident, 'id'>, id?: string) => void;
  accident: Partial<Accident> | null;
}

export function AccidentEntryForm({ isOpen, setIsOpen, onSave, accident }: AccidentEntryFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [accidentData, setAccidentData] = useState(initialAccidentData);
  const [damageDetailIds, setDamageDetailIds] = useState<string[]>([]);
  const [documents, setDocuments] = useState<AccidentDocument[]>([]);
  
  const [accidentDate, setAccidentDate] = useState<Date | undefined>();

  const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [drivers] = useLocalStorage<Driver[]>('drivers', []);
  const [accidentTypes] = useLocalStorage<AccidentType[]>('accidentTypes', []);
  const [severityLevels] = useLocalStorage<SeverityLevel[]>('severityLevels', []);
  const [faultStatuses] = useLocalStorage<FaultStatus[]>('faultStatuses', []);
  const [damageDetails] = useLocalStorage<DamageDetail[]>('damageDetails', []);
  const [serviceCenters] = useLocalStorage<ServiceCenter[]>('serviceCenters', []);
  
  const isEditing = accident && accident.id;
  const progress = Math.round((step / 4) * 100);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEditing && accident) {
        setAccidentData({ ...initialAccidentData, ...accident });
        setDamageDetailIds(accident.damageDetailIds || []);
        setDocuments(accident.documents || []);
        setAccidentDate(accident.accidentDate ? new Date(accident.accidentDate) : undefined);
      } else {
        setAccidentData(initialAccidentData);
        setDamageDetailIds([]);
        setDocuments([]);
        setAccidentDate(undefined);
      }
    }
  }, [isOpen, accident, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const isNumber = type === 'number';
    setAccidentData(prev => ({ ...prev, [id]: isNumber ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (id: keyof typeof accidentData) => (value: string) => {
    setAccidentData(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (setter: (date: Date | undefined) => void, field: keyof typeof accidentData) => (date: Date | undefined) => {
      setter(date);
      setAccidentData(prev => ({...prev, [field]: date ? format(date, 'yyyy-MM-dd') : ''}))
  }
  
  const handleCheckboxChange = (id: keyof typeof accidentData) => (checked: boolean) => {
      setAccidentData(prev => ({ ...prev, [id]: checked }));
  };
  
  const handleDamageDetailCheck = (id: string) => (checked: boolean) => {
    setDamageDetailIds(prev => checked ? [...prev, id] : prev.filter(detailId => detailId !== id));
  }

  // Document handlers
  const addDocument = () => setDocuments(d => [...d, {id: Date.now().toString(), label: '', file: ''}]);
  const updateDocumentLabel = (id: string, label: string) => {
    setDocuments(d => d.map(doc => doc.id === id ? {...doc, label} : doc));
  };
  const handleFileChange = (id: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => setDocuments(d => d.map(doc => doc.id === id ? {...doc, file: reader.result as string} : doc));
      reader.readAsDataURL(file);
    }
  }
  const removeDocument = (id: string) => setDocuments(d => d.filter(doc => doc.id !== id));

  
  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
        return accidentData.vehicleId && accidentData.driverId && accidentData.accidentDate;
    }
    return true;
  }
  
  const nextStep = () => {
    if (!validateStep(step)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields in this step.' });
        return;
    }
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const handleSave = () => {
     if (!validateStep(1)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please go back and fill all required fields in Step 1.' });
        return;
    }
    const dataToSave: Omit<Accident, 'id'> = {
        ...accidentData,
        damageDetailIds,
        documents
    };
    onSave(dataToSave, accident?.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Accident Record' : 'Add Accident Record'}</DialogTitle>
          <DialogDescription>Follow the steps to log a vehicle accident.</DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 1: Accident Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Vehicle</Label><Select value={accidentData.vehicleId} onValueChange={handleSelectChange('vehicleId')}><SelectTrigger><SelectValue placeholder="Select Vehicle"/></SelectTrigger><SelectContent>{vehicles.map(v=><SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Driver</Label><Select value={accidentData.driverId} onValueChange={handleSelectChange('driverId')}><SelectTrigger><SelectValue placeholder="Select Driver"/></SelectTrigger><SelectContent>{drivers.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Accident Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!accidentDate&&"text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{accidentDate?format(accidentDate,"PPP"):"Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={accidentDate} onSelect={handleDateChange(setAccidentDate, 'accidentDate')} initialFocus/></PopoverContent></Popover></div>
                    <div className="space-y-2"><Label>Accident Time</Label><Input id="accidentTime" type="time" value={accidentData.accidentTime} onChange={handleInputChange}/></div>
                    <div className="space-y-2 col-span-2"><Label>Location</Label><Input id="location" value={accidentData.location} onChange={handleInputChange} /></div>
                    <div className="space-y-2"><Label>Accident Type</Label><Select value={accidentData.accidentTypeId} onValueChange={handleSelectChange('accidentTypeId')}><SelectTrigger><SelectValue placeholder="Select Type"/></SelectTrigger><SelectContent>{accidentTypes.map(t=><SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Severity Level</Label><Select value={accidentData.severityLevelId} onValueChange={handleSelectChange('severityLevelId')}><SelectTrigger><SelectValue placeholder="Select Level"/></SelectTrigger><SelectContent>{severityLevels.map(sl=><SelectItem key={sl.id} value={sl.id}>{sl.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Fault Status</Label><Select value={accidentData.faultStatusId} onValueChange={handleSelectChange('faultStatusId')}><SelectTrigger><SelectValue placeholder="Select Status"/></SelectTrigger><SelectContent>{faultStatuses.map(fs=><SelectItem key={fs.id} value={fs.id}>{fs.name}</SelectItem>)}</SelectContent></Select></div>
                </div>
                 <div className="space-y-2">
                  <Label>Damage Details</Label>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border p-4 rounded-md">
                        {damageDetails.map(detail => (
                            <div key={detail.id} className="flex items-center space-x-2">
                                <Checkbox id={`damage-${detail.id}`} checked={damageDetailIds.includes(detail.id)} onCheckedChange={(checked) => handleDamageDetailCheck(detail.id)(checked as boolean)} />
                                <label htmlFor={`damage-${detail.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{detail.name}</label>
                            </div>
                        ))}
                   </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description of Incident</Label>
                  <Textarea id="description" value={accidentData.description} onChange={handleInputChange} />
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 2: Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Estimated Repair Cost</Label><Input id="estimatedRepairCost" type="number" value={accidentData.estimatedRepairCost} onChange={handleInputChange}/></div>
                  <div className="space-y-2"><Label>Actual Repair Cost</Label><Input id="actualRepairCost" type="number" value={accidentData.actualRepairCost} onChange={handleInputChange}/></div>
                  <div className="space-y-2"><Label>Third-Party Damage Cost</Label><Input id="thirdPartyDamageCost" type="number" value={accidentData.thirdPartyDamageCost} onChange={handleInputChange}/></div>
                  <div className="space-y-2"><Label>Repaired By (Garage)</Label><Select value={accidentData.repairedById} onValueChange={handleSelectChange('repairedById')}><SelectTrigger><SelectValue placeholder="Select Garage"/></SelectTrigger><SelectContent>{serviceCenters.map(sc=><SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2 col-span-2"><Label>Repair Payment Status</Label><Select value={accidentData.repairPaymentStatus} onValueChange={handleSelectChange('repairPaymentStatus')}><SelectTrigger><SelectValue placeholder="Select Status"/></SelectTrigger><SelectContent><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent></Select></div>
                </div>
              </div>
            )}
             {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 3: Legal & Insurance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 border rounded-md">
                        <div className="flex items-center space-x-2"><Checkbox id="policeReportFiled" checked={accidentData.policeReportFiled} onCheckedChange={handleCheckboxChange('policeReportFiled')} /><Label htmlFor="policeReportFiled">Police Report Filed?</Label></div>
                        {accidentData.policeReportFiled && (
                            <div className="space-y-4 pl-6 pt-2">
                                <div className="space-y-2"><Label>Police Report Number</Label><Input id="policeReportNumber" value={accidentData.policeReportNumber} onChange={handleInputChange}/></div>
                                <div className="space-y-2"><Label>Police Station</Label><Input id="policeStation" value={accidentData.policeStation} onChange={handleInputChange}/></div>
                            </div>
                        )}
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <div className="flex items-center space-x-2"><Checkbox id="insuranceClaimFiled" checked={accidentData.insuranceClaimFiled} onCheckedChange={handleCheckboxChange('insuranceClaimFiled')} /><Label htmlFor="insuranceClaimFiled">Insurance Claim Filed?</Label></div>
                         {accidentData.insuranceClaimFiled && (
                            <div className="space-y-4 pl-6 pt-2">
                                <div className="space-y-2"><Label>Insurance Claim Number</Label><Input id="insuranceClaimNumber" value={accidentData.insuranceClaimNumber} onChange={handleInputChange}/></div>
                                <div className="space-y-2"><Label>Insurance Company</Label><Input id="insuranceCompany" value={accidentData.insuranceCompany} onChange={handleInputChange}/></div>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            )}
            {step === 4 && (
                 <div className="space-y-6">
                    <div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Step 4: Upload Documents</h3><Button variant="outline" size="sm" onClick={addDocument}><PlusCircle className="mr-2 h-4 w-4"/>Add Document</Button></div>
                     <div className="space-y-4">
                        {documents.map(doc => (
                             <div key={doc.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                                <Input placeholder="Document Label (e.g., Accident Photo)" value={doc.label} onChange={(e) => updateDocumentLabel(doc.id, e.target.value)} />
                                <Label htmlFor={`file-upload-${doc.id}`} className="flex items-center justify-center w-full h-10 px-4 transition bg-background border rounded-md appearance-none cursor-pointer hover:border-primary text-sm text-muted-foreground">
                                    <Upload className="h-4 w-4 mr-2" /> {doc.file ? 'Change File' : 'Upload File'}
                                </Label>
                                <Input id={`file-upload-${doc.id}`} type="file" className="hidden" onChange={handleFileChange(doc.id)} />
                                 <div className="flex items-center gap-2">
                                    {doc.file && <span className="text-xs text-muted-foreground truncate">File uploaded</span>}
                                    <Button variant="ghost" size="icon" onClick={() => removeDocument(doc.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </div>
                            </div>
                        ))}
                     </div>
                 </div>
            )}
        </div>

        <DialogFooter className="flex justify-between w-full pt-4">
            {step > 1 ? (<Button variant="outline" onClick={prevStep}>Previous</Button>) : <div></div>}
            {step < 4 ? (<Button onClick={nextStep}>Next</Button>) : (<Button onClick={handleSave}>{isEditing ? 'Update Record' : 'Save Record'}</Button>)}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
