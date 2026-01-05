
"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import { Upload, X, CalendarIcon, PlusCircle, Trash2, ChevronsUpDown, Check, File as FileIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Vehicle } from './vehicle-table';
import type { Driver } from './driver-entry-form';
import type { TripPurpose } from './trip-purpose-table';
import type { Location } from './location-table';
import type { Route } from './route-table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { ExpenseType } from './expense-type-table';
import { useLocalStorage } from '@/hooks/use-local-storage';

type UploadedFile = {
  id: string;
  name: string;
  file: string; // data URL
}

type DocType = 'approvalDoc' | 'fuelReceipt' | 'parkingBill' | 'tollBill' | 'miscExpense' | 'lunchBill' | 'otherDoc' | 'damagePhoto' | 'routePermit' | 'specialApprove';

const documentLabels: Record<DocType, string> = {
    approvalDoc: 'Approval Document',
    fuelReceipt: 'Fuel Receipt/Memo',
    parkingBill: 'Parking Bill',
    tollBill: 'Toll Bill',
    miscExpense: 'Miscellaneous Expenses Bill',
    lunchBill: 'Lunch Bill',
    otherDoc: 'Other Document',
    damagePhoto: 'Damage Photo',
    routePermit: 'Route Permit Photo',
    specialApprove: 'Special Approval Document',
}

export type Trip = {
  id: string;
  tripId: string;
  vehicleId: string;
  driverId: string;
  purposeId: string;
  routeId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  startLocationId: string;
  destinationLocationId: string;
  startingMeter: number;
  endingMeter: number;
  remarks: string;
  tripStatus: 'Planned' | 'Ongoing' | 'Completed' | 'Cancelled' | '';
  expenses: Expense[];
  documents: Record<DocType, UploadedFile[]>;
};

type Expense = {
  id: string;
  expenseTypeId: string;
  amount: number;
  date: string;
};

const initialTripData: Omit<Trip, 'id' | 'tripId' | 'documents' | 'expenses'> = {
  vehicleId: '',
  driverId: '',
  purposeId: '',
  routeId: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  startLocationId: '',
  destinationLocationId: '',
  startingMeter: 0,
  endingMeter: 0,
  remarks: '',
  tripStatus: 'Planned',
};

const initialDocuments = Object.keys(documentLabels).reduce((acc, key) => ({...acc, [key]: []}), {} as Record<DocType, UploadedFile[]>);


interface TripEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: Omit<Trip, 'id'>, id?: string) => void;
  trip: Partial<Trip> | null;
}

// Combobox Component
interface ComboboxProps<T> {
  items: T[];
  value: string;
  onSelect: (value: string) => void;
  displayValue: (item: T) => string;
  searchValue: (item: T) => string;
  placeholder: string;
  emptyMessage: string;
  disabled?: boolean;
}

