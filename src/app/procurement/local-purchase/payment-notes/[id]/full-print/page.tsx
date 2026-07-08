
'use client';

import React, { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Printer, Download, CheckCircle2 } from 'lucide-react';

export default function PNFullPrintPage() {
    const params = useParams();
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const { id } = params;

    const [isActionExecuted, setIsActionExecuted] = useState(false);
    const [settlingProgress, setSettlingProgress] = useState(0);

    const pnRef = useMemoFirebase(() => (firestore && id) ? doc(firestore, 'paymentNotes', id as string) : null, [firestore, id]);
    const { data: pn, isLoading: l1 } = useDoc<PaymentNote>(pnRef);

    const mrrRef = useMemoFirebase(() => (firestore && pn) ? doc(firestore, 'mrrs', pn.mrrId) : null, [firestore, pn]);
    const { data: mrr, isLoading: l2 } = useDoc<MRR>(mrrRef);

    const poRef = useMemoFirebase(() => (firestore && mrr) ? doc(firestore, 'purchaseOrders', mrr.poId) : null, [firestore, mrr]);
    const { data: po, isLoading: l3 } = useDoc<PurchaseOrder>(poRef);

    const csRef = useMemoFirebase(() => (firestore && po) ? doc(firestore, 'comparativeStatements', po.csId) : null, [firestore, po]);
    const { data: cs, isLoading: l4 } = useDoc<ComparativeStatement>(csRef);

    const dnRef = useMemoFirebase(() => (firestore && po) ? doc(firestore, 'demandNotes', po.demandNoteId) : null, [firestore, po]);
    const { data: dn, isLoading: l5 } = useDoc<DemandNote>(dnRef);

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

    const isGlobalLoading = isAuthLoading || !firestore || l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13 || l14;

    const performAction = async (mode: string | null) => {
        if (isActionExecuted) return;
        setIsActionExecuted(true);

        // Extended settling window for PDF unrolling and image rendering
        if (mode === 'download') {
            const element = document.querySelector('.payment-bundle-container');
            if (element) {
                try {
                    // @ts-ignore
                    const html2pdf = (await import('html2pdf.js')).default;
                    const opt = {
                        margin: 0,
                        filename: `YKK_FullSet_${pn?.pnNumber || 'Bundle'}.pdf`,
                        image: { type: 'jpeg', quality: 0.95 },
                        html2canvas: { 
                            scale: 1.5, // Reduced scale for better memory management in background iframes
                            useCORS: true, 
                            logging: false, 
                            letterRendering: true 
                        },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                    };
                    // @ts-ignore
                    await html2pdf().from(element).set(opt).save();
                } catch (err) {
                    console.error("Critical PDF Export Failure:", err);
                }
            }
        } else {
            window.print();
        }
    };

    useEffect(() => {
        if (!isGlobalLoading && pn && mrr && po && cs && dn && orgSettings) {
            const searchParams = new URLSearchParams(window.location.search);
            const mode = searchParams.get('mode');

            // High-Fidelity Settling Protocol: Wait for canvases to render
            const timer = setInterval(() => {
                setSettlingProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        performAction(mode);
                        return 100;
                    }
                    return prev + 10;
                });
            }, 800); // ~8 seconds total settling time

            return () => clearInterval(timer);
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

    if (!pn || !mrr || !po || !cs || !dn || !orgSettings) {
        return (
            <div className="p-12 text-center space-y-4">
                <h2 className="text-2xl font-bold text-destructive">Bundle Compilation Incomplete</h2>
                <p className="text-muted-foreground max-w-md mx-auto">The system could not retrieve the full record set. Verify all modules are approved and linked.</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Retry Handshake</Button>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen relative">
            {/* High-Fidelity Manual Overrides (Floaters for when background logic settles) */}
            <div className="fixed top-4 right-4 z-[9999] flex gap-2 print:hidden bg-white/80 backdrop-blur-md p-2 rounded-full border shadow-2xl animate-in slide-in-from-top-4 duration-1000">
                <div className="flex flex-col items-center justify-center px-4 border-r mr-2">
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Bundle Readiness</p>
                    <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${settlingProgress}%` }} />
                    </div>
                </div>
                <Button size="sm" onClick={() => performAction(null)} className="rounded-full h-10 px-6 font-bold uppercase tracking-widest text-[10px]">
                    <Printer className="mr-2 h-4 w-4" /> Force Print
                </Button>
                <Button size="sm" variant="secondary" onClick={() => performAction('download')} className="rounded-full h-10 px-6 font-bold uppercase tracking-widest text-[10px]">
                    <Download className="mr-2 h-4 w-4" /> Force Download
                </Button>
                {isActionExecuted && (
                    <div className="flex items-center gap-1 text-green-600 px-4">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase">Triggered</span>
                    </div>
                )}
            </div>

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
