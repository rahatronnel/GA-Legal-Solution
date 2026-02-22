"use client";

import React, { useState, useEffect } from 'react';
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

/**
 * BundlePageWrapper - Enforces strict A4 geometry for the print stream.
 */
const BundlePageWrapper: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
    <div className="page-break bg-white overflow-hidden w-[21cm] h-[29.7cm] mx-auto relative shadow-none border-none">
        <div className="print-only-title text-[8px] text-muted-foreground opacity-30 text-right px-8 pt-4 uppercase font-black tracking-widest absolute top-0 right-0 z-50">{title}</div>
        {children}
    </div>
);

/**
 * PdfMultiPageRenderer - Decomposes a multi-page PDF into individual A4 pages for the print bundle.
 */
const PdfMultiPageRenderer: React.FC<{ file: string; label: string; orgSettings: OrganizationSettings }> = ({ file, label, orgSettings }) => {
    const [pages, setPages] = useState<string[]>([]);

    useEffect(() => {
        const renderPdf = async () => {
            if (typeof window === 'undefined') return;
            try {
                // High-Fidelity PDF decompose using CDN worker for zero-config stability
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
                
                const loadingTask = pdfjsLib.getDocument(file);
                const pdf = await loadingTask.promise;
                const pageImages: string[] = [];
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 }); // High-density rendering for legibility
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    
                    if (context) {
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        await page.render({ canvasContext: context, viewport }).promise;
                        pageImages.push(canvas.toDataURL('image/jpeg', 0.8));
                    }
                }
                setPages(pageImages);
            } catch (err) {
                console.error("Critical PDF Rendering Failure:", err);
            }
        };
        renderPdf();
    }, [file]);

    return (
        <>
            {pages.map((imgData, index) => (
                <div key={index} className="page-break bg-white p-8 w-[21cm] h-[29.7cm] flex flex-col border-2 border-black mx-auto overflow-hidden">
                    <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-center shrink-0">
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tighter">{orgSettings.name}</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Secure Evidence Vault</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-lg font-black uppercase text-primary italic underline underline-offset-4">{label} - Page {index + 1}</h2>
                        </div>
                    </div>
                    
                    <div className="flex-grow flex items-center justify-center relative bg-gray-50/50 border-4 border-dashed border-gray-200 rounded-2xl overflow-hidden p-4">
                        <img 
                            src={imgData} 
                            alt={`${label} page ${index + 1}`} 
                            className="max-w-full max-h-full object-contain shadow-2xl" 
                        />
                    </div>

                    <div className="mt-6 pt-4 border-t border-black/10 text-center shrink-0">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">YKK ERP Solution • Organizational Full-Set Bundle</p>
                    </div>
                </div>
            ))}
        </>
    );
};

/**
 * UploadedDocumentPage - Renders evidentiary scans (Images/PDFs) within A4 boundaries.
 */
const UploadedDocumentPage: React.FC<{ file: { name: string; file: string }; label: string; orgSettings: OrganizationSettings }> = ({ file, label, orgSettings }) => {
    const isPdf = file.file.startsWith('data:application/pdf');
    const isImage = file.file.startsWith('data:image/');

    // High-Fidelity Branching: Multi-page PDFs are decomposed into individual sheets
    if (isPdf) {
        return <PdfMultiPageRenderer file={file.file} label={label} orgSettings={orgSettings} />;
    }

    return (
        <div className="page-break bg-white p-8 w-[21cm] h-[29.7cm] flex flex-col border-2 border-black mx-auto overflow-hidden">
            <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tighter">{orgSettings.name}</h1>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Secure Evidence Vault</p>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-black uppercase text-primary italic underline underline-offset-4">{label}</h2>
                    <p className="text-[9px] font-mono opacity-60 mt-1">{file.name}</p>
                </div>
            </div>
            
            <div className="flex-grow flex items-center justify-center relative bg-gray-50/50 border-4 border-dashed border-gray-200 rounded-2xl overflow-hidden p-4">
                {isImage && (
                    <div className="relative w-full h-full">
                        <Image 
                            src={file.file} 
                            alt={label} 
                            fill 
                            className="object-contain" 
                            unoptimized 
                        />
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-black/10 text-center shrink-0">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">YKK ERP Solution • Secure Organizational Document</p>
            </div>
        </div>
    );
};

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
        <div className="payment-bundle-container bg-gray-100/30 py-8 print:p-0 print:bg-white">
            {/* 1. Payment Note */}
            <BundlePageWrapper title="Stage 1: Financial settlement">
                <PNPrintLayout pn={pn} mrr={mrr} po={po} vendor={vendor} employees={employees} designations={designations} orgSettings={orgSettings} />
            </BundlePageWrapper>

            {/* 2. Supplier Invoice / Evidence (From MRR documents or PO uploads) */}
            {(mrr.documents?.bill || po.documents?.invoice || []).map((file, i) => (
                <UploadedDocumentPage key={`inv-${i}`} file={file} label="Stage 2: Supplier Invoice" orgSettings={orgSettings} />
            ))}

            {/* 3. MRR */}
            <BundlePageWrapper title="Stage 3: Logistics Audit (MRR)">
                <MRRPrintLayout mrr={mrr} employees={employees} designations={designations} orgSettings={orgSettings} />
            </BundlePageWrapper>

            {/* 4. Supplier Challan */}
            {(mrr.documents?.challan || po.documents?.challan || []).map((file, i) => (
                <UploadedDocumentPage key={`chal-${i}`} file={file} label="Stage 4: Delivery Challan" orgSettings={orgSettings} />
            ))}

            {/* 5. Mushok (VAT) */}
            {(po.documents?.mushok || []).map((file, i) => (
                <UploadedDocumentPage key={`vat-${i}`} file={file} label="Stage 5: Mushok (VAT)" orgSettings={orgSettings} />
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

            {/* 9. Vendor Quotations - Multi-page PDFs will be joined as individual sheets */}
            {(dn.quotations || []).map((q, i) => {
                const v = vendors.find(v => v.id === q.vendorId);
                if (!q.fileDataUrl) return null;
                return (
                    <UploadedDocumentPage 
                        key={`quote-${i}`} 
                        file={{ name: q.fileName, file: q.fileDataUrl }} 
                        label={`Stage 9: Quotation - ${v?.vendorName || 'Vendor'}`} 
                        orgSettings={orgSettings} 
                    />
                );
            })}
        </div>
    );
};
