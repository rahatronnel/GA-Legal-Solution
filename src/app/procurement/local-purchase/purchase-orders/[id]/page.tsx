
'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useProcurement } from '../../components/procurement-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileText, Check, X, CheckCircle, Hourglass, MoreHorizontal, User as UserIcon, Building, DollarSign, Calendar } from 'lucide-react';
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
import type { PurchaseOrder } from '../../components/po-entry-form';

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean }> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <div className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</div>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
);

function PurchaseOrderView() {
    const params = useParams();
    const router = useRouter();
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
        const effectiveApproverId = currentUserEmployee.id;
        const approvalLevels = po.approvalFlow.steps;
        const currentLevel = po.approvalHistory?.length || 0;
    
        const newHistoryEntry = {
            approverId: effectiveApproverId,
            status: status === 1 ? 'Approved' : 'Rejected',
            timestamp: new Date().toISOString(),
            level: currentLevel,
            remarks: `Manually updated from details page`,
        };
    
        let newApprovalStatus: number;
        let nextApproverId: string | undefined;
    
        if (status === 1) { // Approved
            const nextLevel = currentLevel + 1;
            if (nextLevel < approvalLevels.length) {
                newApprovalStatus = getNextApprovalStatusCode(currentLevel); 
                nextApproverId = approvalLevels[nextLevel].approverId;
            } else {
                newApprovalStatus = 1; // Completed
                nextApproverId = '';
            }
        } else { // Rejected
            newApprovalStatus = 0;
            nextApproverId = '';
        }
    
        setDocumentNonBlocking(poRef, {
            approvalStatus: newApprovalStatus,
            currentApproverId: nextApproverId || '',
            approvalHistory: [...(po.approvalHistory || []), newHistoryEntry],
        }, { merge: true });
    };

    const isPendingApproval = po?.approvalStatus !== 0 && po?.approvalStatus !== 1;
    const canApprove = currentUserEmployee && po?.currentApproverId === currentUserEmployee.id;

    if (isLoading) return <p>Loading Purchase Order...</p>;
    if (po === null) notFound();
    if (!po) return null;

    const formatCurrency = (amount: number | undefined) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
    const getStatusVariant = (status: number) => {
        if (status === 1) return 'default';
        if (status === 0) return 'destructive';
        return 'secondary';
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">Purchase Order: {po.poNumber}</CardTitle>
                             <div className="text-sm text-muted-foreground flex items-center gap-2">
                                For Requisition: 
                                <Link href={`/procurement/local-purchase/demand-notes/${po.demandNoteId}`} className="text-primary hover:underline">{demandNote?.demandNoteNumber || 'N/A'}</Link>
                                | Status: 
                                <Badge variant={getStatusVariant(po.approvalStatus)}>{getPOStatusText(po)}</Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {canApprove && isPendingApproval && (
                                <>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-green-500 border-green-500"><Check className="mr-2 h-4 w-4"/>Approve</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Approve PO?</AlertDialogTitle><AlertDialogDescription>This will move the Purchase Order to the next step or final completion.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>handleApproval(1)}>Confirm</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                 </AlertDialog>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><X className="mr-2 h-4 w-4"/>Reject</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Reject PO?</AlertDialogTitle><AlertDialogDescription>This will stop the approval process and mark it as rejected.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={()=>handleApproval(0)}>Confirm Reject</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                 </AlertDialog>
                                </>
                            )}
                            {po.approvalStatus === 1 && (
                                <Button onClick={() => handlePrint(po, 'purchase-order')} variant="outline"><Printer className="mr-2 h-4 w-4"/>Print PO</Button>
                            )}
                            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">PO Details</TabsTrigger>
                    <TabsTrigger value="approval">Approval Status</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Vendor Information</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <InfoItem icon={Building} label="Vendor" value={vendor?.vendorName} />
                                <InfoItem icon={UserIcon} label="Contact" value={vendor?.contactPersonName} />
                                <InfoItem icon={Building} label="Address" value={vendor?.officeAddress} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Delivery Information</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <InfoItem icon={Building} label="Delivery Place" value={demandNote?.deliveryPlace} />
                                <InfoItem icon={Calendar} label="Expected Delivery" value={po.expectedDeliveryDate} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Financial Summary</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span>{formatCurrency(po.totalAmount)}</span></div>
                                <div className="flex justify-between text-destructive"><span className="text-muted-foreground">Discount:</span><span>- {formatCurrency(po.discountAmount)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">VAT:</span><span>+ {formatCurrency(po.vatAmount)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Tax:</span><span>+ {formatCurrency(po.taxAmount)}</span></div>
                                <Separator className="my-1"/>
                                <div className="flex justify-between font-bold text-base"><span>Total:</span><span>{formatCurrency(po.netPayableAmount)}</span></div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Ordered Items</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Particulars</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead className="text-right">Total Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {po.items.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{item.particulars}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-1 uppercase tracking-wider text-muted-foreground">Mandatory Terms</h4>
                                <div className="text-sm whitespace-pre-wrap p-3 bg-muted/30 rounded-md border">{po.mandatoryTerms || 'No specific terms provided.'}</div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm mb-1 uppercase tracking-wider text-muted-foreground">Other Terms</h4>
                                <div className="text-sm whitespace-pre-wrap p-3 bg-muted/30 rounded-md border">{po.otherTerms || 'None.'}</div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="approval" className="mt-6">
                     <Card>
                        <CardHeader><CardTitle>Approval Workflow</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {po.approvalFlow?.steps.map((step, index) => {
                                    const historyEntry = po.approvalHistory?.find(h => h.level === index);
                                    const approver = employees?.find(e => e.id === step.approverId);
                                    const designation = designations?.find(d => d.id === approver?.designationId);
                                    
                                    let status: 'approved' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';

                                    if (historyEntry?.status === 'Approved') {
                                        status = 'approved';
                                    } else if (historyEntry?.status === 'Rejected') {
                                        status = 'rejected';
                                    } else if (po.currentApproverId === step.approverId && isPendingApproval) {
                                        status = 'pending';
                                    }

                                    return (
                                        <li key={index} className="flex items-start gap-4">
                                            <div>
                                                {status === 'approved' && <CheckCircle className="h-6 w-6 text-green-500" />}
                                                {status === 'pending' && <Hourglass className="h-6 w-6 text-orange-500 animate-spin" />}
                                                {status === 'upcoming' && <MoreHorizontal className="h-6 w-6 text-muted-foreground" />}
                                                {status === 'rejected' && <X className="h-6 w-6 text-destructive" />}
                                            </div>
                                            <div className="flex-1 flex gap-4 items-center">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={approver?.profilePicture} alt={approver?.fullName} />
                                                    <AvatarFallback>{approver?.fullName?.charAt(0) || <UserIcon />}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{step.stepName}</p>
                                                    <p className="text-sm">{approver?.fullName || 'N/A'} <span className="text-xs text-muted-foreground">({designation?.name || 'N/A'})</span></p>
                                                    {historyEntry && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {historyEntry.status} on {new Date(historyEntry.timestamp).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function PurchaseOrderPage() {
    return <PurchaseOrderView />;
}
