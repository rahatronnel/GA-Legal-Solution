
"use client";

import React from 'react';
import type { OrganizationSettings } from '@/app/settings/page';
import type { PaymentNote } from './pn-entry-form';
import type { MRR } from './mrr-entry-form';
import type { PurchaseOrder } from './po-entry-form';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PNPrintLayoutProps {
  pn: PaymentNote;
  mrr?: MRR;
  po?: PurchaseOrder;
  vendor?: Vendor;
  orgSettings: OrganizationSettings;
}

export const PNPrintLayout: React.FC<PNPrintLayoutProps> = ({ 
    pn, 
    mrr,
    po,
    vendor,
    orgSettings 
}) => {
    return (
        <div className="p-10 bg-white text-black font-serif min-h-[29.7cm] flex flex-col mx-auto max-w-[21cm] border-[1px] border-gray-100 shadow-none">
            {/* Header Section */}
            <div className="border-2 border-black grid grid-cols-[1.2fr_1.5fr] mb-4">
                <div className="p-4 border-r-2 border-black text-center flex flex-col justify-center bg-gray-50/50">
                    <h1 className="text-2xl font-black uppercase tracking-tighter leading-tight">{orgSettings.name || 'Organization Name'}</h1>
                    <p className="text-[9px] mt-1 italic leading-none opacity-80">{orgSettings.address}</p>
                </div>
                <div className="flex flex-col">
                    <div className="p-2 border-b-2 border-black text-center font-bold text-xs bg-gray-100">
                        শুধুমাত্র অভ্যন্তরীণ ব্যবহারের জন্য
                    </div>
                    <div className="p-2 text-center font-bold text-[11px] uppercase tracking-[0.2em] bg-white">
                        Internal Use Only
                    </div>
                </div>
            </div>

            {/* Title Section */}
            <div className="bg-gray-100/50 py-2 mb-6 border border-gray-300">
                <h2 className="text-2xl font-black text-center italic tracking-tight uppercase underline decoration-double underline-offset-4">Payment Note</h2>
            </div>

            {/* Serial & Date */}
            <div className="flex justify-between mb-6 text-[13px] font-bold">
                <div>Serial# <span className="ml-2 font-mono text-sm px-2 py-0.5 bg-gray-100 rounded border border-gray-200">{pn.pnNumber}</span></div>
                <div>Date: <span className="ml-2 underline underline-offset-4">{pn.date}</span></div>
            </div>

            {/* To/From Section */}
            <div className="space-y-1.5 mb-6 text-[13px] border-l-4 border-black pl-4">
                <div className="flex gap-12 items-baseline"><span className="font-black w-12 text-muted-foreground uppercase">TO:</span><span className="font-bold text-base">Accounts Department</span></div>
                <div className="flex gap-12 items-baseline"><span className="font-black w-12 text-muted-foreground uppercase">From:</span><span className="font-bold text-base">Purchase Department</span></div>
            </div>

            {/* Payable Amount Box */}
            <div className="space-y-2 mb-6">
                <p className="font-black uppercase text-[11px] tracking-widest text-muted-foreground">Payable Amount:</p>
                <div className="flex items-center gap-0">
                    <div className="border-2 border-black bg-gray-100 w-40 py-3 text-center font-black text-xl border-r-0">
                        BDT
                    </div>
                    <div className="flex-1 border-2 border-black py-3 text-2xl font-black px-6 bg-white">
                        {pn.amount?.toLocaleString()} <span className="text-sm font-normal">/-</span>
                    </div>
                </div>
            </div>

            {/* Amount in Word */}
            <div className="mb-8 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="font-black uppercase text-[11px] tracking-widest text-muted-foreground mb-2">Amount in words:</p>
                <div className="italic font-bold text-[15px] leading-snug">
                    " {pn.amountInWords} "
                </div>
            </div>

            {/* Body Text Section */}
            <div className="space-y-6 text-[14px] leading-relaxed text-center px-4">
                <p className="font-semibold text-gray-700">We will need to procure Goods / Services as per the endorsed requisition from:</p>
                
                <p className="text-2xl font-black underline decoration-2 underline-offset-8 uppercase tracking-tight text-primary">
                    {vendor?.vendorName || 'N/A'}
                </p>

                <div className="space-y-4 pt-2">
                    <p className="font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Under the agreed payment terms:</p>
                    <p className="italic font-bold text-lg border-b-2 border-black/10 pb-1 inline-block px-16 bg-gray-50">
                        {po?.paymentTerms || vendor?.paymentTerms || 'As per Agreement'}
                    </p>
                </div>

                <div className="flex justify-center items-center gap-3 pt-4">
                    <span className="font-bold">Mode of payment will be:</span>
                    <Badge variant="outline" className="border-black font-black uppercase text-sm px-4 py-1 h-auto rounded-none bg-gray-100 shadow-sm">
                        {pn.paymentMode}
                    </Badge>
                </div>

                <div className="space-y-2 pt-4">
                    <p className="font-medium">All necessary documents including the final Bill are enclosed herewith for your information and necessary action against:</p>
                    <p className="text-lg font-black tracking-tight bg-gray-50 inline-block px-4 py-1 border border-gray-200">
                        PO #{po?.poNumber || 'N/A'} & Date: {po?.poDate || 'N/A'}
                    </p>
                </div>

                <p className="font-bold text-base pt-4 border-t border-gray-100">
                    In this regard, you are requested to issue the <span className="underline decoration-2">{pn.paymentMode === 'AC Payee' ? 'Accounts Payee Cheque' : pn.paymentMode}</span> in favour of the above mentioned company.
                </p>
            </div>

            {/* Closing */}
            <div className="mt-8 space-y-1 text-sm font-bold">
                <p>Thanking you,</p>
                <p>Sincerely Yours,</p>
            </div>

            {/* Signatories - Pushed to bottom of A4 */}
            <div className="mt-auto pt-12 flex justify-between items-end">
                {[
                    { label: 'Prepared By', sub: 'GP Concern' },
                    { label: 'Checked By', sub: 'Purchase Manager' },
                    { label: 'Verified By', sub: 'Dept. Head / TA' },
                    { label: 'Authorized By', sub: 'Managing Director' }
                ].map((sig, idx) => (
                    <div key={idx} className="text-center w-[22%] group">
                        <div className="h-14 mb-1 transition-all group-hover:bg-gray-50 rounded"></div>
                        <div className="border-t-2 border-black pt-1.5 flex flex-col gap-0.5">
                            <span className="text-[11px] font-black uppercase tracking-tighter leading-none">{sig.label}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none">{sig.sub}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
