
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon, Settings, User, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VendorCategoryTable } from "./components/vendor-category-table";
import { VendorNatureOfBusinessTable } from "./components/vendor-nature-of-business-table";
import { VendorTable } from "./components/vendor-table";
import { BillTypeTable } from "./components/bill-type-table";
import { BillCategoryTable } from "./components/bill-category-table";
import { BillTable } from "./components/bill-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasterDataProvider } from "./components/bill-flow-provider";
import { BillItemMasterTable } from "./components/bill-item-master-table";
import { BillItemCategoryTable } from "./components/bill-item-category-table";
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useCollection } from "@/firebase";
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { doc, collection } from 'firebase/firestore';
import type { OrganizationSettings } from '../settings/page';
import type { Employee } from '../user-management/components/employee-entry-form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { ModuleHeader } from '@/app/components/module-header';
import { BillFlowDashboard } from './components/dashboard';
import BillFlowReportsPage from './reports/page';

type ApprovalStep = {
    stepName: string;
    approverId: string;
    statusName: string;
};

const hardcodedSteps: { [key: number]: Omit<ApprovalStep, 'approverId'>[] } = {
    1: [{ stepName: 'Final Approver', statusName: 'Completed' }],
    2: [{ stepName: 'Initiator', statusName: 'Reviewed' }, { stepName: 'Final Approver', statusName: 'Completed' }],
    3: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Reviewer', statusName: 'Reviewed' }, { stepName: 'Final Approver', statusName: 'Approved' }],
    4: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Checked' }, { stepName: 'Final Approver', statusName: 'Approved' }],
    5: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Checked' }, { stepName: 'Compliance Officer', statusName: 'Validated' }, { stepName: 'Final Approver', statusName: 'Approved' }],
    6: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Checked' }, { stepName: 'Pre-Approval Officer', statusName: 'Validated' }, { stepName: 'Compliance Officer', statusName: 'Confirmed' }, { stepName: 'Final Approver', statusName: 'Approved' }],
    7: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Checked' }, { stepName: 'Pre-Approval Officer', statusName: 'Validated' }, { stepName: 'Compliance Officer', statusName: 'Confirmed' }, { stepName: 'Department Head', statusName: 'Authorized' }, { stepName: 'Final Approver', statusName: 'Approved' }],
    8: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Checked' }, { stepName: 'Pre-Approval Officer', statusName: 'Validated' }, { stepName: 'Compliance Officer', statusName: 'Confirmed' }, { stepName: 'Department Head', statusName: 'Authorized' }, { stepName: 'Financial Reviewer', statusName: 'Endorsed' }, { stepName: 'Final Approver', statusName: 'Approved' }],
    9: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Checked' }, { stepName: 'Pre-Approval Officer', statusName: 'Validated' }, { stepName: 'Compliance Officer', statusName: 'Confirmed' }, { stepName: 'Department Head', statusName: 'Authorized' }, { stepName: 'Financial Reviewer', statusName: 'Endorsed' }, { stepName: 'Senior Reviewer', statusName: 'Approved' }, { stepName: 'Final Approver', statusName: 'Final Approval' }],
    10: [{ stepName: 'Initiator', statusName: 'Pending Review' }, { stepName: 'Validator', statusName: 'Reviewed' }, { stepName: 'Reviewer', statusName: 'Reviewed' }, { stepName: 'Pre-Approval Officer', statusName: 'Checked' }, { stepName: 'Compliance Officer', statusName: 'Validated' }, { stepName: 'Department Head', statusName: 'Confirmed' }, { stepName: 'Financial Reviewer', statusName: 'Authorized' }, { stepName: 'Senior Reviewer', statusName: 'Endorsed' }, { stepName: 'Executive Approver', statusName: 'Approved' }, { stepName: 'Final Approver', statusName: 'Completed' }]
};

