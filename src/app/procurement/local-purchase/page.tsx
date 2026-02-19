
"use client";

import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { WorkflowTracker } from './components/workflow-tracker';

function LocalPurchaseContent() {
  const { user } = useUser();
  const { orgSettings, employees } = useProcurement();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = searchParams.get('tab') || 'demand-notes';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`?${params.toString()}`);
  };

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

  const tabsList = useMemo(() => {
    const list = [{ id: 'demand-notes', label: 'Demand Notes' }];
    const showGPDesk = isSuperAdmin || isGPOfficer || isGPConcern;
    const canViewCsAndPo = isSuperAdmin || isGPOfficer || isManager || isGPConcern || isCsApprover;

    if (showGPDesk) list.push({ id: 'gp-desk', label: 'GP Desk' });
    if (canViewCsAndPo) {
        list.push({ id: 'cs', label: 'CS' });
        list.push({ id: 'po', label: 'PO' });
    }
    
    list.push({ id: 'tracker', label: 'Workflow Tracker' });

    if (isSuperAdmin) {
      list.push({ id: 'master-data', label: 'Master Data' });
      list.push({ id: 'settings', label: 'Settings' });
    }
    return list;
  }, [isSuperAdmin, isGPOfficer, isGPConcern, isManager, isCsApprover]);

  const userRoleText = useMemo(() => {
    if (isSuperAdmin) return "Superadmin";
    if (isGPOfficer) return "GP Officer";
    if (isGPConcern) return "GP Concern Officer";
    if (isCsApprover) return "CS Approver";
    if (isManager) return "Manager";
    return "Employee";
  }, [isSuperAdmin, isGPOfficer, isGPConcern, isCsApprover, isManager]);

  const gridColsCount = tabsList.length;

  return (
    <div className="space-y-6">
      <ModuleHeader />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Local Purchase Module</h1>
        <Badge variant="outline" className="px-4 py-1 text-sm">Role: {userRoleText}</Badge>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${gridColsCount}, minmax(0, 1fr))` }}>
          {tabsList.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="demand-notes">
          <Card>
            <CardHeader>
                <CardTitle>Requisition Overview</CardTitle>
                <CardDescription>Track and analyze all local purchase demand notes.</CardDescription>
            </CardHeader>
            <CardContent>
                <DemandNoteTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gp-desk">
          <Card>
            <CardHeader><CardTitle>General Purchase Desk</CardTitle></CardHeader>
            <CardContent><GPDeskTable /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cs">
          <Card>
            <CardHeader><CardTitle>Comparative Statements</CardTitle></CardHeader>
            <CardContent><ComparativeStatementTable /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="po">
          <Card>
            <CardHeader><CardTitle>Purchase Orders</CardTitle></CardHeader>
            <CardContent><PurchaseOrderTable /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracker">
            <WorkflowTracker />
        </TabsContent>

        {isSuperAdmin && (
          <>
            <TabsContent value="master-data">
               <LegacyBillFlowProvider>
                <MasterDataProvider>
                  <Tabs defaultValue="vendors" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
                      <TabsTrigger value="vendors">Vendors</TabsTrigger>
                      <TabsTrigger value="v-cat">V-Cat</TabsTrigger>
                      <TabsTrigger value="v-nature">V-Nature</TabsTrigger>
                      <TabsTrigger value="bill-items">Bill Items</TabsTrigger>
                      <TabsTrigger value="i-cat">Item Cat</TabsTrigger>
                      <TabsTrigger value="codes">Process Codes</TabsTrigger>
                      <TabsTrigger value="types">DN Types</TabsTrigger>
                      <TabsTrigger value="places">Offices</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="vendors" className="mt-4"><Card><CardHeader><CardTitle>Vendors</CardTitle></CardHeader><CardContent><VendorTable /></CardContent></Card></TabsContent>
                    <TabsContent value="v-cat" className="mt-4"><Card><CardHeader><CardTitle>Vendor Categories</CardTitle></CardHeader><CardContent><VendorCategoryTable /></CardContent></Card></TabsContent>
                    <TabsContent value="v-nature" className="mt-4"><Card><CardHeader><CardTitle>Nature of Business</CardTitle></CardHeader><CardContent><VendorNatureOfBusinessTable /></CardContent></Card></TabsContent>
                    <TabsContent value="bill-items" className="mt-4"><Card><CardHeader><CardTitle>Bill Item Master</CardTitle></CardHeader><CardContent><BillItemMasterTable /></CardContent></Card></TabsContent>
                    <TabsContent value="i-cat" className="mt-4"><Card><CardHeader><CardTitle>Bill Item Categories</CardTitle></CardHeader><CardContent><BillItemCategoryTable /></CardContent></Card></TabsContent>
                    <TabsContent value="codes" className="mt-4"><Card><CardHeader><CardTitle>Process Codes</CardTitle></CardHeader><CardContent><ProcessCodeTable /></CardContent></Card></TabsContent>
                    <TabsContent value="types" className="mt-4"><Card><CardHeader><CardTitle>Demand Types</CardTitle></CardHeader><CardContent><DemandTypeTable /></CardContent></Card></TabsContent>
                    <TabsContent value="places" className="mt-4"><Card><CardHeader><CardTitle>Delivery Places</CardTitle></CardHeader><CardContent><DeliveryPlaceTable /></CardContent></Card></TabsContent>
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

export default function LocalPurchasePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><p className="animate-pulse font-medium text-muted-foreground">Initializing Module...</p></div>}>
      <LocalPurchaseContent />
    </Suspense>
  );
}
