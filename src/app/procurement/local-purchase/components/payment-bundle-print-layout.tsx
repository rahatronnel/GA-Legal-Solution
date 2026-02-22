
"use client";

import React from 'react';
import Image from 'next/image';
import type { OrganizationSettings } from '@/app/settings/page';
import type { PaymentNote } from './pn-entry-form';
import type { MRR } from './mrr-entry-form';
import type { PurchaseOrder } from './po-entry-form';
import type { DemandNote } from './demand-note-entry-form';
import type { ComparativeStatement } from './cs-entry-form';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Designation } from '@/app/user-management/components/designation-table';
import type { DeliveryPlace } from './delivery-place-table';
import type { BillItemMaster } from '@/app/billflow/components/bill-item-master-table';
import type { Section } from '@/app/user-management/components/section-table';
import type { ProcessCode } from './process-code-table';
import type { DemandType } from './demand-type-table';

import { PNPrintLayout } from './pn-print-layout';
import { MRRPrintLayout } from './mrr-print-layout';
import { POPrintLayout } from './po-print-layout';
import { CSPrintLayout } from './cs-print-layout';
import { DemandNotePrintLayout } from './demand-note-print-layout';

const BundlePageWrapper: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
    <div className="page-break bg-white overflow-hidden" style={{ minHeight: '29.7cm' }}>
        <div className="print-only-title text-[8px] text-muted-foreground opacity-30 text-right px-8 pt-4 uppercase font-black tracking-widest">{title}</div>
        {children}
    </div>
);

const UploadedDocumentPage: React.FC<{ file: { name: string; file: string }; label: string; orgSettings: OrganizationSettings }> = ({ file, label, orgSettings }) => (
    <div className="page-break bg-white p-8 h-[29.7cm] flex flex-col border-2 border-black m-4">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-center">
            <div>
                <h1 className="text-xl font-black uppercase">{orgSettings.name}</h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Uploaded Evidence Vault</p>
            </div>
            <div className="text-right">
                <h2 className="text-lg font-black uppercase text-primary">{label}</h2>
                <p className="text-[9px] italic">{file.name}</p>
            </div>
        </div>
        <div className="flex-grow flex items-center justify-center relative border-4 border-dashed border-muted bg-muted/5 rounded-2xl overflow-hidden">
            {file.file.startsWith('data:image/') ? (
                <Image src={file.file} alt={label} layout="fill" className="object-contain p-4" />
            ) : (
                <div className="text-center p-12">
                    <p className="text-lg font-bold">Document Attachment</p>
                    <p className="text-sm text-muted-foreground italic">Non-image file (PDF/Other) detected. Please refer to the digital system for full interactive preview.</p>
                </div>
            )}
        </div>
        <div className="mt-6 pt-4 border-t border-black/10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
            YKK ERP Solution • Secure Organizational Evidence
        </div>
    </div>
);

interface PaymentBundlePrintLayoutProps {
  pn: PaymentNote;
  mrr: MRR;
  po: PurchaseOrder;
  cs: ComparativeStatement;
  dn: DemandNote;
  vendors: Vendor[];
  employees: Employee[];
  designations: Designation[];
  deliveryPlaces: DeliveryPlace[];
  billItemMasters: BillItemMaster[];
  sections: Section[];
  processCodes: ProcessCode[];
  demandTypes: DemandType[];
  orgSettings: OrganizationSettings;
}

export const PaymentBundlePrintLayout: React.FC<PaymentBundlePrintLayoutProps> = ({
    pn, mrr, po, cs, dn, vendors, employees, designations, deliveryPlaces, billItemMasters, sections, processCodes, demandTypes, orgSettings
}) => {
    const vendor = vendors.find(v => v.id === po.vendorId);
    const department = sections.find(s => s.id === dn.departmentId);
    const processCode = processCodes.find(p => p.id === dn.processCodeId);
    const demandType = demandTypes.find(t => t.id === dn.demandTypeId);
    const deliveryPlace = deliveryPlaces.find(p => p.id === dn.deliveryPlace);

    return (
        <div className="payment-bundle-container bg-muted/5">
            {/* 1. Payment Note */}
            <BundlePageWrapper title="Stage 1: Payment Instruction">
                <PNPrintLayout pn={pn} mrr={mrr} po={po} vendor={vendor} employees={employees} designations={designations} orgSettings={orgSettings} />
            </BundlePageWrapper>

            {/* 2. Supplier Invoice (From MRR documents or PO uploads) */}
            {(mrr.documents?.bill || po.documents?.invoice || []).map((file, i) => (
                <UploadedDocumentPage key={`inv-${i}`} file={file} label="Supplier Invoice / Bill" orgSettings={orgSettings} />
            ))}

            {/* 3. MRR */}
            <BundlePageWrapper title="Stage 3: Logistics Audit (MRR)">
                <MRRPrintLayout mrr={mrr} employees={employees} designations={designations} orgSettings={orgSettings} />
            </BundlePageWrapper>

            {/* 4. Supplier Challan */}
            {(mrr.documents?.challan || po.documents?.challan || []).map((file, i) => (
                <UploadedDocumentPage key={`chal-${i}`} file={file} label="Delivery Challan" orgSettings={orgSettings} />
            ))}

            {/* 5. Mushok (VAT) */}
            {(po.documents?.mushok || []).map((file, i) => (
                <UploadedDocumentPage key={`vat-${i}`} file={file} label="Mushok (VAT) Document" orgSettings={orgSettings} />
            ))}

            {/* 6. Purchase Order */}
            <BundlePageWrapper title="Stage 6: Formal Contract (PO)">
                <POPrintLayout po={po} demandNote={dn} vendor={vendor} employees={employees} designations={designations} deliveryPlaces={deliveryPlaces} orgSettings={orgSettings} />
            </BundlePageWrapper>

            {/* 7. Comparative Statement */}
            <BundlePageWrapper title="Stage 7: Sourcing Analysis (CS)">
                <CSPrintLayout cs={cs} demandNote={dn} vendors={vendors} employees={employees} designations={designations} orgSettings={orgSettings} />
            </BundlePageWrapper>

            {/* 8. Demand Note */}
            <BundlePageWrapper title="Stage 8: Intent Origin (DN)">
                <DemandNotePrintLayout 
                    demandNote={dn} 
                    creator={employees.find(e => e.id === dn.createdBy)} 
                    department={department} 
                    processCode={processCode} 
                    demandType={demandType} 
                    deliveryPlace={deliveryPlace} 
                    billItemMasters={billItemMasters} 
                    employees={employees} 
                    designations={designations} 
                    orgSettings={orgSettings} 
                />
            </BundlePageWrapper>

            {/* 9. Vendor Quotations */}
            {(dn.quotations || []).map((q, i) => {
                const v = vendors.find(v => v.id === q.vendorId);
                return (
                    <UploadedDocumentPage 
                        key={`quote-${i}`} 
                        file={{ name: q.fileName, file: q.fileDataUrl }} 
                        label={`Quotation: ${v?.vendorName || 'Vendor'}`} 
                        orgSettings={orgSettings} 
                    />
                );
            })}
        </div>
    );
};
