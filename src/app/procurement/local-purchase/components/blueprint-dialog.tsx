'use client';

import React, { useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Workflow, FileText, Users, BarChart2, ShoppingCart, Package, 
    ChevronRight, ShieldCheck, DollarSign, AlertTriangle, Gavel, 
    ListOrdered, GitCommitHorizontal, MapPin, Info, CheckCircle2, 
    Send, Factory, UserCheck, ClipboardCheck, Zap, TrendingUp, Search,
    History, Layers, UserPlus, Tag, Bell, Lock, Eye
} from 'lucide-react';
import { useProcurement } from './procurement-provider';
import { cn } from '@/lib/utils';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

const BlueprintSection = ({ 
    icon: Icon, 
    title, 
    colorClass, 
    children 
}: { 
    icon: any, 
    title: string, 
    colorClass: string, 
    children: React.ReactNode 
}) => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={cn("flex items-center gap-3 p-4 rounded-2xl border-l-8 shadow-sm bg-background", colorClass)}>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md shadow-inner">
                <Icon className="h-8 w-8 text-white" />
            </div>
            <div>
                <h3 className="text-2xl font-black tracking-tighter uppercase text-white">{title}</h3>
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest leading-none">Micro-Process Execution Standard</p>
            </div>
        </div>
        <div className="grid grid-cols-1 gap-6 px-2">
            {children}
        </div>
    </div>
);

