
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

export default function LocalPurchasePage() {
  const { user } = useUser();
  const { orgSettings, employees, isLoading } = useProcurement();

  const { isSuperAdmin, isGPOfficer, isGPConcern, isManager } = React.useMemo(() => {
    const settings = orgSettings?.procurementSettings;
    const superAdmin = user?.email === 'superadmin@galsolution.com';
    if (!settings || !employees || employees.length === 0 || !user) {
      return { isSuperAdmin: superAdmin, isGPOfficer: false, isGPConcern: false, isManager: false };
    }
    const currentUserEmployee = employees.find(e => e.email === user.email);
    if (!currentUserEmployee) {
      return { isSuperAdmin: superAdmin, isGPOfficer: false, isGPConcern: false, isManager: false };
    }

    const GPO = settings.generalPurchaseOfficerId === currentUserEmployee.id;
    const GPC = !!settings.gpConcernOfficerIds?.includes(currentUserEmployee.id);
    const manager = 
        settings.managingDirectorId === currentUserEmployee.id ||
        settings.factoryDirectorId === currentUserEmployee.id ||
        settings.manufacturingDeptManagerId === currentUserEmployee.id ||
        settings.specializedDeptManagerId === currentUserEmployee.id;
    
    return { isSuperAdmin: superAdmin, isGPOfficer: GPO, isGPConcern: GPC, isManager: manager };
  }, [orgSettings, employees, user, isLoading]);
  
  const showGPDesk = isSuperAdmin || isGPOfficer || isGPConcern;
  const canViewCsTab = isSuperAdmin || isGPOfficer || isManager || isGPConcern;

  const getGridCols = () => {
    const tabsToShow = new Set(['dashboard', 'demand-notes']);
    if (isSuperAdmin) {
        tabsToShow.add('gp-desk');
        tabsToShow.add('cs');
        tabsToShow.add('master-data');
        tabsToShow.add('settings');
    } else {
        if (showGPDesk) tabsToShow.add('gp-desk');
        if (canViewCsTab) tabsToShow.add('cs');
    }
    return `repeat(${tabsToShow.size}, minmax(0, 1fr))`;
  }

  return (
    <div className="space-y-6">
      <ModuleHeader />
      <Tabs defaultValue="demand-notes" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: getGridCols() }}>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="demand-notes">Demand Notes</TabsTrigger>
            {showGPDesk && <TabsTrigger value="gp-desk">GP Desk</TabsTrigger>}
            {canViewCsTab && <TabsTrigger value="cs">CS</TabsTrigger>}
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
                    <CardTitle>Demand Notes</CardTitle>
                    <CardDescription>Create and manage item requisitions.</CardDescription>
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
                        <CardTitle>Comparative Statements</CardTitle>
                        <CardDescription>Review and manage all generated comparative statements.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ComparativeStatementTable />
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

    
