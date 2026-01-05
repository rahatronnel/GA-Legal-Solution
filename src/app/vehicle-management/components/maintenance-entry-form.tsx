
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
import { Upload, X, CalendarIcon, PlusCircle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useLocalStorage } from '@/hooks/use-local-storage';

import type { Vehicle } from './vehicle-table';
import type { MaintenanceType } from './maintenance-type-table';
import type { ServiceCenter } from './service-center-table';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { MaintenanceExpenseType } from './maintenance-expense-type-table';


type Part = {
  id: string;
  name: string;
  price: number;
  brand: string;
  quantity: number;
  warranty: string;
  expiryDate: string;
}

type Expense = {
  id: string;
  expenseTypeId: string;
  amount: number;
};

type MaintenanceDocument = {
  id: string;
  label: string;
  file: string; // data URL
}

export type MaintenanceRecord = {
  id: string;
  vehicleId: string;
  maintenanceTypeId: string;
  serviceCenterId: string;
  serviceDate: string;
  upcomingServiceDate: string;
  description: string;
  monitoringEmployeeId: string;
  parts: Part[];
  expenses: Expense[];
  documents: MaintenanceDocument[];
};

const initialMaintenanceData: Omit<MaintenanceRecord, 'id' | 'parts' | 'expenses' | 'documents'> = {
  vehicleId: '',
  maintenanceTypeId: '',
  serviceCenterId: '',
  serviceDate: '',
  upcomingServiceDate: '',
  description: '',
  monitoringEmployeeId: '',
};

interface MaintenanceEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (record: Omit<MaintenanceRecord, 'id'>, id?: string) => void;
  record: Partial<MaintenanceRecord> | null;
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
}

