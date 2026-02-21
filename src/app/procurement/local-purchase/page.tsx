"use client";

import React, { useMemo, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs as ShadTabs, TabsContent as ShadTabsContent, TabsList as ShadTabsList, TabsTrigger as ShadTabsTrigger } from "@/components/ui/tabs";
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
    FileText, Briefcase, BarChart2, ClipboardCheck, Package, 
    Database, Settings, History, UserCheck, X, Workflow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UserAuditReport } from './components/user-audit-report';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { BlueprintDialog } from './components/blueprint-dialog';

function LocalPurchaseContent() {
  const { user } = useUser();
  const { orgSettings, employees } = useProcurement();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);

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
      return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isGPConcern: false, isManager: false, isAnyDeptHead: false };
    }

    const currentEmp = employees.find((e: any) => e.email === user.email);
    if (!currentEmp) {
      return { isSuperAdmin: superAdminCheck, isGPOfficer: false, isGPConcern: false, isManager: false, isAnyDeptHead: false };
    }

    const GPO = settings.generalPurchaseOfficerId === currentEmp.id;
    const GPC = !!settings.gpConcernOfficerIds?.includes(currentEmp.id);
    const managerCheck =
      settings.managingDirectorId === currentEmp.id ||
      settings.factoryDirectorId === currentEmp.id ||
      settings.manufacturingDeptManagerId === currentEmp.id ||
      settings.specializedDeptManagerId === currentEmp.id;
    
    // Check if user is a configured approver (Dept Head or Tech Advisor)
    const anyDeptHeadCheck = settings.departmentHeads?.some(
        dh => dh.headId === currentEmp.id || dh.technicalAdvisorId === currentEmp.id
    );

    return {
      isSuperAdmin: superAdminCheck,
      isGPOfficer: GPO,
      isGPConcern: GPC,
      isManager: managerCheck,
      isAnyDeptHead: anyDeptHeadCheck
    };
  }, [orgSettings, employees, user]);

  const { isSuperAdmin, isGPOfficer, isGPConcern, isManager, isAnyDeptHead } = roleData;

  const tabsList = useMemo(() => {
    const list = [{ id: 'demand-notes', label: 'Demand Notes', icon: FileText }];
    const showGPDesk = isSuperAdmin || isGPOfficer || isGPConcern;
    // Approvers (Dept Heads) must also have access to the Analysis tabs
    const canViewCsAndPo = isSuperAdmin || isGPOfficer || isManager || isGPConcern || isAnyDeptHead;

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
  }, [isSuperAdmin, isGPOfficer, isGPConcern, isManager, isAnyDeptHead]);

  const gridColsCount = tabsList.length;

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <ModuleHeader />
      
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl border">
        <div className="flex items-center gap-4">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Local Purchase</h1>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Supply Chain Command</p>
            </div>
            <Badge variant="outline" className="px-4 py-1 text-sm bg-background/50 border-primary/20 font-black">
                {isSuperAdmin ? 'SUPERADMIN' : (isGPOfficer ? 'GP OFFICER' : (isGPConcern ? 'CONCERN' : 'MANAGER'))}
            </Badge>
        </div>
        <div className="flex items-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-transform active:scale-95 text-blue-600" onClick={() => setIsBlueprintOpen(true)}>
                        <Workflow className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="animate-scale-in">Operational Blueprint Master</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-transform active:scale-95" onClick={() => setIsTrackerOpen(true)}>
                        <History className="h-5 w-5 text-primary" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="animate-scale-in">Workflow Tracker</TooltipContent>
            </Tooltip>
            
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-transform active:scale-95" onClick={() => setIsAuditOpen(true)}>
                        <UserCheck className="h-5 w-5 text-primary" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="animate-scale-in">Performance Audit Trail</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-8 mx-2" />
            <NotificationCenter />
        </div>
      </div>
      
      <ShadTabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <ShadTabsList className="grid w-full h-auto p-1 bg-muted/50 rounded-xl" style={{ gridTemplateColumns: `repeat(${gridColsCount}, minmax(0, 1fr))` }}>
          {tabsList.map(tab => (
            <ShadTabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <tab.icon className="h-4 w-4" />
                <span className="hidden lg:inline font-bold text-xs uppercase tracking-tight">{tab.label}</span>
            </ShadTabsTrigger>
          ))}
        </ShadTabsList>

        <ShadTabsContent value="demand-notes" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <DemandNoteTable />
        </ShadTabsContent>
        <ShadTabsContent value="gp-desk" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <GPDeskTable />
        </ShadTabsContent>
        <ShadTabsContent value="cs" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ComparativeStatementTable />
        </ShadTabsContent>
        <ShadTabsContent value="po" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <PurchaseOrderTable />
        </ShadTabsContent>
        <ShadTabsContent value="mrr" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <MRRTable />
        </ShadTabsContent>

        {isSuperAdmin && (
          <>
            <ShadTabsContent value="master-data" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <LegacyBillFlowProvider>
                <MasterDataProvider>
                  <ShadTabs defaultValue="vendors" className="w-full">
                    <ShadTabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto bg-muted/30 p-1 rounded-lg">
                      <ShadTabsTrigger value="vendors" className="text-[10px] font-bold">VENDORS</ShadTabsTrigger>
                      <ShadTabsTrigger value="v-cat" className="text-[10px] font-bold">V-CAT</ShadTabsTrigger>
                      <ShadTabsTrigger value="v-nature" className="text-[10px] font-bold">V-NATURE</ShadTabsTrigger>
                      <ShadTabsTrigger value="bill-items" className="text-[10px] font-bold">B-ITEMS</ShadTabsTrigger>
                      <ShadTabsTrigger value="i-cat" className="text-[10px] font-bold">I-CAT</ShadTabsTrigger>
                      <ShadTabsTrigger value="codes" className="text-[10px] font-bold">CODES</ShadTabsTrigger>
                      <ShadTabsTrigger value="types" className="text-[10px] font-bold">DN-TYPES</ShadTabsTrigger>
                      <ShadTabsTrigger value="places" className="text-[10px] font-bold">OFFICES</ShadTabsTrigger>
                    </ShadTabsList>
                    
                    <ShadTabsContent value="vendors" className="mt-4"><VendorTable /></ShadTabsContent>
                    <ShadTabsContent value="v-cat" className="mt-4"><VendorCategoryTable /></ShadTabsContent>
                    <ShadTabsContent value="v-nature" className="mt-4"><VendorNatureOfBusinessTable /></ShadTabsContent>
                    <ShadTabsContent value="bill-items" className="mt-4"><BillItemMasterTable /></ShadTabsContent>
                    <ShadTabsContent value="i-cat" className="mt-4"><BillItemCategoryTable /></ShadTabsContent>
                    <ShadTabsContent value="codes" className="mt-4"><ProcessCodeTable /></ShadTabsContent>
                    <ShadTabsContent value="types" className="mt-4"><DemandTypeTable /></ShadTabsContent>
                    <ShadTabsContent value="places" className="mt-4"><DeliveryPlaceTable /></ShadTabsContent>
                  </ShadTabs>
                </MasterDataProvider>
              </LegacyBillFlowProvider>
            </ShadTabsContent>
            <ShadTabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <DemandNoteApprovalSettings />
            </ShadTabsContent>
          </>
        )}
      </ShadTabs>

      <Dialog open={isTrackerOpen} onOpenChange={setIsTrackerOpen}>
        <DialogContent className="sm:max-w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden animate-dialog-in">
            <div className="p-6 flex-grow overflow-hidden flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-4 border-b pb-4 shrink-0">
                    <div>
                        <DialogTitle className="text-2xl font-black text-primary">Organizational Workflow Tracker</DialogTitle>
                        <DialogDescription className="font-bold">Comprehensive audit trail and lifecycle visibility for every requisition.</DialogDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsTrackerOpen(false)}><X className="h-5 w-5" /></Button>
                </div>
                <div className="flex-grow min-h-0">
                    <WorkflowTracker />
                </div>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
        <DialogContent className="sm:max-w-[98vw] h-[95vh] flex flex-col p-0 overflow-hidden animate-dialog-in">
            <div className="p-6 flex-grow overflow-hidden flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-4 border-b pb-4 shrink-0">
                    <div>
                        <DialogTitle className="text-2xl font-black text-primary uppercase tracking-tighter">Personnel Performance & Activity Analytics</DialogTitle>
                        <DialogDescription className="font-bold text-destructive">Advanced diagnostic view of organizational efficiency and response lag metrics.</DialogDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsAuditOpen(false)}><X className="h-5 w-5" /></Button>
                </div>
                <div className="flex-grow min-h-0">
                    <UserAuditReport />
                </div>
            </div>
        </DialogContent>
      </Dialog>

      <BlueprintDialog isOpen={isBlueprintOpen} onOpenChange={setIsBlueprintOpen} />

    </div>
    </TooltipProvider>
  );
}

export default function LocalPurchasePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><div className="flex flex-col items-center gap-4"><div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div><p className="animate-pulse font-black text-xs uppercase tracking-widest text-muted-foreground">Handshaking Database...</p></div></div>}>
      <LocalPurchaseContent />
    </Suspense>
  );
}
