"use client";

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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { 
    Workflow, FileText, Users, BarChart2, Package, 
    ChevronRight, ShieldCheck, ListOrdered, GitCommitHorizontal, 
    MapPin, Info, CheckCircle2, UserCheck, Zap, TrendingUp, Search,
    History as HistoryIcon, Layers, UserPlus, Tag, Lock, 
    Truck, BellRing, Database, ArrowRight, Play, CheckCircle, 
    Briefcase, ChevronDown, Activity, Scale, ShieldAlert, Cpu, 
    ClipboardCheck, Car, Wrench, AlertTriangle, Milestone, PlusCircle, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function VehicleBlueprintDialog({ 
    isOpen, 
    onOpenChange 
}: { 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[98vw] h-[85vh] flex flex-col p-0 overflow-hidden animate-dialog-in border-none shadow-2xl">
                <div className="bg-primary p-3 text-primary-foreground shrink-0 relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xl ring-1 ring-white/20 shadow-2xl">
                                <Workflow className="h-8 w-8 text-white animate-pulse" />
                            </div>
                            <div className="space-y-0.5">
                                <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Fleet Operational Blueprint</h1>
                                <p className="text-[9px] font-bold text-primary-foreground/60 uppercase tracking-[0.2em] leading-none">Vehicle Management Lifecycle & Asset Logic</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge variant="secondary" className="bg-white/20 text-white border-none font-black text-[10px] px-2 py-0.5">ORG-VMM-V2.0</Badge>
                        </div>
                    </div>
                    <div className="absolute -top-12 -right-12 h-32 w-32 bg-white/5 rounded-full blur-3xl" />
                </div>

                <div className="flex-grow min-h-0 bg-muted/20">
                    <Tabs defaultValue="overview" className="h-full flex flex-col">
                        <div className="px-4 bg-background border-b shrink-0">
                            <TabsList className="h-10 w-full justify-start bg-transparent gap-4 p-0 overflow-x-auto overflow-y-hidden no-scrollbar">
                                <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><HistoryIcon className="h-3 w-3"/> Lifecycle</TabsTrigger>
                                <TabsTrigger value="onboarding" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><PlusCircle className="h-3 w-3"/> 1. Registry</TabsTrigger>
                                <TabsTrigger value="assignment" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><Users className="h-3 w-3"/> 2. Pairing</TabsTrigger>
                                <TabsTrigger value="trips" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><Milestone className="h-3 w-3"/> 3. Logistics</TabsTrigger>
                                <TabsTrigger value="maintenance" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><Wrench className="h-3 w-3"/> 4. Technical</TabsTrigger>
                                <TabsTrigger value="accidents" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><AlertTriangle className="h-3 w-3"/> 5. Governance</TabsTrigger>
                                <TabsTrigger value="access" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-1.5 shrink-0"><Lock className="h-3 w-3"/> Security</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 px-4 py-4">
                            <div className="max-w-7xl mx-auto space-y-8 pb-32">
                                
                                <TabsContent value="overview" className="mt-0 space-y-8">
                                    <BlueprintSection icon={GitCommitHorizontal} title="The Fleet Management Subway" colorClass="bg-slate-800 border-slate-900">
                                        <div className="relative p-8 border-4 border-dashed rounded-[2rem] bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700">
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative z-10">
                                                <ProcessStep icon={Car} label="Asset Registry" status="VEHICLE ONBOARD" sub="Compliance" />
                                                <ProcessStep icon={UserPlus} label="Personnel" status="DRIVER ONBOARD" sub="Licensing" />
                                                <ProcessStep icon={Users} label="Assignment" status="DRIVER PAIRING" sub="Responsibility" />
                                                <ProcessStep icon={Truck} label="Logistics" status="TRIP EXECUTION" sub="Movement" />
                                                <ProcessStep icon={Wrench} label="Service" status="MAINTENANCE LOG" sub="Mechanical" />
                                                <ProcessStep icon={AlertTriangle} label="Incident" status="ACCIDENT REPORT" sub="Governance" />
                                            </div>
                                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-amber-500 via-emerald-500 via-purple-500 to-red-500 -translate-y-1/2 opacity-10 hidden md:block" />
                                        </div>
                                    </BlueprintSection>

                                    <BlueprintSection icon={Layers} title="Phase I: Onboarding & Identity" colorClass="bg-blue-600 border-blue-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h5 className="font-black text-xs uppercase tracking-widest text-blue-900">Fleet Data Standards</h5>
                                                <ul className="space-y-2">
                                                    <li className="flex gap-3 items-start"><CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5"/><p className="text-xs text-muted-foreground font-medium"><strong>Digital RC Vault:</strong> Vehicles require Base64 scans of RC, Fitness, and Tax Token before pairing.</p></li>
                                                    <li className="flex gap-3 items-start"><CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5"/><p className="text-xs text-muted-foreground font-medium"><strong>License Verification:</strong> Drivers must have a valid Professional/Heavy license record matched to NID.</p></li>
                                                </ul>
                                            </div>
                                            <Card className="bg-blue-50 border-blue-200">
                                                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-blue-800">Architecture Trigger: Document Expiry</CardTitle></CardHeader>
                                                <CardContent>
                                                    <p className="text-[10px] leading-relaxed italic text-blue-700 font-bold">
                                                        The system monitors document timestamps. Expired Fitness or Tax Tokens trigger a "DANGER" status, preventing trip initiation.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </BlueprintSection>

                                    <BlueprintSection icon={Workflow} title="Fleet Interactive Process Matrix" colorClass="bg-slate-900 border-black">
                                        <div className="p-6 border-4 border-slate-800 rounded-[2rem] bg-[#0f172a] shadow-inner relative overflow-x-auto min-h-[500px] flex flex-col items-center justify-center gap-10">
                                            <div className="flex items-center gap-4 relative">
                                                <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse shrink-0"><Play className="h-6 w-6 ml-1" /></div>
                                                <FlowArrow />
                                                <FlowNode icon={Car} title="Asset Entry" status="Technical Specs" color="bg-blue-600/60 border-blue-400" />
                                                <FlowArrow />
                                                <FlowDiamond label="Docs Valid?" color="bg-blue-900 border-blue-400" />
                                                <FlowArrow />
                                                <FlowNode icon={CheckCircle} title="Onboarded" status="Registry Locked" color="bg-blue-500 text-white border-white shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
                                            </div>

                                            <div className="h-10 w-1 bg-gradient-to-b from-blue-500 to-emerald-500 opacity-40" />

                                            <div className="flex items-center gap-4">
                                                <FlowNode icon={UserPlus} title="Pairing" status="Driver assigned" color="bg-emerald-600/60 border-emerald-400" />
                                                <FlowArrow />
                                                <FlowNode icon={Truck} title="Trip Log" status="Movement start" color="bg-emerald-600/60 border-emerald-400" />
                                                <FlowArrow />
                                                <FlowDiamond label="Mechanical OK?" color="bg-emerald-900 border-emerald-400" />
                                                <FlowArrow />
                                                <FlowNode icon={Package} title="Arrival" status="Odometer Lock" color="bg-emerald-500 text-white border-white shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                                            </div>

                                            <div className="h-10 w-1 bg-gradient-to-b from-emerald-500 to-red-500 opacity-40" />

                                            <div className="flex items-center gap-4">
                                                <FlowNode icon={Wrench} title="Service" status="Workshop log" color="bg-amber-600/60 border-amber-400" />
                                                <FlowArrow />
                                                <FlowNode icon={AlertTriangle} title="Incident" status="Accident report" color="bg-red-600/60 border-red-400" />
                                                <FlowArrow />
                                                <FlowNode icon={Activity} title="Analytics" status="Dashboard Sync" color="bg-purple-500 text-white border-white shadow-[0_0_25px_rgba(168,85,247,0.8)]" />
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="onboarding" className="mt-0 space-y-8">
                                    <BlueprintSection icon={PlusCircle} title="Registry Data Integrity" colorClass="bg-blue-600 border-blue-800">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <LogicGate title="Asset Fingerprinting" description="Requires Engine No, Chassis No and Manufacture Year for non-repudiation." badge="Standard" path="VEHICLE -> DB" />
                                            <LogicGate title="Technical Category" description="Automated classification (Light/Heavy) based on capacity metrics." badge="Auto-Logic" path="METER -> CLASS" />
                                            <LogicGate title="Identity Vault" description="Drivers paired with NID and signature for legal accountability." badge="Personnel" path="DRIVER -> BIO" />
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="trips" className="mt-0 space-y-8">
                                    <BlueprintSection icon={Truck} title="Logistics Execution Flow" colorClass="bg-emerald-600 border-emerald-800">
                                        <div className="p-6 border-4 border-dashed rounded-[2rem] bg-emerald-900/10 border-emerald-500/30 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-600 rounded-lg shadow-xl"><Milestone className="h-6 w-6 text-white" /></div>
                                                <div>
                                                    <h4 className="text-base font-black uppercase tracking-tighter text-emerald-900 leading-none">Trip Lifecycle Control</h4>
                                                    <p className="text-[9px] font-bold text-emerald-700/60 uppercase tracking-widest mt-1">Real-Time Movement Diagnostic</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="p-3 bg-white border-2 border-emerald-500 rounded-xl shadow-lg"><p className="text-[10px] font-black uppercase">Planned</p><p className="text-[9px] text-muted-foreground">Itinerary defined, waiting for keys.</p></div>
                                                <div className="p-3 bg-white border-2 border-amber-500 rounded-xl shadow-lg"><p className="text-[10px] font-black uppercase">Ongoing</p><p className="text-[9px] text-muted-foreground">Odometer running, movement active.</p></div>
                                                <div className="p-3 bg-white border-2 border-blue-500 rounded-xl shadow-lg"><p className="text-[10px] font-black uppercase">Completed</p><p className="text-[9px] text-muted-foreground">Ending meter locked, expenses audited.</p></div>
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="maintenance" className="mt-0">
                                    <BlueprintSection icon={Wrench} title="Technical Audit Protocol" colorClass="bg-amber-600 border-amber-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h5 className="font-black text-amber-900 uppercase text-xs mb-3 tracking-widest flex items-center gap-2"><Settings className="h-4 w-4"/> Workshop Signature</h5>
                                                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                                    Maintenance records link specific garage IDs to part-level costs.
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2 bg-amber-50 rounded-lg text-center border border-amber-100 shadow-sm"><p className="text-[8px] font-black uppercase">Odometer Check</p></div>
                                                    <div className="p-2 bg-amber-50 rounded-lg text-center border border-amber-100 shadow-sm"><p className="text-[8px] font-black uppercase">Job Card Link</p></div>
                                                </div>
                                            </div>
                                            <Card className="border-none shadow-xl bg-slate-900 text-white">
                                                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-slate-400">Trigger: Preventive Schedule</CardTitle></CardHeader>
                                                <CardContent>
                                                    <p className="text-[10px] leading-relaxed italic text-slate-300 font-bold">
                                                        Maintenance records calculate the "Upcoming Service Date". System flags overdue assets automatically on the Dashboard.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="accidents" className="mt-0">
                                    <BlueprintSection icon={AlertTriangle} title="Incident Governance Model" colorClass="bg-red-600 border-red-800">
                                        <div className="p-6 border-4 border-slate-900 rounded-[2rem] bg-red-950 text-white relative overflow-hidden shadow-2xl">
                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/40 backdrop-blur-xl">
                                                        <Scale className="h-8 w-8 text-red-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black uppercase tracking-tighter leading-none">Incident Response Protocol</h4>
                                                        <p className="text-[10px] font-bold text-red-200/40 uppercase tracking-[0.3em] mt-2 italic">Legal & Insurance Recovery Matrix</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                                <div className="p-4 bg-white/5 rounded-2xl border-2 border-red-500/30"><p className="text-xs font-black uppercase mb-1">Police Case</p><p className="text-[9px] opacity-60">Mandatory GD/FIR upload for severe incidents.</p></div>
                                                <div className="p-4 bg-white/5 rounded-2xl border-2 border-red-500/30"><p className="text-xs font-black uppercase mb-1">Damage Audit</p><p className="text-[9px] opacity-60">Visual evidence pairing before workshop handover.</p></div>
                                                <div className="p-4 bg-white/5 rounded-2xl border-2 border-red-500/30"><p className="text-xs font-black uppercase mb-1">Cost Recovery</p><p className="text-[9px] opacity-60">Insurance claim reference linked to accident ID.</p></div>
                                            </div>
                                        </div>
                                    </BlueprintSection>
                                </TabsContent>

                                <TabsContent value="access" className="mt-0">
                                    <BlueprintSection icon={Lock} title="Organizational Access Matrix" colorClass="bg-slate-800 border-slate-900">
                                        <Card className="border-primary/10 shadow-lg overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-slate-100">
                                                    <TableRow className="h-10 border-b-2">
                                                        <TableHead className="font-black uppercase text-[10px]">Action / Menu</TableHead>
                                                        <TableHead className="font-black uppercase text-[10px]">Administrative</TableHead>
                                                        <TableHead className="font-black uppercase text-[10px]">Operator</TableHead>
                                                        <TableHead className="font-black uppercase text-[10px]">Driver</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow className="text-[10px] font-medium"><TableCell className="font-black">Fleet Registry</TableCell><TableCell>Full Access</TableCell><TableCell>Read Only</TableCell><TableCell className="italic">Zero Visibility</TableCell></TableRow>
                                                    <TableRow className="text-[10px] font-medium"><TableCell className="font-black">Trip Logging</TableCell><TableCell>Full Access</TableCell><TableCell>Full Access</TableCell><TableCell className="italic">Read Only</TableCell></TableRow>
                                                    <TableRow className="text-[10px] font-medium"><TableCell className="font-black">Incident Report</TableCell><TableCell>Audit Power</TableCell><TableCell>Entry Power</TableCell><TableCell className="italic">Observation Only</TableCell></TableRow>
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

                <DialogFooter className="p-3 border-t bg-muted/10 shrink-0">
                    <div className="w-full flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => <div key={i} className="h-6 w-6 rounded-full border border-white bg-primary text-[8px] font-black flex items-center justify-center text-white shadow-sm">YK</div>)}
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground italic">Authorized documentation.</p>
                        </div>
                        <button onClick={() => onOpenChange(false)} className="h-8 px-8 font-black uppercase tracking-widest text-[10px] bg-primary text-white rounded-md shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Exit Blueprint</button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
