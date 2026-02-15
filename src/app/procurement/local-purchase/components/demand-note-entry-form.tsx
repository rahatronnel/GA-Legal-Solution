
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
import { CalendarIcon, PlusCircle, Trash2, File as FileIcon, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn, imageToDataUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useProcurement } from './procurement-provider';
import { useUser } from '@/firebase';
import { Progress } from '@/components/ui/progress';

export type UploadedFile = {
  id: string;
  name: string;
  file: string; // data URL
}

export type DemandNoteItem = {
    id: string;
    billItemMasterId: string;
    particulars: string;
    requiredQty: number;
    unit: string;
    remarks: string;
    brandName?: string;
    modelNo?: string;
    otherDetails?: string;
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
    documents: {
      attachments: UploadedFile[];
    };
    approvalFlow?: {
        steps: { stepName: string; approverId: string; }[];
    };
    approvalStatus?: number;
    currentApproverId?: string;
    approvalHistory?: any[];
};

const initialDemandNoteData: Omit<DemandNote, 'id' | 'demandNoteNumber' | 'items' | 'documents'> = {
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
    const { sections, processCodes, demandTypes, billItemMasters, employees, billItemCategories, orgSettings } = useProcurement();

    const [step, setStep] = useState(1);
    const [noteData, setNoteData] = useState<Omit<DemandNote, 'id' | 'demandNoteNumber' | 'items' | 'documents'>>(initialDemandNoteData);
    const [items, setItems] = useState<DemandNoteItem[]>([]);
    const [documents, setDocuments] = useState<{ attachments: UploadedFile[] }>({ attachments: [] });
    const [date, setDate] = useState<Date | undefined>(new Date());

    const isEditing = demandNote && demandNote.id;
    const totalSteps = 2;
    const progress = Math.round((step / totalSteps) * 100);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            const loggedInEmployee = employees.find(e => e.email === user?.email);
            
            if (isEditing && demandNote) {
                setNoteData({ ...initialDemandNoteData, ...demandNote });
                setItems(demandNote.items || []);
                setDocuments(demandNote.documents || { attachments: [] });
                setDate(demandNote.date ? parseISO(demandNote.date) : new Date());
            } else {
                const today = new Date();
                const contactPerson = loggedInEmployee ? loggedInEmployee.fullName : '';
                const contactNumber = loggedInEmployee ? loggedInEmployee.mobileNumber : '';
                const department = loggedInEmployee ? loggedInEmployee.departmentId : '';

                setNoteData({
                    ...initialDemandNoteData,
                    date: format(today, 'yyyy-MM-dd'),
                    createdBy: loggedInEmployee?.id || '',
                    contactPersonName: contactPerson,
                    contactPersonNumber: contactNumber,
                    departmentId: department
                });
                setItems([]);
                setDocuments({ attachments: [] });
                setDate(today);
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
    const addItem = () => setItems(prev => [...prev, { id: Date.now().toString(), billItemMasterId: '', particulars: '', requiredQty: 1, unit: '', remarks: '', brandName: '', modelNo: '', otherDetails: '' }]);
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            try {
              const dataUrl = await imageToDataUrl(file);
              setDocuments(prev => ({ attachments: [...prev.attachments, { id: Date.now().toString(), name: file.name, file: dataUrl }] }));
            } catch (error) {
               console.error("Error processing document:", error);
               toast({ variant: 'destructive', title: 'File Error', description: `Could not process ${file.name}.` });
            }
        }
    };
    
    const removeDocument = (fileId: string) => {
        setDocuments(prev => ({ attachments: prev.attachments.filter(doc => doc.id !== fileId)}));
    };
    
    const validateStep1 = () => {
        if (!noteData.departmentId || !noteData.date) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Date and Department are required.' });
            return false;
        }
        return true;
    }

    const nextStep = () => {
        if (!validateStep1()) return;
        setStep(s => s + 1);
    };
    const prevStep = () => setStep(s => s - 1);
    
    const handleSave = () => {
        if (!validateStep1()) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please go back and fill in all required fields.'});
            return;
        }

        const dataToSave: Partial<DemandNote> = {
            ...noteData,
            items,
            documents,
            demandNoteNumber: isEditing ? demandNote.demandNoteNumber : `DN-${format(new Date(), 'ddMMyy')}-${Date.now().toString().slice(-4)}`,
        };
        
        if (!isEditing && orgSettings?.procurementSettings) {
            const creator = employees.find(e => e.id === noteData.createdBy);
            const department = sections.find(s => s.id === creator?.departmentId);

            const hasSpecialItem = items.some(item => {
                const masterItem = billItemMasters.find(m => m.id === item.billItemMasterId);
                if (!masterItem) return false;
                const category = billItemCategories.find(c => c.id === masterItem.billItemCategoryId);
                return category?.isSpecial === true;
            });

            const approvalFlowSteps = [];
            const { departmentHeads, managingDirectorId, factoryDirectorId, manufacturingDeptManagerId, specializedDeptManagerId } = orgSettings.procurementSettings;
            
            const deptApprovers = departmentHeads.find(dh => dh.sectionId === department?.id);
            const deptHeadId = deptApprovers?.headId;
            const techAdvisorId = deptApprovers?.technicalAdvisorId;

            if (hasSpecialItem) {
                if (deptHeadId) approvalFlowSteps.push({ stepName: 'Department Head', approverId: deptHeadId });
                if (techAdvisorId) approvalFlowSteps.push({ stepName: 'Technical Advisor', approverId: techAdvisorId });
                if (specializedDeptManagerId) approvalFlowSteps.push({ stepName: 'Specialized Dept. Manager', approverId: specializedDeptManagerId });
                if (managingDirectorId) approvalFlowSteps.push({ stepName: 'Managing Director', approverId: managingDirectorId });
            } else if (department?.isManufacturingDept) {
                if (deptHeadId) approvalFlowSteps.push({ stepName: 'Department Head', approverId: deptHeadId });
                if (techAdvisorId) approvalFlowSteps.push({ stepName: 'Technical Advisor', approverId: techAdvisorId });
                if (manufacturingDeptManagerId) approvalFlowSteps.push({ stepName: 'Manufacturing Dept. Manager', approverId: manufacturingDeptManagerId });
            } else {
                if (deptHeadId) approvalFlowSteps.push({ stepName: 'Department Head', approverId: deptHeadId });
                if (techAdvisorId) approvalFlowSteps.push({ stepName: 'Technical Advisor', approverId: techAdvisorId });
            }

            dataToSave.approvalFlow = { steps: approvalFlowSteps };
            dataToSave.currentApproverId = approvalFlowSteps[0]?.approverId || '';
            dataToSave.approvalStatus = 2; // Pending
            dataToSave.approvalHistory = [];
        }

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
                    <Progress value={progress} className="w-full mt-2" />
                </DialogHeader>
                <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-6">
                    {step === 1 && (
                        <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>Demand Note Number</Label><Input value={isEditing ? demandNote.demandNoteNumber : 'Auto-generated'} disabled /></div>
                            <div className="space-y-2"><Label>Date<MandatoryIndicator/></Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={handleDateChange} /></PopoverContent></Popover></div>
                            <div className="space-y-2">
                                <Label>Department<MandatoryIndicator/></Label>
                                <Select value={noteData.departmentId} onValueChange={handleSelectChange('departmentId')} disabled>
                                    <SelectTrigger><SelectValue placeholder="Auto-selected based on user"/></SelectTrigger>
                                    <SelectContent>{sections.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
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
                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Brand Name</Label>
                                                <Input value={item.brandName || ''} onChange={(e) => updateItem(item.id, 'brandName', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Model No.</Label>
                                                <Input value={item.modelNo || ''} onChange={(e) => updateItem(item.id, 'modelNo', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Other Necessary Details</Label>
                                                <Input value={item.otherDetails || ''} onChange={(e) => updateItem(item.id, 'otherDetails', e.target.value)} />
                                            </div>
                                         </div>
                                         <div className="space-y-2">
                                            <Label>Remarks</Label>
                                            <Input value={item.remarks} onChange={(e) => updateItem(item.id, 'remarks', e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                                {items.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No items added yet.</p>}
                            </div>
                        </div>
                        </>
                    )}
                     {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-lg">Step 2: Attachments (Optional)</h3>
                            <div className="space-y-2 p-3 border rounded-lg">
                                <div className="flex justify-between items-center">
                                    <Label className="font-medium">Attachments</Label>
                                    <Label htmlFor="file-upload-attachments" className="cursor-pointer text-sm text-primary hover:underline">Add File(s)</Label>
                                    <Input id="file-upload-attachments" type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                                </div>
                                <div className="space-y-1">
                                    {(documents.attachments || []).map(file => (
                                        <div key={file.id} className="flex items-center justify-between text-sm p-1.5 bg-muted rounded-md">
                                            <div className="flex items-center gap-2 truncate"><FileIcon className="h-4 w-4 flex-shrink-0" /><span className="truncate">{file.name}</span></div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDocument(file.id)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                    {(documents.attachments || []).length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No files uploaded.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="flex justify-between w-full pt-4 border-t">
                    <div>{step > 1 && <Button variant="outline" onClick={prevStep}>Previous</Button>}</div>
                    <div>{step < totalSteps ? <Button onClick={nextStep}>Next</Button> : <Button onClick={handleSave}>{isEditing ? 'Update Note' : 'Save Note'}</Button>}</div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
