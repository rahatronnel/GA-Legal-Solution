"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleHeader } from '@/app/components/module-header';
import { DemandNoteApprovalSettings } from './components/demand-note-approval-settings';
import { DemandNoteTable } from './components/demand-note-table';
import { ProcessCodeTable } from './components/process-code-table';
import { DemandTypeTable } from './components/demand-type-table';
import { BillItemMasterTable } from '@/app/billflow/components/bill-item-master-table';
import { BillItemCategoryTable } from '@/app/billflow/components/bill-item-category-table';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useCollection } from "@/firebase";
import { doc, collection } from 'firebase/firestore';
import { useProcurement } from './components/procurement-provider';
import GPDeskTable from './components/gp-desk-table';
import { VendorTable } from '@/app/billflow/components/vendor-table';
import { VendorCategoryTable } from '@/app/billflow/components/vendor-category-table';
import { VendorNatureOfBusinessTable } from '@/app/billflow/components/vendor-nature-of-business-table';
import { LegacyBillFlowProvider } from '@/app/billflow/components/bill-flow-provider';
import { ComparativeStatementTable } from './components/cs-table';
import { Button } from '@/components/ui/button';
import { Info, CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { PurchaseOrderTable } from './components/po-table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

// --- Static Data ---

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

// --- Helper Components ---

function CsApprovalInfo() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-yellow-500">
                    <Info className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>CS Approval Workflow Explained</DialogTitle>
                    <DialogDescription>
                        The approval process for a Comparative Statement (CS) is determined by its financial value.
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm text-muted-foreground space-y-4 py-4">
                    <p>First, the system calculates an "Approval Amount" based on the settings (Minimum, Average, or Maximum of quotes).</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Up to 9,999:</strong> Single approval from Purchase Manager.</li>
                        <li><strong>10,000 to 99,999:</strong> 2-step: Purchase Manager -&gt; Purchase Dept TA.</li>
                        <li><strong>100,000 to 999,999:</strong> 4-step: Manager -&gt; Dept TA -&gt; Requester Dept TA -&gt; Specialized Dept Manager.</li>
                        <li><strong>Above 1,000,000:</strong> Full 9-step approval including MD/FD sign-off.</li>
                    </ul>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DemandNoteApprovalInfo() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-yellow-500">
                    <Info className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Demand Note Approval Workflow Explained</DialogTitle>
                    <DialogDescription>
                        Determined automatically based on department and item types.
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm text-muted-foreground space-y-4 py-4">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Special Items:</strong> 4-step: Dept Head -&gt; TA -&gt; Specialized Manager -&gt; MD.</li>
                        <li><strong>Manufacturing:</strong> 3-step: Dept Head -&gt; TA -&gt; Manufacturing Manager.</li>
                        <li><strong>General:</strong> 2-step: Dept Head -&gt; TA.</li>
                    </ul>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ApprovalSettingsTab() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
    const { data: orgSettings, isLoading: isLoadingSettings } = useDoc<any>(settingsDocRef);
    
    const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const { data: employees, isLoading: isLoadingEmployees } = useCollection<any>(employeesRef);

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
        if (!settingsDocRef) return;
        if (steps.some(step => !step.approverId)) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select an employee for each step.' });
            return;
        }
        const approvalFlow = {
            effectiveDate: effectiveDate ? format(effectiveDate, 'yyyy-MM-dd') : '',
            steps: steps,
        };
        setDocumentNonBlocking(settingsDocRef, { approvalFlow }, { merge: true });
        toast({ title: 'Success', description: 'Approval flow saved.' });
    };

    if (isLoadingSettings || isLoadingEmployees) return <p>Loading settings...</p>;

    return (
        <Card>
            <CardHeader><CardTitle>Bill Approval Flow</CardTitle><CardDescription>Sequence of employees for bill approval.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Number of Steps</Label>
                        <Select value={String(numberOfSteps)} onValueChange={handleNumberOfStepsChange}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{Array.from({ length: 10 }, (_, i) => i + 1).map(num => (<SelectItem key={num} value={String(num)}>{num} Step{num > 1 ? 's' : ''}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Effective Date</Label>
                         <Popover>
                            <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal",!effectiveDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{effectiveDate ? format(effectiveDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={effectiveDate} onSelect={setEffectiveDate} initialFocus/></PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-4 p-3 border rounded-lg">
                            <div className="flex-grow space-y-2"><Label>Step {index + 1}: Name</Label><Input value={step.stepName} disabled /></div>
                            <div className="flex-grow space-y-2"><Label>Approver</Label><Select value={step.approverId} onValueChange={(v) => handleApproverChange(index, v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{(employees || []).map((emp:any) => (<SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>))}</SelectContent></Select></div>
                        </div>
                    ))}
                </div>
                <Button onClick={handleSave}>Save Flow</Button>
            </CardContent>
        </Card>
    );
}

// --- Main Page Component ---

export default function LocalPurchasePage() {
  const { user } = useUser();
  const { orgSettings, employees, isLoading } = useProcurement();

  const roleData = useMemo(() => {
    const superAdminCheck = user?.email === 'superadmin@galsolution.com';
    const settings = orgSettings?.procurementSettings;
    
    if (!settings || !employees || !user) {
      return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isGPConcern: false, isManager: false, isCsApprover: false };
    }
    
    const currentEmp = employees.find((e:any) => e.email === user.email);
    if (!currentEmp) {
      return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isGPConcern: false, isManager: false, isCsApprover: false };
    }

    const GPO = settings.generalPurchaseOfficerId === currentEmp.id;
    const GPC = !!settings.gpConcernOfficerIds?.includes(currentEmp.id);
    const managerCheck = 
        settings.managingDirectorId === currentEmp.id ||
        settings.factoryDirectorId === currentEmp.id ||
        settings.manufacturingDeptManagerId === currentEmp.id ||
        settings.specializedDeptManagerId === currentEmp.id;

    let csApproverCheck = false;
    const csRoles = settings.csApprovalRoles;
    if (csRoles) {
        const roleIds = [
            csRoles.purchaseManagerId, csRoles.purchaseDeptTaId, csRoles.viceFactoryManagerId,
            csRoles.accountsManagerId, csRoles.gmSalesDeptId, csRoles.gmAdministrationId,
        ];
        if (roleIds.includes(currentEmp.id)) csApproverCheck = true;
    }
    if (!csApproverCheck && settings.departmentHeads?.some((dh:any) => dh.technicalAdvisorId === currentEmp.id)) csApproverCheck = true;
    if (!csApproverCheck && settings.specializedDeptTaId === currentEmp.id) csApproverCheck = true;

    return { isSuperAdmin: superAdminCheck, isGPOfficer: GPO, isGPConcern: GPC, isManager: managerCheck, isCsApprover: csApproverCheck };
  }, [orgSettings, employees, user]);
  
  const { isSuperAdmin, isGPOfficer, isGPConcern, isManager, isCsApprover } = roleData;

  const showGPDesk = isSuperAdmin || isGPOfficer || isGPConcern;
  const canViewCsTab = isSuperAdmin || isGPOfficer || isManager || isGPConcern || isCsApprover;
  const canViewPoTab = isSuperAdmin || isGPOfficer || isManager || isGPConcern || isCsApprover;

  const gridColsCount = useMemo(() => {
    let count = 2; // Dashboard & Demand Notes
    if (showGPDesk) count++;
    if (canViewCsTab) count++;
    if (canViewPoTab) count++;
    if (isSuperAdmin) count += 2;
    return count;
  }, [showGPDesk, canViewCsTab, canViewPoTab, isSuperAdmin]);

  if (isLoading) {
      return (
        <div className="p-8 text-center"><p>Loading Local Purchase module...</p></div>
      );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader />
      <Tabs defaultValue="demand-notes" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${gridColsCount}, minmax(0, 1fr))` }}>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="demand-notes">Demand Notes</TabsTrigger>
            {showGPDesk && <TabsTrigger value="gp-desk">GP Desk</TabsTrigger>}
            {canViewCsTab && <TabsTrigger value="cs">CS</TabsTrigger>}
            {canViewPoTab && <TabsTrigger value="po">PO</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="master-data">Master Data</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="dashboard">
            <Card><CardHeader><CardTitle>Dashboard</CardTitle></CardHeader><CardContent className="h-96 flex items-center justify-center"><p className="text-muted-foreground">Local Purchase Dashboard coming soon...</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="demand-notes">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div><CardTitle>Demand Notes</CardTitle><CardDescription>Manage item requisitions.</CardDescription></div>
                        <DemandNoteApprovalInfo />
                    </div>
                </CardHeader>
                 <CardContent><DemandNoteTable /></CardContent>
            </Card>
        </TabsContent>

         {showGPDesk && (
            <TabsContent value="gp-desk">
                <Card>
                    <CardHeader><CardTitle>General Purchase (GP) Desk</CardTitle><CardDescription>Process approved demand notes.</CardDescription></CardHeader>
                    <CardContent><GPDeskTable /></CardContent>
                </Card>
            </TabsContent>
        )}

        {canViewCsTab && (
            <TabsContent value="cs">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div><CardTitle>Comparative Statements</CardTitle><CardDescription>Review and manage vendor quotes.</CardDescription></div>
                            <CsApprovalInfo />
                        </div>
                    </CardHeader>
                    <CardContent><ComparativeStatementTable /></CardContent>
                </Card>
            </TabsContent>
        )}

        {canViewPoTab && (
            <TabsContent value="po">
                <Card>
                    <CardHeader><CardTitle>Purchase Orders</CardTitle><CardDescription>Manage POs from approved statements.</CardDescription></CardHeader>
                    <CardContent><PurchaseOrderTable /></CardContent>
                </Card>
            </TabsContent>
        )}

        {isSuperAdmin && (
          <>
            <TabsContent value="master-data">
                <Tabs defaultValue="vendors" className="w-full">
                    <TabsList className="grid w-full grid-cols-7">
                        <TabsTrigger value="vendors">Vendors</TabsTrigger>
                        <TabsTrigger value="process-codes">Codes</TabsTrigger>
                        <TabsTrigger value="demand-types">Types</TabsTrigger>
                        <TabsTrigger value="bill-items">Items</TabsTrigger>
                        <TabsTrigger value="bill-item-categories">Categories</TabsTrigger>
                        <TabsTrigger value="vendor-categories">V-Cat</TabsTrigger>
                        <TabsTrigger value="vendor-nature">Nature</TabsTrigger>
                    </TabsList>
                    <TabsContent value="vendors" className="mt-4"><LegacyBillFlowProvider><Card><CardHeader><CardTitle>Vendors</CardTitle></CardHeader><CardContent><VendorTable /></CardContent></Card></LegacyBillFlowProvider></TabsContent>
                    <TabsContent value="process-codes" className="mt-4"><Card><CardContent><ProcessCodeTable /></CardContent></Card></TabsContent>
                    <TabsContent value="demand-types" className="mt-4"><Card><CardContent><DemandTypeTable /></CardContent></Card></TabsContent>
                    <TabsContent value="bill-items" className="mt-4"><Card><CardContent><BillItemMasterTable /></CardContent></Card></TabsContent>
                    <TabsContent value="bill-item-categories" className="mt-4"><Card><CardContent><BillItemCategoryTable /></CardContent></Card></TabsContent>
                    <TabsContent value="vendor-categories" className="mt-4"><LegacyBillFlowProvider><Card><CardContent><VendorCategoryTable /></CardContent></LegacyBillFlowProvider></TabsContent>
                    <TabsContent value="vendor-nature" className="mt-4"><LegacyBillFlowProvider><Card><CardContent><VendorNatureOfBusinessTable /></CardContent></LegacyBillFlowProvider></TabsContent>
                </Tabs>
            </TabsContent>
            <TabsContent value="settings"><DemandNoteApprovalSettings /></TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}