const LogicCard = ({ 
    title, 
    description, 
    condition, 
    icon: Icon 
}: { 
    title: string, 
    description: string, 
    condition?: string, 
    icon?: any 
}) => (
    <Card className="border-primary/10 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
        <CardContent className="pt-6 relative">
            <div className="flex items-start gap-4">
                {Icon && (
                    <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <div className="space-y-2">
                    <h4 className="font-black text-base tracking-tight">{title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                    {condition && (
                        <div className="mt-3 p-2 bg-muted rounded border-l-4 border-primary font-mono text-[10px] uppercase font-bold tracking-tighter">
                            Condition: {condition}
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-20 transition-opacity">
                <Zap className="h-12 w-12" />
            </div>
        </CardContent>
    </Card>
);

export function BlueprintDialog({ 
    isOpen, 
    onOpenChange 
}: { 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
    const { orgSettings, employees, designations } = useProcurement();

    const currentApprovalChain = useMemo(() => {
        if (!orgSettings?.approvalFlow?.steps) return [];
        return orgSettings.approvalFlow.steps.map(step => {
            const emp = employees.find(e => e.id === step.approverId);
            const des = designations.find(d => d.id === emp?.designationId);
            return {
                name: step.stepName,
                approver: emp?.fullName || 'Unassigned',
                role: des?.name || 'N/A',
                status: step.statusName
            };
        });
    }, [orgSettings, employees, designations]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[98vw] h-[95vh] flex flex-col p-0 overflow-hidden animate-dialog-in border-none shadow-2xl">
                <div className="bg-primary p-8 text-primary-foreground shrink-0 relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-xl ring-1 ring-white/20 shadow-2xl">
                                <Workflow className="h-12 w-12 text-white animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Operational Blueprint Master</h1>
                                <p className="text-sm font-bold text-primary-foreground/60 uppercase tracking-[0.3em]">End-to-End Local Purchase Lifecycle &amp; Logic Matrix</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-right">
                                <Badge variant="secondary" className="bg-white/20 text-white border-none font-black text-xs px-4">VERSION 4.0 GOLD</Badge>
                                <p className="text-[10px] mt-1 font-bold opacity-50 uppercase tracking-widest text-white">Certified Process Model</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -top-24 -right-24 h-64 w-64 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-white/5 rounded-full blur-3xl" />
                </div>

                <div className="flex-grow min-h-0 bg-muted/20">
                    <Tabs defaultValue="lifecycle" className="h-full flex flex-col">
                        <div className="px-8 bg-background border-b shrink-0">
                            <TabsList className="h-16 w-full justify-start bg-transparent gap-8 p-0">
                                <TabsTrigger value="lifecycle" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2"><GitCommitHorizontal className="h-4 w-4"/> Full Lifecycle</TabsTrigger>
                                <TabsTrigger value="access" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2"><Lock className="h-4 w-4"/> Access Matrix</TabsTrigger>
                                <TabsTrigger value="notifications" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2"><Bell className="h-4 w-4"/> Notification Engine</TabsTrigger>
                                <TabsTrigger value="requisition" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2"><FileText className="h-4 w-4"/> DN Logic</TabsTrigger>
                                <TabsTrigger value="execution" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2"><ShoppingCart className="h-4 w-4"/> PO &amp; Compliance</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 px-8 py-8">
                            <div className="max-w-7xl mx-auto space-y-16 pb-32">
                                <TabsContent value="lifecycle" className="mt-0 space-y-12">
                                    <section className="space-y-8">
                                        <div className="text-center space-y-2">
                                            <h2 className="text-3xl font-black uppercase tracking-tight">The Organizational Subway Map</h2>
                                            <p className="text-muted-foreground font-bold">Six primary gateways from organizational need to physical asset acceptance.</p>
                                        </div>
                                        
                                        <div className="relative p-12 border-4 border-dashed rounded-[3rem] bg-background shadow-2xl overflow-hidden">
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative z-10">
                                                <div className="flex flex-col items-center gap-4 group">
                                                    <div className="h-20 w-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-[0_20px_50px_rgba(37,99,235,0.3)] group-hover:scale-110 transition-transform duration-500 ring-4 ring-white border-4 border-blue-600/20"><FileText className="h-10 w-10" /></div>
                                                    <div className="text-center"><p className="text-xs font-black uppercase tracking-tighter">DN Entry</p><p className="text-[10px] text-muted-foreground leading-tight">Digital<br/>Requisition</p></div>
                                                </div>
                                                <div className="hidden md:flex items-center justify-center pt-8"><ChevronRight className="h-8 w-8 text-muted-foreground/30 animate-pulse" /></div>
                                                <div className="flex flex-col items-center gap-4 group">
                                                    <div className="h-20 w-20 rounded-3xl bg-emerald-600 text-white flex items-center justify-center shadow-[0_20px_50px_rgba(5,150,105,0.3)] group-hover:scale-110 transition-transform duration-500 ring-4 ring-white border-4 border-emerald-600/20"><Users className="h-10 w-10" /></div>
                                                    <div className="text-center"><p className="text-xs font-black uppercase tracking-tighter">GP Desk</p><p className="text-[10px] text-muted-foreground leading-tight">Vendor<br/>Sourcing</p></div>
                                                </div>
                                                <div className="hidden md:flex items-center justify-center pt-8"><ChevronRight className="h-8 w-8 text-muted-foreground/30 animate-pulse" /></div>
                                                <div className="flex flex-col items-center gap-4 group">
                                                    <div className="h-20 w-20 rounded-3xl bg-amber-600 text-white flex items-center justify-center shadow-[0_20px_50px_rgba(217,119,6,0.3)] group-hover:scale-110 transition-transform duration-500 ring-4 ring-white border-4 border-amber-600/20"><BarChart2 className="h-10 w-10" /></div>
                                                    <div className="text-center"><p className="text-xs font-black uppercase tracking-tighter">CS Audit</p><p className="text-[10px] text-muted-foreground leading-tight">Price<br/>Analysis</p></div>
                                                </div>
                                                <div className="hidden md:flex items-center justify-center pt-8"><ChevronRight className="h-8 w-8 text-muted-foreground/30 animate-pulse" /></div>
                                                <div className="flex flex-col items-center gap-4 group">
                                                    <div className="h-20 w-20 rounded-3xl bg-purple-600 text-white flex items-center justify-center shadow-[0_20px_50px_rgba(147,51,234,0.3)] group-hover:scale-110 transition-transform duration-500 ring-4 ring-white border-4 border-purple-600/20"><ShieldCheck className="h-10 w-10" /></div>
                                                    <div className="text-center"><p className="text-xs font-black uppercase tracking-tighter">Execution</p><p className="text-[10px] text-muted-foreground leading-tight">Executive<br/>Approval</p></div>
                                                </div>
                                                <div className="hidden md:flex items-center justify-center pt-8"><ChevronRight className="h-8 w-8 text-muted-foreground/30 animate-pulse" /></div>
                                                <div className="flex flex-col items-center gap-4 group">
                                                    <div className="h-20 w-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.3)] group-hover:scale-110 transition-transform duration-500 ring-4 ring-white border-4 border-indigo-600/20"><ShoppingCart className="h-10 w-10" /></div>
                                                    <div className="text-center"><p className="text-xs font-black uppercase tracking-tighter">Contract</p><p className="text-[10px] text-muted-foreground leading-tight">Purchase<br/>Order</p></div>
                                                </div>
                                                <div className="hidden md:flex items-center justify-center pt-8"><ChevronRight className="h-8 w-8 text-muted-foreground/30 animate-pulse" /></div>
                                                <div className="flex flex-col items-center gap-4 group">
                                                    <div className="h-20 w-20 rounded-3xl bg-slate-800 text-white flex items-center justify-center shadow-[0_20px_50px_rgba(30,41,59,0.3)] group-hover:scale-110 transition-transform duration-500 ring-4 ring-white border-4 border-slate-800/20"><Package className="h-10 w-10" /></div>
                                                    <div className="text-center"><p className="text-xs font-black uppercase tracking-tighter">Receipt</p><p className="text-[10px] text-muted-foreground leading-tight">Inventory<br/>Entry (MRR)</p></div>
                                                </div>
                                            </div>
                                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-amber-500 to-slate-800 -translate-y-1/2 opacity-10 hidden md:block" />
                                        </div>
                                    </section>
                                </TabsContent>

                                <TabsContent value="access" className="mt-0">
                                    <BlueprintSection icon={Lock} title="Organizational Access Matrix" colorClass="bg-slate-800 border-slate-900">
                                        <Card className="border-primary/10 shadow-lg overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-slate-100">
                                                    <TableRow>
                                                        <TableHead className="font-black uppercase text-[10px]">Tab / Menu</TableHead>
                                                        <TableHead className="font-black uppercase text-[10px]">Administrative Access</TableHead>
                                                        <TableHead className="font-black uppercase text-[10px]">Operational Access</TableHead>
                                                        <TableHead className="font-black uppercase text-[10px]">Restrictive Filter</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell className="font-bold text-xs"><div className="flex items-center gap-2"><FileText className="h-3 w-3" /> Demand Notes</div></TableCell>
                                                        <TableCell><Badge variant="outline">Superadmin</Badge></TableCell>
                                                        <TableCell><p className="text-[10px]">All Personnel (Creators, Approvers, GP)</p></TableCell>
                                                        <TableCell><p className="text-[10px] italic">Creators see only their own notes.</p></TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-bold text-xs"><div className="flex items-center gap-2"><Briefcase className="h-3 w-3" /> GP Desk</div></TableCell>
                                                        <TableCell><Badge variant="outline">Superadmin</Badge> <Badge variant="outline" className="ml-1">GP Officer</Badge></TableCell>
                                                        <TableCell><p className="text-[10px]">GP Concern Officers</p></TableCell>
                                                        <TableCell><p className="text-[10px] italic">Concerns see only their assigned tasks.</p></TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-bold text-xs"><div className="flex items-center gap-2"><BarChart2 className="h-3 w-3" /> CS Analysis</div></TableCell>
                                                        <TableCell><Badge variant="outline">Superadmin</Badge> <Badge variant="outline" className="ml-1">Managers</Badge></TableCell>
                                                        <TableCell><p className="text-[10px]">Dept Heads, Technical Advisors</p></TableCell>
                                                        <TableCell><p className="text-[10px] italic font-bold text-primary">Restricted to personal signature history.</p></TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-bold text-xs"><div className="flex items-center gap-2"><Lock className="h-3 w-3" /> System Settings</div></TableCell>
                                                        <TableCell><Badge className="bg-red-600 text-white border-none">Superadmin Only</Badge></TableCell>
                                                        <TableCell><p className="text-[10px] opacity-30">—</p></TableCell>
                                                        <TableCell><p className="text-[10px] italic text-destructive font-black">Zero operational visibility.</p></TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </Card>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="notifications" className="mt-0">
                                    <BlueprintSection icon={Bell} title="The Proactive Notification Engine" colorClass="bg-red-600 border-red-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <Card className="bg-white border-red-100">
                                                <CardHeader className="bg-red-50 border-b border-red-100"><CardTitle className="text-sm font-black uppercase text-red-900 flex items-center gap-2"><Zap className="h-4 w-4" /> Trigger Logic (The "Bell")</CardTitle></CardHeader>
                                                <CardContent className="pt-6 space-y-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-6 w-6 rounded bg-red-600 text-white flex items-center justify-center shrink-0"><Check className="h-3 w-3" /></div>
                                                        <div className="space-y-1"><p className="text-xs font-bold uppercase tracking-tight">Step 1: Status Change</p><p className="text-[10px] text-muted-foreground">The moment a record moves from "Pending" to "Approved" (or vice versa), the system re-calculates the target recipient.</p></div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-6 w-6 rounded bg-red-600 text-white flex items-center justify-center shrink-0"><Check className="h-3 w-3" /></div>
                                                        <div className="space-y-1"><p className="text-xs font-bold uppercase tracking-tight">Step 2: ID Targeting</p><p className="text-[10px] text-muted-foreground">The notification is locked specifically to the `currentApproverId` or `gpConcernOfficerId` strings in the database.</p></div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-6 w-6 rounded bg-red-600 text-white flex items-center justify-center shrink-0"><Check className="h-3 w-3" /></div>
                                                        <div className="space-y-1"><p className="text-xs font-bold uppercase tracking-tight">Step 3: Pulse Indicator</p><p className="text-[10px] text-muted-foreground">A red status dot appears on the top-right of the bell icon, and the bell initiates a subtle 2-second ringing animation.</p></div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-white border-red-100">
                                                <CardHeader className="bg-red-50 border-b border-red-100"><CardTitle className="text-sm font-black uppercase text-red-900 flex items-center gap-2"><History className="h-4 w-4" /> Target Recipients by Scenario</CardTitle></CardHeader>
                                                <CardContent className="p-0">
                                                    <Table>
                                                        <TableBody>
                                                            <TableRow className="border-red-50 hover:bg-red-50/30"><TableCell className="font-bold text-[10px] uppercase">DN Pending Approval</TableCell><TableCell className="text-[10px] font-bold text-red-700">Next Approver in Chain</TableCell></TableRow>
                                                            <TableRow className="border-red-50 hover:bg-red-50/30"><TableCell className="font-bold text-[10px] uppercase">DN Final Approved</TableCell><TableCell className="text-[10px] font-bold text-red-700">GP Officer (Assignment Task)</TableCell></TableRow>
                                                            <TableRow className="border-red-50 hover:bg-red-50/30"><TableCell className="font-bold text-[10px] uppercase">GP Desk Assigned</TableCell><TableCell className="text-[10px] font-bold text-red-700">Assigned GP Concern Officer</TableCell></TableRow>
                                                            <TableRow className="border-red-50 hover:bg-red-50/30"><TableCell className="font-bold text-[10px] uppercase">CS Prepared</TableCell><TableCell className="text-[10px] font-bold text-red-700">GP Concern (Awarding Task)</TableCell></TableRow>
                                                            <TableRow className="border-red-50 hover:bg-red-50/30"><TableCell className="font-bold text-[10px] uppercase">CS Awarded</TableCell><TableCell className="text-[10px] font-bold text-red-700">CS Approval Signature Chain</TableCell></TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="requisition" className="mt-0">
                                    <BlueprintSection icon={FileText} title="Demand Note (DN) Generation" colorClass="bg-blue-600 border-blue-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <LogicCard icon={Factory} title="The Manufacturing Clause" description="If the requesting department is flagged as 'Manufacturing', the system automatically injects the Manufacturing Dept Manager into the approval chain." condition="isManufacturingDept == true" />
                                            <LogicCard icon={AlertTriangle} title="Special Item Audit" description="Requests containing items from 'Special Categories' bypass standard flows and route directly to the Specialized Dept. Manager and MD." condition="hasSpecialItem == true" />
                                            <LogicCard icon={UserCheck} title="Standard Routing" description="Standard items route through the Department Head and Technical Advisor for initial feasibility and budget check." condition="default" />
                                        </div>
                                        <Card className="bg-blue-50/50 border-blue-200">
                                            <CardHeader><CardTitle className="text-sm font-black flex items-center gap-2 text-blue-800 uppercase tracking-widest"><Info className="h-4 w-4"/> Digital Requirement Integrity</CardTitle></CardHeader>
                                            <CardContent className="text-xs text-blue-900/70 leading-relaxed font-bold uppercase tracking-tighter">
                                                All Demand Notes are assigned a unique digital fingerprint. Once a DN is initiated, its particulars (quantity, unit, description) become the immutable reference point for the entire procurement lifecycle. Discrepancies in the final MRR are measured against this original entry.
                                            </CardContent>
                                        </Card>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="execution" className="mt-0">
                                    <BlueprintSection icon={ClipboardCheck} title="Contract Execution &amp; Receipt Compliance" colorClass="bg-purple-600 border-purple-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <h4 className="font-black uppercase tracking-tight text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-purple-600"/> Purchase Order (PO) Standard</h4>
                                                <div className="space-y-4">
                                                    <LogicCard icon={Gavel} title="Legal Commitment" description="The PO is generated directly from the CS award data. It is a legally binding contract between the organization and the vendor." />
                                                    <LogicCard icon={Send} title="Dispatch Requirement" description="Internal approval is only the first step. Dispatching the PO to the vendor triggers the official lead-time countdown." />
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <h4 className="font-black uppercase tracking-tight text-lg flex items-center gap-2"><Package className="h-5 w-5 text-purple-600"/> MRR Audit Standard</h4>
                                                <div className="space-y-4">
                                                    <LogicCard icon={Layers} title="Three-Way Match" description="Physical quantities received are strictly matched against the original DN and the issued PO to prevent over-billing." />
                                                    <LogicCard icon={ShieldCheck} title="Evidence Requirement" description="Every MRR must be finalized with high-resolution scans of the Vendor Invoice and the Delivery Challan." />
                                                </div>
                                            </div>
                                        </div>

                                        <Card className="border-purple-200 bg-purple-50/30">
                                            <CardHeader><CardTitle className="text-base font-black uppercase text-purple-900 tracking-widest flex items-center gap-2"><History className="h-5 w-5"/> The Bill Approval Flow Visualizer (Live Configuration)</CardTitle></CardHeader>
                                            <CardContent className="py-12 px-8">
                                                <div className="relative flex flex-col md:flex-row justify-between items-center gap-12">
                                                    {currentApprovalChain.length > 0 ? currentApprovalChain.map((step, idx) => (
                                                        <React.Fragment key={idx}>
                                                            <div className="flex flex-col items-center gap-4 relative z-10 w-full md:w-auto">
                                                                <div className="flex flex-col items-center">
                                                                    <div className="h-16 w-16 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-2xl ring-4 ring-white border-2 border-purple-400 group relative">
                                                                        <UserCheck className="h-8 w-8" />
                                                                        <div className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-lg">{idx + 1}</div>
                                                                    </div>
                                                                    <div className="mt-4 text-center max-w-[150px]">
                                                                        <p className="text-[10px] font-black uppercase tracking-tighter text-purple-900">{step.name}</p>
                                                                        <p className="text-[11px] font-bold truncate w-full" title={step.approver}>{step.approver}</p>
                                                                        <Badge variant="outline" className="mt-1 text-[8px] font-bold border-purple-200 text-purple-700 bg-white shadow-sm">{step.role}</Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {idx < currentApprovalChain.length - 1 && (
                                                                <div className="hidden md:flex items-center justify-center flex-grow -mx-8 relative px-4">
                                                                    <div className="h-0.5 w-full bg-purple-200 relative overflow-hidden">
                                                                        <div className="absolute inset-0 bg-purple-600 animate-[progress_2s_infinite]" style={{ width: '30%' }} />
                                                                    </div>
                                                                    <ChevronRight className="h-4 w-4 text-purple-300 absolute right-0" />
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    )) : (
                                                        <div className="p-8 text-center text-muted-foreground italic font-bold">No live approval flow configured in settings.</div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </BlueprintSection>
                                </TabsContent>
                            </div>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </Tabs>
                </div>

                <DialogFooter className="p-6 border-t bg-muted/10 shrink-0">
                    <div className="w-full flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1,2,3,4].map(i => <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-primary text-[10px] font-black flex items-center justify-center text-white shadow-md shadow-primary/20">YK</div>)}
                            </div>
                            <p className="text-xs font-bold text-muted-foreground italic">Authorized for presentation to Client &amp; Management Auditors.</p>
                        </div>
                        <Button onClick={() => onOpenChange(false)} className="px-12 font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20">Exit Blueprint View</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
