
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
    Upload, X, Calendar as CalendarIcon, File as FileIcon, PlusCircle, AlertTriangle, 
    Car, User, Clock, MapPin, Hash, Tag, Shield, Milestone, Route, Info, 
    HeartPulse, ShieldQuestion, DollarSign, Building, CheckCircle2, ClipboardList, 
    ShieldCheck, Image as ImageIcon
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn, imageToDataUrl } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useVehicleManagement } from './vehicle-management-provider';

import type { Vehicle } from './vehicle-table';
import type { Driver } from './driver-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { AccidentType } from './accident-type-table';
import type { SeverityLevel } from './severity-level-table';
import type { FaultStatus } from './fault-status-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { ServiceCenter } from './service-center-table';
import { TimeInput } from './time-input';

type UploadedFile = {
  id: string;
  name: string;
  file: string; 
}

type AccidentDocumentType = 'accidentPhotos' | 'policeReport' | 'insuranceClaimForm' | 'workshopQuotation' | 'repairInvoice' | 'medicalReport';

const documentCategories: Record<AccidentDocumentType, string> = {
    accidentPhotos: 'Accident Scene Photos',
    policeReport: 'Police GD / FIR Copy',
    insuranceClaimForm: 'Insurance Claim Copy',
    workshopQuotation: 'Repair Estimate',
    repairInvoice: 'Final Repair Bill',
    medicalReport: 'Injury Report',
};

export type Accident = {
  id: string;
  accidentId: string;
  vehicleId: string;
  driverId: string;
  employeeId: string;
  accidentDate: string;
  accidentTime: string;
  location: string;
  accidentTypeId: string;
  severityLevelId: string;
  faultStatusId: string;
  routeId: string;
  tripId: string;
  description: string;
  vehicleDamageDescription: string;
  thirdPartyDamage: 'Yes' | 'No' | '';
  humanInjury: 'None' | 'Minor' | 'Serious' | 'Fatal' | '';
  vehicleStatusAfterAccident: 'Running' | 'Repair Required' | 'Total Loss' | '';
  estimatedRepairCost: number;
  actualRepairCost: number;
  thirdPartyDamageCost: number;
  repairedById: string;
  repairPaymentStatus: 'Paid' | 'Unpaid' | 'Pending' | '';
  policeReportFiled: boolean;
  policeReportNumber: string;
  policeStation: string;
  insuranceClaimFiled: boolean;
  insuranceClaimNumber: string;
  insuranceCompany: string;
  documents: Record<AccidentDocumentType, UploadedFile[]>;
};

const initialDocuments: Record<AccidentDocumentType, UploadedFile[]> = {
    accidentPhotos: [],
    policeReport: [],
    insuranceClaimForm: [],
    workshopQuotation: [],
    repairInvoice: [],
    medicalReport: [],
};

const initialAccidentData: Omit<Accident, 'id' | 'accidentId' | 'documents'> = {
  vehicleId: '',
  driverId: '',
  employeeId: '',
  accidentDate: '',
  accidentTime: '',
  location: '',
  accidentTypeId: '',
  severityLevelId: '',
  faultStatusId: '',
  routeId: '',
  tripId: '',
  description: '',
  vehicleDamageDescription: '',
  thirdPartyDamage: '',
  humanInjury: '',
  vehicleStatusAfterAccident: '',
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

const MandatoryIndicator = () => <span className="text-red-500 ml-1">*</span>;

interface AccidentEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (record: Partial<Accident>) => void;
  accident: Partial<Accident> | null;
}

