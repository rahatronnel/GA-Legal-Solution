
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
import { Upload, X, CalendarIcon, File as FileIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useLocalStorage } from '@/hooks/use-local-storage';

import type { Vehicle } from './vehicle-table';
import type { Driver } from './driver-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Route } from './route-table';
import type { Trip } from './trip-entry-form';
import type { AccidentType } from './accident-type-table';
import type { SeverityLevel } from './severity-level-table';
import type { FaultStatus } from './fault-status-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { ServiceCenter } from './service-center-table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';

type UploadedFile = {
  id: string;
  name: string;
  file: string; // data URL
}

type AccidentDocumentType = 'accidentPhotos' | 'policeReport' | 'insuranceClaimForm' | 'workshopQuotation' | 'repairInvoice' | 'medicalReport';

const documentCategories: Record<AccidentDocumentType, string> = {
    accidentPhotos: 'Accident Photos',
    policeReport: 'Police Report',
    insuranceClaimForm: 'Insurance Claim Form',
    workshopQuotation: 'Workshop Quotation',
    repairInvoice: 'Repair Invoice',
    medicalReport: 'Medical Report (if any)',
};

export type Accident = {
  id: string;
  accidentId: string; // Auto-generated
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
  
  // Damage Details
  vehicleDamageDescription: string;
  thirdPartyDamage: 'Yes' | 'No' | '';
  humanInjury: 'None' | 'Minor' | 'Serious' | 'Fatal' | '';
  vehicleStatusAfterAccident: 'Running' | 'Repair Required' | 'Total Loss' | '';

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

// Combobox Component
interface ComboboxProps<T> {
  items: T[];
  value: string;
  onSelect: (value: string) => void;
  displayValue: (item: T) => string;
  searchValue: (item: T) => string;
  placeholder: string;
  emptyMessage: string;
}

function Combobox<T extends {id: string}>({ items, value, onSelect, displayValue, searchValue, placeholder, emptyMessage }: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const currentItem = items.find((item) => item.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {currentItem
            ? displayValue(currentItem)
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={searchValue(item)}
                  onSelect={() => {
                    onSelect(item.id === value ? '' : item.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === item.id ? "opacity-100" : "opacity-0")} />
                  {displayValue(item)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface AccidentEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (record: Partial<Accident>) => void;
  accident: Partial<Accident> | null;
}

export function AccidentEntryForm({ isOpen, setIsOpen, onSave, accident }: AccidentEntryFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [accidentData, setAccidentData] = useState(initialAccidentData);
  const [documents, setDocuments] = useState<Record<AccidentDocumentType, UploadedFile[]>>(initialDocuments);
  
  const [accidentDate, setAccidentDate] = useState<Date | undefined>();

  const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [drivers] = useLocalStorage<Driver[]>('drivers', []);
  const [employees] = useLocalStorage<Employee[]>('employees', []);
  const [routes] = useLocalStorage<Route[]>('routes', []);
  const [trips] = useLocalStorage<Trip[]>('trips', []);
  const [accidentTypes] = useLocalStorage<AccidentType[]>('accidentTypes', []);
  const [severityLevels] = useLocalStorage<SeverityLevel[]>('severityLevels', []);
  const [faultStatuses] = useLocalStorage<FaultStatus[]>('faultStatuses', []);
  const [serviceCenters] = useLocalStorage<ServiceCenter[]>('serviceCenters', []);
  
  const isEditing = accident && accident.id;
  const progress = Math.round((step / 5) * 100);

  const selectedVehicle = React.useMemo(() => vehicles.find(v => v.id === accidentData.vehicleId), [accidentData.vehicleId, vehicles]);
  const selectedDriver = React.useMemo(() => drivers.find(d => d.id === accidentData.driverId), [accidentData.driverId, drivers]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEditing && accident) {
        setAccidentData({ ...initialAccidentData, ...accident });
        setDocuments(accident.documents || initialDocuments);
        const accDate = accident.accidentDate ? parseISO(accident.accidentDate) : undefined;
        setAccidentDate(accDate);

        if (!accident.driverId && accDate && accident.vehicleId) {
            const vehicle = vehicles.find(v => v.id === accident.vehicleId);
            if (vehicle) {
                const driverId = getDriverForDate(vehicle, accDate);
                if (driverId) {
                    setAccidentData(prev => ({ ...prev, driverId }));
                }
            }
        }
      } else {
        setAccidentData(initialAccidentData);
        setDocuments(initialDocuments);
        setAccidentDate(undefined);
      }
    }
  }, [isOpen, accident, isEditing, vehicles]);

  const getDriverForDate = (vehicle: Vehicle, date: Date) => {
    if (!vehicle.driverAssignmentHistory || vehicle.driverAssignmentHistory.length === 0) {
      return '';
    }

    const sortedHistory = [...vehicle.driverAssignmentHistory]
        .filter(h => new Date(h.effectiveDate) <= date)
        .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

    return sortedHistory.length > 0 ? sortedHistory[0].driverId : '';
  };

  const handleVehicleChange = (vehicleId: string) => {
    setAccidentData(prev => ({...prev, vehicleId, driverId: ''}));
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if(vehicle && accidentDate) {
        const driverId = getDriverForDate(vehicle, accidentDate);
        if(driverId) {
            setAccidentData(prev => ({...prev, driverId}));
        }
    }
  }

  const handleAccidentDateChange = (date: Date | undefined) => {
    setAccidentDate(date);
    const dateString = date ? format(date, 'yyyy-MM-dd') : '';
    setAccidentData(prev => ({...prev, accidentDate: dateString, driverId: ''}));

    if(accidentData.vehicleId && date) {
        const vehicle = vehicles.find(v => v.id === accidentData.vehicleId);
        if(vehicle) {
            const driverId = getDriverForDate(vehicle, date);
            if(driverId) {
                setAccidentData(prev => ({...prev, driverId}));
            }
        }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const isNumber = type === 'number';
    setAccidentData(prev => ({ ...prev, [id]: isNumber ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (id: keyof typeof accidentData) => (value: string) => {
    if (id === 'vehicleId') {
        handleVehicleChange(value);
    } else {
        setAccidentData(prev => ({ ...prev, [id]: value }));
    }
  };
  
  const handleComboboxChange = (id: keyof typeof accidentData) => (value: string) => {
      setAccidentData(prev => ({...prev, [id]: value}));
  }

  const handleDateChange = (setter: (date: Date | undefined) => void, field: keyof typeof accidentData) => (date: Date | undefined) => {
      if (field === 'accidentDate') {
          handleAccidentDateChange(date);
      } else {
        setter(date);
        setAccidentData(prev => ({...prev, [field]: date ? format(date, 'yyyy-MM-dd') : ''}))
      }
  }
  
  const handleCheckboxChange = (id: keyof typeof accidentData) => (checked: boolean) => {
      setAccidentData(prev => ({ ...prev, [id]: checked }));
  };
  
  // Document handlers
  const handleFileChange = (docType: AccidentDocumentType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newFiles: UploadedFile[] = [];

      for (const file of files) {
        const reader = new FileReader();
        const filePromise = new Promise<UploadedFile>(resolve => {
          reader.onload = () => {
            resolve({
              id: Date.now().toString() + Math.random(),
              name: file.name,
              file: reader.result as string,
            });
          };
        });
        reader.readAsDataURL(file);
        newFiles.push(await filePromise);
      }

      setDocuments(prev => ({
        ...prev,
        [docType]: [...prev[docType], ...newFiles]
      }));
    }
    e.target.value = ''; // Reset file input
  };

  const removeDocument = (docType: AccidentDocumentType, fileId: string) => {
    setDocuments(prev => ({
        ...prev,
        [docType]: prev[docType].filter(doc => doc.id !== fileId)
    }));
  };
  
  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
        return accidentData.vehicleId && accidentData.accidentDate && accidentData.accidentTime && accidentData.location;
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
    const dataToSave: Partial<Accident> = {
        ...accidentData,
        documents,
    };
    if (isEditing) {
        dataToSave.id = accident.id;
    }
    onSave(dataToSave);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit Accident: ${accident?.accidentId}` : 'Add Accident Record'}</DialogTitle>
          <DialogDescription>Follow the steps to log a vehicle accident.</DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-4 flex-grow overflow-y-auto pr-6">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 1: Accident Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Vehicle<MandatoryIndicator/></Label>
                    <Combobox items={vehicles} value={accidentData.vehicleId} onSelect={handleSelectChange('vehicleId')} displayValue={(v) => v.vehicleIdCode} searchValue={(v) => `${v.vehicleIdCode} ${v.registrationNumber}`} placeholder="Select Vehicle..." emptyMessage="No vehicle found." />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Registration</Label>
                    <Input value={selectedVehicle?.registrationNumber || ''} disabled />
                  </div>
                   <div className="space-y-2">
                    <Label>Employee</Label>
                    <Combobox items={employees} value={accidentData.employeeId} onSelect={handleSelectChange('employeeId')} displayValue={(e) => e.fullName} searchValue={(e) => `${e.fullName} ${e.userIdCode}`} placeholder="Select Employee..." emptyMessage="No employee found." />
                  </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Accident Date<MandatoryIndicator/></Label>
                        <Popover>
                            <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!accidentDate&&"text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{accidentDate?format(accidentDate,"PPP"):"Pick a date"}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={accidentDate} onSelect={handleDateChange(setAccidentDate, 'accidentDate')} initialFocus/></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2"><Label>Accident Time<MandatoryIndicator/></Label><Input id="accidentTime" type="time" value={accidentData.accidentTime} onChange={handleInputChange}/></div>
                    <div className="space-y-2"><Label>Accident Location<MandatoryIndicator/></Label><Input id="location" value={accidentData.location} onChange={handleInputChange} /></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Driver (Auto-fetched)</Label>
                         <Select value={accidentData.driverId} onValueChange={handleSelectChange('driverId')}><SelectTrigger><SelectValue placeholder="Select vehicle and date"/></SelectTrigger><SelectContent>{drivers.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Driver Name</Label>
                        <Input value={selectedDriver?.name || ''} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>Driver License Number</Label>
                        <Input value={selectedDriver?.drivingLicenseNumber || ''} disabled />
                    </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Accident Type</Label><Select value={accidentData.accidentTypeId} onValueChange={handleSelectChange('accidentTypeId')}><SelectTrigger><SelectValue placeholder="Select Type"/></SelectTrigger><SelectContent>{accidentTypes.map(t=><SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Severity Level</Label><Select value={accidentData.severityLevelId} onValueChange={handleSelectChange('severityLevelId')}><SelectTrigger><SelectValue placeholder="Select Level"/></SelectTrigger><SelectContent>{severityLevels.map(sl=><SelectItem key={sl.id} value={sl.id}>{sl.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Fault Status</Label><Select value={accidentData.faultStatusId} onValueChange={handleSelectChange('faultStatusId')}><SelectTrigger><SelectValue placeholder="Select Status"/></SelectTrigger><SelectContent>{faultStatuses.map(fs=><SelectItem key={fs.id} value={fs.id}>{fs.name}</SelectItem>)}</SelectContent></Select></div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                        <Label>Route (Optional)</Label>
                        <Combobox items={routes} value={accidentData.routeId} onSelect={handleComboboxChange('routeId')} displayValue={(r) => r.name} searchValue={(r) => `${r.name} ${r.routeCode}`} placeholder="Select Route..." emptyMessage="No route found." />
                    </div>
                    <div className="space-y-2">
                        <Label>Trip ID (Optional)</Label>
                        <Combobox items={trips} value={accidentData.tripId} onSelect={handleComboboxChange('tripId')} displayValue={(t) => t.tripId} searchValue={(t) => `${t.tripId}`} placeholder="Select Trip..." emptyMessage="No trip found." />
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
                 <h3 className="font-semibold text-lg">Step 2: Damage Detail</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="vehicleDamageDescription">Vehicle Damage Description</Label>
                        <Textarea id="vehicleDamageDescription" value={accidentData.vehicleDamageDescription} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label>Third-Party Damage</Label>
                        <Select value={accidentData.thirdPartyDamage} onValueChange={handleSelectChange('thirdPartyDamage')}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Human Injury</Label>
                        <Select value={accidentData.humanInjury} onValueChange={handleSelectChange('humanInjury')}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent><SelectItem value="None">None</SelectItem><SelectItem value="Minor">Minor</SelectItem><SelectItem value="Serious">Serious</SelectItem><SelectItem value="Fatal">Fatal</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label>Vehicle Status After Accident</Label>
                        <Select value={accidentData.vehicleStatusAfterAccident} onValueChange={handleSelectChange('vehicleStatusAfterAccident')}><SelectTrigger><SelectValue placeholder="Select Status"/></SelectTrigger><SelectContent><SelectItem value="Running">Running</SelectItem><SelectItem value="Repair Required">Repair Required</SelectItem><SelectItem value="Total Loss">Total Loss</SelectItem></SelectContent></Select>
                    </div>
                 </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 3: Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Estimated Repair Cost</Label><Input id="estimatedRepairCost" type="number" value={accidentData.estimatedRepairCost} onChange={handleInputChange}/></div>
                  <div className="space-y-2"><Label>Actual Repair Cost</Label><Input id="actualRepairCost" type="number" value={accidentData.actualRepairCost} onChange={handleInputChange}/></div>
                  <div className="space-y-2"><Label>Third-Party Damage Cost</Label><Input id="thirdPartyDamageCost" type="number" value={accidentData.thirdPartyDamageCost} onChange={handleInputChange}/></div>
                  <div className="space-y-2"><Label>Repaired By (Garage)</Label><Select value={accidentData.repairedById} onValueChange={handleSelectChange('repairedById')}><SelectTrigger><SelectValue placeholder="Select Garage"/></SelectTrigger><SelectContent>{serviceCenters.map(sc=><SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2 col-span-2"><Label>Repair Payment Status</Label><Select value={accidentData.repairPaymentStatus} onValueChange={handleSelectChange('repairPaymentStatus')}><SelectTrigger><SelectValue placeholder="Select Status"/></SelectTrigger><SelectContent><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent></Select></div>
                </div>
              </div>
            )}
             {step === 4 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 4: Legal & Insurance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 border rounded-md">
                        <div className="flex items-center space-x-2"><Checkbox id="policeReportFiled" checked={accidentData.policeReportFiled} onCheckedChange={(checked) => handleCheckboxChange('policeReportFiled')(checked as boolean)} /><Label htmlFor="policeReportFiled">Police Report Filed?</Label></div>
                        {accidentData.policeReportFiled && (
                            <div className="space-y-4 pl-6 pt-2">
                                <div className="space-y-2"><Label>Police Report Number</Label><Input id="policeReportNumber" value={accidentData.policeReportNumber} onChange={handleInputChange}/></div>
                                <div className="space-y-2"><Label>Police Station</Label><Input id="policeStation" value={accidentData.policeStation} onChange={handleInputChange}/></div>
                            </div>
                        )}
                    </div>
                     <div className="space-y-4 p-4 border rounded-md">
                        <div className="flex items-center space-x-2"><Checkbox id="insuranceClaimFiled" checked={accidentData.insuranceClaimFiled} onCheckedChange={(checked) => handleCheckboxChange('insuranceClaimFiled')(checked as boolean)} /><Label htmlFor="insuranceClaimFiled">Insurance Claim Filed?</Label></div>
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
            {step === 5 && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg">Step 5: Upload Documents</h3>
                    <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                        {(Object.keys(documentCategories) as AccidentDocumentType[]).map(docType => (
                            <div key={docType} className="space-y-2 p-3 border rounded-lg">
                                <div className="flex justify-between items-center">
                                    <Label className="font-medium">{documentCategories[docType]}</Label>
                                    <Label htmlFor={`file-upload-${docType}`} className="cursor-pointer text-sm text-primary hover:underline">
                                        Add File(s)
                                    </Label>
                                    <Input id={`file-upload-${docType}`} type="file" className="hidden" multiple onChange={handleFileChange(docType)} />
                                </div>
                                <div className="space-y-1">
                                    {documents[docType]?.length > 0 ? (
                                        documents[docType].map(file => (
                                            <div key={file.id} className="flex items-center justify-between text-sm p-1.5 bg-muted rounded-md">
                                                <div className="flex items-center gap-2 truncate">
                                                    <FileIcon className="h-4 w-4 flex-shrink-0" />
                                                    <span className="truncate">{file.name}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDocument(docType, file.id)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-2">No files uploaded.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            )}
        </div>

        <DialogFooter className="flex justify-between w-full pt-4 border-t">
            <div>
              {step > 1 && (<Button variant="outline" onClick={prevStep}>Previous</Button>)}
            </div>
            <div>
              {step < 5 ? (<Button onClick={nextStep}>Next</Button>) : (<Button onClick={handleSave}>{isEditing ? 'Update Record' : 'Save Record'}</Button>)}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