function Combobox<T extends {id: string}>({ items, value, onSelect, displayValue, searchValue, placeholder, emptyMessage }: ComboboxProps<T>) {
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
                  <Check className={cn("mr-2 h-4 w-4", value === item.id ? "opacity-100" : "opacity-0")} />
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

// Quick Add Dialogs
const QuickAddDialog: React.FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: any) => void;
    title: string;
    children: React.ReactNode;
}> = ({ open, onOpenChange, onSave, title, children }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
                <div className="py-4">{children}</div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export function MaintenanceEntryForm({ isOpen, setIsOpen, onSave, record }: MaintenanceEntryFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [maintenanceData, setMaintenanceData] = useState(initialMaintenanceData);
  const [parts, setParts] = useState<Part[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [documents, setDocuments] = useState<MaintenanceDocument[]>([]);
  
  const [serviceDate, setServiceDate] = useState<Date | undefined>();
  const [upcomingServiceDate, setUpcomingServiceDate] = useState<Date | undefined>();

  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [maintenanceTypes, setMaintenanceTypes] = useLocalStorage<MaintenanceType[]>('maintenanceTypes', []);
  const [serviceCenters, setServiceCenters] = useLocalStorage<ServiceCenter[]>('serviceCenters', []);
  const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
  const [maintenanceExpenseTypes, setMaintenanceExpenseTypes] = useLocalStorage<MaintenanceExpenseType[]>('maintenanceExpenseTypes', []);

  const [isQuickAddOpen, setIsQuickAddOpen] = useState<string | null>(null);
  const [quickAddData, setQuickAddData] = useState<any>({});
  
  const isEditing = record && record.id;
  const progress = Math.round((step / 3) * 100);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (isEditing && record) {
        setMaintenanceData({ ...initialMaintenanceData, ...record });
        setParts(record.parts || []);
        setExpenses(record.expenses || []);
        setDocuments(record.documents || []);
        setServiceDate(record.serviceDate ? new Date(record.serviceDate) : undefined);
        setUpcomingServiceDate(record.upcomingServiceDate ? new Date(record.upcomingServiceDate) : undefined);
      } else {
        setMaintenanceData(initialMaintenanceData);
        setParts([]);
        setExpenses([]);
        setDocuments([]);
        setServiceDate(undefined);
        setUpcomingServiceDate(undefined);
      }
    }
  }, [isOpen, record, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setMaintenanceData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Omit<MaintenanceRecord, 'id'|'parts'|'expenses'|'documents'>) => (value: string) => {
    setMaintenanceData(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (setter: (date: Date | undefined) => void, field: keyof MaintenanceRecord) => (date: Date | undefined) => {
      setter(date);
      setMaintenanceData(prev => ({...prev, [field]: date ? format(date, 'yyyy-MM-dd') : ''}))
  }

  // Parts handlers
  const addPart = () => setParts(p => [...p, {id: Date.now().toString(), name: '', price: 0, brand: '', quantity: 1, warranty: '', expiryDate: ''}])
  const updatePart = (id: string, field: keyof Omit<Part, 'id'>, value: string | number) => {
    setParts(p => p.map(part => part.id === id ? {...part, [field]: value} : part));
  }
  const removePart = (id: string) => setParts(p => p.filter(part => part.id !== id));

  // Expense handlers
  const addExpense = () => setExpenses(e => [...e, {id: Date.now().toString(), expenseTypeId: '', amount: 0}]);
  const updateExpense = (id: string, field: keyof Omit<Expense, 'id'>, value: string | number) => {
    setExpenses(e => e.map(exp => exp.id === id ? {...exp, [field]: value} : exp));
  }
  const removeExpense = (id: string) => setExpenses(e => e.filter(exp => exp.id !== id));

  // Document handlers
  const addDocument = () => setDocuments(d => [...d, {id: Date.now().toString(), label: '', file: ''}]);
  const updateDocumentLabel = (id: string, label: string) => {
    setDocuments(d => d.map(doc => doc.id === id ? {...doc, label} : doc));
  };
  const handleFileChange = (id: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => setDocuments(d => d.map(doc => doc.id === id ? {...doc, file: reader.result as string} : doc));
      reader.readAsDataURL(file);
    }
  }
  const removeDocument = (id: string) => setDocuments(d => d.filter(doc => doc.id !== id));

  // Quick Add Handlers
  const openQuickAdd = (type: string) => {
      setQuickAddData({});
      setIsQuickAddOpen(type);
  }

  const handleQuickAddSave = () => {
    const { name, code } = quickAddData;
    if (!name || (isQuickAddOpen !== 'employee' && !code)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Name and Code are required.' });
        return;
    }
    
    const newItemId = Date.now().toString();
    
    switch(isQuickAddOpen) {
        case 'maintenanceType':
            const newType = { id: newItemId, name, code };
            setMaintenanceTypes(prev => [...prev, newType]);
            setMaintenanceData(prev => ({ ...prev, maintenanceTypeId: newItemId }));
            toast({ title: 'Success', description: `Maintenance Type "${name}" added and selected.` });
            break;
        case 'serviceCenter':
            const newCenter = { id: newItemId, name, code, ...quickAddData };
            setServiceCenters(prev => [...prev, newCenter]);
            setMaintenanceData(prev => ({ ...prev, serviceCenterId: newItemId }));
            toast({ title: 'Success', description: `Service Center "${name}" added and selected.` });
            break;
    }
    setIsQuickAddOpen(null);
  };
  
  const validateStep1 = () => {
    return maintenanceData.vehicleId && maintenanceData.maintenanceTypeId && maintenanceData.serviceDate && maintenanceData.serviceCenterId;
  }
  
  const nextStep = () => {
    if (step === 1 && !validateStep1()) {
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
    const dataToSave: Omit<MaintenanceRecord, 'id'> = {
        ...maintenanceData,
        parts,
        expenses,
        documents
    };
    onSave(dataToSave, record?.id);
    setIsOpen(false);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Maintenance Record' : 'Add Maintenance Record'}</DialogTitle>
          <DialogDescription>Follow the steps to log a vehicle maintenance activity.</DialogDescription>
          <Progress value={progress} className="w-full mt-2" />
        </DialogHeader>
        
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Step 1: Main Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Vehicle</Label><Combobox items={vehicles} value={maintenanceData.vehicleId} onSelect={handleSelectChange('vehicleId')} displayValue={(v) => v.registrationNumber} searchValue={(v) => `${v.registrationNumber} ${v.make} ${v.model}`} placeholder="Select Vehicle..." emptyMessage="No vehicle found."/></div>
                    
                    <div className="space-y-2"><Label>Maintenance Type</Label><div className="flex gap-2"><Select value={maintenanceData.maintenanceTypeId} onValueChange={handleSelectChange('maintenanceTypeId')}><SelectTrigger><SelectValue placeholder="Select Type"/></SelectTrigger><SelectContent>{maintenanceTypes.map(t=><SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="icon" onClick={() => openQuickAdd('maintenanceType')}><PlusCircle className="h-4 w-4" /></Button></div></div>
                    
                    <div className="space-y-2"><Label>Service Center / Garage</Label><div className="flex gap-2"><Select value={maintenanceData.serviceCenterId} onValueChange={handleSelectChange('serviceCenterId')}><SelectTrigger><SelectValue placeholder="Select Center"/></SelectTrigger><SelectContent>{serviceCenters.map(sc=><SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="icon" onClick={() => openQuickAdd('serviceCenter')}><PlusCircle className="h-4 w-4" /></Button></div></div>

                    <div className="space-y-2"><Label>Monitoring Employee</Label><Combobox items={employees} value={maintenanceData.monitoringEmployeeId} onSelect={handleSelectChange('monitoringEmployeeId')} displayValue={(e) => e.fullName} searchValue={(e) => `${e.fullName} ${e.userIdCode}`} placeholder="Select Employee..." emptyMessage="No employee found."/></div>
                    
                    <div className="space-y-2"><Label>Service Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!serviceDate&&"text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{serviceDate?format(serviceDate,"PPP"):"Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={serviceDate} onSelect={handleDateChange(setServiceDate, 'serviceDate')} initialFocus/></PopoverContent></Popover></div>
                    <div className="space-y-2"><Label>Upcoming Service Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!upcomingServiceDate&&"text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{upcomingServiceDate?format(upcomingServiceDate,"PPP"):"Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={upcomingServiceDate} onSelect={handleDateChange(setUpcomingServiceDate, 'upcomingServiceDate')} initialFocus/></PopoverContent></Popover></div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description / Remarks</Label>
                  <Textarea id="description" value={maintenanceData.description} onChange={handleInputChange} />
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Step 2: Parts & Expenses</h3></div>
                    <div className="flex justify-between items-center border-b pb-2"><h4 className="font-medium">Parts Used</h4><Button variant="outline" size="sm" onClick={addPart}><PlusCircle className="mr-2 h-4 w-4"/>Add Part</Button></div>
                    <div className="space-y-3">
                        {parts.map((part) => (
                            <div key={part.id} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center p-2 rounded-md border">
                                <Input placeholder="Part Name" value={part.name} onChange={(e) => updatePart(part.id, 'name', e.target.value)} className="md:col-span-2" />
                                <Input placeholder="Brand" value={part.brand} onChange={(e) => updatePart(part.id, 'brand', e.target.value)} />
                                <Input placeholder="Price" type="number" value={part.price} onChange={(e) => updatePart(part.id, 'price', parseFloat(e.target.value) || 0)} />
                                <Input placeholder="Qty" type="number" value={part.quantity} onChange={(e) => updatePart(part.id, 'quantity', parseInt(e.target.value) || 0)} />
                                <Input placeholder="Warranty" value={part.warranty} onChange={(e) => updatePart(part.id, 'warranty', e.target.value)} />
                                <Button variant="ghost" size="icon" onClick={() => removePart(part.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2"><h4 className="font-medium">Expenses</h4><Button variant="outline" size="sm" onClick={addExpense}><PlusCircle className="mr-2 h-4 w-4"/>Add Expense</Button></div>
                    <div className="space-y-2">
                        {expenses.map((expense) => (
                            <div key={expense.id} className="grid grid-cols-3 gap-2 items-center">
                                <Select value={expense.expenseTypeId} onValueChange={(value) => updateExpense(expense.id, 'expenseTypeId', value)}>
                                    <SelectTrigger><SelectValue placeholder="Select Expense Type"/></SelectTrigger>
                                    <SelectContent>
                                        {maintenanceExpenseTypes.map(et => <SelectItem key={et.id} value={et.id}>{et.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Input placeholder="Amount" type="number" value={expense.amount} onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)} />
                                <Button variant="ghost" size="icon" onClick={() => removeExpense(expense.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            )}
            {step === 3 && (
                 <div className="space-y-6">
                    <div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Step 3: Upload Documents</h3><Button variant="outline" size="sm" onClick={addDocument}><PlusCircle className="mr-2 h-4 w-4"/>Add Document</Button></div>
                     <div className="space-y-4">
                        {documents.map(doc => (
                             <div key={doc.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                                <Input placeholder="Document Label (e.g., Invoice)" value={doc.label} onChange={(e) => updateDocumentLabel(doc.id, e.target.value)} />
                                <Label htmlFor={`file-upload-${doc.id}`} className="flex items-center justify-center w-full h-10 px-4 transition bg-background border rounded-md appearance-none cursor-pointer hover:border-primary text-sm text-muted-foreground">
                                    <Upload className="h-4 w-4 mr-2" /> {doc.file ? 'Change File' : 'Upload File'}
                                </Label>
                                <Input id={`file-upload-${doc.id}`} type="file" className="hidden" onChange={handleFileChange(doc.id)} />
                                 <div className="flex items-center gap-2">
                                    {doc.file && <span className="text-xs text-muted-foreground truncate">File uploaded</span>}
                                    <Button variant="ghost" size="icon" onClick={() => removeDocument(doc.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </div>
                            </div>
                        ))}
                     </div>
                 </div>
            )}
        </div>

        <DialogFooter className="flex justify-between w-full pt-4">
            {step > 1 ? (<Button variant="outline" onClick={prevStep}>Previous</Button>) : <div></div>}
            {step < 3 ? (<Button onClick={nextStep}>Next</Button>) : (<Button onClick={handleSave}>{isEditing ? 'Update Record' : 'Save Record'}</Button>)}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <QuickAddDialog
        open={isQuickAddOpen === 'maintenanceType'}
        onOpenChange={() => setIsQuickAddOpen(null)}
        onSave={handleQuickAddSave}
        title="Add New Maintenance Type"
    >
        <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={quickAddData.name || ''} onChange={(e) => setQuickAddData({...quickAddData, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Code</Label><Input value={quickAddData.code || ''} onChange={(e) => setQuickAddData({...quickAddData, code: e.target.value})} /></div>
        </div>
    </QuickAddDialog>

    <QuickAddDialog
        open={isQuickAddOpen === 'serviceCenter'}
        onOpenChange={() => setIsQuickAddOpen(null)}
        onSave={handleQuickAddSave}
        title="Add New Service Center"
    >
        <div className="space-y-4">
            <div className="space-y-2"><Label>Garage Name</Label><Input value={quickAddData.name || ''} onChange={(e) => setQuickAddData({...quickAddData, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Code</Label><Input value={quickAddData.code || ''} onChange={(e) => setQuickAddData({...quickAddData, code: e.target.value})} /></div>
            <div className="space-y-2"><Label>Owner Name</Label><Input value={quickAddData.ownerName || ''} onChange={(e) => setQuickAddData({...quickAddData, ownerName: e.target.value})} /></div>
            <div className="space-y-2"><Label>Mobile Number</Label><Input value={quickAddData.mobileNumber || ''} onChange={(e) => setQuickAddData({...quickAddData, mobileNumber: e.target.value})} /></div>
        </div>
    </QuickAddDialog>
    </>
  );
}
