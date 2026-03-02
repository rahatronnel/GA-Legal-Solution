
'use client';

import React from 'react';
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
    ChevronRight, ShieldCheck, DollarSign, Gavel, 
    ListOrdered, GitCommitHorizontal, MapPin, Info, CheckCircle2, 
    Send, UserCheck, Zap, TrendingUp, Search,
    History as HistoryIcon, Layers, UserPlus, Tag, Bell, Lock, 
    Truck, BellRing, MousePointerClick,
    MailCheck, Siren, Database, ArrowRight, Play, CheckCircle, FilePlus,
    Wallet, FileStack, Landmark, Timer, Briefcase, ChevronDown, Activity,
    Scale, FileSearch, ShieldAlert, Cpu, FileSignature, ClipboardCheck
} from 'lucide-react';
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
        <div className={cn("flex items-center gap-3 p-3 rounded-xl border-l-8 shadow-sm bg-background", colorClass)}>
            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md shadow-inner">
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
                <h3 className="text-lg font-black tracking-tighter uppercase text-white leading-none">{title}</h3>
                <p className="text-[8px] font-bold text-white/70 uppercase tracking-widest leading-none mt-1">Micro-Process Execution Standard</p>
            </div>
        </div>
        <div className="grid grid-cols-1 gap-6 px-2">
            {children}
        </div>
    </div>
);

const LogicGate = ({ title, description, badge, path }: { title: string, description: string, badge: string, path: string }) => (
    <div className="p-4 border rounded-xl bg-background shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
            <GitCommitHorizontal className="h-12 w-12" />
        </div>
        <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter border-primary/20">{badge}</Badge>
            <span className="text-[10px] font-bold text-muted-foreground italic">{path}</span>
        </div>
        <h5 className="font-black text-sm uppercase tracking-tight mb-1">{title}</h5>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
);

const ProcessStep = ({ icon: Icon, label, status, sub }: { icon: any, label: string, status: string, sub: string }) => (
    <div className="flex flex-col items-center text-center gap-2 group">
        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all border shadow-sm">
            <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase leading-tight">{label}</p>
            <p className="text-[9px] font-bold text-primary">{status}</p>
            <p className="text-[8px] text-muted-foreground italic leading-none">{sub}</p>
        </div>
    </div>
);

const FlowNode = ({ icon: Icon, title, status, color }: any) => (
    <div className="flex flex-col items-center gap-2 group w-32 shrink-0">
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]", color)}>
            <Icon className="h-7 w-7" />
        </div>
        <div className="text-center px-1">
            <p className="text-[11px] font-black uppercase leading-tight tracking-tighter text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{title}</p>
            <p className="text-[8px] font-bold text-white/70 italic whitespace-nowrap mt-0.5">{status}</p>
        </div>
    </div>
);

const FlowDiamond = ({ label, color }: any) => (
    <div className="flex flex-col items-center justify-center w-24 shrink-0 px-2 relative">
        <div className={cn("h-12 w-12 rotate-45 border-2 flex items-center justify-center shadow-lg transition-all group-hover:scale-110", color)}>
            <div className="-rotate-45 text-[9px] font-black uppercase text-center leading-none px-1 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                {label}
            </div>
        </div>
    </div>
);

const FlowArrow = () => (
    <div className="flex items-center justify-center w-12 shrink-0">
        <ArrowRight className="h-6 w-6 text-white/40 animate-pulse" />
    </div>
);

const OrganogramNode = ({ label, sub, colorClass }: { label: string, sub: string, colorClass: string }) => (
    <div className={cn("p-2 border rounded-lg text-center shadow-sm w-[110px] shrink-0 transition-transform hover:scale-105", colorClass)}>
        <p className="text-[8px] font-black uppercase leading-none truncate">{label}</p>
        <p className="text-[7px] font-bold opacity-70 mt-1 truncate">{sub}</p>
    </div>
);

