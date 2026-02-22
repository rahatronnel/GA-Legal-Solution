
"use client";

import React from 'react';
import Image from 'next/image';
import type { OrganizationSettings } from '@/app/settings/page';
import type { PaymentNote } from './pn-entry-form';
import type { MRR } from './mrr-entry-form';
import type { PurchaseOrder } from './po-entry-form';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Designation } from '@/app/user-management/components/designation-table';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PNPrintLayoutProps {
  pn: PaymentNote;
  mrr?: MRR;
  po?: PurchaseOrder;
  vendor?: Vendor;
  employees: Employee[];
  designations: Designation[];
  orgSettings: OrganizationSettings;
}

export const PNPrintLayout: React.FC<PNPrintLayoutProps> = ({ 
    pn, 
    mrr,
    po,
    vendor,
    employees,
    designations,
    orgSettings 
}) => {
    // Helper to find employee and designation info
    const getEmployeeDetails = (empId?: string) => {
        const emp = employees.find(e => e.id === empId);
        const des = designations.find(d => d.id === emp?.designationId);
        return { emp, des };
    };

    const preparer = getEmployeeDetails(pn.createdBy);
    
    // Find the Purchase Manager approval from history
    const checkerHistory = pn.approvalHistory?.find(h => h.status === 'Approved');
    const checker = getEmployeeDetails(checkerHistory?.approverId);

    const formatDateTime = (ts?: string) => {
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
        } catch {
            return ts;
        }
    };

    return (
        <div className="p-8 bg-white text-black font-serif h-[29.7cm] w-[21cm] flex flex-col mx-auto overflow-hidden border-none shadow-none">
            {/* Header Section */}
            <div className="border-2 border-black grid grid-cols-[1.2fr_1.5fr] mb-3">
                <div className="p-3 border-r-2 border-black text-center flex flex-col justify-center bg-gray-50/50">
                    <h1 className="text-xl font-black uppercase tracking-tighter leading-tight">{orgSettings.name || 'Organization Name'}</h1>
                    <p className="text-[8px] mt-0.5 italic leading-none opacity-80">{orgSettings.address}</p>
                </div>
                <div className="flex flex-col">
                    <div className="p-1.5 border-b-2 border-black text-center font-bold text-[10px] bg-gray-100">
                        শুধুমাত্র অভ্যন্তরীণ ব্যবহারের জন্য
                    </div>
                    <div className="p-1.5 text-center font-bold text-[10px] uppercase tracking-[0.2em] bg-white">
                        Internal Use Only
                    </div>
                </div>
            </div>

            {/* Title Section */}
            <div className="bg-gray-100/50 py-1.5 mb-4 border border-gray-300">
                <h2 className="text-xl font-black text-center italic tracking-tight uppercase underline decoration-double underline-offset-4">Payment Note</h2>
            </div>

            {/* Serial & Date */}
            <div className="flex justify-between mb-4 text-[12px] font-bold">
                <div>Serial# <span className="ml-2 font-mono text-xs px-2 py-0.5 bg-gray-100 rounded border border-gray-200">{pn.pnNumber}</span></div>
                <div>Date: <span className="ml-2 underline underline-offset-4">{pn.date}</span></div>
            </div>

            {/* To/From Section */}
            <div className="space-y-1 mb-4 text-[12px] border-l-4 border-black pl-4">
                <div className="flex gap-12 items-baseline"><span className="font-black w-10 text-muted-foreground uppercase text-[10px]">TO:</span><span className="font-bold text-sm">Accounts Department</span></div>
                <div className="flex gap-12 items-baseline"><span className="font-black w-10 text-muted-foreground uppercase text-[10px]">From:</span><span className="font-bold text-sm">Purchase Department</span></div>
            </div>

            {/* Payable Amount Box */}
            <div className="space-y-1 mb-4">
                <p className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Payable Amount:</p>
                <div className="flex items-center gap-0">
                    <div className="border-2 border-black bg-gray-100 w-32 py-2 text-center font-black text-lg border-r-0">
                        BDT
                    </div>
                    <div className="flex-1 border-2 border-black py-2 text-xl font-black px-6 bg-white">
                        {pn.amount?.toLocaleString()} <span className="text-sm font-normal">/-</span>
                    </div>
                </div>
            </div>

            {/* Amount in Word */}
            <div className="mb-5 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="font-black uppercase text-[9px] tracking-widest text-muted-foreground mb-1">Amount in words:</p>
                <div className="italic font-bold text-[14px] leading-snug">
                    " {pn.amountInWords} "
                </div>
            </div>

            {/* Body Text Section */}
            <div className="space-y-4 text-[13px] leading-relaxed text-center px-4">
                <p className="font-semibold text-gray-700">We will need to procure Goods / Services as per the endorsed requisition from:</p>
                
                <p className="text-xl font-black underline decoration-2 underline-offset-4 uppercase tracking-tight text-primary">
                    {vendor?.vendorName || 'N/A'}
                </p>

                <div className="space-y-2 pt-1">
                    <p className="font-black uppercase tracking-[0.2em] text-[9px] text-muted-foreground">Under the agreed payment terms:</p>
                    <p className="italic font-bold text-base border-b border-black/10 pb-0.5 inline-block px-12 bg-gray-50">
                        {po?.paymentTerms || vendor?.paymentTerms || 'As per Agreement'}
                    </p>
                </div>

                <div className="flex justify-center items-center gap-2 pt-2">
                    <span className="font-bold">Mode of payment will be:</span>
                    <Badge variant="outline" className="border-black font-black uppercase text-[10px] px-3 py-0.5 h-auto rounded-none bg-gray-100 shadow-sm">
                        {pn.paymentMode}
                    </Badge>
                </div>

                <div className="space-y-1 pt-2">
                    <p className="font-medium text-[11px]">All necessary documents including the final Bill are enclosed herewith for your information and necessary action against:</p>
                    <p className="text-base font-black tracking-tight bg-gray-50 inline-block px-3 py-0.5 border border-gray-200">
                        PO #{po?.poNumber || 'N/A'} & Date: {po?.poDate || 'N/A'}
                    </p>
                </div>

                <p className="font-bold text-sm pt-2 border-t border-gray-100">
                    In this regard, you are requested to issue the <span className="underline decoration-2">{pn.paymentMode === 'AC Payee' ? 'Accounts Payee Cheque' : pn.paymentMode}</span> in favour of the above mentioned company.
                </p>
            </div>

            {/* Closing */}
            <div className="mt-4 space-y-0.5 text-xs font-bold">
                <p>Thanking you,</p>
                <p>Sincerely Yours,</p>
            </div>

            {/* Signatories - Redefined for two pillars with full details */}
            <div className="mt-auto pt-8 flex justify-around items-end">
                {/* Prepared By Pillar */}
                <div className="text-center w-[40%] flex flex-col items-center">
                    <div className="h-16 flex items-center justify-center mb-1">
                        {preparer.emp?.signature ? (
                            <Image src={preparer.emp.signature} alt="Preparer Signature" width={120} height={50} className="object-contain" />
                        ) : (
                            <div className="h-12"></div>
                        )}
                    </div>
                    <div className="w-full border-t border-black pt-2 flex flex-col gap-0.5">
                        <span className="text-[11px] font-black uppercase tracking-tight">{preparer.emp?.fullName || 'N/A'}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{preparer.des?.name || 'GP Concern'}</span>
                        <span className="text-[10px] font-black uppercase mt-1">Prepared By</span>
                        <span className="text-[8px] font-bold text-muted-foreground">{formatDateTime(pn.createdAt)}</span>
                    </div>
                </div>

                {/* Checked By Pillar */}
                <div className="text-center w-[40%] flex flex-col items-center">
                    <div className="h-16 flex items-center justify-center mb-1">
                        {checker.emp?.signature ? (
                            <Image src={checker.emp.signature} alt="Checker Signature" width={120} height={50} className="object-contain" />
                        ) : (
                            <div className="h-12"></div>
                        )}
                    </div>
                    <div className="w-full border-t border-black pt-2 flex flex-col gap-0.5">
                        <span className="text-[11px] font-black uppercase tracking-tight">{checker.emp?.fullName || (checkerHistory ? 'N/A' : 'Pending...')}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{checker.des?.name || 'Purchase Manager'}</span>
                        <span className="text-[10px] font-black uppercase mt-1">Checked By</span>
                        {checkerHistory && (
                            <span className="text-[8px] font-bold text-muted-foreground">{formatDateTime(checkerHistory.timestamp)}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
