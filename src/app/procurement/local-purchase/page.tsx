

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleHeader } from '@/app/components/module-header';
import { DemandNoteApprovalSettings } from './components/demand-note-approval-settings';
import { DemandNoteTable } from './components/demand-note-table';
import { ProcessCodeTable } from './components/process-code-table';
import { DemandTypeTable } from './components/demand-type-table';
import { BillItemMasterTable } from '@/app/billflow/components/bill-item-master-table';
import { BillItemCategoryTable } from '@/app/billflow/components/bill-item-category-table';
import { useUser } from '@/firebase';
import { useProcurement } from './components/procurement-provider';
import GPDeskTable from './components/gp-desk-table';
import React from 'react';
import { VendorTable } from '@/app/billflow/components/vendor-table';
import { VendorCategoryTable } from '@/app/billflow/components/vendor-category-table';
import { VendorNatureOfBusinessTable } from '@/app/billflow/components/vendor-nature-of-business-table';
import { LegacyBillFlowProvider } from '@/app/billflow/components/bill-flow-provider';
import { ComparativeStatementTable } from './components/cs-table';
import { DeliveryPlaceTable } from './components/delivery-place-table';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PurchaseOrderTable } from './components/po-table';

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
                    <p>
                        First, the system calculates an "Approval Amount" based on the setting you configured in the settings tab (Minimum, Average, or Maximum of all vendor quotes).
                    </p>
                    <p>
                        Based on this amount, the following approval chain is automatically applied:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong className="text-foreground">Up to 9,999:</strong> A single approval from the <strong className="text-foreground">Purchase Manager</strong> is required.
                        </li>
                        <li>
                            <strong className="text-foreground">From 10,000 to 99,999:</strong> A 2-step approval is needed from the <strong className="text-foreground">Purchase Manager</strong> and then the <strong className="text-foreground">Purchase Department TA</strong>.
                        </li>
                        <li>
                            <strong className="text-foreground">From 100,000 to 999,999:</strong> A 4-step approval is needed, adding the <strong className="text-foreground">Requester's Department TA</strong> and the <strong className="text-foreground">Specialized Dept. Manager</strong> to the previous chain.
                        </li>
                         <li>
                            <strong className="text-foreground">Above 1,000,000:</strong> The full 9-step approval is required, involving all configured roles up to the <strong className="text-foreground">Managing Director</strong> or <strong className="text-foreground">Factory Director</strong> for the final sign-off.
                        </li>
                    </ul>
                     <p>
                        The CS will move from one approver to the next in sequence. The process is complete only when the final person in the chain gives their approval.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
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
                        The approval process for a Demand Note is automatically determined based on the department and item types.
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm text-muted-foreground space-y-4 py-4">
                    <p>
                        The system checks two main conditions to build the approval chain:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong className="text-foreground">Special Items:</strong> If the demand note contains any item marked as 'Special', it requires a 4-step approval from the
                            <strong className="text-foreground"> Department Head, Technical Advisor, Specialized Dept. Manager,</strong> and finally the <strong className="text-foreground">Managing Director</strong>.
                        </li>
                        <li>
                            <strong className="text-foreground">Manufacturing Departments:</strong> If the note is from a department marked as a 'Manufacturing Department', it requires a 3-step approval from the
                            <strong className="text-foreground"> Department Head, Technical Advisor,</strong> and the <strong className="text-foreground">Manufacturing Dept. Manager</strong>.
                        </li>
                         <li>
                            <strong className="text-foreground">General Departments:</strong> For all other departments, a standard 2-step approval is required from the
                            <strong className="text-foreground"> Department Head</strong> and the <strong className="text-foreground">Technical Advisor</strong>.
                        </li>
                    </ul>
                     <p>
                        The Demand Note will move from one approver to the next in sequence. The roles for these positions are configured in the settings tab.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function LocalPurchasePage() {
  const { user } = useUser();
  const { orgSettings, employees, isLoading } = useProcurement();

  const { isSuperAdmin, isGPOfficer, isGPConcern, isManager, isCsApprover } = React.useMemo(() => {
    const settings = orgSettings?.procurementSettings;
    const superAdmin = user?.email === 'superadmin@galsolution.com';
    if (!settings || !employees || employees.length === 0 || !user) {
      return { isSuperAdmin: superAdmin, isGPOfficer: false, isGPConcern: false, isManager: false, isCsApprover: false };
    }
    const currentUserEmployee = employees.find(e => e.email === user.email);
    if (!currentUserEmployee) {
      return { isSuperAdmin: superAdmin, isGPOfficer: false, isGPConcern: false, isManager: false, isCsApprover: false };
    }

    const GPO = settings.generalPurchaseOfficerId === currentUserEmployee.id;
    const GPC = !!settings.gpConcernOfficerIds?.includes(currentUserEmployee.id);
    const manager = 
        settings.managingDirectorId === currentUserEmployee.id ||
        settings.factoryDirectorId === currentUserEmployee.id ||
        settings.manufacturingDeptManagerId === currentUserEmployee.id ||
        settings.specializedDeptManagerId === currentUserEmployee.id;

    let csApproverCheck = false;
    const csRoles = settings.csApprovalRoles;
    if (csRoles) {
        const roleIds = [
            csRoles.purchaseManagerId,
            csRoles.purchaseDeptTaId,
            csRoles.viceFactoryManagerId,
            csRoles.accountsManagerId,
            csRoles.gmSalesDeptId,
            csRoles.gmAdministrationId,
        ];
        if (roleIds.includes(currentUserEmployee.id)) {
            csApproverCheck = true;
        }
    }
    
    if (!csApproverCheck && settings.departmentHeads?.some(dh => dh.technicalAdvisorId === currentUserEmployee.id)) {
        csApproverCheck = true;
    }
    
    if (!csApproverCheck && settings.specializedDeptTaId === currentUserEmployee.id) {
        csApproverCheck = true;
    }

    return { isSuperAdmin: superAdmin, isGPOfficer: GPO, isGPConcern: GPC, isManager: manager, isCsApprover: csApproverCheck };
  }, [orgSettings, employees, user, isLoading]);
  
  const showGPDesk = isSuperAdmin || isGPOfficer || isGPConcern;
  const canViewCsTab = isSuperAdmin || isGPOfficer || isManager || isGPConcern || isCsApprover;
  const canViewPoTab = isSuperAdmin || isGPOfficer || isManager || isGPConcern;

  const getGridCols = () => {
    let count = 2; // Dashboard & Demand Notes
    if (showGPDesk) count++;
    if (canViewCsTab) count++;
    if (canViewPoTab) count++;
    if (isSuperAdmin) count += 2; // Master Data & Settings
    return `repeat(${count}, minmax(0, 1fr))`;
  };

  return (
    <div className="space-y-6">
      <ModuleHeader />
      <Tabs defaultValue="demand-notes" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: getGridCols() }}>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="demand-notes">Demand Notes</TabsTrigger>
            {showGPDesk && <TabsTrigger value="gp-desk">GP Desk</TabsTrigger>}
            {canViewCsTab && <TabsTrigger value="cs">CS</TabsTrigger>}
            {canViewPoTab && <TabsTrigger value="po">PO</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="master-data">Master Data</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>
        <TabsContent value="dashboard">
            <Card>
                <CardHeader>
                    <CardTitle>Local Purchase Dashboard</CardTitle>
                    <CardDescription>Overview of local procurement activities.</CardDescription>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center">
                    <p className="text-muted-foreground">Dashboard coming soon...</p>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="demand-notes">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Demand Notes</CardTitle>
                            <CardDescription>Create and manage item requisitions.</CardDescription>
                        </div>
                        <DemandNoteApprovalInfo />
                    </div>
                </CardHeader>
                 <CardContent>
                    <DemandNoteTable />
                </CardContent>
            </Card>
        </TabsContent>
         {showGPDesk && (
            <TabsContent value="gp-desk">
                <Card>
                    <CardHeader>
                        <CardTitle>General Purchase Desk</CardTitle>
                        <CardDescription>Manage demand notes assigned for purchasing.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GPDeskTable />
                    </CardContent>
                </Card>
            </TabsContent>
        )}
        {canViewCsTab && (
            <TabsContent value="cs">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Comparative Statements</CardTitle>
                                <CardDescription>Review and manage all generated comparative statements.</CardDescription>
                            </div>
                            <CsApprovalInfo />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ComparativeStatementTable />
                    </CardContent>
                </Card>
            </TabsContent>
        )}
        {canViewPoTab && (
            <TabsContent value="po">
                <Card>
                    <CardHeader>
                        <CardTitle>Purchase Orders</CardTitle>
                        <CardDescription>Create and manage purchase orders from approved comparative statements.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PurchaseOrderTable />
                    </CardContent>
                </Card>
            </TabsContent>
        )}
        {isSuperAdmin && (
          <>
            <TabsContent value="master-data">
                <Tabs defaultValue="vendors" className="w-full">
                    <TabsList className="grid w-full grid-cols-7">
                        <TabsTrigger value="vendors">Vendors</TabsTrigger>
                        <TabsTrigger value="process-codes">Process Codes</TabsTrigger>
                        <TabsTrigger value="demand-types">Demand Types</TabsTrigger>
                        <TabsTrigger value="bill-items">Bill Items</TabsTrigger>
                        <TabsTrigger value="bill-item-categories">Bill Item Categories</TabsTrigger>
                        <TabsTrigger value="vendor-categories">Vendor Categories</TabsTrigger>
                        <TabsTrigger value="vendor-nature">Vendor Nature of Business</TabsTrigger>
                        <TabsTrigger value="delivery-places">Delivery Places</TabsTrigger>
                    </TabsList>
                    <TabsContent value="vendors" className="mt-4">
                        <LegacyBillFlowProvider>
                            <Card>
                                <CardHeader><CardTitle>Vendors</CardTitle><CardDescription>Manage your organization's vendors and their information.</CardDescription></CardHeader>
                                <CardContent><VendorTable /></CardContent>
                            </Card>
                        </LegacyBillFlowProvider>
                    </TabsContent>
                    <TabsContent value="process-codes" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Process Codes</CardTitle>
                                <CardDescription>Manage codes that define different stages or processes for demand notes.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ProcessCodeTable />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="demand-types" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Demand Types</CardTitle>
                                <CardDescription>Manage the various types of demand notes (e.g., General, Urgent).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DemandTypeTable />
                            </CardContent>
                        </Card>
                    </TabsContent>
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
                        <LegacyBillFlowProvider>
                            <Card>
                                <CardHeader><CardTitle>Vendor Categories</CardTitle><CardDescription>Manage the categories for your vendors.</CardDescription></CardHeader>
                                <CardContent><VendorCategoryTable /></CardContent>
                            </Card>
                        </LegacyBillFlowProvider>
                    </TabsContent>
                    <TabsContent value="vendor-nature" className="mt-4">
                         <LegacyBillFlowProvider>
                            <Card>
                                <CardHeader><CardTitle>Vendor Nature of Business</CardTitle><CardDescription>Manage the nature of business for your vendors.</CardDescription></CardHeader>
                                <CardContent><VendorNatureOfBusinessTable /></CardContent>
                            </Card>
                        </LegacyBillFlowProvider>
                    </TabsContent>
                    <TabsContent value="delivery-places" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>Delivery Places</CardTitle><CardDescription>Manage predefined office locations for delivery.</CardDescription></CardHeader>
                            <CardContent><DeliveryPlaceTable /></CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TabsContent>
            <TabsContent value="settings">
            <DemandNoteApprovalSettings />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
