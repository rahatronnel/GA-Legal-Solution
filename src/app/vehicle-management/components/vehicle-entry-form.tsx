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
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import type { Vehicle } from './vehicle-table';

type Driver = { id: string; name: string; };
type VehicleType = { id: string; name: string; };

const initialVehicleData: Omit<Vehicle, 'id' | 'documents' | 'driverId'> = {
    vehicleIdCode: '',
    vehicleTypeId: '',
    registrationNumber: '',
    engineNumber: '',
    chassisNumber: '',
    make: '',
    model: '',
    manufactureYear: '',
    fuelType: '',
    capacity: '',
    ownership: '',
    status: '',
};

interface VehicleEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (vehicle: Omit<Vehicle, 'id'>, id?: string) => void;
  vehicle: Partial<Vehicle> | null;
  drivers: Driver[];
  vehicleTypes: VehicleType[];
}

export function VehicleEntryForm({ isOpen, setIsOpen, onSave, vehicle, drivers, vehicleTypes }: VehicleEntryFormProps) {
  const { toast } = useToast();
  
  const [vehicleData, setVehicleData] = useState(initialVehicleData);
  const [documents, setDocuments] = useState<File[]>([]);
  const [driverId, setDriverId] = useState('');

  const isEditing = vehicle && vehicle.id;

  useEffect(() => {
    if (isOpen) {
        if (isEditing && vehicle) {
            const dataToEdit = { ...initialVehicleData };
            for(const key of Object.keys(initialVehicleData)) {
                if(key in vehicle) {
                    (dataToEdit as any)[key] = (vehicle as any)[key];
                }
            }
            setVehicleData(dataToEdit);
            setDriverId(vehicle.driverId || '');
            // Note: Documents are not loaded for editing for simplicity, but existing ones are preserved on save if no new ones are uploaded.
            setDocuments([]); 
        } else {
            setVehicleData(initialVehicleData);
            setDocuments([]);
            setDriverId('');
        }
    }
  }, [isOpen, vehicle, isEditing]);


  const handleVehicleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setVehicleData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id: keyof typeof vehicleData) => (value: string) => {
    setVehicleData(prev => ({ ...prev, [id]: value }));
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDriverChange = (value: string) => {
    setDriverId(value);
  };

  const validateForm = () => {
    const requiredFields: (keyof typeof vehicleData)[] = [
      'vehicleIdCode', 'registrationNumber', 'make', 'model', 'vehicleTypeId', 'ownership', 'status'
    ];
    for (const field of requiredFields) {
      if (!vehicleData[field]?.trim()) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').replace('Id', ' ID').trim();
        toast({ variant: 'destructive', title: 'Error', description: `Please fill out the ${fieldName} field.` });
        return false;
      }
    }
    if (!driverId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please assign a driver.' });
        return false;
    }
    return true;
  };


  const handleSave = async () => {
    if (!validateForm()) {
        return;
    }
    
    // For this prototype, we'll just store filenames.
    const documentNames = documents.map(file => file.name);

    const dataToSave: Omit<Vehicle, 'id'> = {
        ...vehicleData,
        driverId,
        // In edit mode, if no new documents are uploaded, keep the old ones.
        documents: isEditing && documentNames.length === 0 ? vehicle.documents || [] : documentNames, 
    };

    onSave(dataToSave, vehicle?.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this vehicle.' : 'Fill in the details to add a new vehicle.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
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
                         <Select value={vehicleData.vehicleTypeId} onValueChange={handleSelectChange('vehicleTypeId')}>
                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                                {vehicleTypes.map(type => (
                                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="make">Brand</Label>
                        <Input id="make" value={vehicleData.make} onChange={handleVehicleDataChange} />
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
            
            <Separator />
            
            <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-4">
                     <h3 className="font-semibold text-lg">Documents</h3>
                     <div className="space-y-2">
                         <Label htmlFor="documents">Vehicle Documents</Label>
                         <Label htmlFor="file-upload" className="flex items-center justify-center w-full h-24 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary">
                            <span className="flex items-center space-x-2">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <span className="font-medium text-muted-foreground">
                                    Click to upload
                                </span>
                            </span>
                             <Input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
                         </Label>
                     </div>
                     {documents.length > 0 && (
                         <div className="space-y-2">
                             <h4 className="font-medium">New files to upload:</h4>
                             <ul className="space-y-1">
                                 {documents.map((file, index) => (
                                     <li key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                                         <span>{file.name}</span>
                                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDocument(index)}>
                                             <X className="h-4 w-4" />
                                         </Button>
                                     </li>
                                 ))}
                             </ul>
                         </div>
                     )}
                     {isEditing && vehicle.documents && vehicle.documents.length > 0 && documents.length === 0 && (
                        <div className="space-y-2">
                             <h4 className="font-medium">Existing files:</h4>
                             <ul className="space-y-1 text-sm text-muted-foreground">
                                {vehicle.documents.map((docName, index) => <li key={index} className="p-2">{docName}</li>)}
                             </ul>
                        </div>
                     )}
                 </div>

                <div className="space-y-4">
                     <h3 className="font-semibold text-lg">Assignment</h3>
                    <div className="space-y-2">
                        <Label htmlFor="driverId">Assigned Driver</Label>
                        <Select value={driverId} onValueChange={handleDriverChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a driver" />
                            </SelectTrigger>
                            <SelectContent>
                                {drivers.map(driver => (
                                    <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{isEditing ? 'Update Vehicle' : 'Save Vehicle'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Separator = () => <hr className="border-border my-4" />;
