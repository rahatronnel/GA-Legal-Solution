
'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useProcurement } from '../../components/procurement-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Award, Copy, FileText, Check, X, CheckCircle, Hourglass, MoreHorizontal, User as UserIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';
import { useUser, useFirestore, setDocumentNonBlocking, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { getCSStatusText, getNextApprovalStatusCode } from '../../lib/status-helper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';


function ComparativeStatementView() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { handlePrint } = usePrint();
    const { comparativeStatements, demandNotes, vendors, employees, designations, orgSettings, isLoading } = useProcurement();
    const { user } = useUser();
    const firestore = useFirestore();

    const [viewingQuotation, setViewingQuotation] = useState<{ vendorName: string; fileDataUrl: string; fileName: string; } | null>(null);

    const cs = useMemo(() => {
        if (isLoading || !comparativeStatements) return undefined;
        return comparativeStatements.find((c: any) => c.id === params.id) || null;
    }, [params.id, comparativeStatements, isLoading]);

    const demandNote = useMemo(() => {
        if (!cs || !demandNotes) return null;
        return demandNotes.find((dn: any) => dn.id === cs.demandNoteId);
    }, [cs, demandNotes]);

    const participatingVendors = useMemo(() => {
        if (!cs || !vendors) return [];
        return vendors.filter((v: any) => cs.vendorDetails.some((vd: any) => vd.vendorId === v.id));
    }, [cs, vendors]);

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [employees, user]);
    
    const handleApproval = (status: number) => {
        if (!firestore || !cs || !user || !cs.approvalFlow?.steps || !employees || !currentUserEmployee) return;
    
        const csRef = doc(firestore, 'comparativeStatements', cs.id);
        const effectiveApproverId = currentUserEmployee.id;
        const approvalLevels = cs.approvalFlow.steps;
        const currentLevel = cs.approvalHistory?.length || 0;
    
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
                // This is the final approval
                newApprovalStatus = 1; // Completed
                nextApproverId = '';
            }
        } else { // Rejected
            newApprovalStatus = 0;
            nextApproverId = '';
        }
    
        setDocumentNonBlocking(csRef, {
            approvalStatus: newApprovalStatus,
            currentApproverId: nextApproverId,
            approvalHistory: [...(cs.approvalHistory || []), newHistoryEntry],
        }, { merge: true });
    };

    const { canApprove, isPendingApproval } = useMemo(() => {
        if (!cs || !currentUserEmployee || !orgSettings?.procurementSettings) return { canApprove: false, isPendingApproval: false };
        const pending = cs.approvalStatus !== 0 && cs.approvalStatus !== 1 && cs.approvalStatus !== 2;
        
        const { managingDirectorId, factoryDirectorId } = orgSettings.procurementSettings;
        const finalStep = cs.approvalFlow?.steps[cs.approvalFlow.steps.length - 1];
        
        let canApproveCheck = false;
        if (pending) {
             if (finalStep && cs.currentApproverId === finalStep.approverId && finalStep.approverId === managingDirectorId) {
                // Special final step logic for MD or FD
                canApproveCheck = currentUserEmployee.id === managingDirectorId || currentUserEmployee.id === factoryDirectorId;
            } else {
                canApproveCheck = currentUserEmployee.id === cs.currentApproverId;
            }
        }
        
        return { canApprove: canApproveCheck, isPendingApproval: pending };
    }, [cs, currentUserEmployee, orgSettings]);


    const vendorTotals = useMemo(() => {
        if (!cs) return {};
        const totals: { [vendorId: string]: { subtotal: number; discount: number; vatAmount: number; taxAmount: number; grandTotal: number } } = {};
        
        cs.vendorDetails.forEach((vd: any) => {
            const subtotal = cs.items.reduce((acc: number, item: any) => {
                const quote = item.vendorQuotes.find((q: any) => q.vendorId === vd.vendorId);
                return acc + (item.quantity * (quote?.unitPrice || 0));
            }, 0);
            
            let discount = 0;
            if (vd.discountType === 'Percentage') {
                discount = subtotal * ((vd.discountValue || 0) / 100);
            } else {
                discount = vd.discountValue || 0;
            }
            
            const subTotalAfterDiscount = subtotal - discount;
            const vatAmount = subTotalAfterDiscount * ((vd.vatPercentage || 0) / 100);
            const taxAmount = subTotalAfterDiscount * ((vd.taxPercentage || 0) / 100);
            const grandTotal = subTotalAfterDiscount + vatAmount + taxAmount;

            totals[vd.vendorId] = { subtotal, discount, vatAmount, taxAmount, grandTotal };
        });
        
        return totals;
    }, [cs]);

    const bestOfferVendorId = useMemo(() => {
        if (Object.keys(vendorTotals).length === 0) return null;
        return Object.entries(vendorTotals).reduce((min, [vendorId, total]) => {
            return total.grandTotal < min.grandTotal ? { vendorId, grandTotal: total.grandTotal } : min;
        }, { vendorId: '', grandTotal: Infinity }).vendorId;
    }, [vendorTotals]);
    
    if (isLoading) return <p>Loading Comparative Statement...</p>;
    if (cs === null) notFound();
    if (!cs) return null;
    
    const selectedVendor = vendors?.find(v => v.id === cs.selectedVendorId);
    const selectedVendorTotal = cs.selectedVendorId ? vendorTotals[cs.selectedVendorId]?.grandTotal : 0;

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleString();
    const getStatusVariant = (status: number | undefined) => {
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
                            <CardTitle className="text-2xl">Comparative Statement: {cs.csNumber}</CardTitle>
                             <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span>For Demand Note:</span>
                                <Link href={`/procurement/local-purchase/demand-notes/${cs.demandNoteId}`} className="text-primary hover:underline">{demandNote?.demandNoteNumber}</Link>
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(demandNote!.demandNoteNumber!); toast({ title: 'Copied!'});}}><Copy className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Copy DN Number</TooltipContent></Tooltip></TooltipProvider>
                                <span>| Dated: {new Date(cs.csDate).toLocaleString()} | Status: </span>
                                <Badge variant={getStatusVariant(cs.approvalStatus)}>{getCSStatusText(cs)}</Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {canApprove && (
                                <>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="text-green-500 border-green-500"><Check className="mr-2 h-4 w-4"/>Approve</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Approve CS?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to approve the selection of vendor <strong className="text-foreground">{selectedVendor?.vendorName || 'N/A'}</strong> for a total of <strong className="text-foreground">{formatCurrency(selectedVendorTotal || 0)}</strong>? This will move the CS to the next step.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={()=>handleApproval(1)}>Confirm</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                 </AlertDialog>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive"><X className="mr-2 h-4 w-4"/>Reject</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Reject CS?</AlertDialogTitle>
                                            <AlertDialogDescription>This will stop the approval process.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={()=>handleApproval(0)}>Confirm Reject</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                 </AlertDialog>
                                </>
                            )}
                            {cs.approvalStatus === 1 && (
                                <Button onClick={() => handlePrint(cs, 'comparative-statement')} variant="outline"><Printer className="mr-2 h-4 w-4"/>Print</Button>
                            )}
                            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="approval">Approval Status</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Price Comparison</CardTitle></CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[200px]">Item</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Qty</TableHead>
                                        {participatingVendors.map((vendor: any) => {
                                            const quotation = demandNote?.quotations?.find((q: any) => q.vendorId === vendor.id);
                                            return (
                                                <TableHead key={vendor.id} className={`min-w-[200px] text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''} ${vendor.id === cs.selectedVendorId ? 'border-2 border-primary' : ''}`}>
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <span className="font-semibold">{vendor.vendorName}</span>
                                                        <p className="text-xs text-muted-foreground px-2">{vendor.officeAddress}</p>
                                                        {vendor.id === bestOfferVendorId && <Badge className="mt-1 bg-green-600">Best Offer</Badge>}
                                                        {vendor.id === cs.selectedVendorId && <Badge variant="default" className="mt-1">Selected</Badge>}
                                                        {quotation?.fileDataUrl && (
                                                            <Button variant="outline" size="sm" className="h-6 px-2 mt-1" onClick={() => setViewingQuotation({vendorName: vendor.vendorName, fileDataUrl: quotation.fileDataUrl, fileName: quotation.fileName})}>
                                                                <FileText className="h-3 w-3 mr-1" /> View Quotation
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cs.items.map((item: any) => (
                                        <TableRow key={item.demandNoteItemId}>
                                            <TableCell className="font-medium">{item.particulars}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            {participatingVendors.map((vendor: any) => {
                                                const quote = item.vendorQuotes.find((q: any) => q.vendorId === vendor.id);
                                                const unitPrice = quote?.unitPrice || 0;
                                                const totalPrice = item.quantity * unitPrice;
                                                return (
                                                    <TableCell key={vendor.id} className={`text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''} ${vendor.id === cs.selectedVendorId ? 'border-x-2 border-primary' : ''}`}>
                                                        <div className="font-semibold">{formatCurrency(unitPrice)}</div>
                                                        <div className="text-xs text-muted-foreground">Total: {formatCurrency(totalPrice)}</div>
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/30"><TableCell colSpan={3} className="text-right font-semibold">Subtotal</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`text-center font-semibold ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''} ${vendor.id === cs.selectedVendorId ? 'border-x-2 border-primary' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.subtotal)}</TableCell>))}</TableRow>
                                    <TableRow className="bg-muted/30"><TableCell colSpan={3} className="text-right font-semibold">Discount</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`text-center font-semibold ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''} ${vendor.id === cs.selectedVendorId ? 'border-x-2 border-primary' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.discount)}</TableCell>))}</TableRow>
                                    <TableRow className="bg-muted/30"><TableCell colSpan={3} className="text-right font-semibold">VAT</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`text-center font-semibold ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''} ${vendor.id === cs.selectedVendorId ? 'border-x-2 border-primary' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.vatAmount)}</TableCell>))}</TableRow>
                                    <TableRow className="bg-muted/30"><TableCell colSpan={3} className="text-right font-semibold">Tax</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`text-center font-semibold ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''} ${vendor.id === cs.selectedVendorId ? 'border-x-2 border-primary' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.taxAmount)}</TableCell>))}</TableRow>
                                    <TableRow className="text-lg font-extrabold bg-muted"><TableCell colSpan={3} className="text-right">Grand Total</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''} ${vendor.id === cs.selectedVendorId ? 'border-x-2 border-b-2 border-primary' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.grandTotal)}</TableCell>))}</TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Commercial Terms Comparison</CardTitle></CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[200px]">Term</TableHead>
                                        {participatingVendors.map((vendor: any) => (
                                            <TableHead key={vendor.id} className={`min-w-[200px] text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''} ${vendor.id === cs.selectedVendorId ? 'border-2 border-primary' : ''}`}>
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <span className="font-semibold">{vendor.vendorName}</span>
                                                    <p className="text-xs text-muted-foreground px-2">{vendor.officeAddress}</p>
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(['deliveryTerms', 'paymentTerms', 'warranty', 'sampleConfirmed', 'vatPercentage', 'taxPercentage'] as const).map(term => {
                                        const termLabel = term.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                        const isPercent = term.includes('Percentage');
                                        return (
                                        <TableRow key={term}>
                                            <TableCell className="font-medium">{termLabel}</TableCell>
                                            {cs.vendorDetails.map((detail: any) => (
                                                <TableCell key={detail.vendorId} className={`text-center ${detail.vendorId === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''} ${detail.vendorId === cs.selectedVendorId ? 'border-x-2 border-primary' : ''}`}>
                                                    {isPercent ? `${detail[term] || 0}%` : detail[term]}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="approval" className="mt-6">
                     <Card>
                        <CardHeader><CardTitle>Approval Status</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {cs.approvalFlow?.steps.map((step, index) => {
                                    const historyEntry = cs.approvalHistory?.find(h => h.level === index);
                                    const approver = employees?.find(e => e.id === step.approverId);
                                    const designation = designations?.find(d => d.id === approver?.designationId);
                                    
                                    let status: 'approved' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';

                                    if (historyEntry?.status === 'Approved') {
                                        status = 'approved';
                                    } else if (historyEntry?.status === 'Rejected') {
                                        status = 'rejected';
                                    } else if (cs.currentApproverId === step.approverId && isPendingApproval) {
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
                                                            {historyEntry.status} on {formatDateTime(historyEntry.timestamp)}
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
             <Dialog open={!!viewingQuotation} onOpenChange={(open) => !open && setViewingQuotation(null)}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Quotation: {viewingQuotation?.vendorName}</DialogTitle>
                        <DialogDescription>{viewingQuotation?.fileName}</DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow relative">
                        {viewingQuotation?.fileDataUrl.startsWith('data:image/') ? (
                            <Image src={viewingQuotation.fileDataUrl} alt={`Quotation from ${viewingQuotation.vendorName}`} layout="fill" className="object-contain" />
                        ) : (
                            <object data={viewingQuotation?.fileDataUrl} type="application/pdf" width="100%" height="100%">
                                <div className="p-4 text-center">It appears you don't have a PDF plugin for this browser. You can <a href={viewingQuotation?.fileDataUrl} download={viewingQuotation?.fileName} className="text-primary underline">download the PDF file.</a></div>
                            </object>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function ComparativeStatementPage() {
    return <ComparativeStatementView />;
}
