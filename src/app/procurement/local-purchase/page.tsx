"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleHeader } from '@/app/components/module-header';
import { DemandNoteApprovalSettings } from './components/demand-note-approval-settings';

export default function LocalPurchasePage() {
  return (
    <div className="space-y-6">
      <ModuleHeader />
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="demand-notes">Demand Notes</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
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
                 <CardContent className="h-96 flex items-center justify-center">
                    <p className="text-muted-foreground">Demand Note table and creation form coming soon...</p>
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
        <TabsContent value="settings">
          <DemandNoteApprovalSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
