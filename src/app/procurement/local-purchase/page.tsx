
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

export default function LocalPurchasePage() {
  const { user } = useUser();
  const { orgSettings, employees, isLoading } = useProcurement();

  const currentUserEmployee = React.useMemo(() => {
    if (isLoading || !user || !employees) return null;
    return employees.find(e => e.email === user.email);
  }, [user, employees, isLoading]);

  const isSuperAdmin = user?.email === 'superadmin@galsolution.com';
  const procurementSettings = orgSettings?.procurementSettings;

  const isGPOfficer = procurementSettings?.generalPurchaseOfficerId === currentUserEmployee?.id;
  const isGPConcern = procurementSettings?.gpConcernOfficerIds?.includes(currentUserEmployee?.id || '');
  
  const showGPDesk = isSuperAdmin || isGPOfficer || isGPConcern;

  const getGridCols = () => {
    let count = 3;
    if (showGPDesk) count++;
    if (isSuperAdmin) count += 2;
    return `repeat(${count}, minmax(0, 1fr))`;
  }

  return (
    <div className="space-y-6">
      <ModuleHeader />
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: getGridCols() }}>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="demand-notes">Demand Notes</TabsTrigger>
            {showGPDesk && <TabsTrigger value="gp-desk">GP Desk</TabsTrigger>}
            <TabsTrigger value="reports">Reports</TabsTrigger>
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
        <TabsContent value="reports">
            <Card>
                <CardHeader>
                    <CardTitle>Reports</CardTitle>
                    <CardDescription>Analyze procurement data.</CardDescription>
                </CardHeader>
                 <CardContent className="h-96 flex items-center justify-center">
                    <p className="text-muted-foreground">Reports coming soon...</p>
                </CardContent>
            </Card>
        </TabsContent>
        {isSuperAdmin && (
          <>
            <TabsContent value="master-data">
                <Tabs defaultValue="process-codes" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="process-codes">Process Codes</TabsTrigger>
                        <TabsTrigger value="demand-types">Demand Types</TabsTrigger>
                        <TabsTrigger value="bill-items">Bill Items</TabsTrigger>
                        <TabsTrigger value="bill-item-categories">Bill Item Categories</TabsTrigger>
                    </TabsList>
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
