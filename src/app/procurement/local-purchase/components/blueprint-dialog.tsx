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
    ChevronRight, ShieldCheck, DollarSign, AlertTriangle, Gavel, 
    ListOrdered, GitCommitHorizontal, MapPin, Info, CheckCircle2, 
    Send, Factory, UserCheck, ClipboardCheck, Zap, TrendingUp, Search,
    History as HistoryIcon, Layers, UserPlus, Tag, Bell, Lock, Eye, 
    Briefcase, Check, Milestone, UserCog, Box, Undo2, Scale, 
    FileSignature, Fingerprint, Timer, Truck, BellRing, MousePointerClick,
    MailCheck, Siren, Database, ArrowRight, Play, CheckCircle, FilePlus
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

export function BlueprintDialog({ 
    isOpen, 
    onOpenChange 
}: { 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
    const { orgSettings, employees, designations } = useProcurement();

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
                        <div className="text-right">
                            <Badge variant="secondary" className="bg-white/20 text-white border-none font-black text-xs px-4 py-1">ORG-LP-V4.0</Badge>
                            <p className="text-[10px] mt-1 font-bold opacity-50 uppercase tracking-widest text-white">YKK Certified Protocol</p>
                        </div>
                    </div>
                    <div className="absolute -top-24 -right-24 h-64 w-64 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-white/5 rounded-full blur-3xl" />
                </div>

                <div className="flex-grow min-h-0 bg-muted/20">
                    <Tabs defaultValue="overview" className="h-full flex flex-col">
                        <div className="px-8 bg-background border-b shrink-0">
                            <TabsList className="h-16 w-full justify-start bg-transparent gap-6 p-0 overflow-x-auto overflow-y-hidden no-scrollbar">
                                <TabsTrigger value="overview" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2 shrink-0"><HistoryIcon className="h-4 w-4"/> Master Lifecycle</TabsTrigger>
                                <TabsTrigger value="dn" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2 shrink-0"><FileText className="h-4 w-4"/> 1. Demand Note</TabsTrigger>
                                <TabsTrigger value="gp" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2 shrink-0"><Briefcase className="h-4 w-4"/> 2. GP Desk</TabsTrigger>
                                <TabsTrigger value="cs" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2 shrink-0"><BarChart2 className="h-4 w-4"/> 3. CS Analysis</TabsTrigger>
                                <TabsTrigger value="po" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2 shrink-0"><ShoppingCart className="h-4 w-4"/> 4. Purchase Order</TabsTrigger>
                                <TabsTrigger value="mrr" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2 shrink-0"><Package className="h-4 w-4"/> 5. MRR Receipt</TabsTrigger>
                                <TabsTrigger value="notifications" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2 shrink-0"><BellRing className="h-4 w-4"/> Action Center Flow</TabsTrigger>
                                <TabsTrigger value="access" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-4 font-black uppercase text-xs tracking-widest gap-2 shrink-0"><Lock className="h-4 w-4"/> Security Matrix</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 px-8 py-8">
                            <div className="max-w-7xl mx-auto space-y-12 pb-32">
                                
                                <TabsContent value="overview" className="mt-0 space-y-12">
                                    <BlueprintSection icon={GitCommitHorizontal} title="The High-Fidelity Lifecycle subway" colorClass="bg-slate-800 border-slate-900">
                                        <div className="relative p-12 border-4 border-dashed rounded-[3rem] bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700">
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                                                <ProcessStep icon={FileText} label="Requisition" status="DN DRAFT" sub="Intent" />
                                                <ProcessStep icon={Briefcase} label="Sourcing" status="GP ASSIGN" sub="Market" />
                                                <ProcessStep icon={BarChart2} label="Analysis" status="CS AUDIT" sub="Price" />
                                                <ProcessStep icon={ShoppingCart} label="Commitment" status="PO LOCK" sub="Legal" />
                                                <ProcessStep icon={Package} label="Receiving" status="MRR LOG" sub="Asset" />
                                            </div>
                                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-amber-500 to-emerald-500 -translate-y-1/2 opacity-10 hidden md:block" />
                                        </div>
                                    </BlueprintSection>

                                    {/* Phase I: Requisition Integrity */}
                                    <BlueprintSection icon={FileText} title="Phase I: Requisition Integrity (Demand Note)" colorClass="bg-blue-600 border-blue-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h5 className="font-black text-xs uppercase tracking-widest text-blue-900">Micro-Process Execution Standard</h5>
                                                <ul className="space-y-3">
                                                    <li className="flex gap-3 items-start"><CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5"/><p className="text-xs text-muted-foreground font-medium"><strong>Temporal Identity:</strong> Every DN is stamped with a unique, non-colliding ID based on timestamp and department code.</p></li>
                                                    <li className="flex gap-3 items-start"><CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5"/><p className="text-xs text-muted-foreground font-medium"><strong>Department Hard-Lock:</strong> Requisitions are cryptographically bound to the creator's section, preventing data injection from outside units.</p></li>
                                                    <li className="flex gap-3 items-start"><CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5"/><p className="text-xs text-muted-foreground font-medium"><strong>Budget Safeguard:</strong> The Budget Head and Year are mandatory fields, ensuring that no procurement starts without a financial reference.</p></li>
                                                </ul>
                                            </div>
                                            <Card className="bg-blue-50 border-blue-200">
                                                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-blue-800">Architecture Trigger: Dynamic Routing</CardTitle></CardHeader>
                                                <CardContent>
                                                    <p className="text-[10px] leading-relaxed italic text-blue-700 font-bold">
                                                        The system executes a "Deep Scan" of the line items. If a "Special Category" part is detected, the standard 2-step signature chain is instantly expanded to a 4-step chain including the Specialized Manager and Managing Director.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </BlueprintSection>

                                    {/* Phase II: Sourcing Engine */}
                                    <BlueprintSection icon={Briefcase} title="Phase II: The Sourcing Engine (GP Desk)" colorClass="bg-emerald-600 border-emerald-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h5 className="font-black text-xs uppercase tracking-widest text-emerald-900">Task Handover Protocol</h5>
                                                <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-0 before:h-full before:w-0.5 before:bg-emerald-200">
                                                    <div className="relative"><div className="absolute -left-8 h-6 w-6 rounded-full bg-emerald-600 border-4 border-white shadow-sm"/><p className="text-xs font-bold">Officer Assignment</p><p className="text-[10px] text-muted-foreground font-medium">GPO monitors pending DNs and selects a Concern Officer based on category expertise.</p></div>
                                                    <div className="relative"><div className="absolute -left-8 h-6 w-6 rounded-full bg-white border-4 border-emerald-600 shadow-sm"/><p className="text-xs font-bold">Vendor Pool Locking</p><p className="text-[10px] text-muted-foreground font-medium">Concern identifies and assigns 3+ vendors. This creates the baseline for the Comparative Statement analysis.</p></div>
                                                    <div className="relative"><div className="absolute -left-8 h-6 w-6 rounded-full bg-white border-4 border-emerald-600 shadow-sm"/><p className="text-xs font-bold">Bid Vaulting</p><p className="text-[10px] text-muted-foreground font-medium">Physical bids are scanned and uploaded. Each file is hashed and linked to the vendor ID for audit permanence.</p></div>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-50 p-6 rounded-2xl border-2 border-emerald-100 flex flex-col justify-center text-center space-y-3">
                                                <Users className="h-12 w-12 text-emerald-600 mx-auto" />
                                                <p className="text-sm font-black uppercase tracking-tighter">Market rate integrity</p>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed font-bold">The system prevents single-vendor bias by requiring explicit bid documentation before the CS phase can be initialized.</p>
                                            </div>
                                        </div>
                                    </BlueprintSection>

                                    {/* Phase III: Analytical Audit */}
                                    <BlueprintSection icon={BarChart2} title="Phase III: Analytical Auditing (CS Analysis)" colorClass="bg-amber-600 border-amber-800">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="md:col-span-2 space-y-4">
                                                <h5 className="font-black text-xs uppercase tracking-widest text-amber-900">Real-Time Financial Formulas</h5>
                                                <div className="p-4 bg-background border rounded-xl font-mono text-[10px] shadow-inner space-y-1">
                                                    <p className="text-amber-600">// Calculation Logic for every Vendor [V]</p>
                                                    <p className="font-bold text-foreground">Let TotalCost[V] = Σ(Item[i].Qty * Item[i].UnitPrice[V]);</p>
                                                    <p className="font-bold text-foreground">Let NetAmount[V] = TotalCost[V] - Discount[V] + VAT[V] + Tax[V];</p>
                                                    <p className="text-emerald-600 font-black">IF (NetAmount[V] == MIN(all NetAmounts)) SET Flag("Best Offer");</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium">The Comparative Statement acts as a legal justification for spending. It highlights the lowest bidder automatically but provides a "Technical Superiority" override for management decision-making.</p>
                                            </div>
                                            <div className="space-y-4">
                                                <h5 className="font-black text-xs uppercase tracking-widest text-amber-900">Authority Matrix</h5>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between p-2 bg-white border rounded shadow-sm"><span className="text-[10px] font-black">Under $10K</span><Badge className="text-[8px] h-4">Manager</Badge></div>
                                                    <div className="flex items-center justify-between p-2 bg-white border rounded shadow-sm"><span className="text-[10px] font-black">$10K - $100K</span><Badge className="text-[8px] h-4 bg-orange-500">Tech Advisor</Badge></div>
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
                                                    A PO is the definitive contract between YKK and the Vendor. Once the "Dispatch" flag is set, the document is locked for editing. Any changes require a formal cancellation and a new requisition cycle.
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-3 bg-purple-50 rounded-lg text-center border border-purple-100 shadow-sm"><Gavel className="h-4 w-4 text-purple-600 mx-auto mb-1"/><p className="text-[9px] font-black uppercase text-purple-900">Legal Terms</p></div>
                                                    <div className="p-3 bg-purple-50 rounded-lg text-center border border-purple-100 shadow-sm"><Send className="h-4 w-4 text-purple-600 mx-auto mb-1"/><p className="text-[9px] font-black uppercase text-purple-900">Lead Timing</p></div>
                                                </div>
                                            </div>
                                            <Card className="border-none shadow-xl bg-slate-900 text-white">
                                                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-slate-400">Security Trigger: Evidence Compliance</CardTitle></CardHeader>
                                                <CardContent>
                                                    <p className="text-[10px] leading-relaxed italic text-slate-300 font-bold">
                                                        System blocks MRR intake if the PO record is missing the signed "PO Acknowledgement" or "Mushok (VAT)" scans. This enforces a "Paperwork First" policy for all logistics teams.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </BlueprintSection>

                                    {/* Phase V: Intake & Closing */}
                                    <BlueprintSection icon={Package} title="Phase V: intake & Organizational Exit (MRR)" colorClass="bg-emerald-800 border-emerald-900">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black uppercase text-green-400 drop-shadow-sm">5.1 Physical Intake</p>
                                                <div className="p-4 bg-black/60 rounded-xl border border-green-500/30 text-green-100 shadow-2xl">
                                                    <p className="text-xs leading-relaxed font-bold">Goods entry is logged with container IDs and conditions. Discrepancies in quantity are flagged instantly against the PO baseline.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black uppercase text-green-400 drop-shadow-sm">5.2 Multi-Stage Audit</p>
                                                <div className="p-4 bg-black/60 rounded-xl border border-green-500/30 text-green-100 shadow-2xl">
                                                    <p className="text-xs leading-relaxed font-bold">The MRR report itself is vetted by GP Concern and the Requisitioning Department Manager before accounting entry.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black uppercase text-green-400 drop-shadow-sm">5.3 Final Organizational Exit</p>
                                                <div className="p-4 bg-black/60 rounded-xl border border-green-500/30 text-green-300 shadow-2xl">
                                                    <p className="text-xs font-black leading-relaxed">The original Requester confirms the goods. Without this confirmant timestamp, the process remains "Open" in the system audit logs.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </BlueprintSection>

                                    {/* NEW GRAPHICAL FLOW DIAGRAM */}
                                    <BlueprintSection icon={Workflow} title="Interactive Organizational Flow Matrix" colorClass="bg-red-900 border-red-950">
                                        <div className="p-10 border-4 border-slate-800 rounded-[3rem] bg-[#1a1c2c] shadow-inner relative overflow-x-auto min-h-[600px] flex flex-col items-center justify-center gap-12">
                                            {/* ROW 1: REQUISITION */}
                                            <div className="flex items-center gap-4 relative">
                                                <div className="h-16 w-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse shrink-0"><Play className="h-8 w-8 ml-1" /></div>
                                                <FlowArrow />
                                                <FlowNode icon={FileText} title="DN Entry" status="Intent Capture" color="bg-blue-600/60 border-blue-400" />
                                                <FlowArrow />
                                                <FlowDiamond label="Internal Approval?" color="bg-blue-900 border-blue-400" />
                                                <FlowArrow />
                                                <FlowNode icon={CheckCircle} title="Requisition Locked" status="Baseline Set" color="bg-blue-500 text-white border-white shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
                                            </div>

                                            {/* CONNECTOR DOWN */}
                                            <div className="h-12 w-1 bg-gradient-to-b from-blue-500 to-emerald-500 opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.1)]" />

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

                                            {/* CONNECTOR DOWN */}
                                            <div className="h-12 w-1 bg-gradient-to-b from-emerald-500 to-amber-500 opacity-40" />

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

                                            {/* CONNECTOR DOWN */}
                                            <div className="h-12 w-1 bg-gradient-to-b from-amber-500 to-purple-500 opacity-40" />

                                            {/* ROW 4: COMMITMENT */}
                                            <div className="flex items-center gap-4">
                                                <FlowNode icon={ShoppingCart} title="PO Entry" status="Draft Creation" color="bg-purple-600/60 border-purple-400" />
                                                <FlowArrow />
                                                <FlowDiamond label="Evidence OK?" color="bg-purple-900 border-purple-400" />
                                                <FlowArrow />
                                                <FlowNode icon={Send} title="PO Dispatched" status="Vendor Handover" color="bg-purple-500 text-white border-white shadow-[0_0_20px_rgba(139,92,246,0.8)]" />
                                            </div>

                                            {/* CONNECTOR DOWN */}
                                            <div className="h-12 w-1 bg-gradient-to-b from-purple-500 to-emerald-800 opacity-40" />

                                            {/* ROW 5: LOGISTICS & CLOSING */}
                                            <div className="flex items-center gap-4">
                                                <FlowNode icon={Truck} title="Gate Entry" status="Goods Arrival" color="bg-slate-600/60 border-slate-400" />
                                                <FlowArrow />
                                                <FlowNode icon={Package} title="MRR Finalized" status="3-Way Match" color="bg-emerald-800 text-white border-white" />
                                                <FlowArrow />
                                                <FlowDiamond label="Quality Pass?" color="bg-emerald-950 border-emerald-500" />
                                                <FlowArrow />
                                                <FlowNode icon={UserCheck} title="Requester confirm" status="Flow Closed" color="bg-green-600 text-white border-white shadow-[0_0_30px_rgba(22,163,74,0.8)]" />
                                            </div>

                                            {/* DECORATIVE DIAMOND END */}
                                            <div className="absolute right-10 top-1/2 -translate-y-1/2 h-24 w-8 bg-red-600 rotate-45 opacity-10 hidden lg:block" />
                                            <div className="absolute left-10 top-1/2 -translate-y-1/2 h-24 w-8 bg-blue-600 -rotate-45 opacity-10 hidden lg:block" />
                                        </div>
                                    </BlueprintSection>

                                    {/* ARCHITECTURE SECTION */}
                                    <Separator className="opacity-10" />
                                    <div className="space-y-6">
                                        <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-muted-foreground">
                                            <Database className="h-6 w-6" /> System Architecture & Security Standards
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="p-4 border rounded-xl bg-background shadow-sm space-y-2">
                                                <Zap className="h-5 w-5 text-amber-500" />
                                                <p className="text-[10px] font-black uppercase">Real-Time Sync</p>
                                                <p className="text-[9px] text-muted-foreground leading-tight font-medium">Leveraging Firestore's reactive document streaming for sub-second updates across all terminals.</p>
                                            </div>
                                            <div className="p-4 border rounded-xl bg-background shadow-sm space-y-2">
                                                <Lock className="h-5 w-5 text-blue-500" />
                                                <p className="text-[10px] font-black uppercase">Row-Level Security</p>
                                                <p className="text-[9px] text-muted-foreground leading-tight font-medium">Authentication tokens are validated per request against organizational department structures.</p>
                                            </div>
                                            <div className="p-4 border rounded-xl bg-background shadow-sm space-y-2">
                                                <HistoryIcon className="h-5 w-5 text-emerald-500" />
                                                <p className="text-[10px] font-black uppercase">Audit Immutable Logs</p>
                                                <p className="text-[9px] text-muted-foreground leading-tight font-medium">Document state transitions are captured in non-destructive history arrays with UID and Timestamp.</p>
                                            </div>
                                            <div className="p-4 border rounded-xl bg-background shadow-sm space-y-2">
                                                <Layers className="h-5 w-5 text-purple-500" />
                                                <p className="text-[10px] font-black uppercase">Asset Virtualization</p>
                                                <p className="text-[9px] text-muted-foreground leading-tight font-medium">Physical documents are virtualized as high-fidelity Base64 objects within the organizational vault.</p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="dn" className="mt-0 space-y-8">
                                    <BlueprintSection icon={FileText} title="Menu Detail: Demand Note (DN)" colorClass="bg-blue-600 border-blue-800">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <LogicGate 
                                                title="The Standard Gateway" 
                                                description="Items without 'Special' flags route through the Department Head and Technical Advisor." 
                                                badge="Route A" 
                                                path="DH -> TA" 
                                            />
                                            <LogicGate 
                                                title="The Manufacturing Filter" 
                                                description="Injected automatically if the department is flagged as 'Manufacturing' in the profile." 
                                                badge="Route B" 
                                                path="DH -> TA -> MFG MGR" 
                                            />
                                            <LogicGate 
                                                title="The Special Audit" 
                                                description="Triggered by high-value or complex item categories. Direct routing to Specialized Manager and MD." 
                                                badge="Route C" 
                                                path="SPEC MGR -> MD" 
                                            />
                                        </div>
                                        <div className="p-6 border-2 border-blue-100 rounded-2xl bg-blue-50/30">
                                            <h4 className="font-black text-blue-900 uppercase text-xs mb-4 tracking-widest flex items-center gap-2"><TrendingUp className="h-4 w-4"/> Digital Asset Fingerprinting</h4>
                                            <p className="text-xs text-blue-800/70 leading-relaxed mb-4 font-bold">
                                                Upon creation, each DN receives a unique temporal ID. This ID locks the **Particulars**, **Quantity**, and **Budget Head**. These values become the "Control Baseline" for all subsequent modules. If a requester asks for 10 units, the system will prevent the MRR from receiving 11, ensuring zero leakage.
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="p-3 bg-white rounded-lg shadow-sm text-center border"><p className="text-[10px] font-black uppercase text-blue-600">Draft Status</p><p className="text-[18px] font-bold">Pending</p></div>
                                                <div className="p-3 bg-white rounded-lg shadow-sm text-center border"><p className="text-[10px] font-black uppercase text-blue-600">Signature 1</p><p className="text-[18px] font-bold">Reviewed</p></div>
                                                <div className="p-3 bg-white rounded-lg shadow-sm text-center border"><p className="text-[10px] font-black uppercase text-blue-600">Signature 2</p><p className="text-[18px] font-bold">Checked</p></div>
                                                <div className="p-3 bg-white rounded-lg shadow-sm text-center border"><p className="text-[10px] font-black uppercase text-blue-600">Final Gate</p><p className="text-[18px] font-bold text-green-600">Approved</p></div>
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="gp" className="mt-0 space-y-8">
                                    <BlueprintSection icon={Briefcase} title="Menu Detail: General Purchase (GP) Desk" colorClass="bg-emerald-600 border-emerald-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <Card className="border-none bg-background shadow-xl">
                                                <CardHeader className="bg-emerald-50"><CardTitle className="text-sm font-black uppercase text-emerald-900">Task Assignment Engine</CardTitle></CardHeader>
                                                <CardContent className="pt-6 space-y-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-6 w-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">1</div>
                                                        <div><p className="text-xs font-bold uppercase">Officer Handover</p><p className="text-[10px] text-muted-foreground font-medium">The GP Officer selects a specific 'Concern' based on category expertise.</p></div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-6 w-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">2</div>
                                                        <div><p className="text-xs font-bold uppercase">Vendor Pool Selection</p><p className="text-[10px] text-muted-foreground font-medium">Concern assigns 3+ vendors to the DN to begin the bidding war.</p></div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-6 w-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">3</div>
                                                        <div><p className="text-xs font-bold uppercase">Bid Collection</p><p className="text-[10px] text-muted-foreground font-medium">Concern uploads scans of physical bids directly into the DN's quote vault.</p></div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <div className="flex flex-col justify-center items-center p-8 border-4 border-dashed rounded-3xl opacity-50 space-y-4 bg-emerald-50/20">
                                                <Users className="h-20 w-20 text-emerald-600" />
                                                <div className="text-center"><p className="font-black uppercase text-sm">Competitive Sourcing Graph</p><p className="text-[10px] font-bold">Ensuring market-rate integrity through forced multi-vendor bidding.</p></div>
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="cs" className="mt-0 space-y-8">
                                    <BlueprintSection icon={BarChart2} title="Menu Detail: Comparative Statement (CS)" colorClass="bg-amber-600 border-amber-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h4 className="font-black uppercase text-xs tracking-[0.2em] text-amber-900">Authorities by Award Amount</h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm"><span className="text-xs font-bold">Under $10,000</span><Badge>Purchase Manager</Badge></div>
                                                    <div className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm"><span className="text-xs font-bold">$10,000 - $100,000</span><div className="flex gap-1"><Badge>Purchase Mgr</Badge><Badge>Purchase TA</Badge></div></div>
                                                    <div className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm"><span className="text-xs font-bold">$100,000 - $1M</span><Badge className="bg-orange-500">Specialized Dept MGR</Badge></div>
                                                    <div className="flex items-center justify-between p-3 bg-white border rounded-lg bg-amber-50 border-amber-200 shadow-sm"><span className="text-xs font-black">ABOVE $1M</span><Badge variant="destructive">FULL EXECUTIVE CHAIN (MD/FD)</Badge></div>
                                                </div>
                                            </div>
                                            <Card className="border-none shadow-2xl overflow-hidden bg-background">
                                                <CardHeader className="bg-amber-500 text-white"><CardTitle className="text-sm font-black uppercase">Financial Logic Engine</CardTitle></CardHeader>
                                                <CardContent className="pt-6 space-y-4">
                                                    <div className="p-3 border rounded bg-muted/20 font-mono text-[10px] font-bold">
                                                        IF (ManualSelection == true) ALERT (MD_Notification);
                                                        <br/>CALC (TotalCost = (Qty * UnitPrice) - Discount + VAT + TAX);
                                                        <br/>FLAG (Lowest_Bidder, "Best Offer");
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed italic font-bold">
                                                        The CS system automatically identifies the lowest total bidder but allows for manual selection based on technical superiority—which triggers a management audit alert.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="po" className="mt-0 space-y-8">
                                    <BlueprintSection icon={ShoppingCart} title="Menu Detail: Purchase Order (PO)" colorClass="bg-purple-600 border-purple-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="p-8 bg-background border-4 border-double rounded-3xl space-y-6 shadow-xl">
                                                <div className="flex items-center gap-4"><Gavel className="h-10 w-10 text-purple-600"/><h4 className="text-lg font-black uppercase tracking-tighter">The Legal commitment</h4></div>
                                                <p className="text-xs text-muted-foreground leading-relaxed font-bold">
                                                    A PO is the first external-facing document. It inherits all terms from the CS and hard-codes them into a printable contract. Once a PO is marked as **"Sent to Vendor"**, the system locks the record to prevent retroactive price manipulation.
                                                </p>
                                                <ul className="grid grid-cols-2 gap-2">
                                                    <li className="flex items-center gap-2 text-[10px] font-black uppercase"><CheckCircle2 className="h-3 w-3 text-purple-600"/> Delivery Terms</li>
                                                    <li className="flex items-center gap-2 text-[10px] font-black uppercase"><CheckCircle2 className="h-3 w-3 text-purple-600"/> Payment Terms</li>
                                                    <li className="flex items-center gap-2 text-[10px] font-black uppercase"><CheckCircle2 className="h-3 w-3 text-purple-600"/> Warranty Logic</li>
                                                    <li className="flex items-center gap-2 text-[10px] font-black uppercase"><CheckCircle2 className="h-3 w-3 text-purple-600"/> Office Address</li>
                                                </ul>
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="font-black uppercase text-xs text-purple-900 flex items-center gap-2"><Send className="h-4 w-4"/> Dispatch Timeline Logic</h4>
                                                <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-0 before:h-full before:w-0.5 before:bg-purple-200">
                                                    <div className="relative"><div className="absolute -left-8 h-6 w-6 rounded-full bg-purple-600 border-4 border-white shadow-sm"/><p className="text-xs font-bold uppercase">PO Authorized</p><p className="text-[10px] text-muted-foreground font-medium">Internal signatures complete.</p></div>
                                                    <div className="relative"><div className="absolute -left-8 h-6 w-6 rounded-full bg-white border-4 border-purple-600 shadow-sm"/><p className="text-xs font-bold uppercase">Physical Sending</p><p className="text-[10px] text-purple-700 font-black italic">User clicks "Send to Vendor" button.</p></div>
                                                    <div className="relative opacity-50"><div className="absolute -left-8 h-6 w-6 rounded-full bg-slate-200 border-4 border-white shadow-sm"/><p className="text-xs font-bold uppercase">Lead-Time Countdown</p><p className="text-[10px] text-muted-foreground font-medium">System monitors expected delivery date.</p></div>
                                                </div>
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="mrr" className="mt-0 space-y-8">
                                    <BlueprintSection icon={Package} title="Menu Detail: Material Receiving Report (MRR)" colorClass="bg-emerald-800 border-emerald-900">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="p-6 bg-background rounded-2xl border-2 border-emerald-100 space-y-3 shadow-md">
                                                <h5 className="font-black text-xs uppercase text-emerald-900 flex items-center gap-2"><Layers className="h-4 w-4"/> Three-Way Match Audit</h5>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed font-bold">
                                                    The system enforces integrity by cross-referencing:
                                                    <br/>1. **DN Quantity** (Original Req)
                                                    <br/>2. **PO Price** (Contract Price)
                                                    <br/>3. **Physical Receipt** (Store Verification)
                                                </p>
                                            </div>
                                            <div className="p-6 bg-background rounded-2xl border-2 border-emerald-100 space-y-3 shadow-md">
                                                <h5 className="font-black text-xs uppercase text-emerald-900 flex items-center gap-2"><Bell className="h-4 w-4"/> Requester Confirmation</h5>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed font-bold">
                                                    The **Demand Note Creator** is automatically notified to verify the goods. They must click "Confirm Receipt" to close the organizational loop.
                                                </p>
                                            </div>
                                            <div className="p-6 bg-background rounded-2xl border-2 border-emerald-100 space-y-3 shadow-md">
                                                <h5 className="font-black text-xs uppercase text-emerald-900 flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Evidence Collection</h5>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed font-bold">
                                                    MRR finalization requires mandatory scans of:
                                                    <br/>- **Vendor Bill/Invoice**
                                                    <br/>- **Delivery Challan**
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative p-12 border-4 border-dashed rounded-[3rem] bg-background shadow-2xl overflow-hidden mt-8">
                                            <div className="flex flex-col md:flex-row justify-around items-center gap-8 relative z-10">
                                                <div className="flex flex-col items-center"><div className="h-16 w-16 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg"><Truck className="h-8 w-8" /></div><p className="mt-2 text-[10px] font-black uppercase">Gate Entry</p></div>
                                                <ChevronRight className="h-8 w-8 text-muted-foreground/30 animate-pulse" />
                                                <div className="flex flex-col items-center"><div className="h-16 w-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg"><Search className="h-8 w-8" /></div><p className="mt-2 text-[10px] font-black uppercase">Quality Check</p></div>
                                                <ChevronRight className="h-8 w-8 text-muted-foreground/30 animate-pulse" />
                                                <div className="flex flex-col items-center"><div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"><UserCheck className="h-8 w-8" /></div><p className="mt-2 text-[10px] font-black uppercase">User Confirm</p></div>
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="notifications" className="mt-0 space-y-8">
                                    <BlueprintSection icon={BellRing} title="Menu Detail: Action Center & Alert Engine" colorClass="bg-red-600 border-red-800">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <Card className="lg:col-span-2 border-none shadow-xl bg-background overflow-hidden">
                                                <CardHeader className="bg-red-50 border-b">
                                                    <CardTitle className="text-sm font-black uppercase text-red-900 flex items-center gap-2">
                                                        <Siren className="h-4 w-4" /> Real-Time Handover Routing
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-0">
                                                    <Table>
                                                        <TableHeader className="bg-muted/30">
                                                            <TableRow>
                                                                <TableHead className="text-[10px] font-black uppercase">Lifecycle Trigger</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase">Notified Personnel</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase">Action Required</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            <TableRow className="h-12 hover:bg-muted/10 transition-colors">
                                                                <TableCell className="text-xs font-bold">DN Created / Level Approved</TableCell>
                                                                <TableCell><Badge variant="outline" className="font-black text-[9px]">Next Level Approver</Badge></TableCell>
                                                                <TableCell className="text-[10px] italic font-bold">Internal Signature</TableCell>
                                                            </TableRow>
                                                            <TableRow className="h-12 bg-red-50/20 hover:bg-red-50/40 transition-colors">
                                                                <TableCell className="text-xs font-bold">DN Final Approval</TableCell>
                                                                <TableCell><Badge variant="outline" className="bg-red-100 text-red-700 font-black text-[9px]">GP Officer</Badge></TableCell>
                                                                <TableCell className="text-[10px] italic font-bold">Assign Concern Officer</TableCell>
                                                            </TableRow>
                                                            <TableRow className="h-12 hover:bg-muted/10 transition-colors">
                                                                <TableCell className="text-xs font-bold">GP Concern Assigned</TableCell>
                                                                <TableCell><Badge variant="outline" className="font-black text-[9px]">Concern Officer</Badge></TableCell>
                                                                <TableCell className="text-[10px] italic font-bold">Assign Vendors / Collect Bids</TableCell>
                                                            </TableRow>
                                                            <TableRow className="h-12 bg-red-50/20 hover:bg-red-50/40 transition-colors">
                                                                <TableCell className="text-xs font-bold">CS Prepared / Awarded</TableCell>
                                                                <TableCell><Badge variant="outline" className="font-black text-[9px]">CS Signature Chain</Badge></TableCell>
                                                                <TableCell className="text-[10px] italic font-bold">Financial Audit Sign-off</TableCell>
                                                            </TableRow>
                                                            <TableRow className="h-12 hover:bg-muted/10 transition-colors">
                                                                <TableCell className="text-xs font-bold">CS Final Approved</TableCell>
                                                                <TableCell><Badge variant="outline" className="font-black text-[9px]">Concern / GP Officer</Badge></TableCell>
                                                                <TableCell className="text-[10px] italic font-bold">Prepare Official PO</TableCell>
                                                            </TableRow>
                                                            <TableRow className="h-12 bg-red-50/20 hover:bg-red-50/40 transition-colors">
                                                                <TableCell className="text-xs font-bold">PO Fully Approved</TableCell>
                                                                <TableCell><Badge variant="outline" className="font-black text-[9px]">Concern / GP Officer</Badge></TableCell>
                                                                <TableCell className="text-[10px] italic font-bold">Dispatch (Send) to Vendor</TableCell>
                                                            </TableRow>
                                                            <TableRow className="h-12 hover:bg-muted/10 transition-colors">
                                                                <TableCell className="text-xs font-bold">Physical Receipt (MRR)</TableCell>
                                                                <TableCell><Badge variant="outline" className="bg-green-100 text-green-700 font-black text-[9px]">Original Requester</Badge></TableCell>
                                                                <TableCell className="text-[10px] italic font-bold">Quality & Qty Confirmation</TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </Card>

                                            <div className="space-y-6">
                                                <Card className="border-2 border-red-100 shadow-lg bg-red-50/30">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs font-black uppercase text-red-900 flex items-center gap-2">
                                                            <Timer className="h-4 w-4" /> Persistent Reminder Pulse
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="p-3 bg-white rounded-xl border border-red-200 shadow-inner">
                                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Threshold Logic</p>
                                                            <p className="text-xs font-bold text-red-700 leading-tight">
                                                                System re-calculates urgency every [X] hours based on settings.
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-red-600 text-white flex items-center justify-center animate-pulse">
                                                                <Siren className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase leading-none">Status: Escalated</p>
                                                                <Badge className="bg-red-600 text-[9px] mt-1 font-black">Urgent: Reminder #3</Badge>
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground italic leading-relaxed font-bold">
                                                            Personnel will receive repeated alerts in the Action Center for each cycle that passes without an approval or "Acknowledgement".
                                                        </p>
                                                    </CardContent>
                                                </Card>

                                                <Card className="border-none shadow-md bg-slate-800 text-white">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Task Control Logic</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3">
                                                        <div className="flex items-start gap-2">
                                                            <MousePointerClick className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                                                            <p className="text-[10px] leading-tight font-medium"><span className="font-black text-blue-300">Acknowledgement:</span> Personnel can acknowledge a task to stop the "New" indicator, but the task remains pending in their active queue.</p>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <MailCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                                            <p className="text-[10px] leading-tight font-medium"><span className="font-black text-emerald-300">Auto-Clear:</span> Notifications are automatically purged from the personnel queue once the document moves to the next lifecycle stage.</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    </BlueprintSection>
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
                                                        <TableCell className="font-black text-xs"><div className="flex items-center gap-2"><FileText className="h-3 w-3" /> Demand Notes</div></TableCell>
                                                        <TableCell><Badge variant="outline" className="font-black text-[9px]">Superadmin</Badge></TableCell>
                                                        <TableCell><p className="text-[10px] font-medium">All Personnel (Creators, Approvers, GP)</p></TableCell>
                                                        <TableCell><p className="text-[10px] italic font-bold">Creators see only their own notes.</p></TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-black text-xs"><div className="flex items-center gap-2"><Briefcase className="h-3 w-3" /> GP Desk</div></TableCell>
                                                        <TableCell><Badge variant="outline" className="font-black text-[9px]">Superadmin</Badge> <Badge variant="outline" className="ml-1 font-black text-[9px]">GP Officer</Badge></TableCell>
                                                        <TableCell><p className="text-[10px] font-medium">GP Concern Officers</p></TableCell>
                                                        <TableCell><p className="text-[10px] italic font-bold">Concerns see only their assigned tasks.</p></TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-black text-xs"><div className="flex items-center gap-2"><BarChart2 className="h-3 w-3" /> CS Analysis</div></TableCell>
                                                        <TableCell><Badge variant="outline" className="font-black text-[9px]">Superadmin</Badge> <Badge variant="outline" className="ml-1 font-black text-[9px]">Managers</Badge></TableCell>
                                                        <TableCell><p className="text-[10px] font-medium">Dept Heads, Technical Advisors</p></TableCell>
                                                        <TableCell><p className="text-[10px] italic font-black text-primary">Restricted to personal signature history.</p></TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-black text-xs"><div className="flex items-center gap-2"><Lock className="h-3 w-3" /> System Settings</div></TableCell>
                                                        <TableCell><Badge className="bg-red-600 text-white border-none font-black text-[9px]">Superadmin Only</Badge></TableCell>
                                                        <TableCell><p className="text-[10px] opacity-30">—</p></TableCell>
                                                        <TableCell><p className="text-[10px] italic text-destructive font-black">Zero operational visibility.</p></TableCell>
                                                    </TableRow>
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

                <DialogFooter className="p-6 border-t bg-muted/10 shrink-0">
                    <div className="w-full flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1,2,3,4].map(i => <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-primary text-[10px] font-black flex items-center justify-center text-white shadow-md shadow-primary/20">YK</div>)}
                            </div>
                            <p className="text-xs font-bold text-muted-foreground italic">Authorized for organizational master documentation.</p>
                        </div>
                        <Button onClick={() => onOpenChange(false)} className="px-12 font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20">Exit Blueprint View</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}