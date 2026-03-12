
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
    Upload, X, User, Calendar as CalendarIcon, Hash, Phone, Mail, UserCheck, 
    CheckCircle2, Clock, Building, Briefcase, MapPin, FileText, KeyRound, 
    FileSignature, ShieldCheck, ImageIcon, Cpu, Tag, UserSquare2
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn, imageToDataUrl } from '@/lib/utils';
import { format } from 'date-fns';
import type { Designation } from './designation-table';
import type { Section } from './section-table';
import { initiateEmailSignUp, useAuth, recreateUserWithPassword } from '@/firebase';
import { Separator } from '@/components/ui/separator';


export type Employee = {
  id: string;
  userIdCode: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  role: 'Admin' | 'Operator' | 'Driver' | 'Viewer' | '';
  status: 'Active' | 'Inactive' | '';
  employeeType: 'Executive' | 'S. Staff' | '';
  gender: 'Male' | 'Female' | 'Other' | '';
  location: 'Dhaka Office' | 'Factory' | 'Gazipur Branch Office' | '';
  username: string;
  departmentId: string;
  designationId: string;
  sectionId?: string;
  joiningDate: string;
  address: string;
  remarks: string;
  profilePicture: string; 
  signature: string; 
  documents: {
    nid: string; 
    other: string; 
  }
  defaultPassword?: string;
  processCode: string;
};

