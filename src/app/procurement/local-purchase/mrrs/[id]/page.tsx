
"use client";

import React, { useMemo } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, User, FileText, Download, Printer, Clock, Check, X, 
    Building, CheckCircle, Hourglass, MoreHorizontal, Hash, Truck, 
    Package, Box, MapPin, DollarSign, MessageSquare, Tag, CheckCircle2, Archive 
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProcurement } from '../../components/procurement-provider';
import { getMRRStatusText, getNextApprovalStatusCode } from '../../lib/status-helper';
import { Separator } from '@/components/ui/separator';

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean }> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <div className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</div>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
);

const DocumentViewer = ({ files, categoryLabel }: { files: { name: string; file: string }[]; categoryLabel: string }) => {
    if (!files || files.length === 0) return null;

    return (
        <Card>
            <CardHeader><CardTitle>{categoryLabel}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                {files.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                            <p className="font-medium text-sm truncate">{doc.name}</p>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={doc.file} download={doc.name} target="_blank"><Download className="mr-2 h-4 w-4"/>Download</Link>
                            </Button>
                        </div>
                        {doc.file.startsWith('data:image/') && (
                            <div className="mt-2 rounded-lg overflow-hidden flex justify-center items-center bg-muted/50 aspect-video">
                                <Image src={doc.file} alt={doc.name} width={400} height={225} className="object-contain" />
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default function MRRProfilePage() {
    const params = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const { user } = useUser();
    const { mrrs, employees, designations, isLoading } = useProcurement();

    const mrr = useMemo(() => {
        if (isLoading || !mrrs) return undefined;
        return mrrs.find((m: any) => m.id === params.id) || null;
    }, [params.id, mrrs, isLoading]);

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [user, employees]);

    const handleApproval = (status: number) => {
        if (!firestore || !mrr || !user || !mrr.approvalFlow?.steps || !currentUserEmployee) return;
    
        const mrrRef = doc(firestore, 'mrrs', mrr.id);
        const approvalLevels = mrr.approvalFlow.steps;
        const currentLevel = mrr.approvalHistory?.length || 0;
    
        const newHistoryEntry = {
            approverId: currentUserEmployee.id,
            status: status === 1 ? 'Approved' : 'Rejected',
            timestamp: new Date().toISOString(),
            level: currentLevel,
            remarks: `Status updated from detail page`,
        };
    
        let newStatus: number;
        let nextApproverId: string;
    
        if (status === 1) { // Approve
            const nextLevel = currentLevel + 1;
            if (nextLevel < approvalLevels.length) {
                newStatus = getNextApprovalStatusCode(currentLevel);
                nextApproverId = approvalLevels[nextLevel].approverId;
            } else {
                newStatus = 1; // Completed
                nextApproverId = '';
            }
        } else { // Reject
            newStatus = 0;
            nextApproverId = '';
        }
    
        setDocumentNonBlocking(mrrRef, {
            approvalStatus: newStatus,
            currentApproverId: nextApproverId,
            approvalHistory: [...(mrr.approvalHistory || []), newHistoryEntry],
        }, { merge: true });
    };

    if (isLoading || mrr === undefined) return <div className="p-10 text-center animate-pulse">Loading report...</div>;
    if (mrr === null) notFound();

    const isPendingApproval = mrr.approvalStatus > 2;
    const canApprove = currentUserEmployee && mrr.currentApproverId === currentUserEmployee.id;
    const receiver = employees.find(e => e.id === mrr.receiverConfirmantId);

    return (
        <TooltipProvider>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-2xl">{mrr.mrrNumber}</CardTitle>
                                <Badge variant={mrr.approvalStatus === 1 ? 'default' : 'secondary'}>{getMRRStatusText(mrr)}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">Material Receiving Report finalized on {new Date(mrr.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex gap-2">
                            {canApprove && isPendingApproval && (
                                <>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button size="sm" className="bg-green-600 hover:bg-green-700"><Check className="mr-2 h-4 w-4"/>Approve</Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Approve MRR?</AlertDialogTitle><AlertDialogDescription>Confirm receipt and condition of materials.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleApproval(1)}>Confirm</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><X className="mr-2 h-4 w-4"/>Reject</Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Reject MRR?</AlertDialogTitle><AlertDialogDescription>This will halt the procurement cycle for this shipment.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive" onClick={() => handleApproval(0)}>Confirm Reject</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}
                            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="overview">
                <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="documents">Bill & Challan</TabsTrigger><TabsTrigger value="history">Approval Flow</TabsTrigger></TabsList>
                
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card><CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Truck className="h-4 w-4"/>Logistics</CardTitle></CardHeader>
                        <CardContent className="grid gap-4">
                            <InfoItem icon={Tag} label="Shipment Type" value={mrr.shipmentType} />
                            <InfoItem icon={Box} label="Container" value={`${mrr.containerNo} (${mrr.containerSize})`} />
                            <InfoItem icon={FileText} label="Invc/Challan" value={`${mrr.invoiceNumber} / ${mrr.challanNumber}`} />
                        </CardContent></Card>
                        <Card><CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/>Condition</CardTitle></CardHeader>
                        <CardContent className="grid gap-4">
                            <InfoItem icon={Package} label="Goods State" value={<Badge variant={mrr.goodsCondition === 'Ok' ? 'default' : 'destructive'}>{mrr.goodsCondition}</Badge>} />
                            <InfoItem icon={Archive} label="Packaging" value={<Badge variant={mrr.packageCondition === 'Ok' ? 'default' : 'destructive'}>{mrr.packageCondition}</Badge>} />
                            <InfoItem icon={User} label="Confirmant" value={receiver?.fullName} />
                        </CardContent></Card>
                    </div>

                    <Card><CardHeader><CardTitle className="text-lg">Received Items</CardTitle></CardHeader>
                    <CardContent><Table><TableHeader><TableRow><TableHead>Particulars</TableHead><TableHead>Description</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                    <TableBody>{mrr.items.map((item: any, i: number) => (<TableRow key={i}><TableCell className="font-bold">{item.particulars}</TableCell><TableCell className="italic text-xs">{item.description}</TableCell><TableCell className="text-center">{item.receivedQty} {item.unit}</TableCell><TableCell className="text-right font-mono">{item.unitPrice.toLocaleString()}</TableCell><TableCell className="text-right font-bold">{item.amount.toLocaleString()}</TableCell></TableRow>))}</TableBody>
                    </Table></CardContent></Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-6 mt-6">
                    <DocumentViewer files={mrr.documents?.bill || []} categoryLabel="Vendor Bill / Invoice" />
                    <DocumentViewer files={mrr.documents?.challan || []} categoryLabel="Delivery Challan" />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card><CardContent className="py-6"><ul className="space-y-4">{mrr.approvalFlow?.steps.map((step: any, index: number) => {
                        const historyEntry = mrr.approvalHistory?.find((h:any) => h.level === index);
                        const approver = employees?.find(e => e.id === step.approverId);
                        const isPending = mrr.currentApproverId === step.approverId && mrr.approvalStatus > 2;
                        return (<li key={index} className="flex items-start gap-4">{historyEntry ? <CheckCircle className="h-6 w-6 text-green-500" /> : (isPending ? <Hourglass className="h-6 w-6 text-orange-500 animate-spin" /> : <MoreHorizontal className="h-6 w-6 text-muted-foreground" />)}<div className="flex-1 flex gap-4 items-center"><Avatar className="h-10 w-10 border"><AvatarFallback>{approver?.fullName?.charAt(0)}</AvatarFallback></Avatar><div><p className="font-semibold">{step.stepName}</p><p className="text-sm">{approver?.fullName}</p>{historyEntry && <p className="text-[10px] text-muted-foreground">{new Date(historyEntry.timestamp).toLocaleString()}</p>}</div></div></li>);
                    })}</ul></CardContent></Card>
                </TabsContent>
            </Tabs>
        </div>
        </TooltipProvider>
    );
}
