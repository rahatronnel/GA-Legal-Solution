
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
    Upload, X, User, Hash, Calendar as CalendarIcon, Phone, 
    Milestone, ShieldCheck, MapPin, Building, Briefcase, Clock, Users, 
    FileSignature, FileText, Image as ImageIcon, Contact
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { format, parse, isValid } from 'date-fns';
import type { Vehicle } from './vehicle-entry-form';
import { imageToDataUrl } from '@/lib/utils';

export type Driver = {
  id: string;
  driverIdCode: string;
  name: string;
  fatherOrGuardianName: string;
  dateOfBirth: string; 
  gender: 'Male' | 'Female' | 'Other' | '';
  mobileNumber: string;
  alternateMobileNumber: string;
  profilePicture: string; 
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
    drivingLicense: string; 
    nid: string; 
    other: string; 
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

const MandatoryIndicator = () => <span className="text-red-500 ml-1">*</span>;

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
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [docPreviews, setDocPreviews] = useState({ drivingLicense: '', nid: '', other: ''});

  const progress = Math.round((step / 4) * 100);
  const isEditing = driver && driver.id;

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEditing && driver) {
        setDriverData({ ...initialDriverData, ...driver } as any);
        setProfilePicPreview(driver.profilePicture || null);
        setDocPreviews(driver.documents || { drivingLicense: '', nid: '', other: '' });
      } else {
        setDriverData(initialDriverData);
        setProfilePicPreview(null);
        setDocPreviews({ drivingLicense: '', nid: '', other: '' });
      }
    }
  }, [isOpen, driver, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setDriverData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id: keyof Driver) => (value: string) => {
    setDriverData(prev => ({ ...prev, [id]: value === 'none' ? '' : value }));
  };

  const handleFileChange = (docType: 'drivingLicense' | 'nid' | 'other') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const dataUrl = await imageToDataUrl(file);
        setDocPreviews(prev => ({...prev, [docType]: dataUrl}));
      } catch (error) {
        toast({ variant: 'destructive', title: 'Upload Failed' });
      }
    }
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
          const dataUrl = await imageToDataUrl(file);
          setProfilePicPreview(dataUrl);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Image Failed' });
        }
    }
  };

  const removeDocument = (docType: 'drivingLicense' | 'nid' | 'other') => {
      setDocPreviews(prev => ({...prev, [docType]: ''}));
  };
  
  const removeProfilePic = () => {
    setProfilePicPreview(null);
    setDriverData(prev => ({...prev, profilePicture: ''}));
  }

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
        return driverData.driverIdCode && driverData.name && driverData.mobileNumber;
    }
    return true;
  }
  
  const nextStep = () => {
    if (!validateStep(step)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all mandatory fields.' });
        return;
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSave = () => {
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Professional Driver Profile' : 'Register New Professional Driver'}</DialogTitle>
          <DialogDescription>Input personal credentials and licensing verification data.</DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-4 flex-grow overflow-y-auto pr-6">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Contact className="h-5 w-5 text-primary" /> Step 1: Personal Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 flex flex-col items-center gap-4">
                        <Label htmlFor="driver-pic" className="cursor-pointer">
                            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/20 hover:border-primary transition-colors">
                                {profilePicPreview ? (
                                    <Image src={profilePicPreview} alt="Profile" width={128} height={128} className="object-cover w-full h-full" />
                                ) : (
                                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                )}
                            </div>
                        </Label>
                        <Input id="driver-pic" type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                        {profilePicPreview && <Button variant="link" size="sm" className="text-destructive" onClick={removeProfilePic}>Remove Photo</Button>}
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="driverIdCode" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><Hash className="h-3 w-3" /> Driver Code / ID<MandatoryIndicator/></Label>
                            <Input id="driverIdCode" value={driverData.driverIdCode} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> Legal Full Name<MandatoryIndicator/></Label>
                             <Input id="name" value={driverData.name} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fatherOrGuardianName" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> Father / Guardian</Label>
                            <Input id="fatherOrGuardianName" value={driverData.fatherOrGuardianName} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarIcon className="h-3 w-3" /> Date of Birth</Label>
                            <Input id="dateOfBirth" value={driverData.dateOfBirth} onChange={handleInputChange} placeholder="YYYY-MM-DD" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="gender" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> Gender</Label>
                            <Select value={driverData.gender} onValueChange={handleSelectChange('gender')}>
                                <SelectTrigger><SelectValue placeholder="Choose gender" /></SelectTrigger>
                                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="mobileNumber" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><Phone className="h-3 w-3" /> Primary Mobile<MandatoryIndicator/></Label>
                            <Input id="mobileNumber" value={driverData.mobileNumber} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="presentAddress" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><MapPin className="h-3 w-3" /> Present Address</Label>
                          <Textarea id="presentAddress" value={driverData.presentAddress} onChange={handleInputChange} rows={2} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="permanentAddress" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><MapPin className="h-3 w-3" /> Permanent Address</Label>
                          <Textarea id="permanentAddress" value={driverData.permanentAddress} onChange={handleInputChange} rows={2} />
                      </div>
                    </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Step 2: Licensing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="drivingLicenseNumber" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> Driving License Number</Label>
                      <Input id="drivingLicenseNumber" value={driverData.drivingLicenseNumber} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="licenseType" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> License Class</Label>
                      <Select value={driverData.licenseType} onValueChange={handleSelectChange('licenseType')}>
                          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent><SelectItem value="Light">Light Vehicle</SelectItem><SelectItem value="Heavy">Heavy Duty</SelectItem><SelectItem value="Professional">Professional Carrier</SelectItem></SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="licenseIssueDate" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarIcon className="h-3 w-3" /> Issue Date</Label>
                      <Input id="licenseIssueDate" value={driverData.licenseIssueDate} onChange={handleInputChange} type="date" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="licenseExpiryDate" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarIcon className="h-3 w-3" /> Expiry Date</Label>
                      <Input id="licenseExpiryDate" value={driverData.licenseExpiryDate} onChange={handleInputChange} type="date" />
                  </div>
                  <div className="space-y-2 col-span-2">
                      <Label htmlFor="issuingAuthority" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Issuing Authority (e.g. BRTA)</Label>
                      <Input id="issuingAuthority" value={driverData.issuingAuthority} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Step 3: Employment Verification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="joiningDate" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarIcon className="h-3 w-3" /> Date of Joining</Label>
                      <Input id="joiningDate" value={driverData.joiningDate} onChange={handleInputChange} type="date" />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="employmentType" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Briefcase className="h-3 w-3" /> Employment Category</Label>
                      <Select value={driverData.employmentType} onValueChange={handleSelectChange('employmentType')}>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent><SelectItem value="Permanent">Permanent</SelectItem><SelectItem value="Contract">Contractual</SelectItem><SelectItem value="Temporary">Casual/Daily</SelectItem></SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="department" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Assigned Department</Label>
                      <Input id="department" value={driverData.department} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="dutyShift" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Clock className="h-3 w-3" /> Assigned Shift</Label>
                      <Input id="dutyShift" value={driverData.dutyShift} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="supervisor" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Users className="h-3 w-3" /> Supervisor / Reported To</Label>
                      <Input id="supervisor" value={driverData.supervisor} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Milestone className="h-3 w-3" /> Designated Vehicle</Label>
                        <Select value={driverData.assignedVehicleId || 'none'} onValueChange={handleSelectChange('assignedVehicleId')}>
                            <SelectTrigger><SelectValue placeholder="Assign a vehicle..." /></SelectTrigger>
                            <SelectContent><SelectItem value="none">Unassigned</SelectItem>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
              </div>
            )}

            {step === 4 && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Step 4: Digital Verification Vault</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {(['drivingLicense', 'nid', 'other'] as const).map(docType => {
                            const preview = docPreviews[docType];
                            const label = { drivingLicense: 'Driving License Scan', nid: 'NID Scan', other: 'Supporting Doc'}[docType];
                            return (
                                <div className="space-y-2 p-3 border rounded-lg bg-muted/10 group" key={docType}>
                                    <Label className="font-semibold text-xs flex items-center gap-2 uppercase tracking-tight text-muted-foreground"><ShieldCheck className="h-3 w-3" /> {label}</Label>
                                    {preview ? (
                                        <div className="flex items-center justify-between text-sm p-2 bg-primary/5 rounded-md border border-primary/20">
                                            <span className="truncate font-medium flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Copy Uploaded</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeDocument(docType)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    ) : (
                                        <Label htmlFor={`d-file-${docType}`} className="flex items-center justify-center w-full h-12 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Upload className="h-4 w-4 group-hover:text-primary" />
                                                <span className="text-xs">Click to upload scan</span>
                                            </div>
                                            <Input id={`d-file-${docType}`} type="file" className="hidden" onChange={handleFileChange(docType)} />
                                        </Label>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                 </div>
            )}
        </div>

        <DialogFooter className="flex justify-between w-full pt-4 border-t">
            <Button variant="outline" onClick={prevStep} disabled={step === 1}>Previous</Button>
            {step < 4 ? (
                <Button onClick={nextStep}>Continue</Button>
            ) : (
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">{isEditing ? 'Sync Changes' : 'Register Driver'}</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
