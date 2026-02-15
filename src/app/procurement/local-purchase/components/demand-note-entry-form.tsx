
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useProcurement } from './procurement-provider';
import { useUser } from '@/firebase';

export type DemandNoteItem = {
    id: string;
    billItemMasterId: string;
    particulars: string;
    requiredQty: number;
    unit: string;
    remarks: string;
};

export type DemandNote = {
    id: string;
    demandNoteNumber: string;
    date: string;
    departmentId: string;
    sectionId: string;
    processCodeId: string;
    demandTypeId: string;
    deliveryPlace: string;
    contactPersonName: string;
    contactPersonNumber: string;
    budgetAmount: number;
    budgetYearAndListNo: string;
    purpose: string;
    items: DemandNoteItem[];
    remarks: string;
    createdBy: string;
};

const initialDemandNoteData: Omit<DemandNote, 'id' | 'demandNoteNumber' | 'items'> = {
    date: format(new Date(), 'yyyy-MM-dd'),
    departmentId: '',
    sectionId: '',
    processCodeId: '',
    demandTypeId: '',
    deliveryPlace: '',
    contactPersonName: '',
    contactPersonNumber: '',
    budgetAmount: 0,
    budgetYearAndListNo: '',
    purpose: '',
    remarks: '',
    createdBy: '',
};

const MandatoryIndicator = () => <span className="text-red-500 ml-1">*</span>;

interface DemandNoteEntryFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: Partial<DemandNote>) => void;
  demandNote: Partial<DemandNote> | null;
}

export function DemandNoteEntryForm({ isOpen, setIsOpen, onSave, demandNote }: DemandNoteEntryFormProps) {
    const { toast } = useToast();
    const { user } = useUser();
    const { sections, processCodes, demandTypes, billItemMasters, employees } = useProcurement();

    const [noteData, setNoteData] = useState<Omit<DemandNote, 'id' | 'demandNoteNumber' | 'items'>>(initialDemandNoteData);
    const [items, setItems] = useState<DemandNoteItem[]>([]);
    const [date, setDate] = useState<Date | undefined>(new Date());

    const isEditing = demandNote && demandNote.id;

    useEffect(() => {
        const loggedInEmployee = employees.find(e => e.email === user?.email);
        const contactPerson = loggedInEmployee ? loggedInEmployee.fullName : '';
        const contactNumber = loggedInEmployee ? loggedInEmployee.mobileNumber : '';
        const department = loggedInEmployee ? loggedInEmployee.departmentId : '';

        if (isOpen) {
            if (isEditing && demandNote) {
                setNoteData({ ...initialDemandNoteData, ...demandNote });
                setItems(demandNote.items || []);
                setDate(demandNote.date ? new Date(demandNote.date) : new Date());
            } else {
                setNoteData({
                    ...initialDemandNoteData,
                    createdBy: loggedInEmployee?.id || '',
                    contactPersonName: contactPerson,
                    contactPersonNumber: contactNumber,
                    departmentId: department
                });
                setItems([]);
                setDate(new Date());
            }
        }
    }, [isOpen, demandNote, isEditing, user, employees]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setNoteData(prev => ({...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
    
    const handleSelectChange = (id: keyof typeof noteData) => (value: string) => {
        setNoteData(prev => ({ ...prev, [id]: value }));
    }

    const handleDateChange = (newDate: Date | undefined) => {
        setDate(newDate);
        setNoteData(prev => ({...prev, date: newDate ? format(newDate, 'yyyy-MM-dd') : ''}))
    }

    // Item handlers
    const addItem = () => setItems(prev => [...prev, { id: Date.now().toString(), billItemMasterId: '', particulars: '', requiredQty: 1, unit: '', remarks: '' }]);
    const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));
    const updateItem = (id: string, field: keyof DemandNoteItem, value: string | number) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const newItem = { ...item, [field]: value };
                if (field === 'billItemMasterId') {
                    const masterItem = billItemMasters.find(m => m.id === value);
                    if (masterItem) {
                        newItem.particulars = masterItem.name;
                        newItem.unit = masterItem.unitOfMeasure;
                    }
                }
                return newItem;
            }
            return item;
        }));
    };
    
    const handleSave = () => {
        if (!noteData.departmentId || !noteData.date) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Date and Department are required.' });
            return;
        }

        const dataToSave: Partial<DemandNote> = {
            ...noteData,
            items,
            demandNoteNumber: isEditing ? demandNote.demandNoteNumber : `DN-${format(new Date(), 'ddMMyy')}-${Date.now().toString().slice(-4)}`,
        };
        
        if (isEditing) dataToSave.id = demandNote.id;
        
        onSave(dataToSave);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Demand Note' : 'Create Demand Note'}</DialogTitle>
                    <DialogDescription>Fill in the details for the requisition.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>Demand Note Number</Label><Input value={isEditing ? demandNote.demandNoteNumber : 'Auto-generated'} disabled /></div>
                        <div className="space-y-2"><Label>Date<MandatoryIndicator/></Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={handleDateChange} /></PopoverContent></Popover></div>
                        <div className="space-y-2"><Label>Department<MandatoryIndicator/></Label><Select value={noteData.departmentId} onValueChange={handleSelectChange('departmentId')}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{sections.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Section</Label><Select value={noteData.sectionId} onValueChange={handleSelectChange('sectionId')}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{sections.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Process Code</Label><Select value={noteData.processCodeId} onValueChange={handleSelectChange('processCodeId')}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{processCodes.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Demand Type</Label><Select value={noteData.demandTypeId} onValueChange={handleSelectChange('demandTypeId')}><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger><SelectContent>{demandTypes.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Delivery Place</Label><Input id="deliveryPlace" value={noteData.deliveryPlace} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label>Contact Person</Label><Input id="contactPersonName" value={noteData.contactPersonName} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label>Contact Number</Label><Input id="contactPersonNumber" value={noteData.contactPersonNumber} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label>Budget Amount</Label><Input id="budgetAmount" type="number" value={noteData.budgetAmount} onChange={handleInputChange} /></div>
                        <div className="space-y-2 md:col-span-2"><Label>Budget Year & List No.</Label><Input id="budgetYearAndListNo" value={noteData.budgetYearAndListNo} onChange={handleInputChange} /></div>
                        <div className="space-y-2 md:col-span-3"><Label>Purpose of Requisition</Label><Textarea id="purpose" value={noteData.purpose} onChange={handleInputChange} /></div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Items</h3><Button variant="outline" size="sm" onClick={addItem}><PlusCircle className="mr-2 h-4 w-4"/>Add Item</Button></div>
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                            {items.map((item, index) => (
                                <div key={item.id} className="p-3 border rounded-lg space-y-2">
                                     <div className="flex justify-between items-center"><Label className="text-base">Item {index + 1}</Label><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
                                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Particulars</Label>
                                            <Select value={item.billItemMasterId} onValueChange={(v) => updateItem(item.id, 'billItemMasterId', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select from master list..."/></SelectTrigger>
                                                <SelectContent>{billItemMasters.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Required Qty</Label>
                                            <Input type="number" value={item.requiredQty} onChange={(e) => updateItem(item.id, 'requiredQty', parseFloat(e.target.value) || 0)} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label>Unit</Label>
                                            <Input value={item.unit} disabled />
                                        </div>
                                     </div>
                                     <div className="space-y-2">
                                        <Label>Remarks/Other information</Label>
                                        <Input value={item.remarks} onChange={(e) => updateItem(item.id, 'remarks', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                            {items.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No items added yet.</p>}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>{isEditing ? 'Update Note' : 'Save Note'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
