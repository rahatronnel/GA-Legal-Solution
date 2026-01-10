
"use client";

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Search, ChevronsUpDown, AlertCircle, Info, X, Check, CalendarIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useBillData } from './bill-flow-provider';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandList, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';


export type AlternativeApprover = {
  id: string; // Employee ID
};

export type ApproverLevel = {
    id: string;
    level: number;
    approverId: string;
    escalationTimeoutDays?: number;
    alternativeApprovers?: AlternativeApprover[];
};

export type ApprovalRule = {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  effectiveDate?: string;
  approverLevels: ApproverLevel[];
};

const initialFormData: Omit<ApprovalRule, 'id' | 'approverLevels'> = {
    name: '',
    minAmount: 0,
    maxAmount: 0,
    effectiveDate: '',
};

export function ApprovalConfigTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const dataRef = useMemoFirebase(() => firestore ? collection(firestore, 'approvalRules') : null, [firestore]);
  const { data: rules, isLoading } = useCollection<ApprovalRule>(dataRef);
  const { employees, isLoading: isLoadingEmployees } = useBillData();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ApprovalRule> | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [approverLevels, setApproverLevels] = useState<ApproverLevel[]>([]);
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null);

  const safeRules = useMemo(() => Array.isArray(rules) ? rules : [], [rules]);

  const getApproverName = (approverId: string) => {
    return employees.find(e => e.id === approverId)?.fullName || 'N/A';
  }

  const filteredItems = useMemo(() => {
    if (!searchTerm) return safeRules;
    const lowercasedTerm = searchTerm.toLowerCase();
    return safeRules.filter(rule => 
        rule.name.toLowerCase().includes(lowercasedTerm)
    );
  }, [safeRules, searchTerm]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
  };
  
  const handleDateChange = (date: Date | undefined) => {
      setEffectiveDate(date);
      setFormData(prev => ({ ...prev, effectiveDate: date ? format(date, 'yyyy-MM-dd') : ''}));
  }

  const addApproverLevel = () => {
    const nextLevel = approverLevels.length > 0 ? Math.max(...approverLevels.map(l => l.level)) + 1 : 1;
    setApproverLevels(prev => [...prev, { id: Date.now().toString(), level: nextLevel, approverId: '', alternativeApprovers: [] }]);
  }
  const removeApproverLevel = (id: string) => setApproverLevels(prev => prev.filter(l => l.id !== id));
  
  const updateApproverLevel = (id: string, field: keyof ApproverLevel, value: any) => {
      setApproverLevels(prev => prev.map(level => level.id === id ? { ...level, [field]: value } : level));
  }
  
  const addAlternative = (levelId: string) => {
      setApproverLevels(prev => prev.map(level => {
          if (level.id === levelId) {
              const newAlts = [...(level.alternativeApprovers || []), {id: ''}];
              return {...level, alternativeApprovers: newAlts};
          }
          return level;
      }));
  };

  const updateAlternative = (levelId: string, altIndex: number, approverId: string) => {
       setApproverLevels(prev => prev.map(level => {
           if(level.id === levelId) {
               const newAlts = [...(level.alternativeApprovers || [])];
               newAlts[altIndex] = { id: approverId };
               return {...level, alternativeApprovers: newAlts};
           }
           return level;
       }));
  };
  
  const removeAlternative = (levelId: string, altIndex: number) => {
      setApproverLevels(prev => prev.map(level => {
           if(level.id === levelId) {
               const newAlts = (level.alternativeApprovers || []).filter((_, i) => i !== altIndex);
               return {...level, alternativeApprovers: newAlts};
           }
           return level;
      }));
  }

  const resetForm = () => {
    setCurrentItem(null);
    setFormData(initialFormData);
    setApproverLevels([]);
    setEffectiveDate(undefined);
  }

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (item: ApprovalRule) => {
    setCurrentItem(item);
    setFormData({ name: item.name, minAmount: item.minAmount, maxAmount: item.maxAmount, effectiveDate: item.effectiveDate || '' });
    setApproverLevels(item.approverLevels.map(l => ({...l, alternativeApprovers: l.alternativeApprovers || []})));
    setEffectiveDate(item.effectiveDate ? parseISO(item.effectiveDate) : undefined);
    setIsDialogOpen(true);
  };

  const handleDelete = (item: ApprovalRule) => {
    setCurrentItem(item);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (currentItem?.id && dataRef) {
        deleteDocumentNonBlocking(doc(dataRef, currentItem.id));
        toast({ title: 'Success', description: 'Approval rule deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!formData.name.trim() || formData.maxAmount <= 0 || formData.maxAmount < formData.minAmount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Rule name and valid amount range are required.' });
      return;
    }
    if (approverLevels.length === 0 || approverLevels.some(l => !l.approverId)) {
      toast({ variant: 'destructive', title: 'Error', description: 'At least one primary approver must be assigned to each level.' });
      return;
    }
    if (!dataRef) return;

    const sortedApprovers = [...approverLevels].sort((a,b) => a.level - b.level);

    const dataToSave = { ...formData, approverLevels: sortedApprovers };

    if (currentItem?.id) {
      setDocumentNonBlocking(doc(dataRef, currentItem.id), dataToSave, { merge: true });
      toast({ title: 'Success', description: 'Approval rule updated successfully.' });
    } else {
      addDocumentNonBlocking(dataRef, dataToSave);
      toast({ title: 'Success', description: 'Approval rule added successfully.' });
    }

    setIsDialogOpen(false);
    resetForm();
  };


  return (
    <TooltipProvider>
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by rule name..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Rule</Button>
            </div>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Amount Range</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Approvers</TableHead>
                    <TableHead>Escalation Policy</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading || isLoadingEmployees ? (
                    Array.from({length: 3}).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/4" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 float-right" /></TableCell>
                      </TableRow>
                    ))
                ) : filteredItems && filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.minAmount.toFixed(2)} - {item.maxAmount.toFixed(2)}</TableCell>
                        <TableCell>{item.effectiveDate ? format(parseISO(item.effectiveDate), 'PPP') : 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                           {item.approverLevels.map(l => `L${l.level}: ${getApproverName(l.approverId)}`).join(', ')}
                        </TableCell>
                        <TableCell>
                           {item.approverLevels.some(l => l.escalationTimeoutDays && l.escalationTimeoutDays > 0) ? <Check className="h-5 w-5 text-green-500"/> : <X className="h-5 w-5 text-muted-foreground"/>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit Rule</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Delete Rule</TooltipContent></Tooltip>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No approval rules found.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{currentItem?.id ? 'Edit' : 'Add'} Approval Rule</DialogTitle>
            <DialogDescription>
              {currentItem?.id ? 'Update the details.' : 'Create a new approval rule, including escalation policies.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Rule Name<span className="text-red-500">*</span></Label>
                    <Input id="name" value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="effectiveDate">Effective Date</Label>
                    <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{effectiveDate ? format(effectiveDate, "PPP") : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={effectiveDate} onSelect={handleDateChange} /></PopoverContent></Popover>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="minAmount">Minimum Amount<span className="text-red-500">*</span></Label>
                <Input id="minAmount" type="number" value={formData.minAmount} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="maxAmount">Maximum Amount<span className="text-red-500">*</span></Label>
                <Input id="maxAmount" type="number" value={formData.maxAmount} onChange={handleInputChange} />
                </div>
            </div>
            <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center"><h3 className="font-medium">Approver Levels & Escalation</h3><Button variant="outline" size="sm" onClick={addApproverLevel}><PlusCircle className="mr-2 h-4 w-4"/>Add Level</Button></div>
                <div className="space-y-3">
                    {approverLevels.map(level => (
                        <div key={level.id} className="p-4 border rounded-lg space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="font-semibold">Level {level.level}</Label>
                                <Button variant="ghost" size="icon" onClick={() => removeApproverLevel(level.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                                <div className="space-y-1">
                                    <Label>Primary Approver<span className="text-red-500">*</span></Label>
                                    <Select value={level.approverId} onValueChange={(value) => updateApproverLevel(level.id, 'approverId', value)}>
                                        <SelectTrigger><SelectValue placeholder="Select Approver" /></SelectTrigger>
                                        <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="flex items-center gap-1">Timeout (Days) <Tooltip><TooltipTrigger><Info className="h-3 w-3"/></TooltipTrigger><TooltipContent>Days before escalating to the first alternative.</TooltipContent></Tooltip></Label>
                                    <Input type="number" value={level.escalationTimeoutDays || ''} onChange={(e) => updateApproverLevel(level.id, 'escalationTimeoutDays', e.target.value ? parseInt(e.target.value) : undefined)} className="w-24"/>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between items-center"><Label className="font-medium">Alternative Approvers (in order)</Label><Button variant="outline" size="sm" onClick={() => addAlternative(level.id)}><PlusCircle className="mr-2 h-4 w-4"/>Add Alternative</Button></div>
                                 {(level.alternativeApprovers || []).map((alt, altIndex) => (
                                     <div key={altIndex} className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">{altIndex + 1}.</span>
                                        <Select value={alt.id} onValueChange={(value) => updateAlternative(level.id, altIndex, value)}>
                                            <SelectTrigger><SelectValue placeholder="Select Alternative..." /></SelectTrigger>
                                            <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Button variant="ghost" size="icon" onClick={() => removeAlternative(level.id, altIndex)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                     </div>
                                 ))}
                                 {(level.alternativeApprovers || []).length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No alternative approvers configured.</p>}
                            </div>
                        </div>
                    ))}
                    {approverLevels.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No approver levels added.</p>}
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete "{currentItem?.name}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}

    