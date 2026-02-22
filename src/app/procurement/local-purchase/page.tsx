
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
import { GPDeskTable } from './components/gp-desk-table';
import { VendorTable } from '@/app/billflow/components/vendor-table';
import { LegacyBillFlowProvider, MasterDataProvider } from '@/app/billflow/components/bill-flow-provider';
import { ComparativeStatementTable } from './components/cs-table';
import { PurchaseOrderTable } from './components/po-table';
import { ProcessCodeTable } from './components/process-code-table';
import { DemandTypeTable } from './components/demand-type-table';
import { BillItemMasterTable } from '@/app/billflow/components/bill-item-master-table';
import { DeliveryPlaceTable } from './components/delivery-place-table';
import { Badge } from '@/components/ui/badge';
import { WorkflowTracker } from './components/workflow-tracker';
import { MRRTable } from './components/mrr-table';
import { NotificationCenter } from './components/notification-center';
import { PaymentNoteTable } from './components/pn-table';
import { 
    FileText, Briefcase, BarChart2, ClipboardCheck, Package, 
    Database, Settings, History, UserCheck, X, Workflow, Wallet, Activity,
    ShoppingCart, ChevronRight, Home, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UserAuditReport } from './components/user-audit-report';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { BlueprintDialog } from './components/blueprint-dialog';
import { cn } from '@/lib/utils';

/**
 * InfographicNavNode - A circular node with alternating label positions matching the user's choice image.
 */
const InfographicNavNode = ({ 
    id, label, icon: Icon, color, isActive, onClick, position 
}: { 
    id: string, label: string, icon: any, color: string, isActive: boolean, onClick: () => void, position: 'top' | 'bottom'
}) => (
    <div className={cn(
        "flex flex-col items-center group relative z-20 transition-all duration-500 flex-1",
        position === 'top' ? "justify-start" : "justify-end"
    )} style={{ height: '100%' }}>
        
        {position === 'bottom' && (
            <div className={cn(
                "text-center w-full px-2 transition-all duration-500 mb-6",
                isActive ? "opacity-100 scale-110" : "opacity-40"
            )}>
                <p className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? color.replace('bg-', 'text-') : "text-muted-foreground")}>DATASET {id}</p>
                <p className="text-[11px] font-black uppercase tracking-tighter text-foreground leading-tight">{label}</p>
            </div>
        )}

        <button
            onClick={onClick}
            className={cn(
                "h-24 w-24 rounded-full border-[8px] flex items-center justify-center transition-all duration-500 shadow-2xl relative",
                isActive 
                    ? "scale-110 border-white bg-primary text-primary-foreground shadow-[0_0_50px_rgba(0,0,0,0.3)] ring-[15px] ring-primary/5" 
                    : "border-background bg-white text-muted-foreground hover:scale-105",
                !isActive && color.replace('bg-', 'border-')
            )}
        >
            <Icon className={cn("h-10 w-10", isActive ? "text-white" : color.replace('bg-', 'text-'))} />
            {/* Visual glow element */}
            {isActive && <div className={cn("absolute inset-0 rounded-full blur-xl opacity-30", color)} />}
        </button>

        {position === 'top' && (
            <div className={cn(
                "text-center w-full px-2 transition-all duration-500 mt-6",
                isActive ? "opacity-100 scale-110" : "opacity-40"
            )}>
                <p className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? color.replace('bg-', 'text-') : "text-muted-foreground")}>DATASET {id}</p>
                <p className="text-[11px] font-black uppercase tracking-tighter text-foreground leading-tight">{label}</p>
            </div>
        )}
    </div>
);

