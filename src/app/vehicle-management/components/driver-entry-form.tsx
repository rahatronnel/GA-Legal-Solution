
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
import { Upload, X, User } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { format, parse, isValid } from 'date-fns';
import type { Vehicle } from './vehicle-table';
import { imageToDataUrl } from '@/lib/utils';

export type Driver = {
  id: string;
  driverIdCode: string;
  name: string;
  fatherOrGuardianName: string;
  dateOfBirth: string; // Stored as DD-MM-YYYY
  gender: 'Male' | 'Female' | 'Other' | '';
  mobileNumber: string;
  alternateMobileNumber: string;
  profilePicture: string; // Will store as data URL
  
  // New fields
  nationalIdOrPassport: string;
  drivingLicenseNumber: string;
  licenseType: 'Light' | 'Heavy' | 'Professional' | '';
  licenseIssueDate: string; // Stored as yyyy-MM-dd
  licenseExpiryDate: string; // Stored as yyyy-MM-dd
  issuingAuthority: string;
  presentAddress: string;
  permanentAddress: string;
  joiningDate: string; // Stored as yyyy-MM-dd
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
  
  // Store file objects temporarily
  const [docFiles, setDocFiles] = useState({ drivingLicense: null as File | null, nid: null as File | null, other: null as File | null });
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

  // Store previews/data URLs
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [docPreviews, setDocPreviews] = useState({ drivingLicense: '', nid: '', other: ''});


  const progress = Math.round((step / 4) * 100);
  const isEditing = driver && driver.id;

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    try {
        // Handle both yyyy-MM-dd and dd-MM-yyyy initial formats
        const parsedDate = isValid(parse(dateString, 'yyyy-MM-dd', new Date())) 
            ? parse(dateString, 'yyyy-MM-dd', new Date()) 
            : parse(dateString, 'dd-MM-yyyy', new Date());

        if (isValid(parsedDate)) {
            return format(parsedDate, 'dd-MM-yyyy');
        }
    } catch (e) {}
    return dateString; // Return original if parsing fails
  }

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEditing && driver) {
        const initialData = { ...initialDriverData, ...driver };
        
        setDriverData({
            ...initialData,
            dateOfBirth: formatDateForDisplay(initialData.dateOfBirth),
            licenseIssueDate: formatDateForDisplay(initialData.licenseIssueDate),
            licenseExpiryDate: formatDateForDisplay(initialData.licenseExpiryDate),
            joiningDate: formatDateForDisplay(initialData.joiningDate),
        });
        
        setProfilePicPreview(initialData.profilePicture || null);
        setDocPreviews(initialData.documents || { drivingLicense: '', nid: '', other: '' });
      } else {
        setDriverData(initialDriverData);
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
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      const input = value.replace(/\D/g, ''); // Remove non-digit characters
      let formattedInput = input;
  
      if (input.length > 4) {
        formattedInput = `${input.slice(0, 2)}-${input.slice(2, 4)}-${input.slice(4, 8)}`;
      } else if (input.length > 2) {
        formattedInput = `${input.slice(0, 2)}-${input.slice(2, 4)}`;
      }
      setDriverData(prev => ({ ...prev, [id]: formattedInput }));
  };

  const handleSelectChange = (id: keyof Driver) => (value: string) => {
    // Handle "none" value for assignedVehicleId
    if (id === 'assignedVehicleId' && value === 'none') {
        setDriverData(prev => ({...prev, [id]: ''}));
        return;
    }
    setDriverData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (docType: 'drivingLicense' | 'nid' | 'other') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setDocFiles(prev => ({ ...prev, [docType]: file }));
        const dataUrl = await imageToDataUrl(file);
        setDocPreviews(prev => ({...prev, [docType]: dataUrl}));
      } catch (error) {
         console.error("Error processing document:", error);
        toast({ variant: 'destructive', title: 'File Error', description: 'Could not process the uploaded file.' });
      }
    }
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
          setProfilePicFile(file);
          const dataUrl = await imageToDataUrl(file);
          setProfilePicPreview(dataUrl);
        } catch (error) {
          console.error("Error processing image:", error);
          toast({ variant: 'destructive', title: 'Image Error', description: 'Could not process the uploaded image.' });
        }
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
        if (!driverData.driverIdCode || !driverData.name || !driverData.mobileNumber) {
            toast({ variant: 'destructive', title: 'Error', description: 'Driver ID, Name, and Mobile Number are required.' });
            return false;
        }
        return true;
      // Add more validations for other steps if needed
      default:
        return true;
    }
  }
  
  const nextStep = () => {
    if (!validateStep(step)) {
        return;
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const parseAndFormatDateForSave = (dateString: string, fieldName: string) => {
    if (!dateString) return '';
    try {
        const parsedDate = parse(dateString, 'dd-MM-yyyy', new Date());
        if (!isValid(parsedDate)) {
            throw new Error(`Invalid date format for ${fieldName}. Please use DD-MM-YYYY.`);
        }
        return format(parsedDate, 'yyyy-MM-dd');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Invalid Date', description: error.message });
        throw error;
    }
  }

  const handleSave = async () => {
    if (!validateStep(1)) {
        return;
    }

    try {
        const dobToSave = parseAndFormatDateForSave(driverData.dateOfBirth, 'Date of Birth');
        const licenseIssueDateToSave = parseAndFormatDateForSave(driverData.licenseIssueDate, 'License Issue Date');
        const licenseExpiryDateToSave = parseAndFormatDateForSave(driverData.licenseExpiryDate, 'License Expiry Date');
        const joiningDateToSave = parseAndFormatDateForSave(driverData.joiningDate, 'Joining Date');

        const dataToSave: Omit<Driver, 'id'> = {
            ...driverData,
            dateOfBirth: dobToSave,
            licenseIssueDate: licenseIssueDateToSave,
            licenseExpiryDate: licenseExpiryDateToSave,
            joiningDate: joiningDateToSave,
            profilePicture: profilePicPreview || driverData.profilePicture,
            documents: {
                drivingLicense: docPreviews.drivingLicense || driverData.documents.drivingLicense,
                nid: docPreviews.nid || driverData.documents.nid,
                other: docPreviews.other || driverData.documents.other
            },
        };

        onSave(dataToSave, driver?.id);
        setIsOpen(false);
    } catch (error) {
        // Toast is already shown in the parsing function
        return;
    }
  };
  
  const getDocumentName = (docType: 'drivingLicense' | 'nid' | 'other') => {
      if (docFiles[docType]) return docFiles[docType]!.name;
      if (docPreviews[docType] || (driverData.documents && driverData.documents[docType])) return `${docType.replace(/([A-Z])/g, ' $1')}.file`;
      return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this driver.' : 'Follow the steps to add a new driver.'}
          </DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-4 flex-grow overflow-y-auto pr-6">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 1: Personal & Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 flex flex-col items-center gap-4">
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
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="driverIdCode">Driver ID / Code<MandatoryIndicator/></Label>
                            <Input id="driverIdCode" value={driverData.driverIdCode} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="name">Driver Name<MandatoryIndicator/></Label>
                             <Input id="name" value={driverData.name} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fatherOrGuardianName">Father’s / Guardian’s Name</Label>
                            <Input id="fatherOrGuardianName" value={driverData.fatherOrGuardianName} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Input
                                id="dateOfBirth"
                                value={driverData.dateOfBirth}
                                onChange={handleDateChange}
                                placeholder="DD-MM-YYYY"
                                maxLength={10}
                            />
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
                            <Label htmlFor="mobileNumber">Mobile Number<MandatoryIndicator/></Label>
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
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Input
                          id="licenseIssueDate"
                          value={driverData.licenseIssueDate}
                          onChange={handleDateChange}
                          placeholder="DD-MM-YYYY"
                          maxLength={10}
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="licenseExpiryDate">License Expiry Date</Label>
                      <Input
                          id="licenseExpiryDate"
                          value={driverData.licenseExpiryDate}
                          onChange={handleDateChange}
                          placeholder="DD-MM-YYYY"
                          maxLength={10}
                      />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="joiningDate">Joining Date</Label>
                      <Input
                          id="joiningDate"
                          value={driverData.joiningDate}
                          onChange={handleDateChange}
                          placeholder="DD-MM-YYYY"
                          maxLength={10}
                      />
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
                        <Select value={driverData.assignedVehicleId || 'none'} onValueChange={handleSelectChange('assignedVehicleId')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
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

        <DialogFooter className="flex justify-between w-full pt-4 border-t">
            <div>
              {step > 1 && (
                  <Button variant="outline" onClick={prevStep}>Previous</Button>
              )}
            </div>
            
            <div>
              {step < 4 ? (
                  <Button onClick={nextStep}>Next</Button>
              ) : (
                  <Button onClick={handleSave}>{isEditing ? 'Update Driver' : 'Save Driver'}</Button>
              )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