function ApprovalSettingsTab() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
    const { data: orgSettings, isLoading: isLoadingSettings } = useDoc<OrganizationSettings>(settingsDocRef);
    
    const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);

    const [numberOfSteps, setNumberOfSteps] = useState(1);
    const [steps, setSteps] = useState<ApprovalStep[]>([]);
    const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(new Date());

    useEffect(() => {
        if (orgSettings?.approvalFlow && orgSettings.approvalFlow.steps) {
            const flow = orgSettings.approvalFlow;
            setNumberOfSteps(flow.steps.length);
            setSteps(flow.steps);
            setEffectiveDate(flow.effectiveDate ? new Date(flow.effectiveDate) : new Date());
        } else {
            // Default to 1 step if no flow is set
            const defaultFlow = hardcodedSteps[1] || [];
            setNumberOfSteps(1);
            setSteps(defaultFlow.map(s => ({...s, approverId: ''})));
            setEffectiveDate(new Date());
        }
    }, [orgSettings]);

    const handleNumberOfStepsChange = (value: string) => {
        const num = parseInt(value, 10);
        if (num > 0 && num <= 10) {
            setNumberOfSteps(num);
            const newFlowConfig = hardcodedSteps[num] || [];
            const newSteps = newFlowConfig.map(s => ({
                stepName: s.stepName,
                statusName: s.statusName,
                approverId: '', // Reset approver on change
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

        const approvalFlow = {
            effectiveDate: format(effectiveDate, 'yyyy-MM-dd'),
            steps: steps,
        };

        setDocumentNonBlocking(settingsDocRef, { approvalFlow }, { merge: true });
        toast({ title: 'Success', description: 'Approval flow saved.' });
    };

    if (isLoadingSettings || isLoadingEmployees) {
        return <p>Loading settings...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bill Approval Flow</CardTitle>
                <CardDescription>
                    Define the sequence of employees for the bill approval process.
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

export default function BillFlowPage() {
    return (
      <div className="space-y-6">
        <ModuleHeader />
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="master">Master Data</TabsTrigger>
              <TabsTrigger value="approval-settings">Approval Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <Card>
                <CardHeader>
                    <CardTitle>BillFlow Dashboard</CardTitle>
                    <CardDescription>A quick overview of your billing activities.</CardDescription>
                </CardHeader>
                <CardContent>
                  <BillFlowDashboard />
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bills">
            <Card>
                <CardHeader>
                    <CardTitle>Bills</CardTitle>
                    <CardDescription>Manage all submitted bills and their approval status.</CardDescription>
                </CardHeader>
                <CardContent>
                  <BillTable />
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="vendors">
            <Card>
                <CardHeader>
                    <CardTitle>Vendors</CardTitle>
                    <CardDescription>Manage your organization's vendors and their information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <VendorTable />
                </CardContent>
            </Card>
          </TabsContent>
           <TabsContent value="reports">
             <BillFlowReportsPage />
          </TabsContent>
          <TabsContent value="master" className="space-y-6">
            <MasterDataProvider>
              <Tabs defaultValue="bill-items" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="bill-items">Bill Items</TabsTrigger>
                  <TabsTrigger value="bill-item-categories">Bill Item Categories</TabsTrigger>
                  <TabsTrigger value="vendor-categories">Vendor Categories</TabsTrigger>
                  <TabsTrigger value="vendor-nature">Vendor Nature of Business</TabsTrigger>
                  <TabsTrigger value="bill-types">Bill Types</TabsTrigger>
                  <TabsTrigger value="bill-categories">Bill Categories</TabsTrigger>
                </TabsList>
                <TabsContent value="bill-items" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle>Bill Items</CardTitle><CardDescription>Manage the master list of billable items and services.</CardDescription></CardHeader>
                    <CardContent><BillItemMasterTable /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="bill-item-categories" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle>Bill Item Categories</CardTitle><CardDescription>Manage categories for your billable items.</CardDescription></CardHeader>
                    <CardContent><BillItemCategoryTable /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="vendor-categories" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle>Vendor Categories</CardTitle><CardDescription>Manage the categories for your vendors.</CardDescription></CardHeader>
                    <CardContent><VendorCategoryTable /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="vendor-nature" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle>Vendor Nature of Business</CardTitle><CardDescription>Manage the nature of business for your vendors.</CardDescription></CardHeader>
                    <CardContent><VendorNatureOfBusinessTable /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="bill-types" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle>Bill Types</CardTitle><CardDescription>Manage the different types of bills (e.g., Purchase, Service).</CardDescription></CardHeader>
                    <CardContent><BillTypeTable /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="bill-categories" className="mt-4">
                   <Card>
                    <CardHeader><CardTitle>Bill Categories</CardTitle><CardDescription>Manage the categories for your bills.</CardDescription></CardHeader>
                    <CardContent><BillCategoryTable /></CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </MasterDataProvider>
          </TabsContent>
          <TabsContent value="approval-settings">
            <ApprovalSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    );
}
