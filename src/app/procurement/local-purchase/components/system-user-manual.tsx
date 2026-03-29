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
    BookOpen, FileText, Briefcase, BarChart2, ShoppingCart, Package, 
    Wallet, ChevronRight, Info, CheckCircle2, UserPlus, Users, 
    DollarSign, Gavel, Truck, ShieldCheck, ClipboardCheck, History,
    Search, BellRing, Printer, Download, ArrowRight, Lightbulb, 
    AlertTriangle, Cpu, ListOrdered, Activity, Upload, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ManualStep = ({ 
    icon: Icon, 
    title, 
    color, 
    children 
}: { 
    icon: any, 
    title: string, 
    color: string, 
    children: React.ReactNode 
}) => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className={cn("flex items-center gap-3 p-4 rounded-2xl border shadow-sm bg-background", color)}>
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md shadow-inner">
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
                <h3 className="text-lg font-black tracking-tight text-white uppercase">{title}</h3>
                <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Procedural Standard Operating Procedure</p>
            </div>
        </div>
        <div className="px-2">
            {children}
        </div>
    </div>
);

const InstructionCard = ({ title, icon: Icon, children, variant = "default" }: any) => (
    <Card className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        variant === "warning" ? "border-amber-200 bg-amber-50/30" : "border-primary/5"
    )}>
        <CardHeader className="py-3 bg-muted/30 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Icon className={cn("h-4 w-4", variant === "warning" ? "text-amber-600" : "text-primary")} />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-muted-foreground leading-relaxed">
            {children}
        </CardContent>
    </Card>
);

