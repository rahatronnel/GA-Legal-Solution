"use client";

import React from 'react';
import type { OrganizationSettings } from '@/app/settings/page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MRR } from './mrr-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Designation } from '@/app/user-management/components/designation-table';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MRRPrintLayoutProps {
  mrr: MRR;
  employees: Employee[];
  designations: Designation[];
  orgSettings: OrganizationSettings;
}

export const MRRPrintLayout: React.FC<MRRPrintLayoutProps> = ({ 
    mrr, 
    employees, 
    designations, 
    orgSettings 
}) => {
    const formatCurrency = (amount: number | undefined) => 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

    const preparer = employees.find(e => e.id === mrr.createdBy);
    const preparerDesignation = designations.find(d => d.id === preparer?.designationId);
    
    const formatDateTime = (ts: string | undefined) => {
        if (!ts) return '';
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

    // Extract signatures from history
    const approvers = mrr.approvalHistory
        ?.filter(h => h.status === 'Approved')
        .map(h => {
            const employee = employees.find(e => e.id === h.approverId);
            const designation = designations.find(d => d.id === employee?.designationId);
            return { ...h, employee, designation };
        }) || [];

    return (
        <div className="p-6 bg-white text-black font-sans min-h-[29.7cm] flex flex-col border-2 border-black m-4">
            {/* Header Section */}
            <div className="grid grid-cols-[1fr_1.5fr] border-b-2 border-black overflow-hidden">
                <div className="p-4 border-r-2 border-black flex flex-col justify-center items-center text-center">
                    <h1 className="text-3xl font-black uppercase tracking-tight">{orgSettings.name}</h1>
                    <p className="text-sm mt-1">{orgSettings.address}</p>
                </div>
                <div className="flex flex-col">
                    <div className="flex-1 p-2 flex justify-between items-center text-[10px] border-b-2 border-black px-4 italic">
                        <span className="font-bold text-base">শুধুমাত্র অভ্যন্তরীণ ব্যবহারের জন্য</span>
                        <div className="text-right">
                            <p>for internal use only</p>
                            <p>only</p>
                        </div>
                    </div>
                    <div className="flex-1 p-3 flex justify-center items-center">
                        <h2 className="text-xl font-bold uppercase">Material Receiving Report (MRR)</h2>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-4 text-xs">
                <div className="flex justify-between border-b border-black/20 pb-1">
                    <span className="font-bold">Department:</span>
                    <span>{mrr.departmentName}</span>
                </div>
                <div className="flex justify-between border-b border-black/20 pb-1">
                    <span className="font-bold">SL No:</span>
                    <span className="font-mono">{mrr.mrrNumber}</span>
                </div>
                <div className="flex justify-between border-b border-black/20 pb-1">
                    <span className="font-bold">Section:</span>
                    <span>{mrr.sectionName}</span>
                </div>
                <div className="flex justify-between border-b border-black/20 pb-1">
                    <span className="font-bold">Material Receiving Date:</span>
                    <span>{mrr.receivingDate}</span>
                </div>
                <div className="flex justify-between border-b border-black/20 pb-1">
                    <span className="font-bold">Name of Supplier:</span>
                    <span>{mrr.supplierName}</span>
                </div>
                <div className="flex justify-between border-b border-black/20 pb-1">
                    <span className="font-bold">MRR Issue Date:</span>
                    <span>{mrr.MRR_IssueDate}</span>
                </div>
                <div className="flex justify-between border-b border-black/20 pb-1">
                    <span className="font-bold">Address/Origin:</span>
                    <span>{mrr.supplierAddress}</span>
                </div>
                <div className="flex justify-between border-b border-black/20 pb-1">
                    <span className="font-bold">Shipment Type:</span>
                    <span>{mrr.shipmentType}</span>
                </div>
                <div className="flex justify-between border-b border-black/20 pb-1">
                    <span className="font-bold">Container No:</span>
                    <span>{mrr.containerNo || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-black/20 pb-1">
                    <span className="font-bold">Container Size:</span>
                    <span>{mrr.containerSize || 'N/A'}</span>
                </div>
            </div>

            {/* Item Table */}
            <div className="flex-grow mt-4">
                <table className="w-full border-collapse border-2 border-black text-[10px]">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border-2 border-black p-2 text-center w-10">Sl No</th>
                            <th className="border-2 border-black p-2 text-left">Invoice Number</th>
                            <th className="border-2 border-black p-2 text-left">DN Number</th>
                            <th className="border-2 border-black p-2 text-left">Challan Number</th>
                            <th className="border-2 border-black p-2 text-left">Material/Item Name</th>
                            <th className="border-2 border-black p-2 text-center">Receive Quantity</th>
                            <th className="border-2 border-black p-2 text-center">Unit</th>
                            <th className="border-2 border-black p-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mrr.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="border-2 border-black p-2 text-center">{idx + 1}</td>
                                <td className="border-2 border-black p-2">{mrr.invoiceNumber}</td>
                                <td className="border-2 border-black p-2">{mrr.demandNoteNumber}</td>
                                <td className="border-2 border-black p-2">{mrr.challanNumber}</td>
                                <td className="border-2 border-black p-2">
                                    <p className="font-bold">{item.particulars}</p>
                                    {item.description && <p className="text-[8px] italic">{item.description}</p>}
                                </td>
                                <td className="border-2 border-black p-2 text-center">{item.receivedQty}</td>
                                <td className="border-2 border-black p-2 text-center">{item.unit}</td>
                                <td className="border-2 border-black p-2 text-right font-mono">{formatCurrency(item.amount)}</td>
                            </tr>
                        ))}
                        {/* Fill empty rows to maintain structure if few items */}
                        {Array.from({ length: Math.max(0, 8 - mrr.items.length) }).map((_, i) => (
                            <tr key={`empty-${i}`} className="h-8">
                                <td className="border-2 border-black p-2"></td>
                                <td className="border-2 border-black p-2"></td>
                                <td className="border-2 border-black p-2"></td>
                                <td className="border-2 border-black p-2"></td>
                                <td className="border-2 border-black p-2"></td>
                                <td className="border-2 border-black p-2"></td>
                                <td className="border-2 border-black p-2"></td>
                                <td className="border-2 border-black p-2 text-right"></td>
                            </tr>
                        ))}
                        <tr className="bg-gray-100 font-bold">
                            <td colSpan={7} className="border-2 border-black p-2 text-right uppercase tracking-wider">Grand Total Amount</td>
                            <td className="border-2 border-black p-2 text-right font-mono text-base">{formatCurrency(mrr.totalAmount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Conditions Section */}
            <div className="grid grid-cols-2 gap-8 p-4 mt-4 border-2 border-black text-xs font-bold bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <span>Goods Condition:</span>
                    <div className="flex gap-4">
                        <span className={cn(mrr.goodsCondition === 'Ok' ? "underline decoration-2" : "opacity-30")}>OK</span>
                        <span>-</span>
                        <span className={cn(mrr.goodsCondition === 'Not Ok' ? "underline decoration-2 text-red-600" : "opacity-30")}>Not OK</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span>Package Condition:</span>
                    <div className="flex gap-4">
                        <span className="opacity-30">Wet Box</span>
                        <span>-</span>
                        <span className={cn(mrr.packageCondition === 'Not Ok' ? "underline decoration-2 text-red-600" : "opacity-30")}>Broken Box</span>
                        <span>-</span>
                        <span className={cn(mrr.packageCondition === 'Ok' ? "underline decoration-2" : "opacity-30")}>Others (Intact)</span>
                    </div>
                </div>
            </div>

            {/* Signature Section */}
            <div className="mt-12">
                <p className="text-right text-xs font-bold mb-4 uppercase tracking-widest mr-4">Respective (C&F and Others)</p>
                <div className="grid grid-cols-5 gap-x-2 gap-y-12">
                    {/* Prepared By */}
                    <div className="text-center">
                        <div className="h-10 flex items-center justify-center">
                            {preparer?.signature && <Image src={preparer.signature} alt="Sig" width={80} height={30} className="object-contain" />}
                        </div>
                        <div className="border-t border-black pt-1">
                            <p className="text-[10px] font-bold truncate">{preparer?.fullName || 'N/A'}</p>
                            <p className="text-[8px] text-gray-600 uppercase">Prepared By</p>
                            <p className="text-[7px] text-gray-400">{formatDateTime(mrr.createdAt)}</p>
                        </div>
                    </div>

                    {/* Approvers Grid */}
                    {Array.from({ length: 19 }).map((_, i) => {
                        const approver = approvers[i];
                        return (
                            <div key={i} className="text-center">
                                <div className="h-10 flex items-center justify-center">
                                    {approver?.employee?.signature && <Image src={approver.employee.signature} alt="Sig" width={80} height={30} className="object-contain" />}
                                </div>
                                <div className="border-t border-black pt-1">
                                    <p className="text-[10px] font-bold truncate">{approver?.employee?.fullName || ''}</p>
                                    <p className="text-[8px] text-gray-600 uppercase">Signatory-{i + 1}</p>
                                    <p className="text-[7px] text-gray-400">{approver ? formatDateTime(approver.timestamp) : ''}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};