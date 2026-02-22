"use client";

import React, { useMemo, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs as ShadTabs, TabsContent as ShadTabsContent, TabsList as ShadTabsList, TabsTrigger as ShadTabsTrigger } from "@/components/ui/tabs";
import { DemandNoteApprovalSettings } from './components/demand-note-approval-settings';
import { DemandNoteTable } from './components/demand-note-table';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection } from 'firebase/firestore';
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
import { WorkflowTracker } from './components/workflow-tracker';
import { MRRTable } from './components/mrr-table';
import { NotificationCenter } from './components/notification-center';
import { PaymentNoteTable } from './components/pn-table';
import { 
    FileText, Briefcase, BarChart2, Package, 
    Database, Settings, History, X, Workflow, Wallet, Activity,
    ShoppingCart, Home, User as UserIcon, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UserAuditReport } from './components/user-audit-report';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { BlueprintDialog } from './components/blueprint-dialog';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { ChangePasswordDialog } from '@/components/change-password-dialog';

/**
 * CompactPipelineNode - High-density process nodes for the one-line header.
 * Enhanced with hover zoom and persistent short names.
 */
const CompactPipelineNode = ({ 
    shortName, label, color, isActive, onClick 
}: { 
    shortName: string, label: string, color: string, isActive: boolean, onClick: () => void
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                onClick={onClick}
                className={cn(
                    "relative flex flex-col items-center justify-center transition-all duration-300 group",
                    isActive ? "scale-110" : "scale-90 opacity-70 hover:opacity-100 hover:scale-125"
                )}
            >
                <div className={cn(
                    "h-12 w-12 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 shadow-lg relative overflow-hidden",
                    isActive 
                        ? "border-white bg-primary text-primary-foreground shadow-[0_0_25px_rgba(0,0,0,0.3)] ring-4 ring-primary/5" 
                        : "border-background bg-white text-muted-foreground shadow-md",
                    !isActive && color.replace('bg-', 'border-')
                )}>
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-tighter leading-none z-10",
                        isActive ? "text-white" : color.replace('bg-', 'text-')
                    )}>{shortName}</span>
                    {isActive && <div className={cn("absolute inset-0 rounded-full blur-lg opacity-40 animate-pulse", color)} />}
                </div>
                <div className="absolute -bottom-5 w-max">
                    <p className={cn(
                        "text-[8px] font-black uppercase tracking-tighter transition-all",
                        isActive ? "text-primary opacity-100" : "opacity-0"
                    )}>{label}</p>
                </div>
            </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="font-black uppercase text-[10px] tracking-widest">{label}</TooltipContent>
    </Tooltip>
);