export function SystemUserManual({ 
    isOpen, 
    onOpenChange 
}: { 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden animate-dialog-in border-none shadow-2xl">
                <div className="bg-slate-900 p-6 text-white shrink-0 relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary rounded-2xl shadow-2xl ring-4 ring-white/10">
                                <BookOpen className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none italic">Local Purchase: Full System Manual</h1>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-2 leading-none">Complete Organizational End-to-End User Guide</p>
                            </div>
                        </div>
                        <div className="hidden md:block text-right">
                            <Badge variant="outline" className="border-white/20 text-white/60 font-black text-[10px] px-4 h-8 uppercase tracking-widest">Version 5.0 Stable</Badge>
                        </div>
                    </div>
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-primary/10 rounded-full blur-3xl" />
                </div>

                <div className="flex-grow min-h-0 bg-muted/10">
                    <Tabs defaultValue="intro" className="h-full flex flex-col">
                        <div className="px-6 bg-background border-b shrink-0 overflow-x-auto no-scrollbar">
                            <TabsList className="h-14 w-full justify-start bg-transparent gap-6 p-0">
                                <TabsTrigger value="intro" className="data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-2 shrink-0"><Info className="h-4 w-4"/> Introduction</TabsTrigger>
                                <TabsTrigger value="dn" className="data-[state=active]:border-b-4 data-[state=active]:border-red-500 rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-2 shrink-0"><FileText className="h-4 w-4 text-red-500"/> Stage 1: DN</TabsTrigger>
                                <TabsTrigger value="gp" className="data-[state=active]:border-b-4 data-[state=active]:border-cyan-500 rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-2 shrink-0"><Briefcase className="h-4 w-4 text-cyan-500"/> Stage 2: GP</TabsTrigger>
                                <TabsTrigger value="cs" className="data-[state=active]:border-b-4 data-[state=active]:border-yellow-500 rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-2 shrink-0"><BarChart2 className="h-4 w-4 text-yellow-500"/> Stage 3: CS</TabsTrigger>
                                <TabsTrigger value="po" className="data-[state=active]:border-b-4 data-[state=active]:border-green-500 rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-2 shrink-0"><ShoppingCart className="h-4 w-4 text-green-500"/> Stage 4: PO</TabsTrigger>
                                <TabsTrigger value="mrr" className="data-[state=active]:border-b-4 data-[state=active]:border-orange-500 rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-2 shrink-0"><Package className="h-4 w-4 text-orange-500"/> Stage 5: MRR</TabsTrigger>
                                <TabsTrigger value="pn" className="data-[state=active]:border-b-4 data-[state=active]:border-purple-500 rounded-none h-full px-2 font-black uppercase text-[10px] tracking-widest gap-2 shrink-0"><Wallet className="h-4 w-4 text-purple-500"/> Stage 6: PN</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 px-6 py-8">
                            <div className="max-w-5xl mx-auto pb-32">
                                
                                <TabsContent value="intro" className="mt-0 space-y-8">
                                    <div className="flex flex-col items-center text-center space-y-4 mb-12">
                                        <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center border-2 border-dashed border-primary/20 animate-pulse">
                                            <Activity className="h-10 w-10 text-primary" />
                                        </div>
                                        <h2 className="text-3xl font-black uppercase tracking-tight italic">Welcome to the Procurement Hub</h2>
                                        <p className="text-muted-foreground max-w-2xl text-lg font-medium leading-relaxed italic">
                                            "This system is designed to transform complex organizational requirements into a streamlined, high-fidelity digital audit trail."
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <InstructionCard title="The Mission" icon={Lightbulb}>
                                            Ensure zero leakage, 100% document compliance, and maximum financial transparency across all departments through rigorous process automation.
                                        </InstructionCard>
                                        <InstructionCard title="Role Awareness" icon={Users}>
                                            Permissions are derived from your organizational profile. Requisitioners, Officers, and Managers have distinct interaction points within the matrix.
                                        </InstructionCard>
                                        <InstructionCard title="Traceability" icon={History}>
                                            Every click is timestamped. Every signature is logged. Every document is vaulted. This system provides a non-repudiable history of every BDT spent.
                                        </InstructionCard>
                                    </div>

                                    <div className="p-8 border-4 border-dashed rounded-[3rem] bg-slate-50 flex flex-col items-center gap-8">
                                        <h4 className="font-black uppercase tracking-widest text-xs text-muted-foreground">End-to-End High-Speed Process Subway</h4>
                                        <div className="flex flex-wrap justify-center items-center gap-4">
                                            <div className="p-3 rounded-xl bg-red-500 text-white shadow-lg flex items-center gap-2 font-black text-[10px] uppercase">DN</div>
                                            <ArrowRight className="h-4 w-4 opacity-30" />
                                            <div className="p-3 rounded-xl bg-cyan-500 text-white shadow-lg flex items-center gap-2 font-black text-[10px] uppercase">GP</div>
                                            <ArrowRight className="h-4 w-4 opacity-30" />
                                            <div className="p-3 rounded-xl bg-yellow-500 text-white shadow-lg flex items-center gap-2 font-black text-[10px] uppercase">CS</div>
                                            <ArrowRight className="h-4 w-4 opacity-30" />
                                            <div className="p-3 rounded-xl bg-green-500 text-white shadow-lg flex items-center gap-2 font-black text-[10px] uppercase">PO</div>
                                            <ArrowRight className="h-4 w-4 opacity-30" />
                                            <div className="p-3 rounded-xl bg-orange-500 text-white shadow-lg flex items-center gap-2 font-black text-[10px] uppercase">MRR</div>
                                            <ArrowRight className="h-4 w-4 opacity-30" />
                                            <div className="p-3 rounded-xl bg-purple-500 text-white shadow-lg flex items-center gap-2 font-black text-[10px] uppercase">PN</div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="dn" className="mt-0">
                                    <ManualStep icon={FileText} title="Stage 1: Requisition (Demand Note)" color="bg-red-600 border-red-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <h5 className="font-black text-sm uppercase text-red-900">User Action: Creating a Request</h5>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        Click <strong>"Create Demand Note"</strong>. Fill in the budget year, purpose, and required items. You must link items from the <strong>Master List</strong> to ensure pricing consistency.
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-white border-2 border-red-100 rounded-xl space-y-3">
                                                    <h6 className="font-bold text-xs uppercase flex items-center gap-2"><Cpu className="h-4 w-4 text-red-600"/> Intelligence Trigger: Approval Routing</h6>
                                                    <p className="text-xs text-muted-foreground">The system automatically calculates your signature path:</p>
                                                    <ul className="text-[11px] space-y-1 font-medium">
                                                        <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-red-400"/> Standard: DH &gt; TA</li>
                                                        <li className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-red-400"/> Mfg: DH &gt; TA &gt; MFG Manager</li>
                                                        <li className="flex items-center gap-2 font-black text-red-700"><div className="h-1 w-1 rounded-full bg-red-600"/> Special Items: DH &gt; TA &gt; Spec. Manager &gt; MD</li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <InstructionCard title="Action Beacon: Approve DN" icon={CheckCircle2}>
                                                    If you are an approver, check your <strong>Notification Center</strong>. Clicking "Approve" records your digital signature. Rejection halts the process.
                                                </InstructionCard>
                                                <InstructionCard title="Lifecycle Tracking" icon={History}>
                                                    Use the <strong>"Status Track"</strong> button in the DN list to see exactly where your requisition is in the cloud—even if it has moved to GP, PO, or MRR.
                                                </InstructionCard>
                                            </div>
                                        </div>
                                    </ManualStep>
                                </TabsContent>

                                <TabsContent value="gp" className="mt-0">
                                    <ManualStep icon={Briefcase} title="Stage 2: Sourcing Engine (GP Desk)" color="bg-cyan-600 border-cyan-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h5 className="font-black text-sm uppercase text-cyan-900">Stage 2.1: Officer Assignment</h5>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    The <strong>GP Officer</strong> monitors final-approved DNs. They must click the <strong>"Assign Concern"</strong> icon to appoint a procurement owner for that task.
                                                </p>
                                                <div className="p-4 bg-cyan-50 rounded-xl border-2 border-cyan-100 flex items-center gap-4">
                                                    <UserPlus className="h-8 w-8 text-cyan-600 shrink-0" />
                                                    <p className="text-xs font-bold text-cyan-800">Once assigned, the Concern Officer receives a High-Priority notification pulse.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h5 className="font-black text-sm uppercase text-cyan-900">Stage 2.2: Vendor Pairing</h5>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    The <strong>Concern Officer</strong> clicks <strong>"Assign Vendors"</strong> to identify which suppliers will bid. The system enforces a &quot;Bidding War&quot; protocol (3+ vendors recommended).
                                                </p>
                                                <InstructionCard title="Quotation Vault" icon={Upload}>
                                                    Scanned bids must be uploaded to the DN record. These become the evidentiary foundation for the Comparative Statement (CS).
                                                </InstructionCard>
                                            </div>
                                        </div>
                                    </ManualStep>
                                </TabsContent>

                                <TabsContent value="cs" className="mt-0">
                                    <ManualStep icon={BarChart2} title="Stage 3: Analytical Auditing (CS Analysis)" color="bg-yellow-600 border-yellow-800">
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <h5 className="font-black text-sm uppercase text-amber-900">User Action: Preparation</h5>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        The Concern Officer clicks <strong>"Prepare CS"</strong>. They must enter unit prices and terms for every assigned vendor.
                                                    </p>
                                                    <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-100 space-y-2">
                                                        <h6 className="font-black text-[10px] uppercase text-amber-800 flex items-center gap-2"><DollarSign className="h-4 w-4"/> Financial Logic Pulse</h6>
                                                        <p className="text-xs font-medium text-amber-700">The system auto-calculates Subtotal, Discount, VAT, and Tax. The <strong>"Best Offer"</strong> is highlighted in green automatically based on lowest Net Billed Amount.</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <h5 className="font-black text-sm uppercase text-amber-900">Action: Awarding the Contract</h5>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        Once data entry is complete, the Officer must click <strong>"Award"</strong> on the best vendor. This locks the price and initiates the <strong>Multi-Level Executive Signature Flow</strong>.
                                                    </p>
                                                    <InstructionCard title="Threshold Matrix" icon={ShieldCheck}>
                                                        Approval paths scale with cost. Large investments (e.g. &gt; $1M) route through Vice Factory Manager, GMs, and the Managing Director.
                                                    </InstructionCard>
                                                </div>
                                            </div>
                                        </div>
                                    </ManualStep>
                                </TabsContent>

                                <TabsContent value="po" className="mt-0">
                                    <ManualStep icon={ShoppingCart} title="Stage 4: Legal Commitment (Purchase Order)" color="bg-green-600 border-green-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h5 className="font-black text-sm uppercase text-green-900">User Action: PO Generation</h5>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    After CS approval, click <strong>"Prepare PO"</strong>. Select the approved CS. The system will pre-populate all contractual terms, prices, and items.
                                                </p>
                                                <div className="p-4 border-2 border-dashed border-green-200 rounded-2xl bg-green-50/50">
                                                    <p className="text-xs italic font-bold text-green-800 leading-relaxed">
                                                        "The PO acts as the formal organizational contract. Once Management approves the PO, it becomes a legally binding commitment."
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <InstructionCard title="Action Beacon: Dispatch PO" icon={Send}>
                                                    Crucial Step: Once approved, you MUST click <strong>"Send to Vendor"</strong>. This timestamps the dispatch and enables the MRR (Receiving) phase.
                                                </InstructionCard>
                                                <InstructionCard title="Official Print" icon={Printer}>
                                                    Approved POs feature high-fidelity headers and signatures. Print and save these for the vendor handshake.
                                                </InstructionCard>
                                            </div>
                                        </div>
                                    </ManualStep>
                                </TabsContent>

                                <TabsContent value="mrr" className="mt-0">
                                    <ManualStep icon={Package} title="Stage 5: Intake & Verification (MRR)" color="bg-orange-600 border-orange-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h5 className="font-black text-sm uppercase text-orange-900">User Action: Material Logging</h5>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    When goods arrive, click <strong>"Prepare MRR"</strong>. You must perform a <strong>Physical Audit</strong> of the goods condition and box packaging.
                                                </p>
                                                <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-100 flex items-start gap-3">
                                                    <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                                                    <p className="text-[11px] font-bold text-orange-800 leading-relaxed uppercase">Evidence Mandate: You MUST upload the Vendor Bill and Delivery Challan scans before finalization.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h5 className="font-black text-sm uppercase text-orange-900">Action: Final Receipt Confirmation</h5>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    The system will notify the <strong>Original Requester</strong>. They must click <strong>"Confirm Receipt"</strong> to acknowledge that they have received the items in good order.
                                                </p>
                                                <InstructionCard title="3-Way Match Audit" icon={CheckCircle2}>
                                                    The system automatically vets the MRR quantity against the PO contract and the original DN intent. Discrepancies are flagged for management.
                                                </InstructionCard>
                                            </div>
                                        </div>
                                    </ManualStep>
                                </TabsContent>

                                <TabsContent value="pn" className="mt-0">
                                    <ManualStep icon={Wallet} title="Stage 6: Financial Settlement (Payment Note)" color="bg-purple-600 border-purple-800">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h5 className="font-black text-sm uppercase text-purple-900">The Treasury instruction</h5>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    The final step in the cycle. The Concern Officer initiates the PN from an approved MRR. The amount is locked to the audited MRR value.
                                                </p>
                                                <div className="p-4 bg-purple-50 rounded-2xl border-4 border-double border-purple-200">
                                                    <h6 className="font-black text-[10px] uppercase text-purple-800 flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Final Audit Gate</h6>
                                                    <p className="text-[11px] font-medium text-purple-700 leading-relaxed mt-1">The <strong>Purchase Manager</strong> must sign off on the PN before it is released to Accounts for disbursement.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h5 className="font-black text-sm uppercase text-purple-900">The 9-Stage Full-Set Bundle</h5>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    Click <strong>"Print Full-Set Bundle"</strong>. The system will compile all внутрішний documentation and physical scans into a single, high-fidelity PDF for Treasury.
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-2 bg-muted/20 border rounded-lg text-center"><Download className="h-4 w-4 mx-auto mb-1 text-primary"/><p className="text-[8px] font-black uppercase">One-Click PDF</p></div>
                                                    <div className="p-2 bg-muted/20 border rounded-lg text-center"><ClipboardCheck className="h-4 w-4 mx-auto mb-1 text-primary"/><p className="text-[8px] font-black uppercase">Audit Ready</p></div>
                                                </div>
                                            </div>
                                        </div>
                                    </ManualStep>
                                </TabsContent>

                            </div>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </Tabs>
                </div>

                <DialogFooter className="p-4 border-t bg-background shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <div className="w-full flex justify-between items-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Authorized System Manual</span>
                        </div>
                        <Button onClick={() => onOpenChange(false)} className="px-12 font-bold uppercase tracking-widest">Close Manual</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
