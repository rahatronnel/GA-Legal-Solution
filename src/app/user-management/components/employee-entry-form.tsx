
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
import { Upload, X, User, CalendarIcon, Copy, FileSignature } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn, imageToDataUrl } from '@/lib/utils';
import { format } from 'date-fns';
import type { Designation } from './designation-table';
import type { Section } from './section-table';
import { initiateEmailSignUp, useAuth, updatePasswordNonBlocking } from '@/firebase';


export type Employee = {
  id: string;
  userIdCode: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  role: 'Admin' | 'Operator' | 'Driver' | 'Viewer' | '';
  status: 'Active' | 'Inactive' | '';
  username: string;
  departmentId: string;
  designationId: string;
  joiningDate: string;
  address: string;
  remarks: string;
  profilePicture: string; // Will store as data URL
  signature: string; // Data URL of the employee's signature
  documents: {
    nid: string; // Will store as data URL
    other: string; // Will store as data URL
  }
  defaultPassword?: string;
};

const initialEmployeeData: Omit<Employee, 'id' | 'defaultPassword'> = {
  userIdCode: '',
  fullName: '',
  mobileNumber: '',
  email: '',
  role: '',
  status: '',
  username: '',
  departmentId: '',
  designationId: '',
  joiningDate: '',
  address: '',
  remarks: '',
  profilePicture: '',
  signature: '',
  documents: { nid: '', other: '' },
};

const MandatoryIndicator = () => <span className="text-red-500 ml-1">*</span>;

interface EmployeeEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (employee: Omit<Employee, 'id' | 'defaultPassword'>, id?: string) => void;
  employee: Partial<Employee> | null;
  sections: Section[];
  designations: Designation[];
}

