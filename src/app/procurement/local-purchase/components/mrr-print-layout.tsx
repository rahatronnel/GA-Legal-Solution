"use client";

import React from 'react';
import type { OrganizationSettings } from '@/app/settings/page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MRR } from './mrr-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Designation } from '@/app/user-management/components/designation-table';
import { cn, numberToWords } from '@/lib/utils';
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

    const approvers = mrr.approvalHistory
        ?.filter(h => h.status === 'Approved')
        .map(h => {
            const employee = employees.find(e => e.id === h.approverId);
            const designation = designations.find(d => d.id === employee?.designationId);
            const step = mrr.approvalFlow?.steps?.[h.level];
            return { ...h, employee, designation, title: step?.stepName || 'Approved By' };
        }) || [];

    return (
        <div className="p-6 bg-white text-black font-sans min-h-[29.7cm] flex flex-col border-2 border-black m-4">
            <div className="grid grid-cols-[1fr_1.5fr] border-b-2 border-black overflow-hidden">
                <div className="p-4 border-r-2 border-black flex flex-col justify-center items-center text-center bg-gray-50">
                    <h1 className="text-2xl font-black uppercase tracking-tight">{orgSettings.name}</h1>
                    <p className="text-[9px] mt-1 opacity-70">{orgSettings.address}</p>
                </div>
                <div className="flex flex-col">
                    <div className="flex-1 p-2 flex justify-between items-center text-[10px] border-b-2 border-black px-4 italic bg-gray-100">
                        <span className="font-bold text-sm">শুধুমাত্র অভ্যন্তরীণ ব্যবহারের জন্য</span>
                        <div className="text-right">
                            <p>for internal use only</p>
                        </div>
                    </div>
                    <div className="flex-1 p-3 flex justify-center items-center">
                        <h2 className="text-xl font-black uppercase tracking-widest">Material Receiving Report (MRR)</h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 p-4 text-xs">
                <div className="flex justify-between border-b border-black/20 pb-1"><span className="font-bold uppercase tracking-tighter">Department:</span><span className="font-semibold">{mrr.departmentName}</span></div>
                <div className="flex justify-between border-b border-black/20 pb-1"><span className="font-bold uppercase tracking-tighter">MRR Number:</span><span className="font-mono font-bold text-sm">{mrr.mrrNumber}</span></div>
                <div className="flex justify-between border-b border-black/20 pb-1"><span className="font-bold uppercase tracking-tighter">Section:</span><span className="font-semibold">{mrr.sectionName}</span></div>
                <div className="flex justify-between border-b border-black/20 pb-1"><span className="font-bold uppercase tracking-tighter">Receiving Date:</span><span>{mrr.receivingDate}</span></div>
                <div className="flex justify-between border-b border-black/20 pb-1"><span className="font-bold uppercase tracking-tighter">Name of Supplier:</span><span className="font-bold">{mrr.supplierName}</span></div>
                <div className="flex justify-between border-b border-black/20 pb-1"><span className="font-bold uppercase tracking-tighter">MRR Issue Date:</span><span>{mrr.MRR_IssueDate}</span></div>
                <div className="flex justify-between border-b border-black/20 pb-1"><span className="font-bold uppercase tracking-tighter">Address/Origin:</span><span className="text-[10px] italic truncate ml-4">{mrr.supplierAddress}</span></div>
                <div className="flex justify-between border-b border-black/20 pb-1"><span className="font-bold uppercase tracking-tighter">Shipment Type:</span><span className="font-bold text-primary">{mrr.shipmentType}</span></div>
            </div>

            <div className="mt-4">
                <table className="w-full border-collapse border-2 border-black text-[10px]">
                    <thead>
                        <tr className="bg-gray-100 uppercase tracking-tighter font-bold">
                            <th className="border-2 border-black p-2 text-center w-10">Sl No</th>
                            <th className="border-2 border-black p-2 text-left">Invoice No</th>
                            <th className="border-2 border-black p-2 text-left">DN Number</th>
                            <th className="border-2 border-black p-2 text-left">Material / Item Name</th>
                            <th className="border-2 border-black p-2 text-center">Qty</th>
                            <th className="border-2 border-black p-2 text-center">Unit</th>
                            <th className="border-2 border-black p-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mrr.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="border-2 border-black p-2 text-center font-bold">{idx + 1}</td>
                                <td className="border-2 border-black p-2">{mrr.invoiceNumber}</td>
                                <td className="border-2 border-black p-2 font-mono">{mrr.demandNoteNumber}</td>
                                <td className="border-2 border-black p-2">
                                    <p className="font-bold">{item.particulars}</p>
                                    {item.description && <p className="text-[8px] italic opacity-70">Des: {item.description}</p>}
                                </td>
                                <td className="border-2 border-black p-2 text-center font-bold">{item.receivedQty}</td>
                                <td className="border-2 border-black p-2 text-center">{item.unit}</td>
                                <td className="border-2 border-black p-2 text-right font-mono">{formatCurrency(item.amount)}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-100 font-black">
                            <td colSpan={6} className="border-2 border-black p-2 text-right uppercase tracking-wider">Grand Total Value</td>
                            <td className="border-2 border-black p-2 text-right font-mono text-base underline underline-offset-4 decoration-double">{formatCurrency(mrr.totalAmount)}</td>
                        </tr>
                    </tbody>
                </table>
                <div className="mt-2 p-3 border-2 border-black bg-gray-50 text-[10px] flex gap-2">
                    <span className="font-bold uppercase">Amount in Words: </span>
                    <span className="italic font-bold text-sm">"{numberToWords(mrr.totalAmount || 0)}"</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 p-4 mt-4 border-2 border-black text-xs font-bold bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <span className="uppercase tracking-tighter">Goods Condition:</span>
                    <div className="flex gap-4">
                        <span className={cn(mrr.goodsCondition === 'Ok' ? "underline decoration-2 text-green-700" : "opacity-30")}>✅ OK</span>
                        <span className={cn(mrr.goodsCondition === 'Not Ok' ? "underline decoration-2 text-red-600" : "opacity-30")}>❌ Not OK</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="uppercase tracking-tighter">Package Condition:</span>
                    <div className="flex gap-4">
                        <span className={cn(mrr.packageCondition === 'Ok' ? "underline decoration-2 text-green-700" : "opacity-30")}>✅ Intact</span>
                        <span className={cn(mrr.packageCondition === 'Not Ok' ? "underline decoration-2 text-red-600" : "opacity-30")}>❌ Broken</span>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-8">
                <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="h-10 flex items-center justify-center">
                            {preparer?.signature && <Image src={preparer.signature} alt="Sig" width={80} height={30} className="object-contain" />}
                        </div>
                        <div className="border-t-2 border-black pt-1">
                            <p className="text-[9px] font-bold truncate">{preparer?.fullName || 'N/A'}</p>
                            <p className="text-[8px] text-gray-600 uppercase font-black">Prepared By</p>
                            <p className="text-[7px] text-gray-400">{formatDateTime(mrr.createdAt)}</p>
                        </div>
                    </div>
                    {approvers.map((sig, i) => (
                        <div key={i} className="text-center">
                            <div className="h-10 flex items-center justify-center">
                                {sig.employee?.signature && <Image src={sig.employee.signature} alt="Sig" width={80} height={30} className="object-contain" />}
                            </div>
                            <div className="border-t-2 border-black pt-1">
                                <p className="text-[9px] font-bold truncate">{sig.employee?.fullName}</p>
                                <p className="text-[8px] text-gray-600 uppercase font-black">{sig.title}</p>
                                <p className="text-[7px] text-gray-400">{formatDateTime(sig.timestamp)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};