const initialEmployeeData: Omit<Employee, 'id'> = {
  userIdCode: '',
  fullName: '',
  mobileNumber: '',
  email: '',
  role: '',
  status: '',
  employeeType: '',
  gender: '',
  location: '',
  username: '',
  departmentId: '',
  designationId: '',
  joiningDate: '',
  address: '',
  remarks: '',
  profilePicture: '',
  signature: '',
  documents: { nid: '', other: '' },
  defaultPassword: '',
  processCode: '',
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
  
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [docPreviews, setDocPreviews] = useState({ nid: '', other: ''});


  const isEditing = employee && employee.id;
  const totalSteps = isEditing ? 2 : 3;
  const progress = Math.round((step / totalSteps) * 100);

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
        setEmployeeData(initialEmployeeData);
        setJoiningDate(undefined);
        setProfilePicPreview(null);
        setSignaturePreview(null);
        setDocPreviews({ nid: '', other: '' });
      }
    }
  }, [isOpen, employee, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEmployeeData(prev => {
        const newData = { ...prev, [id]: value };
        if (id === 'email') {
            newData.username = value;
        }
        return newData;
    });
  };

  const handleSelectChange = (id: keyof Employee) => (value: string) => {
    setEmployeeData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleDateChange = (date: Date | undefined) => {
      setJoiningDate(date);
      setEmployeeData(prev => ({...prev, joiningDate: date ? format(date, 'yyyy-MM-dd') : ''}))
  }

  const handleFileChange = (docType: 'nid' | 'other') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const dataUrl = await imageToDataUrl(file);
        setDocPreviews(prev => ({...prev, [docType]: dataUrl}));
      } catch (error) {
        toast({ variant: 'destructive', title: 'File Error' });
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

  const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
          const dataUrl = await imageToDataUrl(file);
          setSignaturePreview(dataUrl);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Signature Failed' });
        }
    }
  };

  const removeDocument = (docType: 'nid' | 'other') => {
      setDocPreviews(prev => ({...prev, [docType]: ''}));
  };
  
  const removeProfilePic = () => {
    setProfilePicPreview(null);
  }
  
  const removeSignature = () => {
    setSignaturePreview(null);
  }

  const validateStep = (currentStep: number) => {
    switch(currentStep) {
      case 1:
        return employeeData.userIdCode && employeeData.fullName && employeeData.mobileNumber && employeeData.role && employeeData.status && employeeData.email && employeeData.employeeType && employeeData.location;
      case 2:
        if (isEditing) return true;
        return employeeData.defaultPassword && employeeData.email && employeeData.defaultPassword.length >= 6;
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
    const finalData = {
        ...employeeData,
        profilePicture: profilePicPreview || employeeData.profilePicture,
        signature: signaturePreview || employeeData.signature,
        documents: {
            nid: docPreviews.nid || employeeData.documents.nid,
            other: docPreviews.other || employeeData.documents.other
        },
    };

    const { defaultPassword, ...dataToSave } = finalData;

    try {
        if (isEditing && employee.id) {
            onSave(dataToSave as any, employee.id);
        } else if (defaultPassword) {
            try {
                await initiateEmailSignUp(auth, dataToSave.email!, defaultPassword);
                onSave(dataToSave as any);
            } catch (authError: any) {
                if (authError.code === 'auth/email-already-in-use') {
                    // Digital Identity Overwrite Protocol:
                    // If Auth exists, reset the password and restore the registry record.
                    try {
                        await recreateUserWithPassword(auth, dataToSave.email!, defaultPassword);
                        onSave(dataToSave as any);
                        toast({ title: 'Identity Overwritten', description: 'Authentication user reset with new password; registry restored.' });
                    } catch (e) {
                        console.error('Identity overwrite failed:', e);
                        throw e;
                    }
                } else {
                    throw authError;
                }
            }
        }
        setIsOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Operation Failed', description: error.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee Profile' : 'Register New Employee'}</DialogTitle>
          <DialogDescription>Input personnel information and access rights.</DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-4 flex-grow overflow-y-auto pr-6">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Step 1: Core Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 flex flex-col items-center gap-4">
                        <Label htmlFor="profile-pic-upload" className="cursor-pointer">
                            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/20 hover:border-primary transition-colors">
                                {profilePicPreview ? (
                                    <Image src={profilePicPreview} alt="Profile" width={128} height={128} className="object-cover w-full h-full" />
                                ) : (
                                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                )}
                            </div>
                        </Label>
                        <Input id="profile-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                        {profilePicPreview && <Button variant="link" size="sm" className="text-destructive" onClick={removeProfilePic}>Remove photo</Button>}
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><Hash className="h-3 w-3" /> User ID / Code<MandatoryIndicator/></Label><Input id="userIdCode" value={employeeData.userIdCode} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><User className="h-3 w-3" /> Full Name<MandatoryIndicator/></Label><Input id="fullName" value={employeeData.fullName} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><Phone className="h-3 w-3" /> Mobile Number<MandatoryIndicator/></Label><Input id="mobileNumber" value={employeeData.mobileNumber} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><Mail className="h-3 w-3" /> Corporate Email<MandatoryIndicator/></Label><Input id="email" type="email" value={employeeData.email} onChange={handleInputChange} /></div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><UserCheck className="h-3 w-3" /> Access Role<MandatoryIndicator/></Label>
                            <Select value={employeeData.role} onValueChange={handleSelectChange('role')}>
                                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                <SelectContent><SelectItem value="Admin">Administrator</SelectItem><SelectItem value="Operator">Operator</SelectItem><SelectItem value="Driver">Driver</SelectItem><SelectItem value="Viewer">Viewer</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> Status<MandatoryIndicator/></Label>
                            <Select value={employeeData.status} onValueChange={handleSelectChange('status')}>
                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><Tag className="h-3 w-3" /> Employee Type<MandatoryIndicator/></Label>
                            <Select value={employeeData.employeeType} onValueChange={handleSelectChange('employeeType')}>
                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Executive">Executive</SelectItem>
                                    <SelectItem value="S. Staff">S. Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><MapPin className="h-3 w-3" /> Work Location<MandatoryIndicator/></Label>
                            <Select value={employeeData.location} onValueChange={handleSelectChange('location')}>
                                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Dhaka Office">Dhaka Office</SelectItem>
                                    <SelectItem value="Factory">Factory</SelectItem>
                                    <SelectItem value="Gazipur Branch Office">Gazipur Branch Office</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold"><UserSquare2 className="h-3 w-3" /> Gender</Label>
                            <Select value={employeeData.gender} onValueChange={handleSelectChange('gender')}>
                                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Section / Unit</Label>
                        <Select value={employeeData.departmentId} onValueChange={handleSelectChange('departmentId')}>
                            <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                            <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Briefcase className="h-3 w-3" /> Designation</Label>
                        <Select value={employeeData.designationId} onValueChange={handleSelectChange('designationId')}>
                            <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                            <SelectContent>{designations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-bold text-blue-600"><Cpu className="h-3 w-3" /> Process Code</Label>
                        <Input id="processCode" value={employeeData.processCode} onChange={handleInputChange} placeholder="e.g. PC-001, PC-002" />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarIcon className="h-3 w-3" /> Joining Date</Label>
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !joiningDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{joiningDate ? format(joiningDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={joiningDate} onSelect={handleDateChange} initialFocus/></PopoverContent>
                        </Popover>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><MapPin className="h-3 w-3" /> Address</Label><Textarea id="address" value={employeeData.address} onChange={handleInputChange} rows={3} /></div>
                    <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><FileText className="h-3 w-3" /> Remarks</Label><Textarea id="remarks" value={employeeData.remarks} onChange={handleInputChange} rows={3} /></div>
                </div>
              </div>
            )}
            
            {step === 2 && !isEditing && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Step 2: System Credentials</h3>
                    <div className="p-4 border rounded-lg bg-primary/5 space-y-4">
                        <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Mail className="h-3 w-3" /> Login Identity</Label><Input value={employeeData.email} disabled className="bg-background" /></div>
                        <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><KeyRound className="h-3 w-3" /> Default Password<MandatoryIndicator/></Label><Input id='defaultPassword' type="password" value={employeeData.defaultPassword} onChange={handleInputChange} className="bg-background" /></div>
                    </div>
                 </div>
            )}

            {step === (isEditing ? 2 : 3) && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Step {isEditing ? 2 : 3}: Documents & Signature</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><FileSignature className="h-3 w-3" /> Signature</Label>
                            {signaturePreview ? (
                                <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center p-2 border relative group">
                                    <Image src={signaturePreview} alt="Signature" width={200} height={100} className="object-contain" />
                                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={removeSignature}><X className="h-3 w-3" /></Button>
                                </div>
                            ) : (
                                <Label htmlFor="signature-upload" className="flex items-center justify-center w-full h-32 px-4 bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary">
                                    <FileSignature className="h-8 w-8 text-muted-foreground" /><Input id="signature-upload" type="file" accept="image/*" className="hidden" onChange={handleSignatureChange} />
                                </Label>
                            )}
                        </div>
                        <div className="space-y-4">
                           {(['nid', 'other'] as const).map(docType => (
                                <div className="space-y-2" key={docType}>
                                    <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><ShieldCheck className="h-3 w-3" /> {docType === 'nid' ? 'National ID' : 'Other'}</Label>
                                    {docPreviews[docType] ? (
                                        <div className="flex items-center justify-between text-sm p-2 bg-primary/5 rounded border border-primary/20"><span className="truncate">Uploaded</span><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeDocument(docType)}><X className="h-4 w-4" /></Button></div>
                                    ) : (
                                        <Label htmlFor={`file-${docType}`} className="flex items-center justify-center w-full h-12 bg-background border-2 border-dashed rounded-md cursor-pointer hover:border-primary"><Upload className="h-4 w-4 mr-2" /><span className="text-xs">Upload</span><Input id={`file-${docType}`} type="file" className="hidden" onChange={handleFileChange(docType)} /></Label>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
            )}
        </div>

        <DialogFooter className="flex justify-between w-full pt-4 border-t">
            <Button variant="outline" onClick={prevStep} disabled={step === 1}>Previous</Button>
            {step < totalSteps ? <Button onClick={nextStep}>Continue</Button> : <Button onClick={handleSave}>{isEditing ? 'Sync Changes' : 'Create Profile'}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
