"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
    Upload, X, Calendar as CalendarIcon, PlusCircle, Trash2, ChevronsUpDown, 
    Check, File as FileIcon, GripVertical, User, Car, Flag, Clock, Hash, 
    Milestone, DollarSign, Tag, ListOrdered, MapPin, Route as RouteIcon, 
    Info, Image as ImageIcon, Briefcase, CheckCircle2
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn, imageToDataUrl } from '@/lib/utils';
import { format } from 'date-fns';
import type { Vehicle } from './vehicle-entry-form';
import type { Driver } from './driver-entry-form';
import type { TripPurpose } from './trip-purpose-table';
import type { Location } from './location-table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { ExpenseType } from './expense-type-table';
import { useVehicleManagement } from './vehicle-management-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TimeInput } from './time-input';
import type { Route } from './route-table';


type UploadedFile = {
  id: string;
  name: string;
  file: string; 
}

type DocType = 'approvalDoc' | 'fuelReceipt' | 'parkingBill' | 'tollBill' | 'miscExpense' | 'lunchBill' | 'otherDoc' | 'damagePhoto' | 'routePermit' | 'specialApprove';

const documentLabels: Record<DocType, string> = {
    approvalDoc: 'Trip Approval',
    fuelReceipt: 'Fuel Receipt',
    parkingBill: 'Parking Bill',
    tollBill: 'Toll Bill',
    miscExpense: 'Misc Expenses',
    lunchBill: 'Meal Bill',
    otherDoc: 'Support Document',
    damagePhoto: 'Damage Evidence',
    routePermit: 'Route Permit',
    specialApprove: 'Special Permit',
}

type Stop = {
  id: string;
  locationId: string;
}

export type Trip = {
  id: string;
  tripId: string;
  vehicleId: string;
  driverId: string;
  purposeId: string;
  stops: Stop[];
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  startingMeter: number;
  endingMeter: number;
  remarks: string;
  tripStatus: 'Planned' | 'Ongoing' | 'Completed' | 'Cancelled' | '';
  expenses: Expense[];
  documents: Record<DocType, UploadedFile[]>;
  routeId?: string;
};

type Expense = {
  id: string;
  expenseTypeId: string;
  amount: number;
  date: string;
};

const initialTripData: Omit<Trip, 'id' | 'tripId' | 'documents' | 'expenses' | 'stops'> = {
  vehicleId: '',
  driverId: '',
  purposeId: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  startingMeter: 0,
  endingMeter: 0,
  remarks: '',
  tripStatus: 'Planned',
  routeId: '',
};

const initialDocuments = Object.keys(documentLabels).reduce((acc, key) => ({...acc, [key]: []}), {} as Record<DocType, UploadedFile[]>);


interface TripEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: Partial<Trip>) => void;
  trip: Partial<Trip> | null;
}

const MandatoryIndicator = () => <span className="text-red-500 ml-1">*</span>;


