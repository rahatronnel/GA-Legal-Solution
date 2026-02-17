
'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useProcurement } from '../../components/procurement-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Award, Copy } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';

function ComparativeStatementView() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { handlePrint } = usePrint();
    const { comparativeStatements, demandNotes, vendors, isLoading } = useProcurement();

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

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">Comparative Statement: {cs.csNumber}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <span>For Demand Note:</span>
                                <Link href={`/procurement/local-purchase/demand-notes/${cs.demandNoteId}`} className="text-primary hover:underline">{demandNote?.demandNoteNumber}</Link>
                                {demandNote?.demandNoteNumber && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => {
                                            navigator.clipboard.writeText(demandNote.demandNoteNumber!);
                                            toast({ title: 'Copied!', description: 'Demand Note number copied to clipboard.' });
                                          }}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Copy DN Number</TooltipContent>
                                    </Tooltip>
                                )}
                                <span>| Dated: {new Date(cs.csDate).toLocaleString()}</span>
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => handlePrint(cs, 'comparative-statement')} variant="outline"><Printer className="mr-2 h-4 w-4"/>Print</Button>
                            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Price Comparison</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[200px]">Item</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Qty</TableHead>
                                {participatingVendors.map((vendor: any) => (
                                    <TableHead key={vendor.id} className={`min-w-[200px] text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
                                        {vendor.vendorName}
                                        {vendor.id === bestOfferVendorId && <Badge className="ml-2 bg-green-600">Best Offer</Badge>}
                                    </TableHead>
                                ))}
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
                                            <TableCell key={vendor.id} className={`text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
                                                <div className="font-semibold">{formatCurrency(unitPrice)}</div>
                                                <div className="text-xs text-muted-foreground">Total: {formatCurrency(totalPrice)}</div>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                            {/* Footer Totals */}
                            <TableRow className="bg-muted/30"><TableCell colSpan={3} className="text-right font-semibold">Subtotal</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`text-center font-semibold ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.subtotal)}</TableCell>))}</TableRow>
                            <TableRow className="bg-muted/30"><TableCell colSpan={3} className="text-right font-semibold">Discount</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`text-center font-semibold ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.discount)}</TableCell>))}</TableRow>
                            <TableRow className="bg-muted/30"><TableCell colSpan={3} className="text-right font-semibold">VAT</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`text-center font-semibold ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.vatAmount)}</TableCell>))}</TableRow>
                            <TableRow className="bg-muted/30"><TableCell colSpan={3} className="text-right font-semibold">Tax</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`text-center font-semibold ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.taxAmount)}</TableCell>))}</TableRow>
                            <TableRow className="text-lg font-extrabold bg-muted"><TableCell colSpan={3} className="text-right">Grand Total</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.grandTotal)}</TableCell>))}</TableRow>
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
                                     <TableHead key={vendor.id} className={`min-w-[200px] text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>{vendor.vendorName}</TableHead>
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
                                        <TableCell key={detail.vendorId} className={`text-center ${detail.vendorId === bestOfferVendorId ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
                                            {isPercent ? `${detail[term] || 0}%` : detail[term]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}

export default function ComparativeStatementPage() {
    return <TooltipProvider><ComparativeStatementView /></TooltipProvider>;
}
