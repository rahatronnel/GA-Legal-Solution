
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Section } from '@/app/user-management/components/section-table';
import { useProcurement } from './procurement-provider';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

type DeptHead = {
    sectionId: string;
    headId: string;
    technicalAdvisorId: string;
};

const Combobox: React.FC<{
    items: Employee[];
    value: string;
    onSelect: (value: string) => void;
    placeholder: string;
}> = ({ items, value, onSelect, placeholder }) => {
    const [open, setOpen] = useState(false);
    const selectedEmployee = items.find(emp => emp.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedEmployee ? `${selectedEmployee.fullName} (${selectedEmployee.userIdCode})` : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search employee by name or code..." />
                    <CommandList>
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup>
                            {items.map(employee => (
                                <CommandItem
                                    key={employee.id}
                                    value={`${employee.fullName} ${employee.userIdCode}`}
                                    onSelect={() => {
                                        onSelect(employee.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === employee.id ? "opacity-100" : "opacity-0")} />
                                    {employee.fullName} ({employee.userIdCode})
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const MultiSelectPopover: React.FC<{
    items: Employee[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    placeholder: string;
}> = ({ items, selectedIds, onSelectionChange, placeholder }) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (id: string) => {
        const newSelectedIds = selectedIds.includes(id)
            ? selectedIds.filter(selectedId => selectedId !== id)
            : [...selectedIds, id];
        onSelectionChange(newSelectedIds);
    };

    const selectedEmployees = items.filter(item => selectedIds.includes(item.id));

    return (
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-10">
                    <div className="flex flex-wrap gap-1">
                        {selectedEmployees.length > 0
                            ? selectedEmployees.map(emp => <Badge key={emp.id} variant="secondary">{emp.fullName} ({emp.userIdCode})</Badge>)
                            : placeholder
                        }
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search employees by name or code..." />
                     <ScrollArea className="h-48">
                        <CommandList>
                        <CommandEmpty>No employees found.</CommandEmpty>
                        <CommandGroup>
                            {items.map(employee => (
                                <CommandItem
                                    key={employee.id}
                                    value={`${employee.fullName} ${employee.userIdCode}`}
                                    onSelect={() => handleSelect(employee.id)}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", selectedIds.includes(employee.id) ? "opacity-100" : "opacity-0")} />
                                    {employee.fullName} ({employee.userIdCode})
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        </CommandList>
                     </ScrollArea>
                </Command>
            </PopoverContent>
        </Popover>
    );
};


export function DemandNoteApprovalSettings() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { employees, sections, orgSettings, isLoading } = useProcurement();

    const settingsDocRef = useMemo(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);

    const [departmentHeads, setDepartmentHeads] = useState<DeptHead[]>([]);
    const [managingDirectorId, setManagingDirectorId] = useState('');
    const [factoryDirectorId, setFactoryDirectorId] = useState('');
    const [manufacturingDeptManagerId, setManufacturingDeptManagerId] = useState('');
    const [specializedDeptManagerId, setSpecializedDeptManagerId] = useState('');
    const [generalPurchaseOfficerId, setGeneralPurchaseOfficerId] = useState('');
    const [gpConcernOfficerIds, setGpConcernOfficerIds] = useState<string[]>([]);

    useEffect(() => {
        if (orgSettings?.procurementSettings) {
            const settings = orgSettings.procurementSettings;
            setDepartmentHeads(settings.departmentHeads || []);
            setManagingDirectorId(settings.managingDirectorId || '');
            setFactoryDirectorId(settings.factoryDirectorId || '');
            setManufacturingDeptManagerId(settings.manufacturingDeptManagerId || '');
            setSpecializedDeptManagerId(settings.specializedDeptManagerId || '');
            setGeneralPurchaseOfficerId(settings.generalPurchaseOfficerId || '');
            setGpConcernOfficerIds(settings.gpConcernOfficerIds || []);
        }
    }, [orgSettings]);

    const handleDeptHeadChange = (sectionId: string, role: 'headId' | 'technicalAdvisorId', employeeId: string) => {
        setDepartmentHeads(prev => {
            const existingIndex = prev.findIndex(dh => dh.sectionId === sectionId);
            
            if (existingIndex !== -1) {
                const updatedHeads = [...prev];
                const existingEntry = updatedHeads[existingIndex];
                updatedHeads[existingIndex] = { ...existingEntry, [role]: employeeId };
                return updatedHeads;
            }
            
            const newEntry: DeptHead = {
                sectionId,
                headId: role === 'headId' ? employeeId : '',
                technicalAdvisorId: role === 'technicalAdvisorId' ? employeeId : '',
            };
            return [...prev, newEntry];
        });
    };
    
    const handleSave = () => {
        if (!settingsDocRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            return;
        }

        const procurementSettings = {
            departmentHeads,
            managingDirectorId,
            factoryDirectorId,
            manufacturingDeptManagerId,
            specializedDeptManagerId,
            generalPurchaseOfficerId,
            gpConcernOfficerIds,
        };

        setDocumentNonBlocking(settingsDocRef, { procurementSettings }, { merge: true });
        toast({ title: 'Success', description: 'Procurement settings saved.' });
    };

    if (isLoading) {
        return <p>Loading settings...</p>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Demand Note Approval Roles</CardTitle>
                    <CardDescription>
                        Assign department heads, advisors, and key roles for the procurement approval process.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div>
                        <h3 className="text-lg font-medium mb-4">Department Heads & Advisors</h3>
                        <div className="space-y-4">
                            {(sections || []).map(section => (
                                <div key={section.id} className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] items-center gap-4 p-3 border rounded-lg">
                                    <Label className="font-semibold">{section.name}</Label>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Department Head</Label>
                                        <Combobox
                                            items={employees || []}
                                            value={departmentHeads.find(dh => dh.sectionId === section.id)?.headId || ''}
                                            onSelect={(employeeId) => handleDeptHeadChange(section.id, 'headId', employeeId)}
                                            placeholder="Select Head..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Technical Advisor</Label>
                                        <Combobox
                                            items={employees || []}
                                            value={departmentHeads.find(dh => dh.sectionId === section.id)?.technicalAdvisorId || ''}
                                            onSelect={(employeeId) => handleDeptHeadChange(section.id, 'technicalAdvisorId', employeeId)}
                                            placeholder="Select Advisor..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium mb-4">Key Roles</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="font-semibold">Managing Director</Label>
                                <Combobox
                                    items={employees || []}
                                    value={managingDirectorId}
                                    onSelect={setManagingDirectorId}
                                    placeholder="Select Managing Director..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Factory Director</Label>
                                <Combobox
                                    items={employees || []}
                                    value={factoryDirectorId}
                                    onSelect={setFactoryDirectorId}
                                    placeholder="Select Factory Director..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Manufacturing Dept Manager</Label>
                                <Combobox
                                    items={employees || []}
                                    value={manufacturingDeptManagerId}
                                    onSelect={setManufacturingDeptManagerId}
                                    placeholder="Select Manufacturing Dept Manager..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Specialized Dept. Manager</Label>
                                <Combobox
                                    items={employees || []}
                                    value={specializedDeptManagerId}
                                    onSelect={setSpecializedDeptManagerId}
                                    placeholder="Select Specialized Dept. Manager..."
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>General Purchase (GP) Settings</CardTitle>
                    <CardDescription>Assign roles for the post-approval purchasing process.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label className="font-semibold">General Purchase (GP) Officer</Label>
                            <Combobox
                                items={employees || []}
                                value={generalPurchaseOfficerId}
                                onSelect={setGeneralPurchaseOfficerId}
                                placeholder="Select GP Officer..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-semibold">GP Concern Officers</Label>
                            <MultiSelectPopover
                                items={employees || []}
                                selectedIds={gpConcernOfficerIds}
                                onSelectionChange={setGpConcernOfficerIds}
                                placeholder="Select one or more concern officers..."
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button onClick={handleSave}>Save All Settings</Button>
            </div>
        </div>
    );
}
