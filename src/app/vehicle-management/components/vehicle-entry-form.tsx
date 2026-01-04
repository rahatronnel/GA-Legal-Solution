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
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Upload, X } from 'lucide-react';
import type { Vehicle } from './vehicle-table';

type Driver = { id: string; name: string; };
type VehicleType = { id: string; name: string; };
const ownershipTypes = ['Company Vehicle', 'Rental Vehicle', 'Covered Van'] as const;

interface VehicleEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  vehicle: Partial<Vehicle> | null;
  drivers: Driver[];
  vehicleTypes: VehicleType[];
}

export function VehicleEntryForm({ isOpen, setIsOpen, vehicle, drivers, vehicleTypes }: VehicleEntryFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    registrationNumber: '',
    vehicleTypeId: '',
    ownership: '',
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [driverId, setDriverId] = useState('');

  const progress = Math.round((step / 3) * 100);
  const isEditing = vehicle && vehicle.id;

  useEffect(() => {
    if (isOpen) {
        setStep(1);
        if (isEditing) {
            setVehicleData({
                make: vehicle.make || '',
                model: vehicle.model || '',
                registrationNumber: vehicle.registrationNumber || '',
                vehicleTypeId: vehicle.vehicleTypeId || '',
                ownership: vehicle.ownership || '',
            });
            // Note: Documents are not loaded for editing for simplicity
            setDocuments([]); 
            setDriverId(vehicle.driverId || '');
        } else {
            setVehicleData({ make: '', model: '', registrationNumber: '', vehicleTypeId: '', ownership: '' });
            setDocuments([]);
            setDriverId('');
        }
    }
  }, [isOpen, vehicle, isEditing]);


  const handleVehicleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setVehicleData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id: string) => (value: string) => {
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
  
  const validateStep1 = () => {
    return vehicleData.make.trim() && vehicleData.model.trim() && vehicleData.registrationNumber.trim() && vehicleData.vehicleTypeId && vehicleData.ownership;
  };

  const validateStep2 = () => {
      // In edit mode, user doesn't have to re-upload documents
      if(isEditing) return true;
      return documents.length > 0;
  }

  const validateStep3 = () => {
    return driverId;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all vehicle details.' });
        return;
    }
    if (step === 2 && !validateStep2()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please upload at least one document.' });
        return;
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSave = async () => {
    if (!validateStep3()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a driver.' });
        return;
    }
    
    // In a real app, you would upload files to Firebase Storage and get URLs.
    // For this prototype, we'll just store filenames.
    const documentNames = documents.map(file => file.name);

    if (firestore) {
        const dataToSave: Omit<Vehicle, 'id'> = {
            ...vehicleData,
            driverId,
            documents: documentNames, 
        };

        try {
            const vehiclesCollection = collection(firestore, 'vehicles');
            if (isEditing) {
                const docRef = doc(firestore, 'vehicles', vehicle.id!);
                await updateDoc(docRef, dataToSave);
                toast({ title: 'Success', description: 'Vehicle updated successfully.' });
            } else {
                await addDoc(vehiclesCollection, dataToSave);
                toast({ title: 'Success', description: 'Vehicle added successfully.' });
            }
            setIsOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this vehicle.' : 'Follow the steps to add a new vehicle to the system.'}
          </DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            {step === 1 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Step 1: Vehicle Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="registrationNumber">Registration No.</Label>
                            <Input id="registrationNumber" value={vehicleData.registrationNumber} onChange={handleVehicleDataChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="vehicleTypeId">Vehicle Type</Label>
                             <Select value={vehicleData.vehicleTypeId} onValueChange={handleSelectChange('vehicleTypeId')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicleTypes.map(type => (
                                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="make">Make</Label>
                            <Input id="make" value={vehicleData.make} onChange={handleVehicleDataChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="model">Model</Label>
                            <Input id="model" value={vehicleData.model} onChange={handleVehicleDataChange} />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="ownership">Ownership</Label>
                             <Select value={vehicleData.ownership} onValueChange={handleSelectChange('ownership')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select ownership" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ownershipTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                 <div className="space-y-4">
                     <h3 className="font-semibold text-lg">Step 2: Upload Documents</h3>
                     <div className="space-y-2">
                         <Label htmlFor="documents">Vehicle Documents</Label>
                         <Label htmlFor="file-upload" className="flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary">
                            <span className="flex items-center space-x-2">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <span className="font-medium text-muted-foreground">
                                    Drop files here or <span className="text-primary">click to upload</span>
                                </span>
                            </span>
                             <Input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
                         </Label>
                     </div>
                     {documents.length > 0 && (
                         <div className="space-y-2">
                             <h4 className="font-medium">Uploaded files:</h4>
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
                 </div>
            )}

            {step === 3 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Step 3: Assign Driver</h3>
                    <div className="space-y-2">
                        <Label htmlFor="driverId">Responsible Driver</Label>
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
            )}
        </div>

        <DialogFooter className="flex justify-between w-full">
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
  );
}
