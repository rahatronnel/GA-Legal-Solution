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
import { LegacyBillFlowProvider, MasterDataProvider } from '@/app/billflow/components/bill-flow-provider';
import { ComparativeStatementTable } from './components/cs-table';
import { PurchaseOrderTable } from './components/po-table';
import { ProcessCodeTable } from './components/process-code-table';
import { DemandTypeTable } from './components/demand-type-table';
import { BillItemMasterTable } from '@/app/billflow/components/bill-item-master-table';
import { BillItemCategoryTable } from '@/app/billflow/components/bill-item-category-table';
import { DeliveryPlaceTable } from './components/delivery-place-table';

export default function LocalPurchasePage() {
  const { user } = useUser();
  const { orgSettings, employees, isLoading } = useProcurement();

  // Role detection logic
  const roleData = useMemo(() => {
    const superAdminCheck = user?.email === 'superadmin@galsolution.com';
    const settings = orgSettings?.procurementSettings;

    if (!settings || !employees || !user) {
      return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isGPConcern: false, isManager: false, isCsApprover: false };
    }

    const currentEmp = employees.find((e: any) => e.email === user.email);
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

    // Check if user is a CS Approver
    let csApproverCheck = false;
    const csRoles = settings.csApprovalRoles;
    if (csRoles) {
        const roleIds = [
            csRoles.purchaseManagerId, csRoles.purchaseDeptTaId, csRoles.viceFactoryManagerId,
            csRoles.accountsManagerId, csRoles.gmSalesDeptId, csRoles.gmAdministrationId,
        ];
        if (roleIds.includes(currentEmp.id)) csApproverCheck = true;
    }
    if (!csApproverCheck && settings.departmentHeads?.some(dh => dh.technicalAdvisorId === currentEmp.id)) csApproverCheck = true;
    if (!csApproverCheck && settings.specializedDeptTaId === currentEmp.id) csApproverCheck = true;

    return {
      isSuperAdmin: superAdminCheck,
      isGPOfficer: GPO,
      isGPConcern: GPC,
      isManager: managerCheck,
      isCsApprover: csApproverCheck
    };
  }, [orgSettings, employees, user]);

  const { isSuperAdmin, isGPOfficer, isGPConcern, isManager, isCsApprover } = roleData;

  // Tab visibility logic
  const showGPDesk = isSuperAdmin || isGPOfficer || isGPConcern;
  const canViewCsTab = isSuperAdmin || isGPOfficer || isManager || isGPConcern || isCsApprover;
  const canViewPoTab = canViewCsTab;

  const tabsList = useMemo(() => {
    const list = [{ id: 'demand-notes', label: 'Demand Notes' }];
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
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading Local Purchase module...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader />
      <Tabs defaultValue="demand-notes" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabsList.length}, minmax(0, 1fr))` }}>
          {tabsList.map(tab => (
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
                <MasterDataProvider>
                  <Tabs defaultValue="vendors" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
                      <TabsTrigger value="vendors">Vendors</TabsTrigger>
                      <TabsTrigger value="vendor-categories">V-Cat</TabsTrigger>
                      <TabsTrigger value="vendor-nature">V-Nature</TabsTrigger>
                      <TabsTrigger value="bill-items">Bill Items</TabsTrigger>
                      <TabsTrigger value="item-categories">Item Cat</TabsTrigger>
                      <TabsTrigger value="process-codes">Process Codes</TabsTrigger>
                      <TabsTrigger value="demand-types">Demand Types</TabsTrigger>
                      <TabsTrigger value="delivery-places">Places</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="vendors" className="mt-4"><Card><CardHeader><CardTitle>Vendors</CardTitle></CardHeader><CardContent><VendorTable /></CardContent></Card></TabsContent>
                    <TabsContent value="vendor-categories" className="mt-4"><Card><CardHeader><CardTitle>Vendor Categories</CardTitle></CardHeader><CardContent><VendorCategoryTable /></CardContent></Card></TabsContent>
                    <TabsContent value="vendor-nature" className="mt-4"><Card><CardHeader><CardTitle>Nature of Business</CardTitle></CardHeader><CardContent><VendorNatureOfBusinessTable /></CardContent></Card></TabsContent>
                    <TabsContent value="bill-items" className="mt-4"><Card><CardHeader><CardTitle>Bill Item Master</CardTitle></CardHeader><CardContent><BillItemMasterTable /></CardContent></Card></TabsContent>
                    <TabsContent value="item-categories" className="mt-4"><Card><CardHeader><CardTitle>Bill Item Categories</CardTitle></CardHeader><CardContent><BillItemCategoryTable /></CardContent></Card></TabsContent>
                    <TabsContent value="process-codes" className="mt-4"><Card><CardHeader><CardTitle>Process Codes</CardTitle></CardHeader><CardContent><ProcessCodeTable /></CardContent></Card></TabsContent>
                    <TabsContent value="demand-types" className="mt-4"><Card><CardHeader><CardTitle>Demand Types</CardTitle></CardHeader><CardContent><DemandTypeTable /></CardContent></Card></TabsContent>
                    <TabsContent value="delivery-places" className="mt-4"><Card><CardHeader><CardTitle>Delivery Places</CardTitle></CardHeader><CardContent><DeliveryPlaceTable /></CardContent></Card></TabsContent>
                  </Tabs>
                </MasterDataProvider>
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