
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useProcurement } from '../../components/procurement-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileText, Check, X, CheckCircle, Hourglass, MoreHorizontal, User as UserIcon, Building, DollarSign, Calendar, Upload, Download, Copy } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Separator } from '@/components/ui/separator';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { getPOStatusText, getNextApprovalStatusCode } from '../../lib/status-helper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { PurchaseOrder, UploadedFile } from '../../components/po-entry-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { imageToDataUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean }> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <div className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</div>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
);

type DocType = 'poAcknowledgement' | 'invoice' | 'mushok' | 'challan';
const documentLabels: Record<DocType, string> = {
    poAcknowledgement: 'PO Acknowledgement',
    invoice: 'Vendor Invoice',
    mushok: 'Mushok (VAT)',
    challan: 'Delivery Challan',
};

function PurchaseOrderView() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { handlePrint } = usePrint();
    const { purchaseOrders, vendors, demandNotes, employees, designations, isLoading } = useProcurement();
    const { user } = useUser();
    const firestore = useFirestore();

    const po = useMemo(() => {
        if (isLoading || !purchaseOrders) return undefined;
        return purchaseOrders.find((p: any) => p.id === params.id) || null;
    }, [params.id, purchaseOrders, isLoading]);

    const demandNote = useMemo(() => {
        if (!po || !demandNotes) return null;
        return demandNotes.find((dn: any) => dn.id === po.demandNoteId);
    }, [po, demandNotes]);

    const vendor = useMemo(() => {
        if (!po || !vendors) return null;
        return vendors.find((v: any) => v.id === po.vendorId);
    }, [po, vendors]);

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [employees, user]);
    
    const handleApproval = (status: number) => {
        if (!firestore || !po || !user || !po.approvalFlow?.steps || !employees || !currentUserEmployee) return;
        const poRef = doc(firestore, 'purchaseOrders', po.id);
        const currentLevel = po.approvalHistory?.length || 0;
        const newHistoryEntry = { approverId: currentUserEmployee.id, status: status === 1 ? 'Approved' : 'Rejected', timestamp: new Date().toISOString(), level: currentLevel, remarks: `Manual update` };
        let nextStatus = status === 1 ? (currentLevel + 1 < po.approvalFlow.steps.length ? getNextApprovalStatusCode(currentLevel) : 1) : 0;
        let nextApprover = status === 1 && currentLevel + 1 < po.approvalFlow.steps.length ? po.approvalFlow.steps[currentLevel + 1].approverId : '';
        setDocumentNonBlocking(poRef, { approvalStatus: nextStatus, currentApproverId: nextApprover, approvalHistory: [...(po.approvalHistory || []), newHistoryEntry] }, { merge: true });
    };

    const handleFileChange = (docType: DocType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && po && firestore) {
            const files = Array.from(e.target.files);
            const newFiles: UploadedFile[] = [];
            for (const file of files) {
                try {
                    const dataUrl = await imageToDataUrl(file);
                    newFiles.push({ id: Date.now().toString() + Math.random(), name: file.name, file: dataUrl });
                } catch (error) { toast({ variant: 'destructive', title: 'File Error' }); }
            }
            const currentDocs = po.documents || { poAcknowledgement: [], invoice: [], mushok: [], challan: [] };
            const updatedDocs = { ...currentDocs, [docType]: [...(currentDocs[docType] || []), ...newFiles] };
            setDocumentNonBlocking(doc(firestore, 'purchaseOrders', po.id), { documents: updatedDocs }, { merge: true });
            toast({ title: 'Success', description: `${newFiles.length} file(s) uploaded.` });
        }
    };

    const isPendingApproval = po?.approvalStatus !== 0 && po?.approvalStatus !== 1;
    const canApprove = currentUserEmployee && po?.currentApproverId === currentUserEmployee.id;
    const isApproved = po?.approvalStatus === 1;

    if (isLoading || po === undefined) return <div className="p-8 text-center">Loading...</div>;
    if (po === null) notFound();

    return (
        <TooltipProvider>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-2xl">Purchase Order: {po.poNumber}</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(po.poNumber); toast({ title: 'Copied!' }); }}><Copy className="h-4 w-4" /></Button>
                            </div>
                             <div className="text-sm text-muted-foreground flex items-center gap-2">
                                For DN: <Link href={`/procurement/local-purchase/demand-notes/${po.demandNoteId}`} className="text-primary hover:underline">{demandNote?.demandNoteNumber || 'N/A'}</Link>
                                | Status: <Badge variant={po.approvalStatus === 1 ? 'default' : 'secondary'}>{getPOStatusText(po)}</Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {canApprove && isPendingApproval && (
                                <>
                                 <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-green-500 border-green-500"><Check className="mr-2 h-4 w-4"/>Approve</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Approve PO?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>handleApproval(1)}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                 <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="destructive"><X className="mr-2 h-4 w-4"/>Reject</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reject PO?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={()=>handleApproval(0)}>Confirm Reject</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                </>
                            )}
                            {isApproved && <Button onClick={() => handlePrint(po, 'purchase-order')} variant="outline"><Printer className="mr-2 h-4 w-4"/>Print PO</Button>}
                            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">PO Details</TabsTrigger>
                    <TabsTrigger value="approval">Approval Flow</TabsTrigger>
                    {isApproved && <TabsTrigger value="documents">Uploads</TabsTrigger>}
                </TabsList>
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <Card><CardHeader><CardTitle>Vendor & Delivery</CardTitle></CardHeader><CardContent className="grid md:grid-cols-2 gap-6"><InfoItem icon={Building} label="Vendor" value={vendor?.vendorName} /><InfoItem icon={Calendar} label="Expected" value={po.expectedDeliveryDate} /></CardContent></Card>
                    <Card><CardHeader><CardTitle>Items</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Particulars</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{po.items.map((item, idx) => (<TableRow key={idx}><TableCell>{item.particulars}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{item.totalPrice.toLocaleString()}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
                </TabsContent>
                <TabsContent value="approval" className="mt-6">
                     <Card><CardContent className="py-6"><ul className="space-y-4">{po.approvalFlow?.steps.map((step, index) => { const historyEntry = po.approvalHistory?.find(h => h.level === index); const isPending = po.currentApproverId === step.approverId && isPendingApproval; return (<li key={index} className="flex items-start gap-4">{historyEntry ? <CheckCircle className="h-6 w-6 text-green-500" /> : (isPending ? <Hourglass className="h-6 w-6 text-orange-500 animate-spin" /> : <MoreHorizontal className="h-6 w-6 text-muted-foreground" />)}<div className="flex-1 flex gap-4 items-center"><Avatar className="h-10 w-10 border"><AvatarFallback>{employees?.find(e => e.id === step.approverId)?.fullName?.charAt(0)}</AvatarFallback></Avatar><div><p className="font-semibold">{step.stepName}</p><p className="text-sm">{employees?.find(e => e.id === step.approverId)?.fullName}</p>{historyEntry && <p className="text-[10px] text-muted-foreground">{new Date(historyEntry.timestamp).toLocaleString()}</p>}</div></div></li>); })}</ul></CardContent></Card>
                </TabsContent>
                {isApproved && (
                    <TabsContent value="documents" className="mt-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {(Object.keys(documentLabels) as DocType[]).map(key => (
                                <Card key={key}><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-lg">{documentLabels[key]}</CardTitle></div><div><Label htmlFor={`file-${key}`} className="cursor-pointer text-primary hover:underline"><Upload className="h-4 w-4 inline mr-1" /> Add</Label><Input id={`file-${key}`} type="file" className="hidden" multiple onChange={handleFileChange(key)} /></div></CardHeader><CardContent className="space-y-2">{po.documents?.[key]?.map(file => (<div key={file.id} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"><span className="truncate">{file.name}</span><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" asChild><Link href={file.file} download={file.name}><Download className="h-4 w-4" /></Link></Button></div></div>)) || <div className="text-center py-4 border-2 border-dashed text-muted-foreground italic">No uploads.</div>}</CardContent></Card>
                            ))}
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
        </TooltipProvider>
    );
}

export default function PurchaseOrderPage() {
    return <PurchaseOrderView />;
}
