
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
    Upload, X, PlusCircle, Trash2, Hash, Tag, Car, Key, Wrench, Settings, 
    Fuel, Users, Building, CheckCircle2, History, FileText, Calendar as CalendarIcon, 
    Milestone, Layers, Image as ImageIcon, ShieldCheck
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { useVehicleManagement } from './vehicle-management-provider';

import type { Driver as DriverType } from './driver-entry-form';
import type { VehicleBrand } from './vehicle-brand-table';
import type { VehicleType } from './vehicle-type-table';
import { imageToDataUrl } from '@/lib/utils';

type DriverAssignment = {
    id: string;
    driverId: string;
    effectiveDate: string;
}

export type Vehicle = {
    id: string;
    vehicleIdCode: string;
    vehicleTypeId: string;
    registrationNumber: string;
    engineNumber: string;
    chassisNumber: string;
    brandId: string; 
    model: string;
    manufactureYear: string;
    fuelType: 'Petrol' | 'Diesel' | 'CNG' | 'LPG' | 'Electric' | '';
    capacity: string; 
    ownership: 'Company' | 'Rental' | '';
    status: 'Active' | 'Under Maintenance' | 'Inactive' | '';
    driverAssignmentHistory: DriverAssignment[];
    documents: {
        registration: string; 
        insurance: string; 
        fitness: string; 
        taxToken: string; 
        routePermit: string; 
        other: string; 
    };
};

const initialVehicleData: Omit<Vehicle, 'id' | 'documents' | 'driverAssignmentHistory' > = {
    vehicleIdCode: '',
    vehicleTypeId: '',
    registrationNumber: '',
    engineNumber: '',
    chassisNumber: '',
    brandId: '',
    model: '',
    manufactureYear: '',
    fuelType: '',
    capacity: '',
    ownership: '',
    status: '',
};

const initialDocuments = {
    registration: '',
    insurance: '',
    fitness: '',
    taxToken: '',
    routePermit: '',
    other: ''
};

interface VehicleEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (vehicle: Omit<Vehicle, 'id'>, id?: string) => void;
  vehicle: Partial<Vehicle> | null;
}

type DocType = keyof Vehicle['documents'];
const documentLabels: Record<DocType, string> = {
  registration: "RC / Blue Book",
  insurance: "Insurance Certificate",
  fitness: "Fitness Certificate",
  taxToken: "Tax Token Receipt",
  routePermit: "Route Permit",
  other: "Other Evidence"
};

const MandatoryIndicator = () => <span className="text-red-500 ml-1">*</span>;

