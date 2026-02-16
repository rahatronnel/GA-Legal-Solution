
"use client";

import React, { useMemo } from 'react';
import type { OrganizationSettings } from '@/app/settings/page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ComparativeStatement } from './cs-entry-form';
import type { DemandNote } from './demand-note-entry-form';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface PrintHeaderProps {
  orgSettings: OrganizationSettings;
  cs: ComparativeStatement;
  demandNote?: DemandNote;
}

const PrintHeader: React.FC<PrintHeaderProps> = ({ orgSettings, cs, demandNote }) => (
    <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
        <div className="text-sm">
            <h1 className="text-xl font-bold text-gray-800">{orgSettings.name}</h1>
            <p className="text-xs">{orgSettings.address}</p>
            <p className="text-xs">Contact: {orgSettings.contactNumber} | Email: {orgSettings.email}</p>
        </div>
        <div className="text-right text-sm">
             <h2 className="text-xl font-bold text-gray-800">Comparative Statement</h2>
             <p>CS No: {cs.csNumber}</p>
             <p>DN No: {demandNote?.demandNoteNumber || 'N/A'}</p>
             <p>Date: {cs.csDate}</p>
        </div>
        {orgSettings.logo && (
             <div className="w-24 h-24 relative">
                <Image src={orgSettings.logo} alt="Organization Logo" layout="fill" objectFit="contain" />
            </div>
        )}
    </div>
);

const PrintFooter = ({ pageNumber }: { pageNumber: number }) => (
    <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-500">
        Page {pageNumber}
    </div>
);

interface CSPrintLayoutProps {
  cs: ComparativeStatement;
  demandNote?: DemandNote;
  vendors: Vendor[];
  orgSettings: OrganizationSettings;
}

export const CSPrintLayout: React.FC<CSPrintLayoutProps> = ({ cs, demandNote, vendors, orgSettings }) => {
    
    const participatingVendors = useMemo(() => {
        if (!cs || !vendors) return [];
        return vendors.filter((v: any) => cs.vendorDetails.some((vd: any) => vd.vendorId === v.id));
    }, [cs, vendors]);

    const vendorTotals = useMemo(() => {
        if (!cs) return {};
        const totals: { [vendorId: string]: { subtotal: number; discount: number; grandTotal: number } } = {};
        
        cs.vendorDetails.forEach((vd: any) => {
            const subtotal = cs.items.reduce((acc: number, item: any) => {
                const quote = item.vendorQuotes.find((q: any) => q.vendorId === vd.vendorId);
                return acc + (item.quantity * (quote?.unitPrice || 0));
            }, 0);
            
            let discount = 0;
            if (vd.discountType === 'Percentage') {
                discount = subtotal * (vd.discountValue / 100);
            } else {
                discount = vd.discountValue;
            }
            
            totals[vd.vendorId] = { subtotal, discount, grandTotal: subtotal - discount };
        });
        
        return totals;
    }, [cs]);

    const bestOfferVendorId = useMemo(() => {
        if (Object.keys(vendorTotals).length === 0) return null;
        return Object.entries(vendorTotals).reduce((min, [vendorId, total]) => {
            return total.grandTotal < min.grandTotal ? { vendorId, grandTotal: total.grandTotal } : min;
        }, { vendorId: '', grandTotal: Infinity }).vendorId;
    }, [vendorTotals]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="p-4 bg-white text-black font-sans print-page relative" style={{ minHeight: '26cm' }}>
            <PrintHeader orgSettings={orgSettings} cs={cs} demandNote={demandNote} />
            <div className="space-y-4 text-xs">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[150px]">Item</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Qty</TableHead>
                                {participatingVendors.map((vendor: any) => (
                                    <TableHead key={vendor.id} className={`min-w-[150px] text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>
                                        {vendor.vendorName}
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
                                            <TableCell key={vendor.id} className={`text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>
                                                <div className="font-semibold">{formatCurrency(unitPrice)}</div>
                                                <div className="text-xs">Total: {formatCurrency(totalPrice)}</div>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableRow className="font-bold bg-gray-100">
                            <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                            {participatingVendors.map((vendor: any) => (
                                <TableCell key={vendor.id} className={`text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.subtotal)}</TableCell>
                            ))}
                        </TableRow>
                        <TableRow className="font-bold bg-gray-100">
                             <TableCell colSpan={3} className="text-right">Discount</TableCell>
                            {participatingVendors.map((vendor: any) => (
                                <TableCell key={vendor.id} className={`text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.discount)}</TableCell>
                            ))}
                        </TableRow>
                         <TableRow className="font-extrabold bg-gray-200">
                            <TableCell colSpan={3} className="text-right">Grand Total</TableCell>
                            {participatingVendors.map((vendor: any) => (
                                <TableCell key={vendor.id} className={`text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.grandTotal)}</TableCell>
                            ))}
                        </TableRow>
                    </Table>
                </div>
                 <div className="overflow-x-auto mt-6">
                     <h3 className="font-bold text-base mb-2">Commercial Terms</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[150px]">Term</TableHead>
                                {participatingVendors.map((vendor: any) => (
                                     <TableHead key={vendor.id} className={`min-w-[150px] text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>{vendor.vendorName}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(['deliveryTerms', 'vatAndTax', 'paymentTerms', 'warranty', 'sampleConfirmed'] as const).map(term => (
                                <TableRow key={term}>
                                    <TableCell className="font-medium">{term.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</TableCell>
                                    {cs.vendorDetails.map((detail: any) => (
                                        <TableCell key={detail.vendorId} className={`text-center ${detail.vendorId === bestOfferVendorId ? 'bg-green-100' : ''}`}>{detail[term]}</TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <PrintFooter pageNumber={1} />
        </div>
    );
};
