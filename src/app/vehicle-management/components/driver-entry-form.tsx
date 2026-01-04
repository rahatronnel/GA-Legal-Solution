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
import { Upload, X, User, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Vehicle } from './vehicle-table';

export type Driver = {
  id: string;
  driverIdCode: string;
  name: string;
  fatherOrGuardianName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  mobileNumber: string;
  alternateMobileNumber: string;
  profilePicture: string; // Will store as data URL
  
  // New fields
  nationalIdOrPassport: string;
  drivingLicenseNumber: string;
  licenseType: 'Light' | 'Heavy' | 'Professional' | '';
  licenseIssueDate: string;
  licenseExpiryDate: string;
  issuingAuthority: string;
  presentAddress: string;
  permanentAddress: string;
  joiningDate: string;
  employmentType: 'Permanent' | 'Contract' | 'Temporary' | '';
  department: string;
  dutyShift: string;
  assignedVehicleId: string;
  supervisor: string;

  documents: {
    drivingLicense: string; // Will store as data URL
    nid: string; // Will store as data URL
    other: string; // Will store as data URL
  }
};

const initialDriverData: Omit<Driver, 'id'> = {
  driverIdCode: '',
  name: '',
  fatherOrGuardianName: '',
  dateOfBirth: '',
  gender: '',
  mobileNumber: '',
  alternateMobileNumber: '',
  profilePicture: '',
  nationalIdOrPassport: '',
  drivingLicenseNumber: '',
  licenseType: '',
  licenseIssueDate: '',
  licenseExpiryDate: '',
  issuingAuthority: '',
  presentAddress: '',
  permanentAddress: '',
  joiningDate: '',
  employmentType: '',
  department: '',
  dutyShift: '',
  assignedVehicleId: '',
  supervisor: '',
  documents: { drivingLicense: '', nid: '', other: '' }
};

interface DriverEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (driver: Omit<Driver, 'id'>, id?: string) => void;
  driver: Partial<Driver> | null;
  vehicles: Pick<Vehicle, 'id' | 'registrationNumber'>[];
}

