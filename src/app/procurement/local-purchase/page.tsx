"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleHeader } from '@/app/components/module-header';
import { DemandNoteApprovalSettings } from './components/demand-note-approval-settings';
import { DemandNoteTable } from './components/demand-note-table';
import { useUser } from "@/firebase";
import { useProcurement } from './components/procurement-provider';
import GPDeskTable from './components/gp-desk-table';
import { VendorTable } from '@/app/billflow/components/vendor-table';
import { VendorCategoryTable } from '@/app/billflow/components/vendor-category-table';
import { VendorNatureOfBusinessTable } from '@/app/billflow/components/vendor-nature-of-business-table';
import { LegacyBillFlowProvider } from '@/app/billflow/components/bill-flow-provider';
import { ComparativeStatementTable } from './components/cs-table';
import { PurchaseOrderTable } from './components/po-table';

export default function LocalPurchasePage() {
  const { user } = useUser();
  const { orgSettings, employees, isLoading } = useProcurement();

  const roleData = useMemo(() => {
    const superAdminCheck = user?.email === 'superadmin@galsolution.com';
    const settings = orgSettings?.procurementSettings;

    if (!settings || !employees || !user) {
      return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isGPConcern: false, isManager: false };
    }

    const currentEmp = employees.find((e: any) => e.email === user.email);
    if (!currentEmp) {
      return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isGPConcern: false, isManager: false };
    }

    const GPO = settings.generalPurchaseOfficerId === currentEmp.id;
    const GPC = !!settings.gpConcernOfficerIds?.includes(currentEmp.id);
    const managerCheck =
      settings.managingDirectorId === currentEmp.id ||
      settings.factoryDirectorId === currentEmp.id ||
      settings.manufacturingDeptManagerId === currentEmp.id ||
      settings.specializedDeptManagerId === currentEmp.id;

    return {
      isSuperAdmin: superAdminCheck,
      isGPOfficer: GPO,
      isGPConcern: GPC,
      isManager: managerCheck
    };
  }, [orgSettings, employees, user]);

  const { isSuperAdmin, isGPOfficer, isGPConcern, isManager } = roleData;

  const showGPDesk = isSuperAdmin || isGPOfficer || isGPConcern;
  const canViewCsTab = isSuperAdmin || isGPOfficer || isManager || isGPConcern;
  const canViewPoTab = canViewCsTab;

  // Use a structured array for tabs to ensure clean logic and avoid JSX syntax errors
  const tabs = useMemo(() => {
    const list = [
      { id: 'demand-notes', label: 'Demand Notes' },
    ];
    if (showGPDesk) list.push({ id: 'gp-desk', label: 'GP Desk' });
    if (canViewCsTab) list.push({ id: 'cs', label: 'CS' });
    if (canViewPoTab) list.push({ id: 'po', label: 'PO' });
    if (isSuperAdmin) {
      list.push({ id: 'master-data', label: 'Master Data' });
      list.push({ id: 'settings', label: 'Settings' });
    }
    return list;
  }, [showGPDesk, canViewCsTab, canViewPoTab, isSuperAdmin]);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p>Loading Local Purchase module...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader />
      <Tabs defaultValue="demand-notes" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="demand-notes">
          <Card>
            <CardHeader><CardTitle>Demand Notes</CardTitle></CardHeader>
            <CardContent><DemandNoteTable /></CardContent>
          </Card>
        </TabsContent>

        {showGPDesk && (
          <TabsContent value="gp-desk">
            <Card>
              <CardHeader><CardTitle>General Purchase Desk</CardTitle></CardHeader>
              <CardContent><GPDeskTable /></CardContent>
            </Card>
          </TabsContent>
        )}

        {canViewCsTab && (
          <TabsContent value="cs">
            <Card>
              <CardHeader><CardTitle>Comparative Statements</CardTitle></CardHeader>
              <CardContent><ComparativeStatementTable /></CardContent>
            </Card>
          </TabsContent>
        )}

        {canViewPoTab && (
          <TabsContent value="po">
            <Card>
              <CardHeader><CardTitle>Purchase Orders</CardTitle></CardHeader>
              <CardContent><PurchaseOrderTable /></CardContent>
            </Card>
          </TabsContent>
        )}

        {isSuperAdmin && (
          <>
            <TabsContent value="master-data">
               <LegacyBillFlowProvider>
                <Tabs defaultValue="vendors" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="vendors">Vendors</TabsTrigger>
                    <TabsTrigger value="vendor-categories">V-Cat</TabsTrigger>
                    <TabsTrigger value="vendor-nature">Nature</TabsTrigger>
                  </TabsList>
                  <TabsContent value="vendors" className="mt-4"><Card><CardHeader><CardTitle>Vendors</CardTitle></CardHeader><CardContent><VendorTable /></CardContent></Card></TabsContent>
                  <TabsContent value="vendor-categories" className="mt-4"><Card><CardContent><VendorCategoryTable /></CardContent></Card></TabsContent>
                  <TabsContent value="vendor-nature" className="mt-4"><Card><CardContent><VendorNatureOfBusinessTable /></CardContent></Card></TabsContent>
                </Tabs>
              </LegacyBillFlowProvider>
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