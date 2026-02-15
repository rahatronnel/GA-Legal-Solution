
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

export default function LocalPurchasePage() {
  return (
    <div className="space-y-6">
      <ModuleHeader />
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="demand-notes">Demand Notes</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="master-data">Master Data</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
