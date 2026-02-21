"use client";

import React, { useMemo, Suspense, useState } from 'react';
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
import { MRRTable } from './components/mrr-table';
import { NotificationCenter } from './components/notification-center';
import { 
    FileText, Briefcase, BarChart2, ClipboardCheck, Package, Activity, 
    Database, Settings, Users, Tag, ListOrdered, Layers, Hash, MapPin,
    History, UserCheck, ShieldCheck, Info, HelpCircle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UserAuditReport } from './components/user-audit-report';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

function LocalPurchaseContent() {
  const { user } = useUser();
  const { orgSettings, employees } = useProcurement();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

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
      isManager: managerCheck,
    };
  }, [orgSettings, employees, user]);

  const { isSuperAdmin, isGPOfficer, isGPConcern, isManager } = roleData;

  const tabsList = useMemo(() => {
    const list = [{ id: 'demand-notes', label: 'Demand Notes', icon: FileText }];
    const showGPDesk = isSuperAdmin || isGPOfficer || isGPConcern;
    const canViewCsAndPo = isSuperAdmin || isGPOfficer || isManager || isGPConcern;

    if (showGPDesk) list.push({ id: 'gp-desk', label: 'GP Desk', icon: Briefcase });
    if (canViewCsAndPo) {
        list.push({ id: 'cs', label: 'CS', icon: BarChart2 });
        list.push({ id: 'po', label: 'PO', icon: ClipboardCheck });
        list.push({ id: 'mrr', label: 'MRR', icon: Package });
    }
    
    if (isSuperAdmin) {
      list.push({ id: 'master-data', label: 'Master Data', icon: Database });
      list.push({ id: 'settings', label: 'Settings', icon: Settings });
    }
    return list;
  }, [isSuperAdmin, isGPOfficer, isGPConcern, isManager]);

  const gridColsCount = tabsList.length;

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <ModuleHeader />
      
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border">
        <div className="flex items-center gap-4">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Local Purchase</h1>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Supply Chain Command</p>
            </div>
            <Badge variant="outline" className="px-4 py-1 text-sm bg-background/50 border-primary/20">
                {isSuperAdmin ? 'Superadmin' : (isGPOfficer ? 'GP Officer' : (isGPConcern ? 'Concern' : 'Manager'))}
            </Badge>
        </div>
        <div className="flex items-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10" onClick={() => setIsTrackerOpen(true)}>
                        <History className="h-5 w-5 text-primary" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="animate-scale-in">Workflow Tracker</TooltipContent>
            </Tooltip>
            
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10" onClick={() => setIsAuditOpen(true)}>
                        <UserCheck className="h-5 w-5 text-primary" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="animate-scale-in">User Activity Audit</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-8 mx-2" />
            <NotificationCenter />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full h-auto p-1 bg-muted/50 rounded-xl" style={{ gridTemplateColumns: `repeat(${gridColsCount}, minmax(0, 1fr))` }}>
          {tabsList.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-background transition-all">
                <tab.icon className="h-4 w-4" />
                <span className="hidden lg:inline font-bold text-xs uppercase">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="demand-notes" className="animate-in fade-in slide-in-from-bottom-2">
          <DemandNoteTable />
        </TabsContent>
        <TabsContent value="gp-desk" className="animate-in fade-in slide-in-from-bottom-2">
          <GPDeskTable />
        </TabsContent>
        <TabsContent value="cs" className="animate-in fade-in slide-in-from-bottom-2">
          <ComparativeStatementTable />
        </TabsContent>
        <TabsContent value="po" className="animate-in fade-in slide-in-from-bottom-2">
          <PurchaseOrderTable />
        </TabsContent>
        <TabsContent value="mrr" className="animate-in fade-in slide-in-from-bottom-2">
          <MRRTable />
        </TabsContent>

        {isSuperAdmin && (
          <>
            <TabsContent value="master-data">
               <LegacyBillFlowProvider>
                <MasterDataProvider>
                  <Tabs defaultValue="vendors" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto bg-muted/30 p-1 rounded-lg">
                      <TabsTrigger value="vendors" className="text-xs">Vendors</TabsTrigger>
                      <TabsTrigger value="v-cat" className="text-xs">V-Cat</TabsTrigger>
                      <TabsTrigger value="v-nature" className="text-xs">V-Nature</TabsTrigger>
                      <TabsTrigger value="bill-items" className="text-xs">B-Items</TabsTrigger>
                      <TabsTrigger value="i-cat" className="text-xs">I-Cat</TabsTrigger>
                      <TabsTrigger value="codes" className="text-xs">Codes</TabsTrigger>
                      <TabsTrigger value="types" className="text-xs">DN-Types</TabsTrigger>
                      <TabsTrigger value="places" className="text-xs">Offices</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="vendors" className="mt-4"><VendorTable /></TabsContent>
                    <TabsContent value="v-cat" className="mt-4"><VendorCategoryTable /></TabsContent>
                    <TabsContent value="v-nature" className="mt-4"><VendorNatureOfBusinessTable /></TabsContent>
                    <TabsContent value="bill-items" className="mt-4"><BillItemMasterTable /></TabsContent>
                    <TabsContent value="i-cat" className="mt-4"><BillItemCategoryTable /></TabsContent>
                    <TabsContent value="codes" className="mt-4"><ProcessCodeTable /></TabsContent>
                    <TabsContent value="types" className="mt-4"><DemandTypeTable /></TabsContent>
                    <TabsContent value="places" className="mt-4"><DeliveryPlaceTable /></TabsContent>
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

      <Dialog open={isTrackerOpen} onOpenChange={setIsTrackerOpen}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0">
            <div className="p-6 flex-grow overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Fleet & Procurement Workflow Tracker</DialogTitle>
                        <DialogDescription>Audit trail and lifecycle visibility.</DialogDescription>
                    </DialogHeader>
                    <Button variant="ghost" size="icon" onClick={() => setIsTrackerOpen(false)}><X className="h-5 w-5" /></Button>
                </div>
                <WorkflowTracker />
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
        <DialogContent className="sm:max-w-[85vw] h-[85vh] flex flex-col p-0">
            <div className="p-6 flex-grow overflow-hidden">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">User Activity Audit & Response Metrics</DialogTitle>
                        <DialogDescription>Analyze organizational efficiency and user performance lag times.</DialogDescription>
                    </DialogHeader>
                    <Button variant="ghost" size="icon" onClick={() => setIsAuditOpen(false)}><X className="h-5 w-5" /></Button>
                </div>
                <UserAuditReport />
            </div>
        </DialogContent>
      </Dialog>

    </div>
    </TooltipProvider>
  );
}

export default function LocalPurchasePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><p className="animate-pulse font-black text-muted-foreground">Handshaking Database...</p></div>}>
      <LocalPurchaseContent />
    </Suspense>
  );
}