function LocalPurchaseContent() {
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
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

  const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  const { data: employees } = useCollection<Employee>(employeesRef);

  const currentUserEmployee = useMemo(() => {
      if (!user || !employees) return null;
      return employees.find(e => e.id === user.uid) || employees.find(e => e.email === user.email);
  }, [user, employees]);

  return (
    <TooltipProvider>
    <div className="space-y-6 pb-20">
      
      {/* THE MASTER COMMAND HUB - ONE LINE INTEGRATION */}
      <div className="flex items-center justify-between gap-4 p-3 bg-background border-b shadow-xl sticky top-0 z-[100] backdrop-blur-xl">
        
        {/* SECTION 1: IDENTITY & HOME (PRO-ACTIVE DROPDOWN) */}
        <div className="flex items-center gap-3 shrink-0">
            <Button size="icon" variant="ghost" asChild className="h-10 w-10 rounded-full hover:bg-primary hover:text-white transition-all active:scale-90">
                <Link href="/"><Home className="h-5 w-5" /></Link>
            </Button>
            <Separator orientation="vertical" className="h-8" />
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 pr-2 cursor-pointer group transition-all">
                        <Avatar className="h-9 w-9 border-2 border-primary/10 group-hover:border-primary/40 transition-colors">
                            <AvatarImage src={currentUserEmployee?.profilePicture} alt={currentUserEmployee?.fullName} />
                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">{currentUserEmployee?.fullName?.charAt(0) || <UserIcon className="h-4 w-4" />}</AvatarFallback>
                        </Avatar>
                        <div className="hidden lg:flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-tighter leading-none text-primary">{currentUserEmployee?.fullName || user?.email?.split('@')[0]}</p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 group-hover:text-primary transition-colors">Digital Identity</p>
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 mt-2 animate-scale-in" sideOffset={8}>
                    <DropdownMenuLabel className="flex flex-col">
                        <span className="font-bold truncate text-sm">{currentUserEmployee?.fullName || user?.email?.split('@')[0]}</span>
                        <span className="text-[10px] text-muted-foreground font-normal truncate">{user?.email || ''}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ChangePasswordDialog>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>My Account</span>
                        </DropdownMenuItem>
                    </ChangePasswordDialog>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => auth.signOut()} className="text-destructive focus:bg-destructive/10 focus:text-destructive font-bold">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* SECTION 2: THE 6-MODULE PIPELINE (CENTRAL SUBWAY) */}
        <div className="flex-1 flex items-center justify-center px-4 max-w-2xl relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted-foreground/10 -translate-y-1/2 z-0" />
            <div className="flex justify-between items-center w-full relative z-10 gap-2">
                <CompactPipelineNode shortName="DN" label="Demand Note" color="bg-red-500" isActive={activeTab === 'demand-notes'} onClick={() => handleTabChange('demand-notes')} />
                <CompactPipelineNode shortName="GP" label="GP Sourcing" color="bg-cyan-500" isActive={activeTab === 'gp-desk'} onClick={() => handleTabChange('gp-desk')} />
                <CompactPipelineNode shortName="CS" label="CS Analysis" color="bg-yellow-500" isActive={activeTab === 'cs'} onClick={() => handleTabChange('cs')} />
                <CompactPipelineNode shortName="PO" label="PO Contract" color="bg-green-500" isActive={activeTab === 'po'} onClick={() => handleTabChange('po')} />
                <CompactPipelineNode shortName="MRR" label="MRR Receipt" color="bg-orange-500" isActive={activeTab === 'mrr'} onClick={() => handleTabChange('mrr')} />
                <CompactPipelineNode shortName="PN" label="PN Settlement" color="bg-purple-500" isActive={activeTab === 'pn'} onClick={() => handleTabChange('pn')} />
            </div>
        </div>

        {/* SECTION 3: UTILITY HUB & NOTIFICATIONS (ELECTRIFIED ALERTS) */}
        <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-muted/30 p-1 rounded-full border border-primary/5 shadow-inner gap-0.5">
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-500 hover:text-white transition-all" onClick={() => setIsBlueprintOpen(true)}><Workflow className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Operational Blueprint</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-emerald-500 hover:text-white transition-all" onClick={() => setIsTrackerOpen(true)}><History className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Workflow Tracker</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-orange-500 hover:text-white transition-all" onClick={() => setIsAuditOpen(true)}><Activity className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Performance Analytics</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full transition-all", activeTab === 'master-data' ? "bg-primary text-white" : "hover:bg-primary hover:text-white")} onClick={() => handleTabChange('master-data')}><Database className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Master Registry</TooltipContent></Tooltip>
                {isSuperAdmin && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full transition-all", activeTab === 'settings' ? "bg-primary text-white" : "hover:bg-primary hover:text-white")} onClick={() => handleTabChange('settings')}><Settings className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Admin Settings</TooltipContent></Tooltip>}
            </div>

            <div className="relative group ml-2 scale-110">
                <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full animate-pulse opacity-50" />
                <NotificationCenter />
            </div>
        </div>
      </div>

      {/* MODULE CONTENT RENDERER */}
      <div className="max-w-[98vw] mx-auto px-4 mt-4">
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
                            <CardHeader className="bg-muted/30 border-b py-3"><CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Fleet & Procurement Master Registry</CardTitle></CardHeader>
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