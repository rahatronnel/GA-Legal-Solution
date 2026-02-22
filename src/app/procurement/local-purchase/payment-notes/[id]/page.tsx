"use client";

import React, { useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, User, Printer, Clock, Check, X, Building, CheckCircle, Hourglass, 
    MoreHorizontal, Hash, DollarSign, Wallet, FileText, Briefcase, Calendar, Info, 
    ShoppingCart, Package, BarChart2, CheckCircle2, Tag, Copy
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useProcurement } from '../../components/procurement-provider';
import { getPNStatusText } from '../../lib/status-helper';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Designation } from '@/app/user-management/components/designation-table';

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean }> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Icon className="h-4 w-4" />{label}</div>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
);

export default function PaymentNoteProfilePage() {
    const params = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const { user } = useUser();
    const { paymentNotes, mrrs, employees, purchaseOrders, comparativeStatements, vendors, designations, isLoading } = useProcurement();

    const pn = useMemo(() => {
        if (isLoading || !paymentNotes) return undefined;
        return paymentNotes.find((p: any) => p.id === params.id) || null;
    }, [params.id, paymentNotes, isLoading]);

    const relatedData = useMemo(() => {
        if (!pn) return null;
        const mrr = mrrs.find(m => m.id === pn.mrrId);
        const po = purchaseOrders?.find(p => p.id === mrr?.poId || p.poNumber === mrr?.poId);
        const cs = comparativeStatements?.find(c => c.id === po?.csId);
        const vendor = vendors?.find(v => v.id === po?.vendorId);
        const preparer = employees?.find(e => e.id === pn.createdBy);
        const preparerDesignation = designations?.find(d => d.id === preparer?.designationId);

        return { mrr, po, cs, vendor, preparer, preparerDesignation };
    }, [pn, mrrs, purchaseOrders, comparativeStatements, vendors, employees, designations]);

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [user, employees]);

    const handleApproval = (status: number) => {
        if (!firestore || !pn || !user || !currentUserEmployee) return;
    
        const pnRef = doc(firestore, 'paymentNotes', pn.id);
        const newHistoryEntry = {
            approverId: currentUserEmployee.id,
            status: status === 1 ? 'Approved' : 'Rejected',
            timestamp: new Date().toISOString(),
            level: pn.approvalHistory?.length || 0,
            remarks: `Direct audit from detail page`,
        };
    
        setDocumentNonBlocking(pnRef, {
            approvalStatus: status,
            currentApproverId: '',
            approvalHistory: [...(pn.approvalHistory || []), newHistoryEntry],
        }, { merge: true });
    };

    if (isLoading || pn === undefined) return <div className="p-10 text-center animate-pulse">Loading payment instrument...</div>;
    if (pn === null) notFound();

    const isPendingApproval = pn.approvalStatus !== 1 && pn.approvalStatus !== 0;
    const canApprove = currentUserEmployee && pn.currentApproverId === currentUserEmployee.id;
    const isFinalApproved = pn.approvalStatus === 1;

    const formatCurrency = (amount: number | undefined) => 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-2xl font-bold">{pn.pnNumber}</CardTitle>
                                    <Badge variant={pn.approvalStatus === 1 ? 'default' : 'secondary'}>{getPNStatusText(pn)}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">Payment Note initiated on {new Date(pn.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="flex gap-2">
                                {canApprove && isPendingApproval && (
                                    <>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button size="sm" className="bg-green-600 hover:bg-green-700"><Check className="mr-2 h-4 w-4"/>Approve</Button></AlertDialogTrigger>
                                            <AlertDialogContent className="animate-dialog-in">
                                                <AlertDialogHeader><AlertDialogTitle>Approve Payment Note?</AlertDialogTitle><AlertDialogDescription>Confirm financial authorization for this settlement.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleApproval(1)}>Confirm</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><X className="mr-2 h-4 w-4"/>Reject</Button></AlertDialogTrigger>
                                            <AlertDialogContent className="animate-dialog-in">
                                                <AlertDialogHeader><AlertDialogTitle>Reject Payment Note?</AlertDialogTitle><AlertDialogDescription>This will halt the financial settlement process.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive" onClick={() => handleApproval(0)}>Confirm Reject</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}
                                {isFinalApproved && (
                                    <div className="flex gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" onClick={() => window.open(`/procurement/local-purchase/payment-notes/${pn.id}/print`, '_blank')}>
                                                    <Printer className="mr-2 h-4 w-4"/> Print PN
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="animate-scale-in">Open in New Tab & Print</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" className="text-blue-600 border-blue-600" onClick={() => window.open(`/procurement/local-purchase/payment-notes/${pn.id}/full-print`, '_blank')}>
                                                    <Printer className="mr-2 h-4 w-4"/> Print Bundle (9 Stages)
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="animate-scale-in">Complete Organizational Audit Bundle</TooltipContent>
                                        </Tooltip>
                                    </div>
                                )}
                                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Tabs defaultValue="overview">
                    <TabsList className="animate-scale-in">
                        <TabsTrigger value="overview">Financial Overview</TabsTrigger>
                        <TabsTrigger value="chain">Traceability Chain</TabsTrigger>
                        <TabsTrigger value="history">Audit History</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-6 mt-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="animate-scale-in bg-primary/5 border-primary/20">
                                <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4"/>Payable Amount</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-4xl font-black tracking-tighter text-primary">{pn.amount?.toLocaleString()} <span className="text-base font-normal">BDT</span></div>
                                    <Separator />
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-black text-muted-foreground">Amount in Words</Label>
                                        <p className="text-sm font-bold italic">"{pn.amountInWords}"</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="animate-scale-in"><CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4"/>Settlement Method</CardTitle></CardHeader>
                            <CardContent className="grid gap-4">
                                <InfoItem icon={Tag} label="Payment Type" value={pn.paymentType} />
                                <InfoItem icon={Briefcase} label="Payment Mode" value={<Badge variant="outline" className="bg-blue-50/50">{pn.paymentMode}</Badge>} />
                                <InfoItem icon={Calendar} label="Document Date" value={pn.date} />
                            </CardContent></Card>
                        </div>

                        <Card className="animate-scale-in">
                            <CardHeader><CardTitle className="text-lg">Preparer Identification</CardTitle></CardHeader>
                            <CardContent className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border">
                                    <AvatarImage src={relatedData?.preparer?.profilePicture} />
                                    <AvatarFallback className="text-xl">{relatedData?.preparer?.fullName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-xl font-bold">{relatedData?.preparer?.fullName}</p>
                                    <p className="text-sm text-muted-foreground uppercase font-black tracking-tighter">{relatedData?.preparerDesignation?.name || 'GP Concern'}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Staged on {new Date(pn.createdAt).toLocaleString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="chain" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-l-4 border-l-emerald-500 shadow-sm animate-scale-in">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-emerald-600">
                                        <Package className="h-4 w-4" /> 1. Material Receipt (MRR)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoItem icon={Hash} label="MRR Number" value={relatedData?.mrr?.mrrNumber} />
                                        <InfoItem icon={Calendar} label="Receiving Date" value={relatedData?.mrr?.receivingDate} />
                                        <InfoItem icon={FileText} label="Invoice No." value={relatedData?.mrr?.invoiceNumber} />
                                        <InfoItem icon={User} label="Supplier" value={relatedData?.mrr?.supplierName} />
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full" asChild>
                                        <Link href={`/procurement/local-purchase/mrrs/${relatedData?.mrr?.id}`}>View Full MRR Profile</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-purple-500 shadow-sm animate-scale-in">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-purple-600">
                                        <ShoppingCart className="h-4 w-4" /> 2. Contractual Order (PO)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoItem icon={Hash} label="PO Number" value={relatedData?.po?.poNumber} />
                                        <InfoItem icon={Calendar} label="PO Date" value={relatedData?.po?.poDate} />
                                        <InfoItem icon={DollarSign} label="Net Billed" value={formatCurrency(relatedData?.po?.netPayableAmount)} />
                                        <InfoItem icon={Tag} label="Terms" value={relatedData?.po?.paymentTerms} />
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full" asChild>
                                        <Link href={`/procurement/local-purchase/purchase-orders/${relatedData?.po?.id}`}>View Full PO Profile</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-6">
                        <Card className="animate-scale-in">
                            <CardHeader>
                                <CardTitle>Digital Sign-off Timeline</CardTitle>
                                <CardDescription>Verified audit history of the financial instruction.</CardDescription>
                            </CardHeader>
                            <CardContent className="py-6">
                                <ul className="space-y-6 relative before:absolute before:left-5 before:top-0 before:h-full before:w-0.5 before:bg-muted">
                                    <li className="relative flex items-center gap-4 pl-10">
                                        <div className="absolute left-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10 border-4 border-background"><CheckCircle2 className="h-5 w-5" /></div>
                                        <div>
                                            <p className="font-bold">Payment Note Prepared</p>
                                            <p className="text-sm text-muted-foreground">{relatedData?.preparer?.fullName} ({relatedData?.preparerDesignation?.name || 'GP Concern'})</p>
                                            <p className="text-[10px] text-muted-foreground">{new Date(pn.createdAt).toLocaleString()}</p>
                                        </div>
                                    </li>
                                    {pn.approvalHistory?.map((h: any, index: number) => {
                                        const approver = employees?.find(e => e.id === h.approverId);
                                        const designation = designations?.find(d => d.id === approver?.designationId);
                                        const isApproved = h.status === 'Approved';
                                        return (
                                            <li key={index} className="relative flex items-center gap-4 pl-10">
                                                <div className={cn("absolute left-0 h-10 w-10 rounded-full flex items-center justify-center z-10 border-4 border-background", isApproved ? "bg-green-500 text-white" : "bg-destructive text-white")}>
                                                    {isApproved ? <CheckCircle className="h-5 w-5" /> : <X className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold">Purchase Manager {h.status}</p>
                                                    <p className="text-sm text-muted-foreground">{approver?.fullName} ({designation?.name || 'N/A'})</p>
                                                    <p className="text-[10px] text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</p>
                                                    {h.remarks && <p className="text-xs italic text-muted-foreground mt-1">"{h.remarks}"</p>}
                                                </div>
                                            </li>
                                        )
                                    })}
                                    {isPendingApproval && (
                                        <li className="relative flex items-center gap-4 pl-10">
                                            <div className="absolute left-0 h-10 w-10 rounded-full bg-orange-500 text-white flex items-center justify-center z-10 border-4 border-background animate-pulse"><Hourglass className="h-5 w-5" /></div>
                                            <div>
                                                <p className="font-bold text-orange-600">Pending Financial Audit</p>
                                                <p className="text-sm text-muted-foreground">Purchase Manager Sign-off Required</p>
                                            </div>
                                        </li>
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </TooltipProvider>
    );
}