const QuickAddDialog: React.FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (newData: any) => void;
    title: string;
    children: React.ReactNode;
}> = ({ open, onOpenChange, onSave, title, children }) => {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    const handleInternalSave = () => {
        if (!name.trim() || !code.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Name and Code are required.' });
            return;
        }
        const newData = { id: Date.now().toString(), name, code };
        onSave(newData);
        setName('');
        setCode('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Tag className="h-3 w-3" /> Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> Code</Label>
                        <Input value={code} onChange={(e) => setCode(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleInternalSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export function VehicleEntryForm({ isOpen, setIsOpen, onSave, vehicle }: VehicleEntryFormProps) {
  const { toast } = useToast();
  const { data, setData } = useVehicleManagement();
  const { drivers, vehicleTypes, vehicleBrands } = data;

  const setVehicleTypes = (updater: React.SetStateAction<VehicleType[]>) => {
    setData(prev => ({...prev, vehicleTypes: typeof updater === 'function' ? updater(prev.vehicleTypes || []) : updater }))
  }
  const setVehicleBrands = (updater: React.SetStateAction<VehicleBrand[]>) => {
    setData(prev => ({...prev, vehicleBrands: typeof updater === 'function' ? updater(prev.vehicleBrands || []) : updater }))
  }
  
  const [step, setStep] = useState(1);
  const [vehicleData, setVehicleData] = useState(initialVehicleData);
  const [docPreviews, setDocPreviews] = useState(initialDocuments);
  const [driverAssignments, setDriverAssignments] = useState<DriverAssignment[]>([]);
  
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  
  const isEditing = vehicle && vehicle.id;
  const progress = Math.round((step / 3) * 100);

  useEffect(() => {
    if (isOpen) {
        setStep(1);
        if (isEditing && vehicle) {
            setVehicleData({ ...initialVehicleData, ...vehicle });
            setDocPreviews(vehicle.documents || initialDocuments);
            setDriverAssignments(vehicle.driverAssignmentHistory || []);
        } else {
            setVehicleData(initialVehicleData);
            setDocPreviews(initialDocuments);
            setDriverAssignments([]);
        }
    }
  }, [isOpen, vehicle, isEditing]);

  const handleVehicleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setVehicleData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id: keyof Omit<Vehicle, 'id' | 'documents' | 'driverAssignmentHistory' >) => (value: string) => {
    setVehicleData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (docType: DocType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const dataUrl = await imageToDataUrl(file);
        setDocPreviews(prev => ({...prev, [docType]: dataUrl}));
      } catch (error) {
        toast({ variant: 'destructive', title: 'File Error', description: 'Could not process the uploaded file.' });
      }
    }
  };

  const removeDocument = (docType: DocType) => {
      setDocPreviews(prev => ({...prev, [docType]: ''}));
  };

  const addDriverAssignment = () => {
    setDriverAssignments(prev => [...prev, { id: Date.now().toString(), driverId: '', effectiveDate: format(new Date(), 'yyyy-MM-dd') }]);
  };

  const updateDriverAssignment = (assignmentId: string, field: 'driverId' | 'effectiveDate', value: string) => {
    setDriverAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, [field]: value } : a));
  };
  
  const removeDriverAssignment = (assignmentId: string) => {
    setDriverAssignments(prev => prev.filter(a => a.id !== assignmentId));
  };

  const validateStep1 = () => {
    const requiredFields: (keyof typeof vehicleData)[] = [
      'vehicleIdCode', 'registrationNumber', 'brandId', 'model', 'vehicleTypeId', 'ownership', 'status'
    ];
    for (const field of requiredFields) {
      if (!vehicleData[field]?.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields.' });
        return false;
      }
    }
    return true;
  };
  
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSave = async () => {
    const dataToSave: Omit<Vehicle, 'id'> = {
        ...vehicleData,
        driverAssignmentHistory: driverAssignments,
        documents: docPreviews,
    };
    onSave(dataToSave, vehicle?.id);
    setIsOpen(false);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Fleet Asset' : 'Register New Fleet Asset'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modify technical specifications or ownership details.' : 'Input core vehicle data to register it in the organization fleet.'}
          </DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
            {step === 1 && (
                <div className="space-y-6">
                 <h3 className="font-semibold text-lg flex items-center gap-2"><Car className="h-5 w-5 text-primary" /> Step 1: Technical Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="vehicleIdCode" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> Vehicle ID / Internal Code<MandatoryIndicator/></Label>
                            <Input id="vehicleIdCode" value={vehicleData.vehicleIdCode} onChange={handleVehicleDataChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="registrationNumber" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><FileText className="h-3 w-3" /> BRTA Registration No.<MandatoryIndicator/></Label>
                            <Input id="registrationNumber" value={vehicleData.registrationNumber} onChange={handleVehicleDataChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="engineNumber" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Wrench className="h-3 w-3" /> Engine Number</Label>
                            <Input id="engineNumber" value={vehicleData.engineNumber} onChange={handleVehicleDataChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="chassisNumber" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Wrench className="h-3 w-3" /> Chassis Number</Label>
                            <Input id="chassisNumber" value={vehicleData.chassisNumber} onChange={handleVehicleDataChange} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="vehicleTypeId" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Tag className="h-3 w-3" /> Vehicle Category<MandatoryIndicator/></Label>
                            <div className="flex gap-2">
                                <Select value={vehicleData.vehicleTypeId} onValueChange={handleSelectChange('vehicleTypeId')}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>{(vehicleTypes || []).map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Button type="button" variant="outline" size="icon" onClick={() => setIsAddTypeOpen(true)}><PlusCircle className="h-4 w-4" /></Button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="brandId" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Brand / Make<MandatoryIndicator/></Label>
                            <div className="flex gap-2">
                                <Select value={vehicleData.brandId} onValueChange={handleSelectChange('brandId')}>
                                    <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                                    <SelectContent>{(vehicleBrands || []).map(brand => <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Button type="button" variant="outline" size="icon" onClick={() => setIsAddBrandOpen(true)}><PlusCircle className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="model" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Car className="h-3 w-3" /> Model Name<MandatoryIndicator/></Label>
                            <Input id="model" value={vehicleData.model} onChange={handleVehicleDataChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manufactureYear" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarIcon className="h-3 w-3" /> Year of Manufacture</Label>
                            <Input id="manufactureYear" value={vehicleData.manufactureYear} onChange={handleVehicleDataChange} type="number" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fuelType" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Fuel className="h-3 w-3" /> Primary Fuel Source</Label>
                            <Select value={vehicleData.fuelType} onValueChange={handleSelectChange('fuelType')}>
                                <SelectTrigger><SelectValue placeholder="Select fuel" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Petrol">Petrol</SelectItem>
                                    <SelectItem value="Diesel">Diesel</SelectItem>
                                    <SelectItem value="CNG">CNG</SelectItem>
                                    <SelectItem value="Electric">Electric</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacity" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Users className="h-3 w-3" /> Load / Seating Capacity</Label>
                            <Input id="capacity" value={vehicleData.capacity} onChange={handleVehicleDataChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownership" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Building className="h-3 w-3" /> Ownership Status<MandatoryIndicator/></Label>
                            <Select value={vehicleData.ownership} onValueChange={handleSelectChange('ownership')}>
                                <SelectTrigger><SelectValue placeholder="Select ownership" /></SelectTrigger>
                                <SelectContent><SelectItem value="Company">Company Asset</SelectItem><SelectItem value="Rental">Third-Party Rental</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status" className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> Operation Status<MandatoryIndicator/></Label>
                            <Select value={vehicleData.status} onValueChange={handleSelectChange('status')}>
                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Ready for Duty</SelectItem>
                                    <SelectItem value="Under Maintenance">Workshop / Service</SelectItem>
                                    <SelectItem value="Inactive">Out of Order</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Step 2: Personnel Assignment</h3>
                    <Button variant="outline" size="sm" onClick={addDriverAssignment} className="flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add Driver</Button>
                </div>
                <div className="space-y-3">
                    {driverAssignments.map((assignment) => (
                        <div key={assignment.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-center p-3 rounded-md border bg-primary/5">
                            <div className="space-y-1">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Users className="h-3 w-3" /> Select Driver</Label>
                                <Select value={assignment.driverId} onValueChange={(v) => updateDriverAssignment(assignment.id, 'driverId', v)}>
                                    <SelectTrigger className="bg-background"><SelectValue placeholder="Choose driver..."/></SelectTrigger>
                                    <SelectContent>{(drivers || []).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><CalendarIcon className="h-3 w-3" /> Effective Date</Label>
                                <Input type="date" value={assignment.effectiveDate} onChange={(e) => updateDriverAssignment(assignment.id, 'effectiveDate', e.target.value)} className="bg-background" />
                            </div>
                            <Button variant="ghost" size="icon" className="mt-5 text-destructive hover:bg-destructive/10" onClick={() => removeDriverAssignment(assignment.id)}><Trash2 className="h-4 w-4"/></Button>
                        </div>
                    ))}
                    {driverAssignments.length === 0 && <p className="text-sm text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">No drivers have been assigned to this vehicle yet.</p>}
                </div>
              </div>
            )}

            {step === 3 && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Step 3: Compliance Documents</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {(Object.keys(documentLabels) as DocType[]).map(docType => {
                            const preview = docPreviews[docType];
                            return (
                                <div className="space-y-2 p-3 border rounded-lg bg-muted/5 group" key={docType}>
                                    <Label className="font-semibold text-xs flex items-center gap-2 uppercase tracking-tight text-muted-foreground"><ShieldCheck className="h-3 w-3" /> {documentLabels[docType]}</Label>
                                    {preview ? (
                                        <div className="flex items-center justify-between text-sm p-2 bg-primary/5 rounded-md border border-primary/20">
                                            <span className="truncate font-medium flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Copy Uploaded</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeDocument(docType)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    ) : (
                                        <Label htmlFor={`v-file-${docType}`} className="flex items-center justify-center w-full h-12 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary">
                                            <div className="flex items-center gap-2">
                                                <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                <span className="text-xs font-medium text-muted-foreground">Upload Scan</span>
                                            </div>
                                            <Input id={`v-file-${docType}`} type="file" className="hidden" onChange={handleFileChange(docType)} />
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
            {step < 3 ? (
                <Button onClick={nextStep}>Continue</Button>
            ) : (
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">{isEditing ? 'Sync Changes' : 'Complete Registration'}</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <QuickAddDialog open={isAddTypeOpen} onOpenChange={setIsAddTypeOpen} onSave={handleQuickAddType} title="New Vehicle Category" />
    <QuickAddDialog open={isAddBrandOpen} onOpenChange={setIsAddBrandOpen} onSave={handleQuickAddBrand} title="New Vehicle Brand" />
    </>
  );
}