export function AccidentEntryForm({ isOpen, setIsOpen, onSave, accident }: AccidentEntryFormProps) {
  const { toast } = useToast();
  const { data } = useVehicleManagement();
  const { vehicles = [], drivers = [], employees = [], accidentTypes = [], severityLevels = [], faultStatuses = [], serviceCenters = [] } = data;
  
  const [step, setStep] = useState(1);
  const [aData, setAData] = useState(initialAccidentData);
  const [documents, setDocuments] = useState<Record<AccidentDocumentType, UploadedFile[]>>(initialDocuments);
  const [accDate, setAccDate] = useState<Date | undefined>();

  const isEditing = accident && accident.id;
  const progress = Math.round((step / 5) * 100);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEditing && accident) {
        setAData({ ...initialAccidentData, ...accident });
        setDocuments(accident.documents || initialDocuments);
        setAccDate(accident.accidentDate ? parseISO(accident.accidentDate) : undefined);
      } else {
        setAData(initialAccidentData);
        setDocuments(initialDocuments);
        setAccDate(undefined);
      }
    }
  }, [isOpen, accident, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    setAData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleFileChange = (docType: AccidentDocumentType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-destructive" /> {isEditing ? 'Modify Accident Record' : 'Record New Accident'}</DialogTitle>
          <DialogDescription>Input official incident metrics, damage assessment, and legal filings.</DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Car className="h-5 w-5 text-primary" /> Step 1: Incident Specifics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Car className="h-3 w-3" /> Vehicle<MandatoryIndicator/></Label>
                    <Select value={aData.vehicleId} onValueChange={(v) => setAData({...aData, vehicleId: v})}>
                        <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                        <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> Driver During Incident<MandatoryIndicator/></Label>
                    <Select value={aData.driverId} onValueChange={(v) => setAData({...aData, driverId: v})}>
                        <SelectTrigger><SelectValue placeholder="Select Driver" /></SelectTrigger>
                        <SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> Reported By Official</Label>
                    <Select value={aData.employeeId} onValueChange={(v) => setAData({...aData, employeeId: v})}>
                        <SelectTrigger><SelectValue placeholder="Select Official" /></SelectTrigger>
                        <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarIcon className="h-3 w-3" /> Date of Incident<MandatoryIndicator/></Label>
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{accDate?format(accDate,"PPP"):"Select Date"}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={accDate} onSelect={(d) => { setAccDate(d); setAData({...aData, accidentDate: d?format(d, 'yyyy-MM-dd'):''})}} /></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Clock className="h-3 w-3" /> Time of Incident<MandatoryIndicator/></Label>
                      <TimeInput value={aData.accidentTime} onChange={(v) => setAData({...aData, accidentTime: v})} />
                    </div>
                    <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><MapPin className="h-3 w-3" /> Precise Location<MandatoryIndicator/></Label><Input id="location" value={aData.location} onChange={handleInputChange} /></div>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Tag className="h-3 w-3" /> Collision Type</Label>
                        <Select value={aData.accidentTypeId} onValueChange={(v) => setAData({...aData, accidentTypeId: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{accidentTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Shield className="h-3 w-3" /> Severity Level</Label>
                        <Select value={aData.severityLevelId} onValueChange={(v) => setAData({...aData, severityLevelId: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{severityLevels.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><ShieldQuestion className="h-3 w-3" /> Fault Determination</Label>
                        <Select value={aData.faultStatusId} onValueChange={(v) => setAData({...aData, faultStatusId: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{faultStatuses.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6">
                 <h3 className="font-semibold text-lg flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Step 2: Damage Evaluation</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Wrench className="h-3 w-3" /> Vehicle Damage Summary</Label>
                        <Textarea id="vehicleDamageDescription" value={aData.vehicleDamageDescription} onChange={handleInputChange} rows={3} />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><HeartPulse className="h-3 w-3" /> Human Injury Level</Label>
                        <Select value={aData.humanInjury} onValueChange={(v) => setAData({...aData, humanInjury: v as any})}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="None">None</SelectItem><SelectItem value="Minor">Minor</SelectItem><SelectItem value="Serious">Serious</SelectItem><SelectItem value="Fatal">Fatal</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Car className="h-3 w-3" /> Asset Condition Post-Crash</Label>
                        <Select value={aData.vehicleStatusAfterAccident} onValueChange={(v) => setAData({...aData, vehicleStatusAfterAccident: v as any})}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Running">Running</SelectItem><SelectItem value="Repair Required">Requires Repair</SelectItem><SelectItem value="Total Loss">Total Loss / Scrap</SelectItem></SelectContent></Select>
                    </div>
                 </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Step 3: Financial Liability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><DollarSign className="h-3 w-3" /> Estimated Repair Cost</Label><Input id="estimatedRepairCost" type="number" value={aData.estimatedRepairCost} onChange={handleInputChange}/></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><DollarSign className="h-3 w-3" /> Actual Repair Cost</Label><Input id="actualRepairCost" type="number" value={aData.actualRepairCost} onChange={handleInputChange}/></div>
                  <div className="space-y-2 col-span-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Chosen Repair Workshop</Label><Select value={aData.repairedById} onValueChange={(v) => setAData({...aData, repairedById: v})}><SelectTrigger><SelectValue placeholder="Select Workshop"/></SelectTrigger>
                  <SelectContent>{serviceCenters.map(sc => <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>)}</SelectContent></Select></div>
                </div>
              </div>
            )}
             {step === 4 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Step 4: Legal & Insurance Recovery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 border rounded-md bg-muted/10">
                        <div className="flex items-center space-x-2"><Checkbox id="policeReportFiled" checked={aData.policeReportFiled} onCheckedChange={(c) => setAData({...aData, policeReportFiled: !!c})} /><Label htmlFor="policeReportFiled">Police Case / GD Filed?</Label></div>
                        {aData.policeReportFiled && (
                            <div className="space-y-4 pl-6 pt-2 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> Case / GD Number</Label><Input id="policeReportNumber" value={aData.policeReportNumber} onChange={handleInputChange}/></div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Police Station (Thana)</Label><Input id="policeStation" value={aData.policeStation} onChange={handleInputChange}/></div>
                            </div>
                        )}
                    </div>
                     <div className="space-y-4 p-4 border rounded-md bg-muted/10">
                        <div className="flex items-center space-x-2"><Checkbox id="insuranceClaimFiled" checked={aData.insuranceClaimFiled} onCheckedChange={(c) => setAData({...aData, insuranceClaimFiled: !!c})} /><Label htmlFor="insuranceClaimFiled">Insurance Claim Initiated?</Label></div>
                         {aData.insuranceClaimFiled && (
                            <div className="space-y-4 pl-6 pt-2 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> Claim Reference Number</Label><Input id="insuranceClaimNumber" value={aData.insuranceClaimNumber} onChange={handleInputChange}/></div>
                                <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Insurer Name</Label><Input id="insuranceCompany" value={aData.insuranceCompany} onChange={handleInputChange}/></div>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            )}
            {step === 5 && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Step 5: Verification Vault</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(Object.keys(documentCategories) as AccidentDocumentType[]).map(docType => (
                            <div key={docType} className="space-y-2 p-3 border rounded-lg bg-muted/5 group">
                                <div className="flex justify-between items-center">
                                    <Label className="font-semibold text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> {documentCategories[docType]}</Label>
                                    <Label htmlFor={`a-file-${docType}`} className="cursor-pointer text-[10px] text-primary hover:underline flex items-center gap-1 font-bold"><Upload className="h-3 w-3"/>Add Files</Label>
                                    <Input id={`a-file-${docType}`} type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileChange(docType)} />
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
            {step < 5 ? (
                <Button onClick={() => setStep(s => s + 1)}>Continue</Button>
            ) : (
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">{isEditing ? 'Sync Incident Record' : 'Commit Accident Data'}</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
