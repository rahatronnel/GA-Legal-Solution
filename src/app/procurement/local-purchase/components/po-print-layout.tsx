"use client";

import React from 'react';
import Image from 'next/image';
import type { OrganizationSettings } from '@/app/settings/page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PurchaseOrder } from './po-entry-form';
import type { DemandNote } from './demand-note-entry-form';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Designation } from '@/app/user-management/components/designation-table';
import type { DeliveryPlace } from './delivery-place-table';
import { numberToWords } from '@/lib/utils';

interface POPrintLayoutProps {
  po: PurchaseOrder;
  demandNote?: DemandNote;
  vendor?: Vendor;
  employees: Employee[];
  designations: Designation[];
  deliveryPlaces: DeliveryPlace[];
  orgSettings: OrganizationSettings;
}

export const POPrintLayout: React.FC<POPrintLayoutProps> = ({ 
    po, 
    demandNote, 
    vendor, 
    employees, 
    designations, 
    deliveryPlaces, 
    orgSettings 
}) => {
    const formatCurrency = (amount: number | undefined) => 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

    const gpConcern = employees.find(e => e.id === demandNote?.gpConcernOfficerId);
    const gpConcernDesignation = designations.find(d => d.id === gpConcern?.designationId);
    const deliveryLocation = deliveryPlaces.find(p => p.id === demandNote?.deliveryPlace);
    
    const formatDateTime = (ts: string | undefined) => {
        if (!ts) return 'N/A';
        try {
            return new Date(ts).toLocaleString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch { return ts; }
    };

    const approvers = po.approvalHistory
        ?.filter(h => h.status === 'Approved')
        .map(h => {
            const employee = employees.find(e => e.id === h.approverId);
            const designation = designations.find(d => d.id === employee?.designationId);
            const step = po.approvalFlow?.steps?.[h.level];
            return { ...h, employee, designation, title: step?.stepName || 'Approved By' };
        }) || [];

    return (
        <div className="p-8 bg-white text-black font-sans min-h-[29.7cm] relative border-2 border-black m-4">
            <h1 className="text-3xl font-bold text-center mb-8 uppercase tracking-widest border-b-4 border-black pb-2">Purchase Order</h1>

            <div className="grid grid-cols-2 gap-12 mb-8">
                <div className="space-y-0 border-2 border-black">
                    <div className="p-2 border-b-2 border-black font-bold text-lg bg-gray-100">{orgSettings.name}</div>
                    <div className="p-2 border-b-2 border-black min-h-[80px] text-sm italic">{orgSettings.address}</div>
                    <div className="p-2 border-b-2 border-black text-sm"><span className="font-bold">Contact:</span> {orgSettings.contactNumber}</div>
                    <div className="p-2 border-b-2 border-black text-sm"><span className="font-bold">GP Concern:</span> {gpConcern?.fullName || 'N/A'}</div>
                    <div className="p-2 text-sm"><span className="font-bold">Email:</span> {orgSettings.email}</div>
                </div>

                <div className="border-2 border-black h-fit">
                    <div className="flex border-b-2 border-black">
                        <div className="flex-1 p-2 border-r-2 border-black font-bold bg-gray-50 text-center">PO Number</div>
                        <div className="flex-1 p-2 text-center font-mono font-bold">{po.poNumber}</div>
                    </div>
                    <div className="flex border-b-2 border-black">
                        <div className="flex-1 p-2 border-r-2 border-black font-bold bg-gray-50 text-center">Date</div>
                        <div className="flex-1 p-2 text-center">{po.poDate}</div>
                    </div>
                    <div className="p-2 border-b-2 border-black font-bold bg-gray-100 text-center uppercase tracking-widest text-[10px]">Delivery Address</div>
                    <div className="p-4 min-h-[60px] text-sm text-center font-semibold">
                        {deliveryLocation?.name || demandNote?.deliveryPlace || 'As per instruction'}
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <table className="w-full border-collapse border-2 border-black">
                    <thead>
                        <tr className="bg-gray-100 text-sm uppercase tracking-tight">
                            <th className="border-2 border-black p-2 text-left w-16">Sl</th>
                            <th className="border-2 border-black p-2 text-left">Description</th>
                            <th className="border-2 border-black p-2 text-center w-20">QTY</th>
                            <th className="border-2 border-black p-2 text-center w-20">Unit</th>
                            <th className="border-2 border-black p-2 text-right w-32">Price</th>
                            <th className="border-2 border-black p-2 text-right w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {po.items.map((item, idx) => (
                            <tr key={idx} className="text-sm">
                                <td className="border-2 border-black p-2 text-center">{idx + 1}</td>
                                <td className="border-2 border-black p-2 font-bold">{item.particulars}</td>
                                <td className="border-2 border-black p-2 text-center font-mono">{item.quantity}</td>
                                <td className="border-2 border-black p-2 text-center">{item.unit}</td>
                                <td className="border-2 border-black p-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                                <td className="border-2 border-black p-2 text-right font-mono font-bold">{formatCurrency(item.totalPrice)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan={4} rowSpan={5} className="border-2 border-black align-top p-4 bg-gray-50/30 italic text-xs">
                                <span className="font-bold not-italic text-sm underline block mb-2">Special Instructions:</span>
                                {po.comments || 'No special instructions recorded.'}
                            </td>
                            <td className="border-2 border-black p-2 font-bold bg-gray-50 text-sm uppercase tracking-tighter">Subtotal</td>
                            <td className="border-2 border-black p-2 text-right text-sm font-mono">{formatCurrency(po.totalAmount)}</td>
                        </tr>
                        <tr>
                            <td className="border-2 border-black p-2 font-bold bg-gray-50 text-sm uppercase tracking-tighter">Discount</td>
                            <td className="border-2 border-black p-2 text-right text-sm text-red-600 font-mono">-{formatCurrency(po.discountAmount)}</td>
                        </tr>
                        <tr>
                            <td className="border-2 border-black p-2 font-bold bg-gray-50 text-sm uppercase tracking-tighter">VAT & Tax</td>
                            <td className="border-2 border-black p-2 text-right text-sm font-mono">{formatCurrency((po.vatAmount || 0) + (po.taxAmount || 0))}</td>
                        </tr>
                        <tr className="bg-gray-100">
                            <td className="border-2 border-black p-2 font-bold text-lg uppercase tracking-tighter">Net Total</td>
                            <td className="border-2 border-black p-2 text-right font-bold text-lg font-mono underline underline-offset-4 decoration-double">{formatCurrency(po.netPayableAmount)}</td>
                        </tr>
                    </tbody>
                </table>
                <div className="mt-2 p-3 border-2 border-black bg-gray-50 text-xs flex gap-2">
                    <span className="font-bold uppercase">Amount in Words: </span>
                    <span className="italic font-semibold text-sm">"{numberToWords(po.netPayableAmount || 0)}"</span>
                </div>
            </div>

            <div className="space-y-6 mb-32">
                <div><h3 className="font-bold text-base underline mb-1 uppercase">Expected Delivery Date</h3><p className="text-sm pl-4 font-bold text-primary">{po.expectedDeliveryDate || 'Immediate / As per schedule'}</p></div>
                <div><h3 className="font-bold text-base underline mb-1 uppercase">Delivery Terms</h3><p className="text-sm pl-4 whitespace-pre-wrap">{po.deliveryTerms || 'N/A'}</p></div>
                <div><h3 className="font-bold text-base underline mb-1 uppercase">Other Terms & Conditions</h3><div className="text-[10px] pl-4 space-y-2 opacity-80 border-l-2 border-black/10"><p className="whitespace-pre-wrap">{po.mandatoryTerms}</p><p className="whitespace-pre-wrap">{po.otherTerms}</p></div></div>
            </div>

            <div className="absolute bottom-12 left-8 right-8 flex justify-between items-start border-t-2 border-black pt-8">
                <div className="text-center w-48">
                    <div className="h-12 flex items-center justify-center">
                        {gpConcern?.signature && <Image src={gpConcern.signature} alt="Sig" width={100} height={40} className="object-contain" />}
                    </div>
                    <div className="border-t-2 border-black pt-2 mt-2">
                        <p className="font-bold text-sm truncate">{gpConcern?.fullName || 'N/A'}</p>
                        <p className="text-xs truncate uppercase text-muted-foreground">{gpConcernDesignation?.name || 'N/A'}</p>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1 text-center font-bold">Prepared By</p>
                    <p className="text-[8px] text-muted-foreground text-center mt-0.5">{formatDateTime(po.createdAt)}</p>
                </div>
                {approvers.map((sig, i) => (
                    <div key={i} className="text-center w-48">
                        <div className="h-12 flex items-center justify-center">
                            {sig.employee?.signature && <Image src={sig.employee.signature} alt="Sig" width={100} height={40} className="object-contain" />}
                        </div>
                        <div className="border-t-2 border-black pt-2 mt-2">
                            <p className="font-bold text-sm truncate">{sig.employee?.fullName}</p>
                            <p className="text-xs truncate uppercase text-muted-foreground">{sig.designation?.name}</p>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1 text-center font-bold uppercase">{sig.title}</p>
                        <p className="text-[8px] text-muted-foreground text-center mt-0.5">{formatDateTime(sig.timestamp)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};