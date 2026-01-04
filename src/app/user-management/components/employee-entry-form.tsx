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
import type { Designation } from './designation-table';
import type { Section } from './section-table';


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
  documents: {
    nid: string; // Will store as data URL
    other: string; // Will store as data URL
  }
};

const initialEmployeeData: Omit<Employee, 'id'> = {
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
  documents: { nid: '', other: '' }
};

interface EmployeeEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (employee: Omit<Employee, 'id'>, id?: string) => void;
  employee: Partial<Employee> | null;
  sections: Section[];
  designations: Designation[];
}

export function EmployeeEntryForm({ isOpen, setIsOpen, onSave, employee, sections, designations }: EmployeeEntryFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [employeeData, setEmployeeData] = useState(initialEmployeeData);
  const [joiningDate, setJoiningDate] = useState<Date | undefined>(undefined);
  
  const [docFiles, setDocFiles] = useState({ nid: null as File | null, other: null as File | null });
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [docPreviews, setDocPreviews] = useState({ nid: '', other: ''});


  const progress = Math.round((step / 2) * 100);
  const isEditing = employee && employee.id;

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEditing && employee) {
        const initialData = { ...initialEmployeeData, ...employee };
        setEmployeeData(initialData);
        setJoiningDate(initialData.joiningDate ? new Date(initialData.joiningDate) : undefined);
        setProfilePicPreview(initialData.profilePicture || null);
        setDocPreviews(initialData.documents || { nid: '', other: '' });
      } else {
        setEmployeeData(initialEmployeeData);
        setJoiningDate(undefined);
        setProfilePicPreview(null);
        setDocPreviews({ nid: '', other: '' });
      }
      setDocFiles({ nid: null, other: null });
      setProfilePicFile(null);
    }
  }, [isOpen, employee, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEmployeeData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Employee) => (value: string) => {
    setEmployeeData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleDateChange = (setter: (date: Date | undefined) => void, field: keyof Employee) => (date: Date | undefined) => {
      setter(date);
      setEmployeeData(prev => ({...prev, [field]: date ? format(date, 'yyyy-MM-dd') : ''}))
  }
  
  const fileToDataUrl = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  }

  const handleFileChange = (docType: 'nid' | 'other') => async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const validateStep = (currentStep: number) => {
    switch(currentStep) {
      case 1:
        return employeeData.userIdCode && employeeData.fullName && employeeData.mobileNumber && employeeData.username && employeeData.role && employeeData.status;
      default:
        return true;
    }
  }
  
  const nextStep = () => {
    if (!validateStep(step)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields.' });
        return;
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSave = async () => {
    if (!validateStep(1)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please go back and fill all required fields.' });
        return;
    }

    const dataToSave: Omit<Employee, 'id'> = {
        ...employeeData,
        profilePicture: profilePicPreview || employeeData.profilePicture,
        documents: {
            nid: docPreviews.nid || employeeData.documents.nid,
            other: docPreviews.other || employeeData.documents.other
        },
    };

    onSave(dataToSave, employee?.id);
    setIsOpen(false);
  };
  
  const getDocumentName = (docType: 'nid' | 'other') => {
      if (docFiles[docType]) return docFiles[docType]!.name;
      if (docPreviews[docType] || (employeeData.documents && employeeData.documents[docType])) return `${docType.toUpperCase()} Document`;
      return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this employee.' : 'Follow the steps to add a new employee.'}
          </DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 1: Employee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="userIdCode">User ID / Code</Label>
                            <Input id="userIdCode" value={employeeData.userIdCode} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" value={employeeData.fullName} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobileNumber">Mobile Number</Label>
                            <Input id="mobileNumber" value={employeeData.mobileNumber} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={employeeData.email} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="md:col-span-1 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">User Role</Label>
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
                            <Label htmlFor="status">Status</Label>
                            <Select value={employeeData.status} onValueChange={handleSelectChange('status')}>
                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username / Login ID</Label>
                            <Input id="username" value={employeeData.username} onChange={handleInputChange} />
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
                    <h3 className="font-semibold text-lg">Step 2: Upload Photo & Documents</h3>
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
                    </div>
                 </div>
            )}
        </div>

        <DialogFooter className="flex justify-between w-full">
            {step > 1 ? (
                <Button variant="outline" onClick={prevStep}>Previous</Button>
            ) : <div></div>}
            
            {step < 2 ? (
                 <Button onClick={nextStep}>Next</Button>
            ) : (
                 <Button onClick={handleSave}>{isEditing ? 'Update Employee' : 'Save Employee'}</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