export function DriverEntryForm({ isOpen, setIsOpen, onSave, driver, vehicles }: DriverEntryFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [driverData, setDriverData] = useState(initialDriverData);

  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [licenseIssueDate, setLicenseIssueDate] = useState<Date | undefined>(undefined);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState<Date | undefined>(undefined);
  const [joiningDate, setJoiningDate] = useState<Date | undefined>(undefined);
  
  // Store file objects temporarily
  const [docFiles, setDocFiles] = useState({ drivingLicense: null as File | null, nid: null as File | null, other: null as File | null });
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

  // Store previews/data URLs
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [docPreviews, setDocPreviews] = useState({ drivingLicense: '', nid: '', other: ''});


  const progress = Math.round((step / 4) * 100);
  const isEditing = driver && driver.id;

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEditing && driver) {
        const initialData = { ...initialDriverData, ...driver };
        setDriverData(initialData);
        setDob(initialData.dateOfBirth ? new Date(initialData.dateOfBirth) : undefined);
        setLicenseIssueDate(initialData.licenseIssueDate ? new Date(initialData.licenseIssueDate) : undefined);
        setLicenseExpiryDate(initialData.licenseExpiryDate ? new Date(initialData.licenseExpiryDate) : undefined);
        setJoiningDate(initialData.joiningDate ? new Date(initialData.joiningDate) : undefined);

        setProfilePicPreview(initialData.profilePicture || null);
        setDocPreviews(initialData.documents || { drivingLicense: '', nid: '', other: '' });
      } else {
        setDriverData(initialDriverData);
        setDob(undefined);
        setLicenseIssueDate(undefined);
        setLicenseExpiryDate(undefined);
        setJoiningDate(undefined);
        setProfilePicPreview(null);
        setDocPreviews({ drivingLicense: '', nid: '', other: '' });
      }
      setDocFiles({ drivingLicense: null, nid: null, other: null });
      setProfilePicFile(null);
    }
  }, [isOpen, driver, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setDriverData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Driver) => (value: string) => {
    setDriverData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleDateChange = (setter: (date: Date | undefined) => void, field: keyof Driver) => (date: Date | undefined) => {
      setter(date);
      setDriverData(prev => ({...prev, [field]: date ? format(date, 'yyyy-MM-dd') : ''}))
  }
  
  const fileToDataUrl = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  }

  const handleFileChange = (docType: 'drivingLicense' | 'nid' | 'other') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFiles(prev => ({ ...prev, [docType]: file }));
      const dataUrl = await fileToDataUrl(file);
      setDocPreviews(prev => ({...prev, [docType]: dataUrl}));
    }
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setProfilePicFile(file);
        const dataUrl = await fileToDataUrl(file);
        setProfilePicPreview(dataUrl);
    }
  };

  const removeDocument = (docType: 'drivingLicense' | 'nid' | 'other') => {
      setDocFiles(prev => ({...prev, [docType]: null}));
      setDocPreviews(prev => ({...prev, [docType]: ''}));
      setDriverData(prev => ({...prev, documents: {...prev.documents, [docType]: ''}}));
  };
  
  const removeProfilePic = () => {
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setDriverData(prev => ({...prev, profilePicture: ''}));
  }

  const validateStep = (currentStep: number) => {
    switch(currentStep) {
      case 1:
        return driverData.driverIdCode && driverData.name && driverData.mobileNumber;
      // Add more validations for other steps if needed
      default:
        return true;
    }
  }
  
  const nextStep = () => {
    if (!validateStep(step)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields for this step.' });
        return;
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSave = async () => {
    const dataToSave: Omit<Driver, 'id'> = {
        ...driverData,
        profilePicture: profilePicPreview || driverData.profilePicture,
        documents: {
            drivingLicense: docPreviews.drivingLicense || driverData.documents.drivingLicense,
            nid: docPreviews.nid || driverData.documents.nid,
            other: docPreviews.other || driverData.documents.other
        },
    };

    onSave(dataToSave, driver?.id);
    setIsOpen(false);
  };
  
  const getDocumentName = (docType: 'drivingLicense' | 'nid' | 'other') => {
      if (docFiles[docType]) return docFiles[docType]!.name;
      if (docPreviews[docType] || (driverData.documents && driverData.documents[docType])) return `${docType.replace(/([A-Z])/g, ' $1')}.file`;
      return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this driver.' : 'Follow the steps to add a new driver.'}
          </DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 1: Personal & Contact Information</h3>
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-1 flex flex-col items-center gap-4">
                        <Label htmlFor="profile-pic-upload" className="cursor-pointer">
                            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                                {profilePicPreview ? (
                                    <Image src={profilePicPreview} alt="Profile" width={128} height={128} className="object-cover w-full h-full" />
                                ) : (
                                    <User className="w-16 h-16 text-muted-foreground" />
                                )}
                            </div>
                        </Label>
                        <Input id="profile-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                        {profilePicPreview ? (
                             <Button variant="link" size="sm" className="text-destructive" onClick={removeProfilePic}>Remove picture</Button>
                        ) : (
                            <Label htmlFor="profile-pic-upload" className="text-sm text-primary cursor-pointer">Upload Picture</Label>
                        )}
                    </div>
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="driverIdCode">Driver ID / Code</Label>
                            <Input id="driverIdCode" value={driverData.driverIdCode} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="name">Driver Name</Label>
                             <Input id="name" value={driverData.name} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fatherOrGuardianName">Father’s / Guardian’s Name</Label>
                            <Input id="fatherOrGuardianName" value={driverData.fatherOrGuardianName} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dob && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dob} onSelect={handleDateChange(setDob, 'dateOfBirth')} initialFocus/></PopoverContent>
                            </Popover>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={driverData.gender} onValueChange={handleSelectChange('gender')}>
                                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="mobileNumber">Mobile Number</Label>
                            <Input id="mobileNumber" value={driverData.mobileNumber} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="alternateMobileNumber">Alternate Mobile Number</Label>
                            <Input id="alternateMobileNumber" value={driverData.alternateMobileNumber} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="nationalIdOrPassport">National ID / Passport No.</Label>
                            <Input id="nationalIdOrPassport" value={driverData.nationalIdOrPassport} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="col-span-3 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="presentAddress">Present Address</Label>
                          <Textarea id="presentAddress" value={driverData.presentAddress} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="permanentAddress">Permanent Address</Label>
                          <Textarea id="permanentAddress" value={driverData.permanentAddress} onChange={handleInputChange} />
                      </div>
                    </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 2: License Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="drivingLicenseNumber">Driving License Number</Label>
                      <Input id="drivingLicenseNumber" value={driverData.drivingLicenseNumber} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="licenseType">License Type</Label>
                      <Select value={driverData.licenseType} onValueChange={handleSelectChange('licenseType')}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Light">Light</SelectItem>
                              <SelectItem value="Heavy">Heavy</SelectItem>
                              <SelectItem value="Professional">Professional</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="licenseIssueDate">License Issue Date</Label>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !licenseIssueDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {licenseIssueDate ? format(licenseIssueDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={licenseIssueDate} onSelect={handleDateChange(setLicenseIssueDate, 'licenseIssueDate')} initialFocus/></PopoverContent>
                      </Popover>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="licenseExpiryDate">License Expiry Date</Label>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !licenseExpiryDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {licenseExpiryDate ? format(licenseExpiryDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={licenseExpiryDate} onSelect={handleDateChange(setLicenseExpiryDate, 'licenseExpiryDate')} initialFocus/></PopoverContent>
                      </Popover>
                  </div>
                  <div className="space-y-2 col-span-2">
                      <Label htmlFor="issuingAuthority">Issuing Authority</Label>
                      <Input id="issuingAuthority" value={driverData.issuingAuthority} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 3: Employment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="joiningDate">Joining Date</Label>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !joiningDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {joiningDate ? format(joiningDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={joiningDate} onSelect={handleDateChange(setJoiningDate, 'joiningDate')} initialFocus/></PopoverContent>
                      </Popover>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Select value={driverData.employmentType} onValueChange={handleSelectChange('employmentType')}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Permanent">Permanent</SelectItem>
                              <SelectItem value="Contract">Contract</SelectItem>
                              <SelectItem value="Temporary">Temporary</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="department">Department / Unit</Label>
                      <Input id="department" value={driverData.department} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="dutyShift">Duty Shift / Schedule</Label>
                      <Input id="dutyShift" value={driverData.dutyShift} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="supervisor">Supervisor / Reporting Person</Label>
                      <Input id="supervisor" value={driverData.supervisor} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                        <Label htmlFor="assignedVehicleId">Assigned Vehicle (if any)</Label>
                        <Select value={driverData.assignedVehicleId} onValueChange={handleSelectChange('assignedVehicleId')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {vehicles.map(vehicle => (
                                    <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              </div>
            )}

            {step === 4 && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg">Step 4: Upload Documents</h3>
                    
                    {(['drivingLicense', 'nid', 'other'] as const).map(docType => {
                        const currentDocName = getDocumentName(docType);
                        const docLabel = { drivingLicense: 'Driving License', nid: 'NID', other: 'Other Document'}[docType];
                        
                        return (
                            <div className="space-y-2" key={docType}>
                                <Label>{docLabel}</Label>
                                {currentDocName ? (
                                    <div className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                                        <span>{currentDocName}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDocument(docType)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Label htmlFor={`file-upload-${docType}`} className="flex items-center justify-center w-full h-20 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary">
                                        <span className="flex items-center space-x-2">
                                            <Upload className="h-5 w-5 text-muted-foreground" />
                                            <span className="font-medium text-muted-foreground">
                                                Click to upload
                                            </span>
                                        </span>
                                        <Input id={`file-upload-${docType}`} type="file" className="hidden" onChange={handleFileChange(docType)} />
                                    </Label>
                                )}
                            </div>
                        );
                    })}
                 </div>
            )}
        </div>

        <DialogFooter className="flex justify-between w-full">
            {step > 1 ? (
                <Button variant="outline" onClick={prevStep}>Previous</Button>
            ) : <div></div>}
            
            {step < 4 ? (
                 <Button onClick={nextStep}>Next</Button>
            ) : (
                 <Button onClick={handleSave}>{isEditing ? 'Update Driver' : 'Save Driver'}</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
