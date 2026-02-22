
'use client';

import React, { useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { PaymentBundlePrintLayout } from '../../../components/payment-bundle-print-layout';
import { useDoc, useMemoFirebase, useFirestore, useCollection } from '@/firebase';
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

export default function PNFullPrintPage() {
    const params = useParams();
    const firestore = useFirestore();
    const { id } = params;

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

    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13 || l14;

    useEffect(() => {
        if (!isLoading && pn && mrr && po && cs && dn && orgSettings) {
            const timer = setTimeout(() => {
                window.print();
            }, 1500); // Increased delay for multi-page complex image heavy rendering
            return () => clearTimeout(timer);
        }
    }, [isLoading, pn, mrr, po, cs, dn, orgSettings]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 font-black text-xs uppercase tracking-widest text-muted-foreground animate-pulse text-center">
                    Compiling Organizational Full-Set Bundle...<br/>
                    <span className="text-[10px] font-bold opacity-50">Fetching 9 Lifecycle Stages & Multi-Vendor Evidence</span>
                </p>
            </div>
        );
    }

    if (!pn || !mrr || !po || !cs || !dn) notFound();
    if (!orgSettings) return <div className="p-8 text-center font-bold">Settings handshake failed.</div>;

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
