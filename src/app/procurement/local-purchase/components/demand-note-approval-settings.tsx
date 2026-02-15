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
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type DeptHead = {
    sectionId: string;
    headId: string;
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
                    {selectedEmployee ? selectedEmployee.fullName : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search employee..." />
                    <CommandEmpty>No employee found.</CommandEmpty>
                    <CommandList>
                    <CommandGroup>
                        {items.map(employee => (
                            <CommandItem
                                key={employee.id}
                                value={employee.fullName}
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

export function DemandNoteApprovalSettings() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { employees, sections, orgSettings, isLoading } = useProcurement();

    const settingsDocRef = useMemo(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);

    const [departmentHeads, setDepartmentHeads] = useState<DeptHead[]>([]);
    const [managingDirectorId, setManagingDirectorId] = useState('');
    const [factoryDirectorId, setFactoryDirectorId] = useState('');

    useEffect(() => {
        if (orgSettings?.procurementSettings) {
            setDepartmentHeads(orgSettings.procurementSettings.departmentHeads || []);
            setManagingDirectorId(orgSettings.procurementSettings.managingDirectorId || '');
            setFactoryDirectorId(orgSettings.procurementSettings.factoryDirectorId || '');
        }
    }, [orgSettings]);

    const handleDeptHeadChange = (sectionId: string, headId: string) => {
        setDepartmentHeads(prev => {
            const existing = prev.find(dh => dh.sectionId === sectionId);
            if (existing) {
                return prev.map(dh => dh.sectionId === sectionId ? { ...dh, headId } : dh);
            }
            return [...prev, { sectionId, headId }];
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
        };

        setDocumentNonBlocking(settingsDocRef, { procurementSettings }, { merge: true });
        toast({ title: 'Success', description: 'Procurement settings saved.' });
    };

    if (isLoading) {
        return <p>Loading settings...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Procurement Approval Configuration</CardTitle>
                <CardDescription>
                    Assign department heads and key roles for the procurement approval process.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div>
                    <h3 className="text-lg font-medium mb-4">Department Heads</h3>
                    <div className="space-y-4">
                        {(sections || []).map(section => (
                            <div key={section.id} className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-4 p-3 border rounded-lg">
                                <Label className="font-semibold">{section.name}</Label>
                                <Combobox
                                    items={employees || []}
                                    value={departmentHeads.find(dh => dh.sectionId === section.id)?.headId || ''}
                                    onSelect={(employeeId) => handleDeptHeadChange(section.id, employeeId)}
                                    placeholder="Select Department Head..."
                                />
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
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button onClick={handleSave}>Save Settings</Button>
                </div>
            </CardContent>
        </Card>
    );
}
