
"use client";

import React, { useState, useEffect } from 'react';
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
import { Upload, X, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { VehicleTypeTable } from './vehicle-type-table';
import type { Driver as DriverType } from './driver-entry-form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { VehicleBrand } from './vehicle-brand-table';

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
    brandId: string; // Formerly make
    model: string;
    manufactureYear: string;
    fuelType: 'Petrol' | 'Diesel' | 'CNG' | 'LPG' | 'Electric' | '';
    capacity: string; // Seating / Load Capacity
    ownership: 'Company' | 'Rental' | '';
    status: 'Active' | 'Under Maintenance' | 'Inactive' | '';
    driverAssignmentHistory: DriverAssignment[];
    documents: {
        registration: string; // data URL
        insurance: string; // data URL
        fitness: string; // data URL
        taxToken: string; // data URL
        routePermit: string; // data URL
        other: string; // data URL
    };
};

type Driver = { id: string; name: string; };
type VehicleType = { id: string; name: string; vehicleTypeCode: string; };

const initialVehicleData: Omit<Vehicle, 'id' | 'documents' | 'driverAssignmentHistory' | 'make'> = {
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
  registration: "Registration Certificate (RC / Blue Book)",
  insurance: "Insurance Certificate",
  fitness: "Fitness Certificate",
  taxToken: "Tax Token / Road Tax Receipt",
  routePermit: "Route Permit",
  other: "Other Document"
};

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
                        <Label>Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Code</Label>
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
  
  const [step, setStep] = useState(1);
  const [vehicleData, setVehicleData] = useState(initialVehicleData);
  const [docPreviews, setDocPreviews] = useState(initialDocuments);
  const [driverAssignments, setDriverAssignments] = useState<DriverAssignment[]>([]);
  
  const [vehicleTypes, setVehicleTypes] = useLocalStorage<VehicleType[]>('vehicleTypes', []);
  const [vehicleBrands, setVehicleBrands] = useLocalStorage<VehicleBrand[]>('vehicleBrands', []);
  const [drivers, setDrivers] = useLocalStorage<DriverType[]>('drivers', []);

  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  
  const isEditing = vehicle && vehicle.id;
  const progress = Math.round((step / 3) * 100);

  useEffect(() => {
    if (isOpen) {
        setStep(1);
        if (isEditing && vehicle) {
            const dataToEdit = { ...initialVehicleData, ...vehicle };
            setVehicleData(dataToEdit);
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
  
  const handleSelectChange = (id: keyof Omit<Vehicle, 'id' | 'documents' | 'driverAssignmentHistory' | 'make'>) => (value: string) => {
    setVehicleData(prev => ({ ...prev, [id]: value }));
  };

  const fileToDataUrl = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  }

  const handleFileChange = (docType: DocType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dataUrl = await fileToDataUrl(file);
      setDocPreviews(prev => ({...prev, [docType]: dataUrl}));
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
        const fieldName = field.replace(/([A-Z])/g, ' $1').replace('Id', '').trim();
        toast({ variant: 'destructive', title: 'Error', description: `Please fill out the ${fieldName} field.` });
        return false;
      }
    }
    return true;
  };
  
  const nextStep = () => {
    if (step === 1 && !validateStep1()) {
        return;
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSave = async () => {
    if (!validateStep1()) {
        toast({variant: 'destructive', title: 'Error', description: 'Please go back and fill out all required fields.'});
        return;
    }
    
    const dataToSave: Omit<Vehicle, 'id' | 'make'> = {
        ...vehicleData,
        driverAssignmentHistory: driverAssignments,
        documents: docPreviews,
    };

    onSave(dataToSave, vehicle?.id);
    setIsOpen(false);
  };

  const handleQuickAddType = (newType: VehicleType) => {
    setVehicleTypes(prev => [...prev, newType]);
    setVehicleData(prev => ({ ...prev, vehicleTypeId: newType.id }));
    toast({ title: 'Success', description: `Category "${newType.name}" added and selected.` });
  };
  
   const handleQuickAddBrand = (newBrand: VehicleBrand) => {
    setVehicleBrands(prev => [...prev, newBrand]);
    setVehicleData(prev => ({ ...prev, brandId: newBrand.id }));
    toast({ title: 'Success', description: `Brand "${newBrand.name}" added and selected.` });
  };
  
  const getDocumentName = (docType: DocType) => {
      if (docPreviews[docType]) {
          const prefix = `data:application/pdf;base64,`;
          if (docPreviews[docType].startsWith(prefix)) return `${documentLabels[docType]}.pdf`;
          return `${documentLabels[docType]}.jpg`;
      }
      return null;
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this vehicle.' : 'Follow the steps to add a new vehicle.'}
          </DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {step === 1 && (
                <div className="space-y-6">
                 <h3 className="font-semibold text-lg">Step 1: Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="vehicleIdCode">Vehicle ID / Code</Label>
                            <Input id="vehicleIdCode" value={vehicleData.vehicleIdCode} onChange={handleVehicleDataChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="registrationNumber">Registration Number</Label>
                            <Input id="registrationNumber" value={vehicleData.registrationNumber} onChange={handleVehicleDataChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="engineNumber">Engine Number</Label>
                            <Input id="engineNumber" value={vehicleData.engineNumber} onChange={handleVehicleDataChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="chassisNumber">Chassis Number</Label>
                            <Input id="chassisNumber" value={vehicleData.chassisNumber} onChange={handleVehicleDataChange} />
                        </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="vehicleTypeId">Vehicle Category</Label>
                            <div className="flex gap-2">
                                <Select value={vehicleData.vehicleTypeId} onValueChange={handleSelectChange('vehicleTypeId')}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        {vehicleTypes.map(type => (
                                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" variant="outline" size="icon" onClick={() => setIsAddTypeOpen(true)}><PlusCircle className="h-4 w-4" /></Button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="brandId">Brand</Label>
                            <div className="flex gap-2">
                                <Select value={vehicleData.brandId} onValueChange={handleSelectChange('brandId')}>
                                    <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                                    <SelectContent>
                                        {vehicleBrands.map(brand => (
                                            <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" variant="outline" size="icon" onClick={() => setIsAddBrandOpen(true)}><PlusCircle className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="model">Model</Label>
                            <Input id="model" value={vehicleData.model} onChange={handleVehicleDataChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manufactureYear">Manufacture Year</Label>
                            <Input id="manufactureYear" value={vehicleData.manufactureYear} onChange={handleVehicleDataChange} type="number" />
                        </div>
                    </div>

                    {/* Column 3 */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fuelType">Fuel Type</Label>
                            <Select value={vehicleData.fuelType} onValueChange={handleSelectChange('fuelType')}>
                                <SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Petrol">Petrol</SelectItem>
                                    <SelectItem value="Diesel">Diesel</SelectItem>
                                    <SelectItem value="CNG">CNG</SelectItem>
                                    <SelectItem value="LPG">LPG</SelectItem>
                                    <SelectItem value="Electric">Electric</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacity">Seating / Load Capacity</Label>
                            <Input id="capacity" value={vehicleData.capacity} onChange={handleVehicleDataChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownership">Ownership</Label>
                            <Select value={vehicleData.ownership} onValueChange={handleSelectChange('ownership')}>
                                <SelectTrigger><SelectValue placeholder="Select ownership" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Company">Company</SelectItem>
                                    <SelectItem value="Rental">Rental</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Vehicle Status</Label>
                            <Select value={vehicleData.status} onValueChange={handleSelectChange('status')}>
                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
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
                    <h3 className="font-semibold text-lg">Step 2: Driver Assignment History</h3>
                    <Button variant="outline" size="sm" onClick={addDriverAssignment}><PlusCircle className="mr-2 h-4 w-4" /> Add Assignment</Button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {driverAssignments.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()).map((assignment) => (
                        <div key={assignment.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center p-2 rounded-md border">
                            <div className="space-y-1">
                                <Label className="text-xs">Driver</Label>
                                <Select value={assignment.driverId} onValueChange={(value) => updateDriverAssignment(assignment.id, 'driverId', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select driver"/></SelectTrigger>
                                    <SelectContent>
                                        {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Effective Date</Label>
                                <Input type="date" value={assignment.effectiveDate} onChange={(e) => updateDriverAssignment(assignment.id, 'effectiveDate', e.target.value)} />
                            </div>
                            <Button variant="ghost" size="icon" className="self-end" onClick={() => removeDriverAssignment(assignment.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    ))}
                    {driverAssignments.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No drivers assigned. Click "Add Assignment" to begin.</p>}
                </div>
              </div>
            )}

            {step === 3 && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg">Step 3: Upload Documents</h3>
                    
                    {(Object.keys(documentLabels) as DocType[]).map(docType => {
                        const currentDocName = getDocumentName(docType);
                        
                        return (
                            <div className="space-y-2" key={docType}>
                                <Label>{documentLabels[docType]}</Label>
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

         <DialogFooter className="flex justify-between w-full pt-4">
            {step > 1 ? (
                <Button variant="outline" onClick={prevStep}>Previous</Button>
            ) : <div></div>}
            
            {step < 3 ? (
                 <Button onClick={nextStep}>Next</Button>
            ) : (
                 <Button onClick={handleSave}>{isEditing ? 'Update Vehicle' : 'Save Vehicle'}</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <QuickAddDialog open={isAddTypeOpen} onOpenChange={setIsAddTypeOpen} onSave={handleQuickAddType} title="Add New Vehicle Category" />
    <QuickAddDialog open={isAddBrandOpen} onOpenChange={setIsAddBrandOpen} onSave={handleQuickAddBrand} title="Add New Vehicle Brand" />
    </>
  );
}