const OrganogramConnector = ({ vertical = false }: { vertical?: boolean }) => (
    <div className={cn("flex items-center justify-center opacity-30", vertical ? "h-4 w-full" : "w-4 h-full")}>
        {vertical ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
    </div>
);

const NotificationCircuit = ({ trigger, receiver, icon: Icon, color }: any) => (
    <div className="flex items-center gap-4 group animate-in fade-in slide-in-from-left-4 duration-700">
        <div className={cn("w-1/3 p-3 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-1 shadow-lg transition-transform hover:scale-105", color)}>
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm shadow-inner">
                <Icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-[9px] font-black uppercase text-white leading-tight tracking-tighter mt-1">{trigger}</p>
        </div>
        
        <div className="flex-1 flex items-center justify-center relative h-12">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
            </div>
            <div className="relative z-10 flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping [animation-delay:0s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping [animation-delay:0.2s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping [animation-delay:0.4s]" />
            </div>
        </div>

        <div className="w-1/3 p-3 rounded-xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center gap-1 bg-white shadow-sm hover:border-primary transition-colors">
            <div className="relative">
                <BellRing className="h-5 w-5 text-primary animate-bell-ring" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            </div>
            <p className="text-[9px] font-black uppercase leading-tight tracking-tighter mt-1 text-primary">{receiver}</p>
        </div>
    </div>
);

export function BlueprintDialog({ 
    isOpen, 
    onOpenChange 
}: { 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[98vw] h-[85vh] flex flex-col p-0 overflow-hidden animate-dialog-in border-none shadow-2xl">
                {/* CONDENSED HEADER */}
                <div className="bg-primary p-3 text-primary-foreground shrink-0 relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xl ring-1 ring-white/20 shadow-2xl">
                                <Workflow className="h-8 w-8 text-white animate-pulse" />
                            </div>
                            <div className="space-y-0.5">
                                <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Operational Blueprint Master</h1>
                                <p className="text-[9px] font-bold text-primary-foreground/60 uppercase tracking-[0.2em] leading-none">Local Purchase Lifecycle & Logic Matrix</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge variant="secondary" className="bg-white/20 text-white border-none font-black text-[10px] px-2 py-0.5">ORG-LP-V5.0</Badge>
                        </div>
                    </div>
                    <div className="absolute -top-12 -right-12 h-32 w-32 bg-white/5 rounded-full blur-3xl" />
                </div>

                <div className="flex-grow min-h-0 bg-muted/20">
                    <Tabs defaultValue="overview" className="h-full flex flex-col">
                        {/* CONDENSED TABS LIST */}
                        <div className="px-4 bg-background border-b shrink-0">
                            <TabsList className="h-10 w-full justify-start bg-transparent gap-4 p-0 overflow-x-auto overflow-y-hidden no-scrollbar">
                                <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><HistoryIcon className="h-3 w-3"/> Lifecycle</TabsTrigger>
                                <TabsTrigger value="dn" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><FileText className="h-3 w-3"/> 1. DN</TabsTrigger>
                                <TabsTrigger value="gp" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><Briefcase className="h-3 w-3"/> 2. GP</TabsTrigger>
                                <TabsTrigger value="cs" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><BarChart2 className="h-3 w-3"/> 3. CS</TabsTrigger>
                                <TabsTrigger value="po" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><ShoppingCart className="h-3 w-3"/> 4. PO</TabsTrigger>
                                <TabsTrigger value="mrr" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><Package className="h-3 w-3"/> 5. MRR</TabsTrigger>
                                <TabsTrigger value="pn" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><Wallet className="h-3 w-3"/> 6. PN</TabsTrigger>
                                <TabsTrigger value="notifications" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><BellRing className="h-3 w-3"/> Alerts</TabsTrigger>
                                <TabsTrigger value="access" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><Lock className="h-3 w-3"/> Security</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 px-4 py-4">
                            <div className="max-w-7xl mx-auto space-y-8 pb-32">
                                
                                <TabsContent value="overview" className="mt-0 space-y-8">
                                    <BlueprintSection icon={GitCommitHorizontal} title="The High-Fidelity Lifecycle subway" colorClass="bg-slate-800 border-slate-900">
                                        <div className="relative p-8 border-4 border-dashed rounded-[2rem] bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700">
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative z-10">
                                                <ProcessStep icon={FileText} label="Requisition" status="DN DRAFT" sub="Intent" />
                                                <ProcessStep icon={Briefcase} label="Sourcing" status="GP ASSIGN" sub="Market" />
                                                <ProcessStep icon={BarChart2} label="Analysis" status="CS AUDIT" sub="Price" />
                                                <ProcessStep icon={ShoppingCart} label="Commitment" status="PO LOCK" sub="Legal" />
                                                <ProcessStep icon={Package} label="Receiving" status="MRR LOG" sub="Asset" />
                                                <ProcessStep icon={Wallet} label="Settlement" status="PN SIGN" sub="Treasury" />
                                            </div>
                                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-amber-500 via-emerald-500 via-purple-500 to-orange-500 -translate-y-1/2 opacity-10 hidden md:block" />
                                        </div>
                                    </BlueprintSection>

                                    {/* Phase I: Requisition Integrity */}
                                    <BlueprintSection icon={FileText} title="Phase I: Requisition Integrity (Demand Note)" colorClass="bg-blue-600 border-blue-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h5 className="font-black text-xs uppercase tracking-widest text-blue-900">Process Standards</h5>
                                                <ul className="space-y-2">
                                                    <li className="flex gap-3 items-start"><CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5"/><p className="text-xs text-muted-foreground font-medium"><strong>Temporal Identity:</strong> Every DN is stamped with a unique, non-colliding ID based on timestamp and department code.</p></li>
                                                    <li className="flex gap-3 items-start"><CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5"/><p className="text-xs text-muted-foreground font-medium"><strong>Department Hard-Lock:</strong> Requisitions are cryptographically bound to the creator's section, preventing data injection.</p></li>
                                                    <li className="flex gap-3 items-start"><CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5"/><p className="text-xs text-muted-foreground font-medium"><strong>Budget Safeguard:</strong> The Budget Head and Year are mandatory fields before procurement starts.</p></li>
                                                </ul>
                                            </div>
                                            <Card className="bg-blue-50 border-blue-200">
                                                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-blue-800">Architecture Trigger: Dynamic Routing</CardTitle></CardHeader>
                                                <CardContent>
                                                    <p className="text-[10px] leading-relaxed italic text-blue-700 font-bold">
                                                        The system executes a "Deep Scan" of line items. If a "Special Category" part is detected, the standard 2-step signature chain is expanded to 4-step chain including Specialized Manager and MD.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </BlueprintSection>

                                    {/* Phase II: Sourcing Engine */}
                                    <BlueprintSection icon={Briefcase} title="Phase II: Sourcing Engine (GP Desk)" colorClass="bg-emerald-600 border-emerald-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h5 className="font-black text-xs uppercase tracking-widest text-emerald-900">Task Handover Protocol</h5>
                                                <div className="relative pl-8 space-y-4 before:absolute before:left-3 before:top-0 before:h-full before:w-0.5 before:bg-emerald-200">
                                                    <div className="relative"><div className="absolute -left-8 h-6 w-6 rounded-full bg-emerald-600 border-4 border-white shadow-sm"/><p className="text-xs font-bold">Officer Assignment</p><p className="text-[10px] text-muted-foreground font-medium">GPO selects a Concern Officer based on category expertise.</p></div>
                                                    <div className="relative"><div className="absolute -left-8 h-6 w-6 rounded-full bg-white border-4 border-emerald-600 shadow-sm"/><p className="text-xs font-bold">Vendor Pool Locking</p><p className="text-[10px] text-muted-foreground font-medium">Concern identifies 3+ vendors for Comparative Statement analysis.</p></div>
                                                    <div className="relative"><div className="absolute -left-8 h-6 w-6 rounded-full bg-white border-4 border-emerald-600 shadow-sm"/><p className="text-xs font-bold">Bid Vaulting</p><p className="text-[10px] text-muted-foreground font-medium">Physical bids are scanned and uploaded for audit permanence.</p></div>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-100 flex flex-col justify-center text-center space-y-2">
                                                <Users className="h-10 w-10 text-emerald-600 mx-auto" />
                                                <p className="text-xs font-black uppercase tracking-tighter">Market rate integrity</p>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed font-bold">System prevents single-vendor bias by requiring explicit bid documentation.</p>
                                            </div>
                                        </div>
                                    </BlueprintSection>

                                    {/* Phase III: Analytical Audit */}
                                    <BlueprintSection icon={BarChart2} title="Phase III: Analytical Auditing (CS Analysis)" colorClass="bg-amber-600 border-amber-800">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="md:col-span-2 space-y-4">
                                                <h5 className="font-black text-xs uppercase tracking-widest text-amber-900">Real-Time Financial Formulas</h5>
                                                <div className="p-3 bg-background border rounded-xl font-mono text-[10px] shadow-inner space-y-1">
                                                    <p className="text-amber-600">// Calculation Logic for every Vendor [V]</p>
                                                    <p className="font-bold text-foreground">Let TotalCost[V] = Σ(Item[i].Qty * Item[i].UnitPrice[V]);</p>
                                                    <p className="font-bold text-foreground">Let NetAmount[V] = TotalCost[V] - Discount[V] + VAT[V] + Tax[V];</p>
                                                    <p className="text-emerald-600 font-black">IF (NetAmount[V] == MIN(all NetAmounts)) SET Flag("Best Offer");</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium">The CS acts as legal justification for spending. It highlights lowest bidder automatically.</p>
                                            </div>
                                            <div className="space-y-4">
                                                <h5 className="font-black text-xs uppercase tracking-widest text-amber-900">Authority Matrix</h5>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between p-2 bg-white border rounded shadow-sm"><span className="text-[10px] font-black">Under $10K</span><Badge className="text-[8px] h-4">Manager</Badge></div>
                                                    <div className="flex items-center justify-between p-2 bg-white border rounded shadow-sm"><span className="text-[10px] font-black">$10K - $100K</span><Badge className="text-[8px] h-4">Purchase Mgr</Badge></div>
                                                    <div className="flex items-center justify-between p-2 bg-white border rounded bg-amber-50 border-amber-200 shadow-sm"><span className="text-[10px] font-black">Above $1M</span><Badge className="text-[8px] h-4" variant="destructive">Full Board</Badge></div>
                                                </div>
                                            </div>
                                        </div>
                                    </BlueprintSection>

                                    {/* Phase IV: Legal Commitment */}
                                    <BlueprintSection icon={ShoppingCart} title="Phase IV: Legal Commitment (Purchase Order)" colorClass="bg-purple-600 border-purple-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h5 className="font-black text-xs uppercase tracking-widest text-purple-900">Document Immutability</h5>
                                                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                                    A PO is the definitive contract. Once dispatched, it is locked. Changes require formal cancellation.
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2 bg-purple-50 rounded-lg text-center border border-purple-100 shadow-sm"><Gavel className="h-4 w-4 text-purple-600 mx-auto mb-1"/><p className="text-[8px] font-black uppercase text-purple-900">Legal Terms</p></div>
                                                    <div className="p-2 bg-purple-50 rounded-lg text-center border border-purple-100 shadow-sm"><Send className="h-4 w-4 text-purple-600 mx-auto mb-1"/><p className="text-[8px] font-black uppercase text-purple-900">Lead Timing</p></div>
                                                </div>
                                            </div>
                                            <Card className="border-none shadow-xl bg-slate-900 text-white">
                                                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-slate-400">Security Trigger: Evidence Compliance</CardTitle></CardHeader>
                                                <CardContent>
                                                    <p className="text-[10px] leading-relaxed italic text-slate-300 font-bold">
                                                        System blocks MRR if PO is missing "PO Acknowledgement" or "Mushok (VAT)" scans. Enforces "Paperwork First" policy.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </BlueprintSection>

                                    {/* Phase V: Intake & Organizational Exit */}
                                    <BlueprintSection icon={Package} title="Phase V: intake & Logistics Verification (MRR)" colorClass="bg-emerald-800 border-emerald-900">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black uppercase text-green-400 drop-shadow-sm">5.1 Physical Intake</p>
                                                <div className="p-3 bg-black/60 rounded-xl border border-green-500/30 text-green-100 shadow-2xl">
                                                    <p className="text-[10px] leading-relaxed font-bold">Goods entry logged with container IDs. Discrepancies flagged against PO baseline.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black uppercase text-green-400 drop-shadow-sm">5.2 Multi-Stage Audit</p>
                                                <div className="p-3 bg-black/60 rounded-xl border border-green-500/30 text-green-100 shadow-2xl">
                                                    <p className="text-[10px] leading-relaxed font-bold">MRR report vetted by GP Concern and Requisitioning Department Manager before accounting entry.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black uppercase text-green-400 drop-shadow-sm">5.3 Final Organizational Exit</p>
                                                <div className="p-3 bg-black/60 rounded-xl border border-green-500/30 text-green-300 shadow-2xl">
                                                    <p className="text-[10px] font-black leading-relaxed">Original Requester confirms goods. Process remains "Open" without confirmant timestamp.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </BlueprintSection>

                                    {/* Phase VI: Financial Settlement */}
                                    <BlueprintSection icon={Wallet} title="Phase VI: Financial Settlement (Payment Note)" colorClass="bg-orange-600 border-orange-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h5 className="font-black text-orange-900 uppercase text-xs mb-3 tracking-widest flex items-center gap-2"><TrendingUp className="h-4 w-4"/> The Treasury Handshake</h5>
                                                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                                    Payment Note (PN) is final financial instruction. It aggregates all preceding logic into a single BDT commitment.
                                                </p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="p-2 bg-orange-50 rounded-lg text-center border border-orange-100 shadow-sm"><CheckCircle2 className="h-4 w-4 text-orange-600 mx-auto mb-1"/><p className="text-[8px] font-black uppercase">Final Audit</p></div>
                                                    <div className="p-2 bg-orange-50 rounded-lg text-center border border-orange-100 shadow-sm"><FileStack className="h-4 w-4 text-orange-600 mx-auto mb-1"/><p className="text-[8px] font-black uppercase">9-Stage Bundle</p></div>
                                                    <div className="p-2 bg-orange-50 rounded-lg text-center border border-orange-100 shadow-sm"><Landmark className="h-4 w-4 text-orange-600 mx-auto mb-1"/><p className="text-[8px] font-black uppercase">Treasury Ready</p></div>
                                                </div>
                                            </div>
                                            <Card className="border-none shadow-xl bg-orange-950 text-white">
                                                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-orange-400">Security Trigger: Purchase Manager Exclusive</CardTitle></CardHeader>
                                                <CardContent>
                                                    <p className="text-[10px] leading-relaxed italic text-orange-200 font-bold">
                                                        Authority for PN approval hard-coded to Purchase Manager role. Ensures single point of failure prevention.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </BlueprintSection>

                                    {/* INTERACTIVE FLOW MATRIX */}
                                    <BlueprintSection icon={Workflow} title="Interactive Organizational Flow Matrix" colorClass="bg-red-900 border-red-950">
                                        <div className="p-6 border-4 border-slate-800 rounded-[2rem] bg-[#1a1c2c] shadow-inner relative overflow-x-auto min-h-[600px] flex flex-col items-center justify-center gap-10">
                                            {/* ROW 1: REQUISITION */}
                                            <div className="flex items-center gap-4 relative">
                                                <div className="h-12 w-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse shrink-0"><Play className="h-6 w-6 ml-1" /></div>
                                                <FlowArrow />
                                                <FlowNode icon={FileText} title="DN Entry" status="Intent Capture" color="bg-blue-600/60 border-blue-400" />
                                                <FlowArrow />
                                                <FlowDiamond label="Internal Approval?" color="bg-blue-900 border-blue-400" />
                                                <FlowArrow />
                                                <FlowNode icon={CheckCircle} title="Requisition Locked" status="Baseline Set" color="bg-blue-500 text-white border-white shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
                                            </div>

                                            <div className="h-10 w-1 bg-gradient-to-b from-blue-500 to-emerald-500 opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.1)]" />

                                            {/* ROW 2: SOURCING */}
                                            <div className="flex items-center gap-4">
                                                <FlowNode icon={UserPlus} title="GP Assign" status="GPO Logic" color="bg-emerald-600/60 border-emerald-400" />
                                                <FlowArrow />
                                                <FlowNode icon={Briefcase} title="GP Concern" status="Execution Ownership" color="bg-emerald-600/60 border-emerald-400" />
                                                <FlowArrow />
                                                <FlowNode icon={Users} title="Vendor Pool" status="3+ Bids Mandatory" color="bg-emerald-600/60 border-emerald-400" />
                                                <FlowArrow />
                                                <FlowNode icon={FilePlus} title="Bids Collected" status="Quotation Vault" color="bg-emerald-500 text-white border-white shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                                            </div>

                                            <div className="h-10 w-1 bg-gradient-to-b from-emerald-500 to-amber-500 opacity-40" />

                                            {/* ROW 3: ANALYSIS */}
                                            <div className="flex items-center gap-4">
                                                <FlowNode icon={BarChart2} title="CS Analysis" status="Price Audit" color="bg-amber-600/60 border-amber-400" />
                                                <FlowArrow />
                                                <FlowDiamond label="Award Selection?" color="bg-amber-900 border-amber-400" />
                                                <FlowArrow />
                                                <FlowNode icon={Gavel} title="Vendor Awarded" status="Selection Logged" color="bg-amber-500 text-white border-white shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
                                                <FlowArrow />
                                                <FlowNode icon={ShieldCheck} title="Board Sign-off" status="Executive Audit" color="bg-amber-500 text-white border-white shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
                                            </div>

                                            <div className="h-10 w-1 bg-gradient-to-b from-amber-500 to-purple-500 opacity-40" />

                                            {/* ROW 4: COMMITMENT */}
                                            <div className="flex items-center gap-4">
                                                <FlowNode icon={ShoppingCart} title="PO Entry" status="Draft Creation" color="bg-purple-600/60 border-purple-400" />
                                                <FlowArrow />
                                                <FlowDiamond label="Evidence OK?" color="bg-purple-900 border-purple-400" />
                                                <FlowArrow />
                                                <FlowNode icon={Send} title="PO Dispatched" status="Vendor Handover" color="bg-purple-500 text-white border-white shadow-[0_0_20px_rgba(139,92,246,0.8)]" />
                                            </div>

                                            <div className="h-10 w-1 bg-gradient-to-b from-purple-500 to-emerald-800 opacity-40" />

                                            {/* ROW 5: LOGISTICS & CLOSING */}
                                            <div className="flex items-center gap-4">
                                                <FlowNode icon={Truck} title="Gate Entry" status="Goods Arrival" color="bg-slate-600/60 border-slate-400" />
                                                <FlowArrow />
                                                <FlowNode icon={Package} title="MRR Finalized" status="3-Way Match" color="bg-emerald-800 text-white border-white" />
                                                <FlowArrow />
                                                <FlowDiamond label="Quality Pass?" color="bg-emerald-950 border-emerald-500" />
                                                <FlowArrow />
                                                <FlowNode icon={UserCheck} title="Requester confirm" status="Logistics Locked" color="bg-green-600 text-white border-white" />
                                            </div>

                                            <div className="h-10 w-1 bg-gradient-to-b from-green-600 to-orange-500 opacity-40" />

                                            {/* ROW 6: SETTLEMENT */}
                                            <div className="flex items-center gap-4">
                                                <FlowNode icon={Wallet} title="PN Entry" status="Financial Intent" color="bg-orange-600/60 border-orange-400" />
                                                <FlowArrow />
                                                <FlowDiamond label="Mgr Sign-off?" color="bg-orange-950 border-orange-500" />
                                                <FlowArrow />
                                                <FlowNode icon={ShieldCheck} title="Authorized" status="Payment Order Set" color="bg-orange-500 text-white border-white shadow-[0_0_30px_rgba(249,115,22,0.8)]" />
                                                <FlowArrow />
                                                <FlowNode icon={FileStack} title="9-Stage Bundle" status="Audit Permanent" color="bg-orange-500 text-white border-white shadow-[0_0_30px_rgba(249,115,22,0.8)]" />
                                            </div>
                                        </div>
                                    </BlueprintSection>

                                    {/* ARCHITECTURE SECTION */}
                                    <Separator className="opacity-10" />
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3 text-muted-foreground">
                                            <Database className="h-5 w-5" /> System Architecture
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="p-3 border rounded-xl bg-background shadow-sm space-y-1">
                                                <Zap className="h-4 w-4 text-amber-500" />
                                                <p className="text-[9px] font-black uppercase">Real-Time Sync</p>
                                                <p className="text-[8px] text-muted-foreground leading-tight font-medium">Reactive document streaming for all terminals.</p>
                                            </div>
                                            <div className="p-3 border rounded-xl bg-background shadow-sm space-y-1">
                                                <Lock className="h-4 w-4 text-blue-500" />
                                                <p className="text-[9px] font-black uppercase">Row-Level Security</p>
                                                <p className="text-[8px] text-muted-foreground leading-tight font-medium">Authentication tokens validated per request.</p>
                                            </div>
                                            <div className="p-3 border rounded-xl bg-background shadow-sm space-y-1">
                                                <HistoryIcon className="h-4 w-4 text-emerald-500" />
                                                <p className="text-[9px] font-black uppercase">Audit Logs</p>
                                                <p className="text-[8px] text-muted-foreground leading-tight font-medium">State transitions captured with UID and Timestamp.</p>
                                            </div>
                                            <div className="p-3 border rounded-xl bg-background shadow-sm space-y-1">
                                                <Layers className="h-4 w-4 text-purple-500" />
                                                <p className="text-[9px] font-black uppercase">Asset Virtualization</p>
                                                <p className="text-[8px] text-muted-foreground leading-tight font-medium">Documents virtualized as Base64 objects.</p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="dn" className="mt-0 space-y-8">
                                    <BlueprintSection icon={FileText} title="Menu Detail: Demand Note (DN)" colorClass="bg-blue-600 border-blue-800">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <LogicGate 
                                                title="The Standard Gateway" 
                                                description="Items without 'Special' flags route through DH and TA." 
                                                badge="Route A" 
                                                path="DH -&gt; TA" 
                                            />
                                            <LogicGate 
                                                title="The Manufacturing Filter" 
                                                description="Injected if department is flagged as 'Manufacturing'." 
                                                badge="Route B" 
                                                path="DH -&gt; TA -&gt; MFG MGR" 
                                            />
                                            <LogicGate 
                                                title="The Special Audit" 
                                                description="Triggered by high-value categories. Direct to MD." 
                                                badge="Route C" 
                                                path="SPEC MGR -&gt; MD" 
                                            />
                                        </div>
                                        
                                        <div className="p-6 border-4 border-dashed rounded-[2rem] bg-blue-900/10 border-blue-500/30 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-600 rounded-lg shadow-xl"><HistoryIcon className="h-6 w-6 text-white animate-spin-slow" /></div>
                                                <div>
                                                    <h4 className="text-base font-black uppercase tracking-tighter text-blue-900 leading-none">Lifecycle Monitoring Hub (Status Track)</h4>
                                                    <p className="text-[9px] font-bold text-blue-700/60 uppercase tracking-widest mt-1">Real-Time Procurement Diagnostic Engine</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                                <div className="space-y-4">
                                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                                        The **Status Track** button acts as a real-time organizational beacon. It performs a multi-stage depth lookup across all modules to tell the requester exactly where their requisition is at any second.
                                                    </p>
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-white border-2 border-blue-500 rounded-xl shadow-lg animate-pulse"><Search className="h-6 w-6 text-blue-600" /></div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black uppercase text-blue-900">Deep Scan Engine</p>
                                                            <p className="text-[9px] text-muted-foreground font-bold">
                                                              DN -&gt; GP -&gt; CS -&gt; PO -&gt; MRR -&gt; PN
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="relative p-4 bg-slate-900 rounded-2xl border-2 border-blue-400/30 overflow-hidden group">
                                                    <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                                                    <div className="relative z-10 space-y-2">
                                                        <div className="flex items-center justify-between"><Badge className="bg-blue-500 text-[8px] h-4">STATUS: SCANNING</Badge><Cpu className="h-3 w-3 text-blue-400" /></div>
                                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-2/3 animate-[progress_2s_infinite]" /></div>
                                                        <div className="text-[10px] font-mono text-blue-300">&gt;&gt; Cross-Referencing PN-Registry...</div>
                                                        <div className="text-[10px] font-mono text-emerald-400">&gt;&gt; Match Found: PN-8821 (Treasury Ready)</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 border-2 border-blue-100 rounded-2xl bg-blue-50/30">
                                            <h4 className="font-black text-blue-900 uppercase text-xs mb-3 tracking-widest flex items-center gap-2"><TrendingUp className="h-4 w-4"/> Asset Fingerprinting</h4>
                                            <p className="text-[10px] text-blue-800/70 leading-relaxed mb-4 font-bold">
                                                DN locks **Particulars**, **Quantity**, and **Budget Head**. These become the "Control Baseline" for all subsequent modules.
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="p-2 bg-white rounded-lg shadow-sm text-center border"><p className="text-[8px] font-black uppercase text-blue-600 leading-none">Draft</p><p className="text-[14px] font-bold mt-1">Pending</p></div>
                                                <div className="p-2 bg-white rounded-lg shadow-sm text-center border"><p className="text-[8px] font-black uppercase text-blue-600 leading-none">Signature 1</p><p className="text-[14px] font-bold mt-1">Reviewed</p></div>
                                                <div className="p-2 bg-white rounded-lg shadow-sm text-center border"><p className="text-[8px] font-black uppercase text-blue-600 leading-none">Signature 2</p><p className="text-[14px] font-bold mt-1">Checked</p></div>
                                                <div className="p-2 bg-white rounded-lg shadow-sm text-center border"><p className="text-[8px] font-black uppercase text-blue-600 leading-none">Final Gate</p><p className="text-[14px] font-bold mt-1 text-green-600">Approved</p></div>
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="gp" className="mt-0 space-y-8">
                                    <BlueprintSection icon={Briefcase} title="Menu Detail: General Purchase (GP) Desk" colorClass="bg-emerald-600 border-emerald-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <Card className="border-none bg-background shadow-xl">
                                                <CardHeader className="bg-emerald-50 py-2"><CardTitle className="text-[10px] font-black uppercase text-emerald-900 leading-none">Task Assignment Engine</CardTitle></CardHeader>
                                                <CardContent className="pt-4 space-y-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-5 w-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">1</div>
                                                        <div><p className="text-[10px] font-bold uppercase leading-none mb-1">Officer Handover</p><p className="text-[9px] text-muted-foreground font-medium leading-tight">GP Officer selects a specific 'Concern' based on expertise.</p></div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-5 w-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">2</div>
                                                        <div><p className="text-[10px] font-bold uppercase leading-none mb-1">Vendor Selection</p><p className="text-[9px] text-muted-foreground font-medium leading-tight">Concern assigns 3+ vendors to begin bidding war.</p></div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-5 w-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">3</div>
                                                        <div><p className="text-[10px] font-bold uppercase leading-none mb-1">Bid Collection</p><p className="text-[9px] text-muted-foreground font-medium leading-tight">Scans of bids uploaded directly into quote vault.</p></div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <div className="flex flex-col justify-center items-center p-6 border-4 border-dashed rounded-2xl opacity-50 space-y-2 bg-emerald-50/20">
                                                <Users className="h-12 w-12 text-emerald-600" />
                                                <div className="text-center"><p className="font-black uppercase text-[10px] leading-none">Competitive Sourcing</p><p className="text-[8px] font-bold mt-1">Market-rate integrity through 3+ bids.</p></div>
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="cs" className="mt-0 space-y-8">
                                    <BlueprintSection icon={BarChart2} title="Menu Detail: Comparative Statement (CS)" colorClass="bg-amber-600 border-amber-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-amber-900 leading-none">Threshold Matrix</h4>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between p-2 bg-white border rounded shadow-sm"><span className="text-[10px] font-bold">Under $10,000</span><Badge className="text-[8px] h-4">Purchase Manager</Badge></div>
                                                    <div className="flex items-center justify-between p-2 bg-white border rounded shadow-sm"><span className="text-[10px] font-bold">$10K - $100K</span><div className="flex gap-1"><Badge className="text-[8px] h-4">Purchase Mgr</Badge><Badge className="text-[8px] h-4">TA</Badge></div></div>
                                                    <div className="flex items-center justify-between p-2 bg-white border rounded bg-amber-50 border-amber-200 shadow-sm"><span className="text-[10px] font-bold">$100K - $1M</span><Badge className="text-[8px] h-4 bg-orange-500 text-white">Spec. Manager</Badge></div>
                                                    <div className="flex items-center justify-between p-2 bg-white border rounded bg-amber-50 border-amber-200 shadow-sm"><span className="text-[10px] font-black">ABOVE $1M</span><Badge variant="destructive" className="text-[8px] h-4">EXECUTIVE CHAIN</Badge></div>
                                                </div>
                                            </div>
                                            <Card className="border-none shadow-2xl overflow-hidden bg-background">
                                                <CardHeader className="bg-amber-500 text-white py-2"><CardTitle className="text-[10px] font-black uppercase leading-none">Financial Logic Engine</CardTitle></CardHeader>
                                                <CardContent className="pt-4 space-y-2">
                                                    <div className="p-2 border rounded bg-muted/20 font-mono text-[9px] font-bold leading-tight">
                                                        IF (ManualSelection == true) ALERT (MD);
                                                        <br/>CALC (Total = (Qty * Price) - Disc + VAT);
                                                        <br/>FLAG (Lowest_Bidder, "Best Offer");
                                                    </div>
                                                    <p className="text-[9px] text-muted-foreground leading-relaxed italic font-bold">
                                                        Highlights lowest bidder but allows override for technical superiority—triggering audit alert.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* GRAPHICAL EXECUTIVE CHAIN ORGANOGRAM */}
                                        <div className="space-y-4 p-6 border-4 border-dashed rounded-[2rem] bg-slate-50 border-amber-200">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-2 bg-amber-600 rounded-lg shadow-lg">
                                                    <ShieldCheck className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-tighter text-amber-900 leading-none">Executive Signature Matrix (Above $1M)</h4>
                                                    <p className="text-[9px] font-bold text-amber-700/60 uppercase tracking-widest mt-1">Hierarchical Governance Model</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center gap-4 relative overflow-x-auto pb-4">
                                                {/* TIER 1: PURCHASE AUDIT */}
                                                <div className="flex items-center gap-4">
                                                    <OrganogramNode label="Purchase Manager" sub="Audit Origin" colorClass="bg-white border-amber-400 text-amber-900" />
                                                    <OrganogramConnector />
                                                    <OrganogramNode label="Purchase TA" sub="Technical Audit" colorClass="bg-white border-amber-400 text-amber-900" />
                                                </div>
                                                
                                                <OrganogramConnector vertical />

                                                {/* TIER 2: DEPARTMENTAL ALIGNMENT */}
                                                <div className="flex items-center gap-4">
                                                    <OrganogramNode label="Requester Dept. TA" sub="Dept. Verification" colorClass="bg-white border-amber-500 text-amber-900 shadow-md" />
                                                    <OrganogramConnector />
                                                    <OrganogramNode label="Specialized Mgr" sub="Subject Specialist" colorClass="bg-white border-amber-500 text-amber-900 shadow-md" />
                                                </div>

                                                <OrganogramConnector vertical />

                                                {/* TIER 3: FACTORY & ACCOUNTS CONTROL */}
                                                <div className="flex items-center gap-4">
                                                    <OrganogramNode label="Vice Factory Mgr" sub="Operations Check" colorClass="bg-amber-100 border-amber-600 text-amber-900 shadow-md" />
                                                    <OrganogramConnector />
                                                    <OrganogramNode label="Accounts Manager" sub="Budget Audit" colorClass="bg-amber-100 border-amber-600 text-amber-900 shadow-md" />
                                                </div>

                                                <OrganogramConnector vertical />

                                                {/* TIER 4: COMMERCIAL & ADMIN */}
                                                <div className="flex items-center gap-4">
                                                    <OrganogramNode label="GM Sales Dept" sub="Commercial Logic" colorClass="bg-amber-200 border-amber-700 text-amber-950 shadow-lg" />
                                                    <OrganogramConnector />
                                                    <OrganogramNode label="GM Administration" sub="Admin Alignment" colorClass="bg-amber-200 border-amber-700 text-amber-950 shadow-lg" />
                                                </div>

                                                <OrganogramConnector vertical />

                                                {/* TIER 5: FINAL AUTHORITY */}
                                                <div className="flex flex-col items-center">
                                                    <div className="p-4 border-4 border-destructive rounded-2xl bg-white shadow-[0_0_20px_rgba(220,38,38,0.2)] animate-pulse">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-destructive rounded-full">
                                                                <Gavel className="h-6 w-6 text-white" />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-xs font-black uppercase text-destructive tracking-widest">Managing Director</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">Final Execution Gate</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="po" className="mt-0 space-y-8">
                                    <BlueprintSection icon={ShoppingCart} title="Menu Detail: Purchase Order (PO)" colorClass="bg-purple-600 border-purple-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="p-6 bg-background border-4 border-double rounded-2xl space-y-4 shadow-xl">
                                                <div className="flex items-center gap-3"><Gavel className="h-8 w-8 text-purple-600"/><h4 className="text-base font-black uppercase tracking-tighter leading-none">Legal commitment</h4></div>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed font-bold">
                                                    PO inherits terms from CS and hard-codes them. Dispatched orders locked to prevent retroactive price manipulation.
                                                </p>
                                                <ul className="grid grid-cols-2 gap-2">
                                                    <li className="flex items-center gap-2 text-[9px] font-black uppercase"><CheckCircle2 className="h-3 w-3 text-purple-600"/> Delivery Terms</li>
                                                    <li className="flex items-center gap-2 text-[9px] font-black uppercase"><CheckCircle2 className="h-3 w-3 text-purple-600"/> Payment Terms</li>
                                                </ul>
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="font-black uppercase text-[10px] text-purple-900 flex items-center gap-2 leading-none"><Send className="h-3 w-3"/> Dispatch Logic</h4>
                                                <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-0 before:h-full before:w-0.5 before:bg-purple-200">
                                                    <div className="relative"><div className="absolute -left-8 h-6 w-6 rounded-full bg-purple-600 border-4 border-white shadow-sm"/><p className="text-[10px] font-bold uppercase leading-none">Authorized</p><p className="text-[9px] text-muted-foreground font-medium mt-1">Internal signatures complete.</p></div>
                                                    <div className="relative"><div className="absolute -left-8 h-6 w-6 rounded-full bg-white border-4 border-purple-600 shadow-sm"/><p className="text-[10px] font-bold uppercase leading-none">Dispatched</p><p className="text-[9px] text-purple-700 font-black italic mt-1">User clicks "Send to Vendor".</p></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 p-6 border-4 border-dashed rounded-[2rem] bg-purple-50 border-purple-200">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-purple-600 rounded-lg shadow-lg"><FileSignature className="h-5 w-5 text-white" /></div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-tighter text-purple-900 leading-none">Contractual Signature Chain</h4>
                                                    <p className="text-[9px] font-bold text-purple-700/60 uppercase tracking-widest mt-1">Formal PO Verification Logic</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-center items-center gap-4">
                                                <OrganogramNode label="Purchase TA" sub="Commercial Audit" colorClass="bg-white border-purple-400" />
                                                <OrganogramConnector />
                                                <OrganogramNode label="Purchase Manager" sub="Final Authorization" colorClass="bg-purple-100 border-purple-600 shadow-md" />
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="mrr" className="mt-0 space-y-8">
                                    <BlueprintSection icon={Package} title="Menu Detail: Material Receiving Report (MRR)" colorClass="bg-emerald-800 border-emerald-900">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="p-4 bg-background rounded-xl border-2 border-emerald-100 space-y-2 shadow-md">
                                                <h5 className="font-black text-[10px] uppercase text-emerald-900 flex items-center gap-2 leading-none"><Layers className="h-3 w-3"/> 3-Way Match</h5>
                                                <p className="text-[9px] text-muted-foreground leading-relaxed font-bold">
                                                    Enforces integrity:
                                                    <br/>1. **DN Qty** (Origin)
                                                    <br/>2. **PO Price** (Contract)
                                                    <br/>3. **Receipt** (Store)
                                                </p>
                                            </div>
                                            <div className="p-4 bg-background rounded-xl border-2 border-emerald-100 space-y-2 shadow-md">
                                                <h5 className="font-black text-[10px] uppercase text-emerald-900 flex items-center gap-2 leading-none"><Bell className="h-3 w-3"/> Verification</h5>
                                                <p className="text-[9px] text-muted-foreground leading-relaxed font-bold">
                                                    **Requester** notified to verify goods quality and click "Confirm Receipt".
                                                </p>
                                            </div>
                                            <div className="p-4 bg-background rounded-xl border-2 border-emerald-100 space-y-2 shadow-md">
                                                <h5 className="font-black text-[10px] uppercase text-emerald-900 flex items-center gap-2 leading-none"><ShieldCheck className="h-3 w-3"/> Evidence</h5>
                                                <p className="text-[9px] text-muted-foreground leading-relaxed font-bold">
                                                    Finalization requires scans of **Vendor Bill** and **Delivery Challan**.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 p-6 border-4 border-dashed rounded-[2rem] bg-emerald-50 border-emerald-200">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-emerald-700 rounded-lg shadow-lg"><Scale className="h-5 w-5 text-white" /></div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-tighter text-emerald-900 leading-none">Logistics Verification Chain</h4>
                                                    <p className="text-[9px] font-bold text-emerald-700/60 uppercase tracking-widest mt-1">Quality & Quantity Audit Protocol</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap justify-center items-center gap-4">
                                                <OrganogramNode label="GP Concern" sub="Verification Origin" colorClass="bg-white border-emerald-400" />
                                                <OrganogramConnector />
                                                <OrganogramNode label="Dept. Manager" sub="Quality Acceptance" colorClass="bg-white border-emerald-500" />
                                                <OrganogramConnector />
                                                <OrganogramNode label="Purchase Manager" sub="Commercial Sync" colorClass="bg-emerald-100 border-emerald-600 shadow-md" />
                                                <OrganogramConnector />
                                                <OrganogramNode label="Purchase TA" sub="Compliance Close" colorClass="bg-emerald-800 text-white border-white shadow-xl" />
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="pn" className="mt-0 space-y-8">
                                    <BlueprintSection icon={Wallet} title="Menu Detail: Payment Note (PN)" colorClass="bg-orange-600 border-orange-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <Card className="border-none shadow-2xl overflow-hidden bg-background">
                                                <CardHeader className="bg-orange-500 text-white py-2"><CardTitle className="text-[10px] font-black uppercase leading-none">The Financial Payload</CardTitle></CardHeader>
                                                <CardContent className="pt-4 space-y-2">
                                                    <ul className="space-y-2">
                                                        <li className="flex gap-3 items-start"><CheckCircle2 className="h-3 w-3 text-orange-600 shrink-0 mt-0.5"/><p className="text-[10px] text-muted-foreground font-medium leading-tight"><strong>Automated:</strong> Amount inherited from MRR value.</p></li>
                                                        <li className="flex gap-3 items-start"><CheckCircle2 className="h-3 w-3 text-orange-600 shrink-0 mt-0.5"/><p className="text-[10px] text-muted-foreground font-medium leading-tight"><strong>Bundle:</strong> Click generating evidentiary trail for Accounts.</p></li>
                                                        <li className="flex gap-3 items-start"><CheckCircle2 className="h-3 w-3 text-orange-600 shrink-0 mt-0.5"/><p className="text-[10px] text-muted-foreground font-medium leading-tight"><strong>Lock:</strong> Hard-lock sign-off required for disbursement.</p></li>
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                            <div className="space-y-3 p-4 border-4 border-double rounded-2xl bg-orange-50/20 border-orange-200">
                                                <h4 className="font-black text-orange-900 uppercase text-[10px] tracking-widest flex items-center gap-2 leading-none"><DollarSign className="h-3 w-3"/> Treasury Dispatch</h4>
                                                <p className="text-[9px] text-muted-foreground font-bold leading-relaxed italic">
                                                    Final financial instruction. Confirms valid req, sourcing, and physical receipt.
                                                </p>
                                                <div className="p-2 bg-white border rounded shadow-inner text-center font-mono text-[10px] font-black text-orange-700">
                                                    STATUS: TREASURY_READY
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 p-6 border-4 border-dashed rounded-[2rem] bg-orange-50 border-orange-200">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-orange-600 rounded-lg shadow-lg"><Landmark className="h-5 w-5 text-white" /></div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-tighter text-orange-900 leading-none">Treasury Authorization Path</h4>
                                                    <p className="text-[9px] font-bold text-orange-700/60 uppercase tracking-widest mt-1">Final Disbursement Governance</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-center items-center gap-4">
                                                <OrganogramNode label="GP Concern" sub="Financial Preparer" colorClass="bg-white border-orange-400" />
                                                <OrganogramConnector />
                                                <OrganogramNode label="Purchase Manager" sub="Final Treasury Audit" colorClass="bg-orange-500 text-white border-white shadow-xl animate-pulse" />
                                            </div>
                                        </div>

                                        {/* BROAD DETAIL: 9-STAGE BUNDLE MAP */}
                                        <div className="space-y-6 p-8 border-4 border-slate-900 rounded-[3rem] bg-[#0f172a] text-white relative overflow-hidden shadow-2xl">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-transparent to-orange-500 opacity-50" />
                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-orange-500/20 rounded-2xl border border-orange-500/40 backdrop-blur-xl">
                                                        <FileSearch className="h-8 w-8 text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black uppercase tracking-tighter leading-none">The 9-Stage Organizational Full-Set Bundle</h4>
                                                        <p className="text-[10px] font-bold text-orange-200/40 uppercase tracking-[0.3em] mt-2 italic">Legal Evidentiary Hierarchy for Treasury Payment</p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 font-black px-4">SECURE BUNDLE V2.0</Badge>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 pt-4">
                                                {[
                                                    { icon: Wallet, title: "1. Payment Note", sub: "The Financial Instruction", color: "border-orange-500 text-orange-400" },
                                                    { icon: FileText, title: "2. Supplier Invoice", sub: "Vendor Bill Evidence", color: "border-slate-700" },
                                                    { icon: Package, title: "3. MRR Report", sub: "Material Receiving Audit", color: "border-emerald-500 text-emerald-400" },
                                                    { icon: ClipboardCheck, title: "4. Supplier Challan", sub: "Physical Delivery Proof", color: "border-slate-700" },
                                                    { icon: ShieldAlert, title: "5. Mushok (VAT)", sub: "Tax Compliance Scan", color: "border-red-500 text-red-400" },
                                                    { icon: ShoppingCart, title: "6. Purchase Order", sub: "The Binding Contract", color: "border-purple-500 text-purple-400" },
                                                    { icon: BarChart2, title: "7. Comparative Statement", sub: "Sourcing Analysis", color: "border-amber-500 text-amber-400" },
                                                    { icon: ListOrdered, title: "8. Demand Note", sub: "Original Intent Origin", color: "border-blue-500 text-blue-400" },
                                                    { icon: FileSearch, title: "9. Vendor Quotations", sub: "Bid Registry Scans", color: "border-slate-700" }
                                                ].map((stage, i) => (
                                                    <div key={i} className={cn("p-4 rounded-2xl bg-white/5 border-2 transition-all hover:bg-white/10 hover:scale-[1.02] flex items-center gap-4 group", stage.color)}>
                                                        <div className="p-2 rounded-xl bg-background/50 group-hover:rotate-12 transition-transform">
                                                            <stage.icon className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black uppercase leading-none mb-1">{stage.title}</p>
                                                            <p className="text-[9px] font-bold text-white/40 italic uppercase tracking-tighter">{stage.sub}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 text-center relative z-10">
                                                <p className="text-[10px] font-bold text-white/60 italic leading-relaxed">
                                                    "The system joins all internal approvals and physical document scans into a single high-fidelity print stream, unrolling multi-page PDFs for absolute audit compliance."
                                                </p>
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="notifications" className="mt-0 space-y-8">
                                    <BlueprintSection icon={BellRing} title="Graphical Alert Propagation Map" colorClass="bg-red-600 border-red-800">
                                        <div className="space-y-6 p-6 border-4 border-dashed rounded-[3rem] bg-slate-50 border-red-200 shadow-inner relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-10 opacity-5">
                                                <Siren className="h-64 w-64 text-red-600 animate-pulse" />
                                            </div>
                                            
                                            <div className="grid grid-cols-1 gap-8 relative z-10">
                                                <NotificationCircuit 
                                                    trigger="REQUISITION ISSUED (DN)" 
                                                    receiver="NEXT LEVEL APPROVER" 
                                                    icon={FileText} 
                                                    color="bg-blue-600 border-blue-800" 
                                                />
                                                <NotificationCircuit 
                                                    trigger="DN FULLY AUTHORIZED" 
                                                    receiver="GENERAL PURCHASE OFFICER" 
                                                    icon={ShieldCheck} 
                                                    color="bg-emerald-600 border-emerald-800" 
                                                />
                                                <NotificationCircuit 
                                                    trigger="CONCERN TASK ASSIGNED" 
                                                    receiver="GP CONCERN OFFICER" 
                                                    icon={UserPlus} 
                                                    color="bg-purple-600 border-purple-800" 
                                                />
                                                <NotificationCircuit 
                                                    trigger="GOODS ARRIVAL (MRR)" 
                                                    receiver="ORIGINAL REQUISITIONER" 
                                                    icon={Package} 
                                                    color="bg-orange-600 border-orange-800" 
                                                />
                                                <NotificationCircuit 
                                                    trigger="INTAKE VERIFIED" 
                                                    receiver="PURCHASE MANAGER (PN AUDIT)" 
                                                    icon={Wallet} 
                                                    color="bg-slate-800 border-slate-900" 
                                                />
                                            </div>

                                            <div className="mt-8 p-4 bg-red-100 rounded-2xl border-2 border-red-200 text-center relative z-10">
                                                <div className="flex items-center justify-center gap-3 mb-2">
                                                    <Timer className="h-5 w-5 text-red-600 animate-spin-slow" />
                                                    <h5 className="text-xs font-black uppercase text-red-900 tracking-widest">Recursive Temporal Pulse</h5>
                                                </div>
                                                <p className="text-[10px] text-red-800/70 font-bold leading-relaxed px-12">
                                                    "If a notification remains unacknowledged, the system triggers a recursive signal every [X] hours, incrementing the badge count until operational sign-off is achieved."
                                                </p>
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="access" className="mt-0">
                                    <BlueprintSection icon={Lock} title="Organizational Access Matrix" colorClass="bg-slate-800 border-slate-900">
                                        <Card className="border-primary/10 shadow-lg overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-slate-100">
                                                    <TableRow className="h-8">
                                                        <TableHead className="font-black uppercase text-[9px]">Tab / Menu</TableHead>
                                                        <TableHead className="font-black uppercase text-[9px]">Administrative</TableHead>
                                                        <TableHead className="font-black uppercase text-[9px]">Operational</TableHead>
                                                        <TableHead className="font-black uppercase text-[9px]">Restrictive Filter</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow className="text-[10px] font-medium"><TableCell className="font-black">Demand Notes</TableCell><TableCell>Superadmin</TableCell><TableCell>All Personnel</TableCell><TableCell className="italic font-bold">Self-Only Filter</TableCell></TableRow>
                                                    <TableRow className="text-[10px] font-medium"><TableCell className="font-black">GP Desk</TableCell><TableCell>GPO</TableCell><TableCell>GP Concerns</TableCell><TableCell className="italic font-bold">Assigned-Only</TableCell></TableRow>
                                                    <TableRow className="text-[10px] font-medium"><TableCell className="font-black">Settings</TableCell><TableCell className="text-red-600 font-black">Superadmin Only</TableCell><TableCell>—</TableCell><TableCell className="italic font-bold">Zero Visibility</TableCell></TableRow>
                                                </TableBody>
                                            </Table>
                                        </Card>
                                    </BlueprintSection>
                                </TabsContent>

                            </div>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </Tabs>
                </div>

                {/* CONDENSED FOOTER */}
                <DialogFooter className="p-3 border-t bg-muted/10 shrink-0">
                    <div className="w-full flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => <div key={i} className="h-6 w-6 rounded-full border border-white bg-primary text-[8px] font-black flex items-center justify-center text-white shadow-sm">YK</div>)}
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground italic">Authorized documentation.</p>
                        </div>
                        <Button onClick={() => onOpenChange(false)} className="h-8 px-8 font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-primary/20">Exit Blueprint</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
