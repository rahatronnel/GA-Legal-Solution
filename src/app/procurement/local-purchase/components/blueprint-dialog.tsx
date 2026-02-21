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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Workflow, FileText, Users, BarChart2, ShoppingCart, Package, 
    ChevronRight, ShieldCheck, DollarSign, AlertTriangle, Gavel, 
    ListOrdered, GitCommitHorizontal, MapPin, Info, CheckCircle2, 
    Send, Factory, UserCheck, ClipboardCheck, Zap, TrendingUp, Search,
    History, Layers, UserPlus, Tag
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
                                <p className="text-sm font-bold text-primary-foreground/60 uppercase tracking-[0.3em]">End-to-End Local Purchase Lifecycle & Logic Matrix</p>
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
                                <TabsTrigger value="requisition" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2"><FileText className="h-4 w-4"/> DN Logic</TabsTrigger>
                                <TabsTrigger value="sourcing" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2"><Users className="h-4 w-4"/> Sourcing Matrix</TabsTrigger>
                                <TabsTrigger value="analysis" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2"><BarChart2 className="h-4 w-4"/> CS thresholds</TabsTrigger>
                                <TabsTrigger value="execution" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2"><ShoppingCart className="h-4 w-4"/> PO & Compliance</TabsTrigger>
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

                                <TabsContent value="sourcing" className="mt-0">
                                    <BlueprintSection icon={Users} title="GP Desk & Sourcing Intelligence" colorClass="bg-emerald-600 border-emerald-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <LogicCard icon={UserPlus} title="Personnel Lockdown" description="The GP Officer must assign a specific 'Concern Officer'. This creates non-repudiable accountability for the vendor sourcing phase." />
                                            <LogicCard icon={Search} title="Blind Quotation Policy" description="Quotation data is collected independently. Concern officers must upload physical or digital bids before initiating the Comparative Statement." />
                                        </div>
                                        <div className="p-8 border-2 border-dashed rounded-3xl bg-emerald-50/30 flex flex-col md:flex-row gap-8 items-center">
                                            <div className="flex-1 space-y-4">
                                                <h4 className="text-xl font-black text-emerald-900 uppercase italic tracking-tighter">The Vendor Sourcing Workflow</h4>
                                                <ul className="space-y-3">
                                                    <li className="flex items-center gap-3 text-sm font-bold"><div className="h-6 w-6 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]">01</div> Assign Primary Concern Officer</li>
                                                    <li className="flex items-center gap-3 text-sm font-bold"><div className="h-6 w-6 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]">02</div> Multilateral Vendor Selection</li>
                                                    <li className="flex items-center gap-3 text-sm font-bold"><div className="h-6 w-6 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]">03</div> Quotation Collection & Digital Archiving</li>
                                                    <li className="flex items-center gap-3 text-sm font-bold"><div className="h-6 w-6 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]">04</div> Trigger Comparative Statement (CS) Analysis</li>
                                                </ul>
                                            </div>
                                            <div className="w-full md:w-1/3 bg-emerald-600 p-6 rounded-2xl text-white shadow-2xl space-y-4">
                                                <div className="flex items-center gap-2"><Tag className="h-5 w-5" /> <span className="font-black uppercase text-xs tracking-widest">GP Manager Alert</span></div>
                                                <p className="text-[10px] leading-relaxed font-medium">The GP Manager has a specialized dashboard view to monitor 'Response Lag' at each sourcing step, ensuring procurement never stalls.</p>
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="analysis" className="mt-0">
                                    <BlueprintSection icon={BarChart2} title="Comparative Analysis & Approval Matrix" colorClass="bg-amber-600 border-amber-800">
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <LogicCard icon={TrendingUp} title="Best Offer Algorithm" description="System automatically compares total landed costs (Price + VAT + Tax - Discount) and flags the most economical bid with a green visual beacon." />
                                                <LogicCard icon={Gavel} title="Decision Freeze" description="Once a vendor is awarded, the CS data is frozen. Any changes require a full audit reset, protecting the integrity of the selection process." />
                                                <LogicCard icon={ListOrdered} title="Sequential Signing" description="Approvals must happen in strict sequence. The system notifies the next person only after the current level is signed and timestamped." />
                                            </div>

                                            <Card className="bg-amber-50 border-amber-200">
                                                <CardHeader className="border-b border-amber-200 bg-amber-100/50">
                                                    <CardTitle className="text-lg font-black uppercase flex items-center gap-2 text-amber-900"><ShieldCheck className="h-5 w-5" /> Dynamic Threshold Logic (Live System Settings)</CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-0 overflow-hidden">
                                                    <Table>
                                                        <TableHeader className="bg-amber-200/30">
                                                            <TableRow>
                                                                <TableHead className="font-black text-amber-900 uppercase text-[10px]">Investment Range</TableHead>
                                                                <TableHead className="font-black text-amber-900 uppercase text-[10px]">Required Signature Chain</TableHead>
                                                                <TableHead className="text-right font-black text-amber-900 uppercase text-[10px]">Authority Level</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            <TableRow className="border-amber-100 hover:bg-amber-50/50">
                                                                <TableCell className="font-bold text-xs">Up to $10,000</TableCell>
                                                                <TableCell className="text-xs">Purchase Manager</TableCell>
                                                                <TableCell className="text-right"><Badge variant="outline" className="text-[10px] font-black border-amber-300 text-amber-700">TIER 1</Badge></TableCell>
                                                            </TableRow>
                                                            <TableRow className="border-amber-100 hover:bg-amber-50/50">
                                                                <TableCell className="font-bold text-xs">$10,001 - $100,000</TableCell>
                                                                <TableCell className="text-xs">Purchase Mgr + Purchase Dept. TA</TableCell>
                                                                <TableCell className="text-right"><Badge variant="outline" className="text-[10px] font-black border-amber-300 text-amber-700">TIER 2</Badge></TableCell>
                                                            </TableRow>
                                                            <TableRow className="border-amber-100 hover:bg-amber-50/50">
                                                                <TableCell className="font-bold text-xs">$100,001 - $1,000,000</TableCell>
                                                                <TableCell className="text-xs">Purch. Mgr + Purch. TA + Req. Dept. TA + Specialized Mgr</TableCell>
                                                                <TableCell className="text-right"><Badge variant="outline" className="text-[10px] font-black border-amber-300 text-amber-700">TIER 3</Badge></TableCell>
                                                            </TableRow>
                                                            <TableRow className="border-amber-100 bg-amber-500/5 hover:bg-amber-100">
                                                                <TableCell className="font-black text-xs text-amber-900">Above $1,000,000</TableCell>
                                                                <TableCell className="text-xs font-bold text-amber-900">Full Executive Chain (Tier 3 + VFM + Accounts + GM + MD/FD)</TableCell>
                                                                <TableCell className="text-right"><Badge className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 shadow-lg">TIER 4 (CRITICAL)</Badge></TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="execution" className="mt-0">
                                    <BlueprintSection icon={ClipboardCheck} title="Contract Execution & Receipt Compliance" colorClass="bg-purple-600 border-purple-800">
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
                            <p className="text-xs font-bold text-muted-foreground italic">Authorized for presentation to Client & Management Auditors.</p>
                        </div>
                        <Button onClick={() => onOpenChange(false)} className="px-12 font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20">Exit Blueprint View</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}