
"use client";

import React from 'react';
import type { OrganizationSettings } from '@/app/settings/page';
import type { PaymentNote } from './pn-entry-form';
import type { MRR } from './mrr-entry-form';
import type { PurchaseOrder } from './po-entry-form';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import { cn } from '@/lib/utils';

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
        <div className="p-8 bg-white text-black font-serif min-h-[29.7cm] flex flex-col mx-auto max-w-[21cm]">
            {/* Header Section */}
            <div className="border-2 border-black grid grid-cols-[1fr_1.5fr] mb-6">
                <div className="p-4 border-r-2 border-black text-center flex flex-col justify-center">
                    <h1 className="text-2xl font-bold uppercase tracking-tight">{orgSettings.name || 'Organization Name'}</h1>
                    <p className="text-[10px] mt-1 italic">{orgSettings.address}</p>
                </div>
                <div className="flex flex-col">
                    <div className="p-2 border-b-2 border-black text-center font-bold text-xs bg-gray-50">
                        শুধুমাত্র অভ্যন্তরীণ ব্যবহারের জন্য
                    </div>
                    <div className="p-2 text-center font-bold text-sm tracking-widest bg-white">
                        Internal Use Only
                    </div>
                </div>
            </div>

            {/* Title Section */}
            <div className="bg-gray-100 py-3 mb-8 border border-gray-300">
                <h2 className="text-2xl font-bold text-center italic">Payment Note.</h2>
            </div>

            {/* Serial & Date */}
            <div className="flex justify-between mb-8 text-sm font-bold">
                <div>Serial# <span className="ml-2 font-mono">{pn.pnNumber}</span></div>
                <div>Date: <span className="ml-2 underline">{pn.date}</span></div>
            </div>

            {/* To/From Section */}
            <div className="space-y-2 mb-8 text-sm">
                <div className="flex gap-12"><span className="font-bold w-12">TO:</span><span>Accounts Department.</span></div>
                <div className="flex gap-12"><span className="font-bold w-12">From:</span><span>Purchase Department</span></div>
            </div>

            {/* Payable Amount Box */}
            <div className="space-y-4 mb-8">
                <p className="font-bold text-sm">Payable Amount:</p>
                <div className="flex items-center gap-4">
                    <div className="border-2 border-black w-48 py-3 text-center font-black text-xl">
                        BDT
                    </div>
                    <div className="flex-1 border-b-2 border-black pb-1 text-lg font-bold px-4">
                        ( {pn.amount?.toLocaleString()} )
                    </div>
                </div>
            </div>

            {/* Amount in Word */}
            <div className="mb-12">
                <p className="font-bold text-sm mb-2">Amount in word:</p>
                <div className="border-b-4 border-double border-black pb-1 italic font-semibold px-4 text-sm">
                    "{pn.amountInWords}"
                </div>
            </div>

            {/* Body Text Section */}
            <div className="space-y-8 text-[15px] leading-loose text-center">
                <p className="font-bold">We Had to will need to Procure Goods/Service as per endorsed requisition from</p>
                
                <p className="text-xl font-black underline decoration-2 underline-offset-8 uppercase">
                    ({vendor?.vendorName || 'N/A'})
                </p>

                <p className="font-bold uppercase tracking-widest text-sm">Under the payment terms:</p>

                <p className="italic font-bold text-lg border-b border-black/20 pb-2 inline-block px-12">
                    ({po?.paymentTerms || vendor?.paymentTerms || 'As per Agreement'})
                </p>

                <div className="flex justify-center items-baseline gap-2">
                    <span className="font-bold">& Mod of payment will be</span>
                    <div className="text-center px-4">
                        <Badge variant="outline" className="border-black font-black uppercase text-[10px] h-5 mb-1">{pn.paymentMode}</Badge>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase leading-none">(Mod of Payment)</p>
                    </div>
                    <span className="font-bold">. All neessery documents Including Bill are enclosed herewith for</span>
                </div>
                <p className="font-bold">your kind information & nesserry action against</p>

                <p className="text-lg font-black tracking-tight">
                    PO ({po?.poNumber || 'N/A'}) & Date ({po?.poDate || 'N/A'}),
                </p>

                <p className="font-bold pt-4">
                    In this regard, you are requested to Issue and ( {pn.paymentMode === 'AC Payee' ? 'Accounts Payee Cheque' : pn.paymentMode} ) in Favour of
                </p>
                <p className="font-black text-lg underline decoration-1 underline-offset-4">Above Mentioned Company.</p>
            </div>

            {/* Closing */}
            <div className="mt-16 space-y-8">
                <p className="font-bold">Thanking you,</p>
                <p className="font-bold">Sincerely Yours,</p>
            </div>

            {/* Signatories */}
            <div className="mt-auto pt-16 flex justify-between items-end border-t border-transparent">
                {['Signatory 1', 'Signatory 2', 'Signatory 3', 'Signatory 4'].map((label, idx) => (
                    <div key={idx} className="text-center w-1/5">
                        <div className="h-12"></div>
                        <div className="border-t-2 border-black pt-1 text-[10px] font-black uppercase tracking-tighter">
                            {label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
