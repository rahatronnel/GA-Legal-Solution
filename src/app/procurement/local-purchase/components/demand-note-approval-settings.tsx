"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import { useProcurement } from './procurement-provider';

type ApprovalStep = {
    stepName: string;
    approverId: string;
    statusName: string;
};

const hardcodedSteps: { [key: number]: Omit<ApprovalStep, 'approverId'>[] } = {
    1: [{ stepName: 'Final Approver', statusName: 'Completed' }],
    2: [{ stepName: 'Initiator', statusName: 'Reviewed' }, { stepName: 'Final Approver', statusName: 'Completed' }],
    3: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Reviewer', statusName: 'Reviewed' }, { stepName: 'Final Approver', statusName: 'Approved' }],
    // Add more if needed
};

export function DemandNoteApprovalSettings() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { employees, orgSettings, isLoading } = useProcurement();

    const settingsDocRef = useMemo(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);

    const [numberOfSteps, setNumberOfSteps] = useState(1);
    const [steps, setSteps] = useState<ApprovalStep[]>([]);
    const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(new Date());

    useEffect(() => {
        if (orgSettings?.demandNoteApprovalFlow && orgSettings.demandNoteApprovalFlow.steps) {
            const flow = orgSettings.demandNoteApprovalFlow;
            setNumberOfSteps(flow.steps.length);
            setSteps(flow.steps);
            setEffectiveDate(flow.effectiveDate ? new Date(flow.effectiveDate) : new Date());
        } else {
            const defaultFlow = hardcodedSteps[1] || [];
            setNumberOfSteps(1);
            setSteps(defaultFlow.map(s => ({ ...s, approverId: '' })));
            setEffectiveDate(new Date());
        }
    }, [orgSettings]);

    const handleNumberOfStepsChange = (value: string) => {
        const num = parseInt(value, 10);
        if (num > 0 && num <= 10) {
            setNumberOfSteps(num);
            const newFlowConfig = hardcodedSteps[num] || Array.from({length: num}, (_,i) => ({ stepName: `Approver ${i+1}`, statusName: `Level ${i+1} Approved` }));
            const newSteps = newFlowConfig.map(s => ({
                stepName: s.stepName,
                statusName: s.statusName,
                approverId: '',
            }));
            setSteps(newSteps);
        }
    };

    const handleApproverChange = (index: number, employeeId: string) => {
        const newSteps = [...steps];
        newSteps[index].approverId = employeeId;
        setSteps(newSteps);
    };

    const handleSave = () => {
        if (!settingsDocRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            return;
        }
        if (steps.some(step => !step.approverId)) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select an employee for each approval step.' });
            return;
        }
        if (!effectiveDate) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select an effective date.' });
            return;
        }

        const demandNoteApprovalFlow = {
            effectiveDate: format(effectiveDate, 'yyyy-MM-dd'),
            steps: steps,
        };

        setDocumentNonBlocking(settingsDocRef, { demandNoteApprovalFlow }, { merge: true });
        toast({ title: 'Success', description: 'Demand Note approval flow saved.' });
    };

    if (isLoading) {
        return <p>Loading settings...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Demand Note Approval Flow</CardTitle>
                <CardDescription>
                    Define the sequence of employees for the demand note approval process.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Number of Approval Steps</Label>
                        <Select value={String(numberOfSteps)} onValueChange={handleNumberOfStepsChange}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                                    <SelectItem key={num} value={String(num)}>{num} Step{num > 1 ? 's' : ''}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Effective Date</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!effectiveDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4"/>{effectiveDate ? format(effectiveDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={effectiveDate} onSelect={setEffectiveDate} initialFocus/></PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-3 border rounded-lg">
                            <div className="flex-grow w-full space-y-2">
                                <Label>Step {index + 1}: Step Name</Label>
                                <Input value={step.stepName} disabled />
                            </div>
                             <div className="flex-grow w-full space-y-2">
                                <Label>Status After Approval</Label>
                                <Input value={step.statusName} disabled />
                            </div>
                            <div className="flex-grow w-full space-y-2">
                                <Label>Approver</Label>
                                <Select value={step.approverId} onValueChange={(value) => handleApproverChange(index, value)}>
                                    <SelectTrigger><SelectValue placeholder="Select an employee..." /></SelectTrigger>
                                    <SelectContent>
                                        {(employees || []).map(emp => (
                                            <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-4">
                    <Button onClick={handleSave}>Save Approval Flow</Button>
                </div>
            </CardContent>
        </Card>
    );
}
