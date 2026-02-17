
"use client";

import React, { useMemo } from 'react';
import type { OrganizationSettings } from '@/app/settings/page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ComparativeStatement } from './cs-entry-form';
import type { DemandNote } from './demand-note-entry-form';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Designation } from '@/app/user-management/components/designation-table';
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
             <p>Date: {new Date(cs.csDate).toLocaleDateString()}</p>
        </div>
        {orgSettings.logo && (
             <div className="w-24 h-24 relative">
                <Image src={orgSettings.logo} alt="Organization Logo" layout="fill" objectFit="contain" />
            </div>
        )}
    </div>
);

const PrintFooter: React.FC<{
    pageNumber: number;
    cs?: ComparativeStatement;
    employees?: Employee[];
    designations?: Designation[];
}> = ({ pageNumber, cs, employees, designations }) => {

    const creator = cs ? employees?.find(e => e.id === cs.createdBy) : undefined;
    const creatorDesignation = creator ? designations?.find(d => d.id === creator.designationId) : undefined;

    const approvers = cs?.approvalHistory
        ?.filter(h => h.status === 'Approved')
        .map(h => {
            const employee = employees?.find(e => e.id === h.approverId);
            const designation = designations?.find(d => d.id === employee?.designationId);
            const step = cs.approvalFlow?.steps?.[h.level];
            return {
                ...h,
                employee,
                designation,
                title: step?.stepName || 'Approved By'
            };
        });
    
    const signatureRowItems = [
        { employee: creator, designation: creatorDesignation, title: 'Prepared By', timestamp: cs?.csDate },
        ...(approvers || [])
    ];

    const formatDateTime = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString();
        } catch {
            return 'N/A';
        }
    }

    const signatureRows = [];
    for (let i = 0; i < signatureRowItems.length; i += 5) {
        signatureRows.push(signatureRowItems.slice(i, i + 5));
    }


    return (
        <div className="absolute bottom-4 left-0 right-0 px-4">
            {signatureRows.length > 0 && (
                <div className="space-y-8 border-t-2 border-gray-300 pt-4 mt-6">
                    {signatureRows.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex justify-around items-end">
                            {row.map((sig, index) => (
                                <div key={index} className="text-center text-xs w-1/5 px-1">
                                    {sig.employee?.signature ? (
                                        <Image src={sig.employee.signature} alt="Signature" width={100} height={30} className="object-contain mx-auto h-8" />
                                    ) : (
                                        <div className="h-8"></div>
                                    )}
                                    <p className="border-t border-gray-500 mt-1 pt-1 font-semibold truncate">{sig.employee?.fullName}</p>
                                    <p className="truncate">{sig.designation?.name}</p>
                                    <p className="text-gray-500 text-[10px]">{sig.title}</p>
                                    {sig.timestamp && <p className="text-gray-500 text-[10px]">{formatDateTime(sig.timestamp)}</p>}
                                </div>
                            ))}
                             {Array(5 - row.length).fill(0).map((_, i) => <div key={`fill-${i}`} className="w-1/5 px-1"></div>)}
                        </div>
                    ))}
                </div>
            )}
            <div className="text-center text-xs text-gray-500 pt-2">Page {pageNumber}</div>
        </div>
    );
};


interface CSPrintLayoutProps {
  cs: ComparativeStatement;
  demandNote?: DemandNote;
  vendors: Vendor[];
  employees: Employee[];
  designations: Designation[];
  orgSettings: OrganizationSettings;
}

export const CSPrintLayout: React.FC<CSPrintLayoutProps> = ({ cs, demandNote, vendors, employees, designations, orgSettings }) => {
    
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

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="p-4 bg-white text-black font-sans print-page relative" style={{ minHeight: '26cm' }}>
            <PrintHeader orgSettings={orgSettings} cs={cs} demandNote={demandNote} />
            <div className="flex-grow pt-6 pb-56 space-y-4 text-[10px]">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="p-1 min-w-[150px]">Item</TableHead>
                                <TableHead className="p-1">Unit</TableHead>
                                <TableHead className="p-1">Qty</TableHead>
                                {participatingVendors.map((vendor: any) => (
                                    <TableHead key={vendor.id} className={`p-1 text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>
                                        {vendor.vendorName}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cs.items.map((item: any) => (
                                <TableRow key={item.demandNoteItemId}>
                                    <TableCell className="p-1 font-medium">{item.particulars}</TableCell>
                                    <TableCell className="p-1">{item.unit}</TableCell>
                                    <TableCell className="p-1">{item.quantity}</TableCell>
                                    {participatingVendors.map((vendor: any) => {
                                        const quote = item.vendorQuotes.find((q: any) => q.vendorId === vendor.id);
                                        const unitPrice = quote?.unitPrice || 0;
                                        const totalPrice = item.quantity * unitPrice;
                                        return (
                                            <TableCell key={vendor.id} className={`p-1 text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>
                                                <div className="font-semibold">{formatCurrency(unitPrice)}</div>
                                                <div className="text-[9px]">Total: {formatCurrency(totalPrice)}</div>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                             <TableRow className="bg-gray-50"><TableCell colSpan={3} className="p-1 text-right font-bold">Subtotal</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`p-1 text-center font-bold ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.subtotal)}</TableCell>))}</TableRow>
                             <TableRow className="bg-gray-50"><TableCell colSpan={3} className="p-1 text-right font-bold">Discount</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`p-1 text-center font-bold ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.discount)}</TableCell>))}</TableRow>
                             <TableRow className="bg-gray-50"><TableCell colSpan={3} className="p-1 text-right font-bold">VAT</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`p-1 text-center font-bold ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.vatAmount)}</TableCell>))}</TableRow>
                             <TableRow className="bg-gray-50"><TableCell colSpan={3} className="p-1 text-right font-bold">Tax</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`p-1 text-center font-bold ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.taxAmount)}</TableCell>))}</TableRow>
                             <TableRow className="font-extrabold bg-gray-200"><TableCell colSpan={3} className="p-1 text-right">Grand Total</TableCell>{participatingVendors.map((vendor: any) => (<TableCell key={vendor.id} className={`p-1 text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>{formatCurrency(vendorTotals[vendor.id]?.grandTotal)}</TableCell>))}</TableRow>
                        </TableBody>
                    </Table>
                </div>
                 <div className="overflow-x-auto mt-6">
                     <h3 className="font-bold text-base mb-2">Commercial Terms</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="p-1 min-w-[150px]">Term</TableHead>
                                {participatingVendors.map((vendor: any) => (
                                     <TableHead key={vendor.id} className={`p-1 text-center ${vendor.id === bestOfferVendorId ? 'bg-green-100' : ''}`}>{vendor.vendorName}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(['deliveryTerms', 'paymentTerms', 'warranty', 'sampleConfirmed'] as const).map(term => {
                                const termLabel = term.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                return (
                                <TableRow key={term}>
                                    <TableCell className="p-1 font-medium">{termLabel}</TableCell>
                                    {cs.vendorDetails.map((detail: any) => (
                                        <TableCell key={detail.vendorId} className={`p-1 text-center ${detail.vendorId === bestOfferVendorId ? 'bg-green-100' : ''}`}>
                                            {detail[term]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <PrintFooter pageNumber={1} cs={cs} employees={employees} designations={designations} />
        </div>
    );
};