function LocalPurchaseContent() {
  const { user } = useUser();
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

  const isSuperAdmin = user?.email === 'superadmin@galsolution.com';

  return (
    <TooltipProvider>
    <div className="space-y-8 pb-20">
      <ModuleHeader />
      
      {/* PERSISTENT TOP COMMAND PANEL */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-background border-4 border-double border-primary/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-cyan-500 via-yellow-500 via-green-500 via-orange-500 to-purple-500 opacity-20" />
        
        <div className="flex items-center gap-6 relative z-10">
            <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter uppercase text-primary leading-none">Local Purchase</h1>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 font-black text-[10px] tracking-widest px-3 py-0.5">EST. 2024</Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Organizational Supply Chain Hub</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
            {/* PERSISTENT COMMAND BUTTONS HUB */}
            <div className="flex bg-muted/30 p-1.5 rounded-full border border-primary/5 shadow-inner gap-1">
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-500 hover:text-white transition-all active:scale-95" onClick={() => setIsBlueprintOpen(true)}><Workflow className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent>Operational Blueprint Master</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="rounded-full hover:bg-emerald-500 hover:text-white transition-all active:scale-95" onClick={() => setIsTrackerOpen(true)}><History className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent>Organizational Workflow Tracker</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="rounded-full hover:bg-orange-500 hover:text-white transition-all active:scale-95" onClick={() => setIsAuditOpen(true)}><Activity className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent>Personnel Performance Analytics</TooltipContent></Tooltip>
                <Separator orientation="vertical" className="h-8 mx-1 opacity-20" />
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all active:scale-95" onClick={() => handleTabChange('master-data')}><Database className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent>Master Data Registry</TooltipContent></Tooltip>
                {isSuperAdmin && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all active:scale-95" onClick={() => handleTabChange('settings')}><Settings className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent>Organizational Flow Settings</TooltipContent></Tooltip>}
            </div>

            <Separator orientation="vertical" className="h-12 mx-2 hidden md:block" />
            
            {/* HIGHLIGHTED NOTIFICATION CENTER */}
            <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
                <NotificationCenter />
            </div>
        </div>
      </div>

      {/* HORIZONTAL WAVY PIPELINE NAVIGATION */}
      <div className="relative py-12 px-4 w-full max-w-6xl mx-auto h-[450px] flex flex-col justify-center">
          {/* SVG Wavy Connection Line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1000 400" preserveAspectRatio="none">
              {/* Main Process Path */}
              <path 
                  d="M 0 300 L 100 300 C 180 300 180 100 260 100 C 340 100 340 300 420 300 C 500 300 500 100 580 100 C 660 100 660 300 740 300 C 820 300 820 100 900 100 L 1000 100" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="transparent" 
                  className="text-muted-foreground/10"
                  strokeLinecap="round"
              />
              {/* Highlight Pulse Path */}
              <path 
                  d="M 0 300 L 100 300 C 180 300 180 100 260 100 C 340 100 340 300 420 300 C 500 300 500 100 580 100 C 660 100 660 300 740 300 C 820 300 820 100 900 100 L 1000 100" 
                  stroke="url(#pipelineGradient)" 
                  strokeWidth="4" 
                  fill="transparent" 
                  strokeDasharray="20 40"
                  className="animate-[progress_15s_linear_infinite]"
              />
              <defs>
                  <linearGradient id="pipelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor:'#ef4444', stopOpacity:1}} />
                      <stop offset="20%" style={{stopColor:'#06b6d4', stopOpacity:1}} />
                      <stop offset="40%" style={{stopColor:'#eab308', stopOpacity:1}} />
                      <stop offset="60%" style={{stopColor:'#22c55e', stopOpacity:1}} />
                      <stop offset="80%" style={{stopColor:'#f97316', stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:'#a855f7', stopOpacity:1}} />
                  </linearGradient>
              </defs>
          </svg>

          {/* Nodes Container */}
          <div className="flex justify-between items-center h-full relative z-10 w-full">
              <InfographicNavNode id="01" label="Demand Notes" icon={FileText} color="bg-red-500" isActive={activeTab === 'demand-notes'} onClick={() => handleTabChange('demand-notes')} position="bottom" />
              <InfographicNavNode id="02" label="GP Desk Sourcing" icon={Briefcase} color="bg-cyan-500" isActive={activeTab === 'gp-desk'} onClick={() => handleTabChange('gp-desk')} position="top" />
              <InfographicNavNode id="03" label="Comparative Statement" icon={BarChart2} color="bg-yellow-500" isActive={activeTab === 'cs'} onClick={() => handleTabChange('cs')} position="bottom" />
              <InfographicNavNode id="04" label="Purchase Order" icon={ShoppingCart} color="bg-green-500" isActive={activeTab === 'po'} onClick={() => handleTabChange('po')} position="top" />
              <InfographicNavNode id="05" label="MRR Receipt" icon={Package} color="bg-orange-500" isActive={activeTab === 'mrr'} onClick={() => handleTabChange('mrr')} position="bottom" />
              <InfographicNavNode id="06" label="PN Settlement" icon={Wallet} color="bg-purple-500" isActive={activeTab === 'pn'} onClick={() => handleTabChange('pn')} position="top" />
          </div>
      </div>

      <Separator className="max-w-5xl mx-auto opacity-10" />

      {/* MODULE CONTENT RENDERER */}
      <div className="max-w-[98vw] mx-auto px-4">
        <ShadTabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <ShadTabsContent value="demand-notes" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0"><DemandNoteTable /></ShadTabsContent>
            <ShadTabsContent value="gp-desk" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0"><GPDeskTable /></ShadTabsContent>
            <ShadTabsContent value="cs" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0"><ComparativeStatementTable /></ShadTabsContent>
            <ShadTabsContent value="po" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0"><PurchaseOrderTable /></ShadTabsContent>
            <ShadTabsContent value="mrr" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0"><MRRTable /></ShadTabsContent>
            <ShadTabsContent value="pn" className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0"><PaymentNoteTable /></ShadTabsContent>
            
            <ShadTabsContent value="master-data" className="animate-in fade-in zoom-in-95 duration-500 mt-0">
                <LegacyBillFlowProvider>
                    <MasterDataProvider>
                        <Card className="border-primary/10 shadow-2xl rounded-3xl overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b"><CardTitle className="text-lg">Fleet & Procurement Master Registry</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                <ShadTabs defaultValue="vendors" className="w-full">
                                    <ShadTabsList className="flex bg-muted/20 border-b h-auto p-1 rounded-none overflow-x-auto no-scrollbar">
                                        <ShadTabsTrigger value="vendors" className="text-[10px] font-black uppercase tracking-widest px-6 py-3">Vendors</ShadTabsTrigger>
                                        <ShadTabsTrigger value="bill-items" className="text-[10px] font-black uppercase tracking-widest px-6 py-3">Items</ShadTabsTrigger>
                                        <ShadTabsTrigger value="places" className="text-[10px] font-black uppercase tracking-widest px-6 py-3">Offices</ShadTabsTrigger>
                                        <ShadTabsTrigger value="codes" className="text-[10px] font-black uppercase tracking-widest px-6 py-3">Process Codes</ShadTabsTrigger>
                                    </ShadTabsList>
                                    <div className="p-6">
                                        <ShadTabsContent value="vendors"><VendorTable /></ShadTabsContent>
                                        <ShadTabsContent value="bill-items"><BillItemMasterTable /></ShadTabsContent>
                                        <ShadTabsContent value="places"><DeliveryPlaceTable /></ShadTabsContent>
                                        <ShadTabsContent value="codes"><ProcessCodeTable /></ShadTabsContent>
                                    </div>
                                </ShadTabs>
                            </CardContent>
                        </Card>
                    </MasterDataProvider>
                </LegacyBillFlowProvider>
            </ShadTabsContent>

            <ShadTabsContent value="settings" className="animate-in fade-in zoom-in-95 duration-500 mt-0">
                <DemandNoteApprovalSettings />
            </ShadTabsContent>
        </ShadTabs>
      </div>

      {/* COMMAND CONTROL DIALOGS */}
      <Dialog open={isTrackerOpen} onOpenChange={setIsTrackerOpen}><DialogContent className="sm:max-w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-3xl"><div className="p-6 flex-grow overflow-hidden flex flex-col min-h-0"><div className="flex justify-between items-center mb-4 border-b pb-4 shrink-0"><div><DialogTitle className="text-2xl font-black text-primary">Organizational Workflow Tracker</DialogTitle><DialogDescription className="font-bold">Comprehensive audit trail and lifecycle visibility.</DialogDescription></div><Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsTrackerOpen(false)}><X className="h-5 w-5" /></Button></div><div className="flex-grow min-h-0"><WorkflowTracker /></div></div></DialogContent></Dialog>
      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}><DialogContent className="sm:max-w-[98vw] h-[95vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-3xl"><div className="p-6 flex-grow overflow-hidden flex flex-col min-h-0"><div className="flex justify-between items-center mb-4 border-b pb-4 shrink-0"><div><DialogTitle className="text-2xl font-black text-primary uppercase tracking-tighter">Personnel Performance Analytics</DialogTitle><DialogDescription className="font-bold text-destructive">Diagnostic view of organizational efficiency.</DialogDescription></div><Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsAuditOpen(false)}><X className="h-5 w-5" /></Button></div><div className="flex-grow min-h-0"><UserAuditReport /></div></div></DialogContent></Dialog>
      <BlueprintDialog isOpen={isBlueprintOpen} onOpenChange={setIsBlueprintOpen} />

    </div>
    </TooltipProvider>
  );
}

export default function LocalPurchasePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><div className="flex flex-col items-center gap-4"><div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div><p className="animate-pulse font-black text-xs uppercase tracking-widest text-muted-foreground">Synchronizing Environmental Registry...</p></div></div>}>
      <LocalPurchaseContent />
    </Suspense>
  );
}
