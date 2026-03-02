'use client';

import React, { useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { PaymentBundlePrintLayout } from '../../../components/payment-bundle-print-layout';
import { useDoc, useMemoFirebase, useFirestore, useCollection, useUser } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { PaymentNote } from '../../../components/pn-entry-form';
import type { MRR } from '../../../components/mrr-entry-form';
import type { PurchaseOrder } from '../../../components/po-entry-form';
import type { DemandNote } from '../../../components/demand-note-entry-form';
import type { ComparativeStatement } from '../../../components/cs-entry-form';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Designation } from '@/app/user-management/components/designation-table';
import type { OrganizationSettings } from '@/app/settings/page';
import type { DeliveryPlace } from '../../../components/delivery-place-table';
import type { BillItemMaster } from '@/app/billflow/components/bill-item-master-table';
import type { Section } from '@/app/user-management/components/section-table';
import type { ProcessCode } from '../../../components/process-code-table';
import type { DemandType } from '../../../components/demand-type-table';

/**
 * PNFullPrintPage - The High-Fidelity 9-Stage Bundle Compiler.
 * This page aggregates data from 5 modules and all evidentiary scans into one print stream.
 */
export default function PNFullPrintPage() {
    const params = useParams();
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const { id } = params;

    // Stage 1: Payment Note
    const pnRef = useMemoFirebase(() => (firestore && id) ? doc(firestore, 'paymentNotes', id as string) : null, [firestore, id]);
    const { data: pn, isLoading: l1 } = useDoc<PaymentNote>(pnRef);

    // Stage 2: Physical Receipt (MRR)
    const mrrRef = useMemoFirebase(() => (firestore && pn) ? doc(firestore, 'mrrs', pn.mrrId) : null, [firestore, pn]);
    const { data: mrr, isLoading: l2 } = useDoc<MRR>(mrrRef);

    // Stage 3: Legal Commitment (PO)
    const poRef = useMemoFirebase(() => (firestore && mrr) ? doc(firestore, 'purchaseOrders', mrr.poId) : null, [firestore, mrr]);
    const { data: po, isLoading: l3 } = useDoc<PurchaseOrder>(poRef);

    // Stage 4: Sourcing Analysis (CS)
    const csRef = useMemoFirebase(() => (firestore && po) ? doc(firestore, 'comparativeStatements', po.csId) : null, [firestore, po]);
    const { data: cs, isLoading: l4 } = useDoc<ComparativeStatement>(csRef);

    // Stage 5: Intent Origin (DN)
    const dnRef = useMemoFirebase(() => (firestore && po) ? doc(firestore, 'demandNotes', po.demandNoteId) : null, [firestore, po]);
    const { data: dn, isLoading: l5 } = useDoc<DemandNote>(dnRef);

    // Master Registries for Profile Matching
    const vendorsRef = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
    const { data: vendors, isLoading: l6 } = useCollection<Vendor>(vendorsRef);

    const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const { data: employees, isLoading: l7 } = useCollection<Employee>(employeesRef);

    const designationsRef = useMemoFirebase(() => firestore ? collection(firestore, 'designations') : null, [firestore]);
    const { data: designations, isLoading: l8 } = useCollection<Designation>(designationsRef);

    const placesRef = useMemoFirebase(() => firestore ? collection(firestore, 'deliveryPlaces') : null, [firestore]);
    const { data: deliveryPlaces, isLoading: l9 } = useCollection<DeliveryPlace>(placesRef);

    const itemsRef = useMemoFirebase(() => firestore ? collection(firestore, 'billItemMasters') : null, [firestore]);
    const { data: billItemMasters, isLoading: l10 } = useCollection<BillItemMaster>(itemsRef);

    const sectionsRef = useMemoFirebase(() => firestore ? collection(firestore, 'sections') : null, [firestore]);
    const { data: sections, isLoading: l11 } = useCollection<Section>(sectionsRef);

    const codesRef = useMemoFirebase(() => firestore ? collection(firestore, 'processCodes') : null, [firestore]);
    const { data: processCodes, isLoading: l12 } = useCollection<ProcessCode>(codesRef);

    const typesRef = useMemoFirebase(() => firestore ? collection(firestore, 'demandTypes') : null, [firestore]);
    const { data: demandTypes, isLoading: l13 } = useCollection<DemandType>(typesRef);

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
    const { data: orgSettings, isLoading: l14 } = useDoc<OrganizationSettings>(settingsRef);

    // Secure Hydration Guard: We wait for ALL data and the database service itself to be ready.
    const isGlobalLoading = isAuthLoading || !firestore || l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13 || l14;

    useEffect(() => {
        if (!isGlobalLoading && pn && mrr && po && cs && dn && orgSettings) {
            const searchParams = new URLSearchParams(window.location.search);
            const mode = searchParams.get('mode');

            if (mode === 'download') {
                const executeDownload = async () => {
                    // High-Performance Handshake: Wait for PDF renderings to stabilize
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    const element = document.querySelector('.payment-bundle-container');
                    if (element) {
                        try {
                            // @ts-ignore
                            const html2pdf = (await import('html2pdf.js')).default;
                            const opt = {
                                margin: 0,
                                filename: `YKK_FullSet_${pn.pnNumber}.pdf`,
                                image: { type: 'jpeg', quality: 0.98 },
                                html2canvas: { 
                                    scale: 2, 
                                    useCORS: true, 
                                    logging: false,
                                    letterRendering: true
                                },
                                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                            };
                            
                            // High-Fidelity Capture: Converts the entire subway of documents into one PDF file
                            await html2pdf().from(element).set(opt).save();
                        } catch (err) {
                            console.error("Critical PDF Export Failure:", err);
                        }
                    }
                };
                executeDownload();
            } else {
                // Standard Print Path
                const timer = setTimeout(() => {
                    window.print();
                }, 5000); 
                return () => clearTimeout(timer);
            }
        }
    }, [isGlobalLoading, pn, mrr, po, cs, dn, orgSettings]);

    if (isGlobalLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 font-black text-xs uppercase tracking-widest text-muted-foreground animate-pulse text-center">
                    Establishing Secure Data Handshake...<br/>
                    <span className="text-[10px] font-bold opacity-50">Compiling 9-Stage Organizational Full-Set Bundle</span>
                </p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-8 text-center">
                <p className="font-black text-xs uppercase tracking-widest text-destructive mb-2">Unauthorized Request</p>
                <p className="text-sm text-muted-foreground">Please ensure you are logged in to the YKK ERP Solution.</p>
            </div>
        );
    }

    // Diagnostic Check: If data is truly missing, we provide a detailed organizational warning instead of a generic 404.
    // Enhanced Integrity Check: Including orgSettings ensures type safety for the downstream Layout.
    if (!pn || !mrr || !po || !cs || !dn || !orgSettings) {
        return (
            <div className="p-12 text-center space-y-4">
                <h2 className="text-2xl font-bold text-destructive">Bundle Compilation Incomplete</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    The system could not retrieve the full record set. Please verify that the 
                    MRR, Purchase Order, and CS are all final-approved and correctly linked.
                </p>
                <div className="grid grid-cols-5 gap-2 text-[10px] font-black uppercase opacity-50">
                    <span className={pn ? "text-green-600" : ""}>PN: {pn ? "OK" : "ERR"}</span>
                    <span className={mrr ? "text-green-600" : ""}>MRR: {mrr ? "OK" : "ERR"}</span>
                    <span className={po ? "text-green-600" : ""}>PO: {po ? "OK" : "ERR"}</span>
                    <span className={cs ? "text-green-600" : ""}>CS: {cs ? "OK" : "ERR"}</span>
                    <span className={dn ? "text-green-600" : ""}>DN: {dn ? "OK" : "ERR"}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <PaymentBundlePrintLayout 
                pn={pn}
                mrr={mrr}
                po={po}
                cs={cs}
                dn={dn}
                vendors={vendors || []}
                employees={employees || []}
                designations={designations || []}
                deliveryPlaces={deliveryPlaces || []}
                billItemMasters={billItemMasters || []}
                sections={sections || []}
                processCodes={processCodes || []}
                demandTypes={demandTypes || []}
                orgSettings={orgSettings}
            />
        </div>
    );
}