export function EmployeeEntryForm({ isOpen, setIsOpen, onSave, employee, sections, designations }: EmployeeEntryFormProps) {
  const auth = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [employeeData, setEmployeeData] = useState<Omit<Employee, 'id'>>(initialEmployeeData);
  const [joiningDate, setJoiningDate] = useState<Date | undefined>(undefined);
  
  const [docFiles, setDocFiles] = useState({ nid: null as File | null, other: null as File | null });
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [docPreviews, setDocPreviews] = useState({ nid: '', other: ''});


  const progress = Math.round((step / 3) * 100);
  const isEditing = employee && employee.id;

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEditing && employee) {
        const { defaultPassword, ...rest } = employee;
        const initialData = { ...initialEmployeeData, ...rest };
        setEmployeeData(initialData);
        setJoiningDate(initialData.joiningDate ? new Date(initialData.joiningDate) : undefined);
        setProfilePicPreview(initialData.profilePicture || null);
        setSignaturePreview(initialData.signature || null);
        setDocPreviews(initialData.documents || { nid: '', other: '' });
      } else {
        setEmployeeData({...initialEmployeeData, defaultPassword: ''});
        setJoiningDate(undefined);
        setProfilePicPreview(null);
        setSignaturePreview(null);
        setDocPreviews({ nid: '', other: '' });
      }
      setDocFiles({ nid: null, other: null });
      setProfilePicFile(null);
      setSignatureFile(null);
    }
  }, [isOpen, employee, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const newEmployeeData = { ...employeeData, [id]: value };
    // Sync username with email
    if (id === 'email') {
        newEmployeeData.username = value;
    }
    setEmployeeData(newEmployeeData);
  };

  const handleSelectChange = (id: keyof Employee) => (value: string) => {
    setEmployeeData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleDateChange = (setter: (date: Date | undefined) => void, field: keyof Employee) => (date: Date | undefined) => {
      setter(date);
      setEmployeeData(prev => ({...prev, [field]: date ? format(date, 'yyyy-MM-dd') : ''}))
  }

  const handleFileChange = (docType: 'nid' | 'other') => async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  
  const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
          setSignatureFile(file);
          const dataUrl = await imageToDataUrl(file);
          setSignaturePreview(dataUrl);
        } catch (error) {
          console.error("Error processing signature image:", error);
          toast({ variant: 'destructive', title: 'Image Error', description: 'Could not process the uploaded signature.' });
        }
    }
  };

  const removeDocument = (docType: 'nid' | 'other') => {
      setDocFiles(prev => ({...prev, [docType]: null}));
      setDocPreviews(prev => ({...prev, [docType]: ''}));
      setEmployeeData(prev => ({...prev, documents: {...prev.documents, [docType]: ''}}));
  };
  
  const removeProfilePic = () => {
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setEmployeeData(prev => ({...prev, profilePicture: ''}));
  }
  
  const removeSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
    setEmployeeData(prev => ({...prev, signature: ''}));
  }

  const validateStep = (currentStep: number) => {
    switch(currentStep) {
      case 1:
        return employeeData.userIdCode && employeeData.fullName && employeeData.mobileNumber && employeeData.username && employeeData.role && employeeData.status && employeeData.email;
      case 2:
        if (isEditing) {
          // Password is optional when editing
          return !employeeData.defaultPassword || (employeeData.defaultPassword.length >= 6);
        }
        // Password is required for new users
        return employeeData.defaultPassword && employeeData.email && employeeData.defaultPassword.length >= 6;
      default:
        return true;
    }
  }
  
  const nextStep = () => {
    if (!validateStep(step)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields. Passwords must be at least 6 characters.' });
        return;
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);
  
  const createLoginAndSave = async () => {
    if (!validateStep(1) || !validateStep(2)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields before saving. Passwords must be at least 6 characters.' });
        return;
    }

    const { defaultPassword, ...dataToSave } = {
        ...employeeData,
        profilePicture: profilePicPreview || employeeData.profilePicture,
        signature: signaturePreview || employeeData.signature,
        documents: {
            nid: docPreviews.nid || employeeData.documents.nid,
            other: docPreviews.other || employeeData.documents.other
        },
    };

    if (defaultPassword) {
      try {
        await initiateEmailSignUp(auth, dataToSave.email, defaultPassword);
        onSave(dataToSave, employee?.id);
        setIsOpen(false);
      } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Login Creation Failed',
            description: error.message || 'Could not create the user in Firebase Authentication.'
        });
      }
    }
  }


  const handleSave = async () => {
    if (!validateStep(1) || !validateStep(2)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please go back and fill all required fields.' });
        return;
    }
    
    const { defaultPassword, ...dataToSave } = {
        ...employeeData,
        profilePicture: profilePicPreview || employeeData.profilePicture,
        signature: signaturePreview || employeeData.signature,
        documents: {
            nid: docPreviews.nid || employeeData.documents.nid,
            other: docPreviews.other || employeeData.documents.other
        },
    };

    if (isEditing && defaultPassword) {
        // This is a complex operation requiring re-authentication and is better handled
        // via a dedicated "change password" flow for the user or an admin reset email.
        // For simplicity, we will show a toast that this feature is not supported here.
        // A real-world app would have an admin SDK on a server to do this.
        toast({ title: "Password Not Changed", description: "Password updates for existing users should be done via a password reset or by the user themselves."});
    }

    onSave(dataToSave, employee?.id);
    setIsOpen(false);
  };
  
  const getDocumentName = (docType: 'nid' | 'other') => {
      if (docFiles[docType]) return docFiles[docType]!.name;
      if (docPreviews[docType] || (employeeData.documents && employeeData.documents[docType])) return `${docType.toUpperCase()} Document`;
      return null;
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Password copied to clipboard.' });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this employee.' : 'Follow the steps to add a new employee.'}
          </DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-4 flex-grow overflow-y-auto pr-6">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 1: Employee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="userIdCode">User ID / Code<MandatoryIndicator/></Label>
                            <Input id="userIdCode" value={employeeData.userIdCode} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name<MandatoryIndicator/></Label>
                            <Input id="fullName" value={employeeData.fullName} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobileNumber">Mobile Number<MandatoryIndicator/></Label>
                            <Input id="mobileNumber" value={employeeData.mobileNumber} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email">Email Address<MandatoryIndicator/></Label>
                            <Input id="email" type="email" value={employeeData.email} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="md:col-span-1 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">User Role<MandatoryIndicator/></Label>
                            <Select value={employeeData.role} onValueChange={handleSelectChange('role')}>
                                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="Operator">Operator</SelectItem>
                                    <SelectItem value="Driver">Driver</SelectItem>
                                    <SelectItem value="Viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="status">Status<MandatoryIndicator/></Label>
                            <Select value={employeeData.status} onValueChange={handleSelectChange('status')}>
                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="username">Username / Login ID<MandatoryIndicator/></Label>
                            <Input id="username" value={employeeData.username} onChange={handleInputChange} disabled/>
                            <p className="text-xs text-muted-foreground">Username is synced with email address.</p>
                        </div>
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
                    </div>
                     <div className="md:col-span-1 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="departmentId">Department / Section</Label>
                            <Select value={employeeData.departmentId} onValueChange={handleSelectChange('departmentId')}>
                                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="designationId">Designation</Label>
                            <Select value={employeeData.designationId} onValueChange={handleSelectChange('designationId')}>
                                <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                                <SelectContent>
                                    {designations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                     </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" value={employeeData.address} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea id="remarks" value={employeeData.remarks} onChange={handleInputChange} />
                    </div>
                </div>
              </div>
            )}
            
            {step === 2 && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg">{isEditing ? 'Step 2: Change Password (Optional)' : 'Step 2: Create Login Credentials'}</h3>
                    <p className="text-sm text-muted-foreground">
                        {isEditing 
                            ? "To change this employee's password, enter a new one below. This is not recommended, a password reset email is safer."
                            : "Set an initial password for the new employee. They can change it later."
                        }
                    </p>
                     <div className="space-y-2">
                        <Label>Login Email</Label>
                        <Input value={employeeData.email} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="defaultPassword">{isEditing ? 'New Password' : 'Initial Password'} {!isEditing && <MandatoryIndicator/>}</Label>
                        <Input id="defaultPassword" type="password" value={employeeData.defaultPassword} onChange={handleInputChange} placeholder={isEditing ? 'Leave blank to keep current' : ''} />
                         <p className="text-xs text-muted-foreground">Password must be at least 6 characters long.</p>
                    </div>
                 </div>
            )}

            {step === 3 && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg">Step 3: Upload Photo & Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                <Label htmlFor="profile-pic-upload" className="text-sm text-primary cursor-pointer">Upload Photo</Label>
                            )}
                        </div>
                        <div className="col-span-2 space-y-4">
                            {(['nid', 'other'] as const).map(docType => {
                                const currentDocName = getDocumentName(docType);
                                const docLabel = { nid: 'NID', other: 'Other Document'}[docType];
                                
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
                         <div className="md:col-span-3 space-y-2">
                                <Label>Signature</Label>
                                {signaturePreview ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center p-2 border">
                                            <Image src={signaturePreview} alt="Signature Preview" width={200} height={100} className="object-contain" />
                                        </div>
                                         <Button variant="link" size="sm" className="text-destructive" onClick={removeSignature}>Remove signature</Button>
                                    </div>
                                ) : (
                                    <Label htmlFor="signature-upload" className="flex items-center justify-center w-full h-24 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary">
                                        <span className="flex items-center space-x-2">
                                            <FileSignature className="h-5 w-5 text-muted-foreground" />
                                            <span className="font-medium text-muted-foreground">Click to upload signature</span>
                                        </span>
                                        <Input id="signature-upload" type="file" accept="image/*" className="hidden" onChange={handleSignatureChange} />
                                    </Label>
                                )}
                        </div>
                    </div>
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
              {step < 3 ? (
                  <Button onClick={nextStep}>Next</Button>
              ) : (
                  <Button onClick={isEditing ? handleSave : createLoginAndSave}>{isEditing ? 'Update Employee' : 'Create Login & Save'}</Button>
              )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