export function TripEntryForm({ isOpen, setIsOpen, onSave, trip }: TripEntryFormProps) {
  const { toast } = useToast();
  const { data: vmData } = useVehicleManagement();
  
  // High-Fidelity Type Alignment: Explicitly casting data to definitive types
  const vehicles = (vmData.vehicles || []) as Vehicle[];
  const drivers = (vmData.drivers || []) as Driver[];
  const tripPurposes = (vmData.tripPurposes || []) as TripPurpose[];
  const locations = (vmData.locations || []) as Location[];
  const expenseTypes = (vmData.expenseTypes || []) as ExpenseType[];
  const routes = (vmData.routes || []) as Route[];

  const [step, setStep] = useState(1);
  const [tripData, setTripData] = useState<Omit<Trip, 'id' | 'tripId' | 'documents' | 'expenses' | 'stops'>>(initialTripData);
  const [stops, setStops] = useState<Stop[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [documents, setDocuments] = useState(initialDocuments);
  
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const isEditing = trip && trip.id;
  const progress = Math.round((step / 2) * 100);

  const selectedDriver = useMemo(() => drivers.find(d => d.id === tripData.driverId), [tripData.driverId, drivers]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEditing && trip) {
        setTripData({ ...initialTripData, ...trip } as any);
        setStops(trip.stops || []);
        setExpenses(trip.expenses || []);
        setDocuments(trip.documents || initialDocuments);
        setStartDate(trip.startDate ? new Date(trip.startDate) : undefined);
        setEndDate(trip.endDate ? new Date(trip.endDate) : undefined);
      } else {
        setTripData(initialTripData);
        setStops([{id: 'start', locationId: ''}, {id: 'end', locationId: ''}]);
        setExpenses([]);
        setDocuments(initialDocuments);
        setStartDate(undefined);
        setEndDate(undefined);
      }
    }
  }, [isOpen, trip, isEditing, vehicles]);
  
  useEffect(() => {
      if (tripData.routeId) {
          const selectedRoute = routes.find(r => r.id === tripData.routeId);
          if (selectedRoute) {
              setStops([
                  { id: 'start', locationId: selectedRoute.startLocationId },
                  { id: 'end', locationId: selectedRoute.endLocationId }
              ]);
          }
      }
  }, [tripData.routeId, routes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    setTripData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleTimeChange = (id: 'startTime' | 'endTime') => (value: string) => {
    setTripData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof typeof tripData) => (value: string) => {
    setTripData(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (setter: (date: Date | undefined) => void, field: keyof typeof tripData) => (date: Date | undefined) => {
      setter(date);
      setTripData(prev => ({...prev, [field]: date ? format(date, 'yyyy-MM-dd') : ''}))
  }

  const handleFileChange = (docType: DocType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newFiles: UploadedFile[] = [];
      for (const file of files) {
        try {
          const dataUrl = await imageToDataUrl(file);
          newFiles.push({ id: Date.now().toString() + Math.random(), name: file.name, file: dataUrl });
        } catch (error) { toast({ variant: 'destructive', title: 'File Error' }); }
      }
      setDocuments(prev => ({ ...prev, [docType]: [...prev[docType], ...newFiles] }));
    }
    e.target.value = '';
  };

  const removeDocument = (docType: DocType, fileId: string) => {
    setDocuments(prev => ({ ...prev, [docType]: prev[docType].filter(doc => doc.id !== fileId) }));
  };

  const addStop = () => {
    setTripData(prev => ({ ...prev, routeId: '' })); 
    setStops(prev => [...prev, {id: Date.now().toString(), locationId: ''}]);
  }
  const removeStop = (id: string) => {
    if (stops.length <= 2) return;
    setStops(prev => prev.filter(stop => stop.id !== id));
  }
  const updateStopLocation = (stopId: string, locationId: string) => {
    setTripData(prev => ({ ...prev, routeId: '' }));
    setStops(prev => prev.map(stop => stop.id === stopId ? {...stop, locationId} : stop));
  }

  const addExpense = () => {
    setExpenses(prev => [...prev, { id: Date.now().toString(), expenseTypeId: '', amount: 0, date: format(new Date(), 'yyyy-MM-dd') }]);
  };

  const updateExpense = (id: string, field: keyof Omit<Expense, 'id'>, value: string | number) => {
    setExpenses(prev => prev.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  };
  
  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(ex => ex.id !== id));
  };

  const validateStep1 = () => {
    return tripData.vehicleId && tripData.driverId && tripData.purposeId && tripData.startDate && tripData.tripStatus && stops.length >= 2 && !stops.some(s => !s.locationId);
  }
  
  const nextStep = () => {
    if (!validateStep1()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please complete the itinerary and mandatory fields.' });
        return;
    }
    setStep(s => s + 1);
  };

  const handleSave = () => {
    onSave({ ...tripData, stops, expenses, documents });
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modify Trip Entry' : 'Log New Trip'}</DialogTitle>
          <DialogDescription>
            Record vehicle deployment data, itinerary, and associated costs.
          </DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg flex items-center gap-2"><RouteIcon className="h-5 w-5 text-primary" /> Step 1: Logistics & Deployment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Car className="h-3 w-3" /> Vehicle<MandatoryIndicator/></Label>
                      <Select value={tripData.vehicleId} onValueChange={handleSelectChange('vehicleId')}>
                          <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                          <SelectContent>{vehicles.map((v: Vehicle) => <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> Driver<MandatoryIndicator/></Label>
                      <Select value={tripData.driverId} onValueChange={handleSelectChange('driverId')}>
                          <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                          <SelectContent>{drivers.map((d: Driver) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Flag className="h-3 w-3" /> Purpose<MandatoryIndicator/></Label>
                      <Select value={tripData.purposeId} onValueChange={handleSelectChange('purposeId')}>
                          <SelectTrigger><SelectValue placeholder="Choose purpose" /></SelectTrigger>
                          <SelectContent>{tripPurposes.map((p: TripPurpose) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> Trip Status<MandatoryIndicator/></Label>
                      <Select value={tripData.tripStatus} onValueChange={handleSelectChange('tripStatus')}>
                          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                          <SelectContent><SelectItem value="Planned">Planned</SelectItem><SelectItem value="Ongoing">Ongoing</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent>
                      </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarIcon className="h-3 w-3" /> Start Date<MandatoryIndicator/></Label>
                      <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{startDate?format(startDate,"PPP"):"Pick date"}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={handleDateChange(setStartDate,'startDate')} initialFocus/></PopoverContent>
                      </Popover>
                  </div>
                  <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Clock className="h-3 w-3" /> Start Time</Label>
                      <TimeInput value={tripData.startTime} onChange={handleTimeChange('startTime')} />
                  </div>
                  <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarIcon className="h-3 w-3" /> End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{endDate?format(endDate,"PPP"):"Pick date"}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={handleDateChange(setEndDate,'endDate')} initialFocus/></PopoverContent>
                      </Popover>
                  </div>
                  <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Clock className="h-3 w-3" /> End Time</Label>
                      <TimeInput value={tripData.endTime} onChange={handleTimeChange('endTime')} />
                  </div>
                </div>
                
                <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
                    <div className="flex justify-between items-center"><Label className="font-bold flex items-center gap-2 text-primary"><Milestone className="h-4 w-4" /> Itinerary Details</Label><Button variant="outline" size="sm" onClick={addStop}><PlusCircle className="mr-2 h-4 w-4"/>Add Point</Button></div>
                    <div className="space-y-2">
                        {stops.map((stop, index) => (
                           <div key={stop.id} className="flex items-center gap-2">
                                <span className="w-12 text-[10px] uppercase font-black text-muted-foreground">{index === 0 ? 'START' : (index === stops.length -1 ? 'DEST' : `P-${index}`)}</span>
                                <Select value={stop.locationId} onValueChange={(v) => updateStopLocation(stop.id, v)}>
                                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select Location" /></SelectTrigger>
                                    <SelectContent>{locations.map((l: Location) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeStop(stop.id)}><X className="h-4 w-4"/></Button>
                           </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> Starting Odometer (km)</Label><Input id="startingMeter" type="number" value={tripData.startingMeter} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Hash className="h-3 w-3" /> Ending Odometer (km)</Label><Input id="endingMeter" type="number" value={tripData.endingMeter} onChange={handleInputChange} /></div>
                </div>
                
                 <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
                    <div className="flex justify-between items-center"><Label className="font-bold flex items-center gap-2 text-primary"><DollarSign className="h-4 w-4" /> Trip Expenses</Label><Button variant="outline" size="sm" onClick={addExpense}><PlusCircle className="mr-2 h-4 w-4"/>Add Cost</Button></div>
                    <div className="space-y-2">
                        {expenses.map((expense) => (
                            <div key={expense.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center p-2 rounded-md bg-background border">
                                <Select value={expense.expenseTypeId} onValueChange={(v) => updateExpense(expense.id, 'expenseTypeId', v)}>
                                    <SelectTrigger className="h-8"><SelectValue placeholder="Type"/></SelectTrigger>
                                    <SelectContent>{expenseTypes.map((et: ExpenseType) => <SelectItem key={et.id} value={et.id}>{et.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Input placeholder="Amount" type="number" value={expense.amount} onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)} className="h-8" />
                                <Input type="date" value={expense.date} onChange={(e) => updateExpense(expense.id, 'date', e.target.value)} className="h-8" />
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive ml-auto" onClick={() => removeExpense(expense.id)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Info className="h-3 w-3" /> Trip Remarks</Label>
                  <Textarea id="remarks" value={tripData.remarks} onChange={handleInputChange} rows={3} />
                </div>
              </div>
            )}
            {step === 2 && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Step 2: Digital Evidence Vault</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(Object.keys(documentLabels) as DocType[]).map(docType => (
                          <div key={docType} className="space-y-2 p-3 border rounded-lg bg-muted/5 group">
                              <div className="flex justify-between items-center">
                                  <Label className="font-semibold text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ImageIcon className="h-3 w-3" /> {documentLabels[docType]}</Label>
                                  <Label htmlFor={`t-file-${docType}`} className="cursor-pointer text-[10px] text-primary hover:underline flex items-center gap-1 font-bold"><Upload className="h-3 w-3"/>Add Files</Label>
                                  <Input id={`t-file-${docType}`} type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileChange(docType)} />
                              </div>
                              <div className="space-y-1">
                                  {documents[docType]?.map(file => (
                                      <div key={file.id} className="flex items-center justify-between text-[11px] p-1.5 bg-primary/5 rounded border border-primary/10"><span className="truncate font-medium">{file.name}</span><Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeDocument(docType, file.id)}><X className="h-3 w-3"/></Button></div>
                                  ))}
                                  {documents[docType]?.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2 italic">No uploads</p>}
                              </div>
                          </div>
                      ))}
                    </div>
                 </div>
            )}
        </div>

        <DialogFooter className="flex justify-between w-full pt-4 border-t">
            <Button variant="outline" onClick={() => prevStep} disabled={step === 1}>Previous</Button>
            {step < 2 ? (
                <Button onClick={() => setStep(s => s + 1)}>Continue</Button>
            ) : (
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">{isEditing ? 'Sync Trip Data' : 'Finalize Trip Entry'}</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}