function Combobox<T extends {id: string}>({ items, value, onSelect, displayValue, searchValue, placeholder, emptyMessage, disabled = false }: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const currentItem = items.find((item) => item.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {currentItem
            ? displayValue(currentItem)
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={searchValue(item)}
                  onSelect={() => {
                    onSelect(item.id === value ? '' : item.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {displayValue(item)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


export function TripEntryForm({ isOpen, setIsOpen, onSave, trip }: TripEntryFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [tripData, setTripData] = useState(initialTripData);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [documents, setDocuments] = useState(initialDocuments);
  
  // Date states
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [drivers] = useLocalStorage<Driver[]>('drivers', []);
  const [purposes] = useLocalStorage<TripPurpose[]>('tripPurposes', []);
  const [locations] = useLocalStorage<Location[]>('locations', []);
  const [routes] = useLocalStorage<Route[]>('routes', []);
  const [expenseTypes] = useLocalStorage<ExpenseType[]>('expenseTypes', []);

  const isEditing = trip && trip.id;
  const progress = Math.round((step / 2) * 100);

  const totalDistance = useMemo(() => {
    const start = Number(tripData.startingMeter);
    const end = Number(tripData.endingMeter);
    return end > start ? end - start : 0;
  }, [tripData.startingMeter, tripData.endingMeter]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEditing && trip) {
        const initialData = { ...initialTripData, ...trip };
        setTripData(initialData);
        setExpenses(trip.expenses || []);
        setDocuments(trip.documents || initialDocuments);
        setStartDate(trip.startDate ? new Date(trip.startDate) : undefined);
        setEndDate(trip.endDate ? new Date(trip.endDate) : undefined);
      } else {
        setTripData(initialTripData);
        setExpenses([]);
        setDocuments(initialDocuments);
        setStartDate(undefined);
        setEndDate(undefined);
      }
    }
  }, [isOpen, trip, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    setTripData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (id: keyof Trip) => (value: string) => {
    setTripData(prev => ({ ...prev, [id]: value }));
  };

  const handleComboboxSelect = (id: keyof Trip) => (value: string) => {
     if (id === 'routeId') {
        const isClearing = !value;
        const newRouteId = isClearing ? '' : value;
        setTripData(prev => ({ ...prev, [id]: newRouteId }));

        if (!isClearing) {
            const selectedRoute = routes.find(r => r.id === value);
            if (selectedRoute) {
                setTripData(prev => ({
                    ...prev,
                    startLocationId: selectedRoute.startLocationId,
                    destinationLocationId: selectedRoute.endLocationId
                }));
            }
        } else {
             setTripData(prev => ({...prev, startLocationId: '', destinationLocationId: ''}));
        }
    } else {
        setTripData(prev => ({ ...prev, [id]: value }));
    }
  }

  const handleDateChange = (setter: (date: Date | undefined) => void, field: keyof Trip) => (date: Date | undefined) => {
      setter(date);
      setTripData(prev => ({...prev, [field]: date ? format(date, 'yyyy-MM-dd') : ''}))
  }

  const handleFileChange = (docType: DocType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newFiles: UploadedFile[] = [];

      for (const file of files) {
        const reader = new FileReader();
        const filePromise = new Promise<UploadedFile>(resolve => {
          reader.onload = () => {
            resolve({
              id: Date.now().toString() + Math.random(),
              name: file.name,
              file: reader.result as string,
            });
          };
        });
        reader.readAsDataURL(file);
        newFiles.push(await filePromise);
      }

      setDocuments(prev => ({
        ...prev,
        [docType]: [...prev[docType], ...newFiles]
      }));
    }
    e.target.value = ''; // Reset file input
  };

  const removeDocument = (docType: DocType, fileId: string) => {
    setDocuments(prev => ({
        ...prev,
        [docType]: prev[docType].filter(doc => doc.id !== fileId)
    }));
  };
  
  // Expense handlers
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
    return tripData.vehicleId && tripData.driverId && tripData.purposeId && tripData.startDate && tripData.tripStatus;
  }
  
  const nextStep = () => {
    if (!validateStep1()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields in this step.' });
        return;
    }
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const handleSave = () => {
    if (!validateStep1()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please go back and fill all required fields.' });
      return;
    }

    const completeTripData = {
        ...tripData,
        expenses,
        documents,
    };

    onSave(completeTripData, trip?.id);
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Trip' : 'Add New Trip'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update details for trip ${trip?.tripId}` : 'Follow the steps to record a new trip.'}
          </DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2"><Label>Vehicle</Label><Select value={tripData.vehicleId} onValueChange={handleSelectChange('vehicleId')}><SelectTrigger><SelectValue placeholder="Select Vehicle"/></SelectTrigger><SelectContent>{vehicles.map(v=><SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Driver</Label><Select value={tripData.driverId} onValueChange={handleSelectChange('driverId')}><SelectTrigger><SelectValue placeholder="Select Driver"/></SelectTrigger><SelectContent>{drivers.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Purpose</Label><Select value={tripData.purposeId} onValueChange={handleSelectChange('purposeId')}><SelectTrigger><SelectValue placeholder="Select Purpose"/></SelectTrigger><SelectContent>{purposes.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Trip Status</Label><Select value={tripData.tripStatus} onValueChange={handleSelectChange('tripStatus')}><SelectTrigger><SelectValue placeholder="Select Status"/></SelectTrigger><SelectContent><SelectItem value="Planned">Planned</SelectItem><SelectItem value="Ongoing">Ongoing</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Cancelled">Cancelled</SelectItem></SelectContent></Select></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2"><Label>Start Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!startDate&&"text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{startDate?format(startDate,"PPP"):"Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={handleDateChange(setStartDate,'startDate')} initialFocus/></PopoverContent></Popover></div>
                  <div className="space-y-2"><Label>Start Time</Label><Input id="startTime" type="time" value={tripData.startTime} onChange={handleInputChange}/></div>
                  <div className="space-y-2"><Label>End Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!endDate&&"text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{endDate?format(endDate,"PPP"):"Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={handleDateChange(setEndDate,'endDate')} initialFocus/></PopoverContent></Popover></div>
                  <div className="space-y-2"><Label>End Time</Label><Input id="endTime" type="time" value={tripData.endTime} onChange={handleInputChange}/></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Route</Label>
                        <Combobox
                            items={routes}
                            value={tripData.routeId}
                            onSelect={handleComboboxSelect('routeId')}
                            displayValue={(route) => route.name}
                            searchValue={(route) => `${route.name} ${route.routeCode}`}
                            placeholder="Select Route..."
                            emptyMessage="No route found."
                        />
                    </div>
                   <div className="space-y-2">
                        <Label>Start Location</Label>
                        <Combobox
                            items={locations}
                            value={tripData.startLocationId}
                            onSelect={handleComboboxSelect('startLocationId')}
                            displayValue={(loc) => loc.name}
                            searchValue={(loc) => `${loc.name} ${loc.locationCode}`}
                            placeholder="Select Start..."
                            emptyMessage="No location found."
                            disabled={!!tripData.routeId}
                        />
                   </div>
                   <div className="space-y-2">
                       <Label>Destination</Label>
                        <Combobox
                            items={locations}
                            value={tripData.destinationLocationId}
                            onSelect={handleComboboxSelect('destinationLocationId')}
                            displayValue={(loc) => loc.name}
                            searchValue={(loc) => `${loc.name} ${loc.locationCode}`}
                            placeholder="Select Destination..."
                            emptyMessage="No location found."
                            disabled={!!tripData.routeId}
                        />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label htmlFor="startingMeter">Starting Meter (km)</Label><Input id="startingMeter" type="number" value={tripData.startingMeter} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><Label htmlFor="endingMeter">Ending Meter (km)</Label><Input id="endingMeter" type="number" value={tripData.endingMeter} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><Label>Total Distance (km)</Label><Input value={totalDistance} readOnly disabled /></div>
                </div>
                
                 <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Expenses</h3><Button variant="outline" size="sm" onClick={addExpense}><PlusCircle className="mr-2 h-4 w-4"/>Add Expense</Button></div>
                    <div className="space-y-2">
                        {expenses.map((expense) => (
                            <div key={expense.id} className="grid grid-cols-4 gap-2 items-center">
                                <Select value={expense.expenseTypeId} onValueChange={(value) => updateExpense(expense.id, 'expenseTypeId', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select Type"/></SelectTrigger>
                                    <SelectContent>
                                        {expenseTypes.map(et => <SelectItem key={et.id} value={et.id}>{et.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Input placeholder="Amount" type="number" value={expense.amount} onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)} />
                                <Input type="date" value={expense.date} onChange={(e) => updateExpense(expense.id, 'date', e.target.value)} />
                                <Button variant="ghost" size="icon" onClick={() => removeExpense(expense.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea id="remarks" value={tripData.remarks} onChange={handleInputChange} />
                </div>
              </div>
            )}
            {step === 2 && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-lg">Step 2: Upload Documents & Photos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {(Object.keys(documentLabels) as DocType[]).map(docType => (
                          <div key={docType} className="space-y-2 p-3 border rounded-lg">
                              <div className="flex justify-between items-center">
                                  <Label className="font-medium">{documentLabels[docType]}</Label>
                                  <Label htmlFor={`file-upload-${docType}`} className="cursor-pointer text-sm text-primary hover:underline">
                                      Add File(s)
                                  </Label>
                                  <Input id={`file-upload-${docType}`} type="file" className="hidden" multiple onChange={handleFileChange(docType)} />
                              </div>
                              <div className="space-y-1">
                                  {documents[docType]?.length > 0 ? (
                                      documents[docType].map(file => (
                                          <div key={file.id} className="flex items-center justify-between text-sm p-1.5 bg-muted rounded-md">
                                              <div className="flex items-center gap-2 truncate">
                                                  <FileIcon className="h-4 w-4 flex-shrink-0" />
                                                  <span className="truncate">{file.name}</span>
                                              </div>
                                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDocument(docType, file.id)}>
                                                  <X className="h-4 w-4" />
                                              </Button>
                                          </div>
                                      ))
                                  ) : (
                                      <p className="text-xs text-muted-foreground text-center py-2">No files uploaded.</p>
                                  )}
                              </div>
                          </div>
                      ))}
                    </div>
                 </div>
            )}
        </div>

        <DialogFooter className="flex justify-between w-full pt-4">
            {step > 1 ? (<Button variant="outline" onClick={prevStep}>Previous</Button>) : <div></div>}
            {step < 2 ? (<Button onClick={nextStep}>Next</Button>) : (<Button onClick={handleSave}>{isEditing ? 'Update Trip' : 'Save Trip'}</Button>)}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
