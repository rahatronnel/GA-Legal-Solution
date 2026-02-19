
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
        <div className="p-8 bg-white text-black font-sans min-h-[29.7cm] relative">
            <h1 className="text-3xl font-bold text-center mb-8 uppercase tracking-widest">Purchase Order</h1>

            <div className="grid grid-cols-2 gap-12 mb-8">
                <div className="space-y-0 border-2 border-black">
                    <div className="p-2 border-b-2 border-black font-bold text-lg">{orgSettings.name}</div>
                    <div className="p-2 border-b-2 border-black min-h-[80px] text-sm italic">{orgSettings.address}</div>
                    <div className="p-2 border-b-2 border-black text-sm"><span className="font-bold">Contact:</span> {orgSettings.contactNumber}</div>
                    <div className="p-2 border-b-2 border-black text-sm"><span className="font-bold">GP Concern:</span> {gpConcern?.fullName || 'N/A'}</div>
                    <div className="p-2 text-sm"><span className="font-bold">Email:</span> {orgSettings.email}</div>
                </div>

                <div className="border-2 border-black h-fit">
                    <div className="flex border-b-2 border-black">
                        <div className="flex-1 p-2 border-r-2 border-black font-bold bg-gray-50 text-center">PO Number</div>
                        <div className="flex-1 p-2 text-center">{po.poNumber}</div>
                    </div>
                    <div className="flex border-b-2 border-black">
                        <div className="flex-1 p-2 border-r-2 border-black font-bold bg-gray-50 text-center">Date</div>
                        <div className="flex-1 p-2 text-center">{po.poDate}</div>
                    </div>
                    <div className="p-2 border-b-2 border-black font-bold bg-gray-100 text-center">Delivery Address</div>
                    <div className="p-4 min-h-[60px] text-sm text-center font-semibold">
                        {deliveryLocation?.name || demandNote?.deliveryPlace || 'As per instruction'}
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <table className="w-full border-collapse border-2 border-black">
                    <thead>
                        <tr className="bg-gray-100 text-sm">
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
                                <td className="border-2 border-black p-2">{item.particulars}</td>
                                <td className="border-2 border-black p-2 text-center">{item.quantity}</td>
                                <td className="border-2 border-black p-2 text-center">{item.unit}</td>
                                <td className="border-2 border-black p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                <td className="border-2 border-black p-2 text-right">{formatCurrency(item.totalPrice)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan={4} rowSpan={5} className="border-2 border-black align-top p-4 bg-gray-50/30 italic text-xs">Note: {po.comments || 'N/A'}</td>
                            <td className="border-2 border-black p-2 font-bold bg-gray-50 text-sm">Subtotal</td>
                            <td className="border-2 border-black p-2 text-right text-sm">{formatCurrency(po.totalAmount)}</td>
                        </tr>
                        <tr>
                            <td className="border-2 border-black p-2 font-bold bg-gray-50 text-sm">Discount</td>
                            <td className="border-2 border-black p-2 text-right text-sm text-red-600">-{formatCurrency(po.discountAmount)}</td>
                        </tr>
                        <tr>
                            <td className="border-2 border-black p-2 font-bold bg-gray-50 text-sm">Vat & Tax</td>
                            <td className="border-2 border-black p-2 text-right text-sm">{formatCurrency((po.vatAmount || 0) + (po.taxAmount || 0))}</td>
                        </tr>
                        <tr className="bg-gray-100">
                            <td className="border-2 border-black p-2 font-bold text-lg">Total</td>
                            <td className="border-2 border-black p-2 text-right font-bold text-lg">{formatCurrency(po.netPayableAmount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="space-y-6 mb-32">
                <div><h3 className="font-bold text-base underline mb-1">Expected Delivery</h3><p className="text-sm pl-4">{po.expectedDeliveryDate || 'Immediate'}</p></div>
                <div><h3 className="font-bold text-base underline mb-1">Delivery Terms</h3><p className="text-sm pl-4 whitespace-pre-wrap">{po.deliveryTerms || 'N/A'}</p></div>
                <div><h3 className="font-bold text-base underline mb-1">Other Terms</h3><div className="text-xs pl-4 space-y-2 opacity-80"><p className="whitespace-pre-wrap">{po.mandatoryTerms}</p><p className="whitespace-pre-wrap">{po.otherTerms}</p></div></div>
            </div>

            <div className="absolute bottom-12 left-8 right-8 flex justify-between items-start border-t pt-8">
                <div className="text-center w-48">
                    <div className="h-12 flex items-center justify-center">
                        {gpConcern?.signature && <Image src={gpConcern.signature} alt="Sig" width={100} height={40} className="object-contain" />}
                    </div>
                    <div className="border-t-2 border-black pt-2 mt-2">
                        <p className="font-bold text-sm truncate">{gpConcern?.fullName || 'N/A'}</p>
                        <p className="text-xs truncate">{gpConcernDesignation?.name || 'N/A'}</p>
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
                            <p className="text-xs truncate">{sig.designation?.name}</p>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1 text-center font-bold">{sig.title}</p>
                        <p className="text-[8px] text-muted-foreground text-center mt-0.5">{formatDateTime(sig.timestamp)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
