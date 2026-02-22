'use client';

import React, { useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { PNPrintLayout } from '../../../components/pn-print-layout';
import { useDoc, useMemoFirebase, useFirestore, useCollection, useUser } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { PaymentNote } from '../../../components/pn-entry-form';
import type { MRR } from '../../../components/mrr-entry-form';
import type { PurchaseOrder } from '../../../components/po-entry-form';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Designation } from '@/app/user-management/components/designation-table';
import type { OrganizationSettings } from '@/app/settings/page';

export default function PNPrintPage() {
    const params = useParams();
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const { id } = params;

    const pnRef = useMemoFirebase(() => (firestore && id) ? doc(firestore, 'paymentNotes', id as string) : null, [firestore, id]);
    const { data: pn, isLoading: l1 } = useDoc<PaymentNote>(pnRef);

    const mrrRef = useMemoFirebase(() => (firestore && pn) ? doc(firestore, 'mrrs', pn.mrrId) : null, [firestore, pn]);
    const { data: mrr, isLoading: l2 } = useDoc<MRR>(mrrRef);

    const poRef = useMemoFirebase(() => (firestore && mrr) ? doc(firestore, 'purchaseOrders', mrr.poId) : null, [firestore, mrr]);
    const { data: po, isLoading: l3 } = useDoc<PurchaseOrder>(poRef);

    const vendorRef = useMemoFirebase(() => (firestore && po) ? doc(firestore, 'vendors', po.vendorId) : null, [firestore, po]);
    const { data: vendor, isLoading: l4 } = useDoc<Vendor>(vendorRef);

    const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const { data: employees, isLoading: l5 } = useCollection<Employee>(employeesRef);

    const designationsRef = useMemoFirebase(() => firestore ? collection(firestore, 'designations') : null, [firestore]);
    const { data: designations, isLoading: l6 } = useCollection<Designation>(designationsRef);

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
    const { data: orgSettings, isLoading: l7 } = useDoc<OrganizationSettings>(settingsRef);

    const isGlobalLoading = isAuthLoading || !firestore || l1 || l2 || l3 || l4 || l5 || l6 || l7;

    useEffect(() => {
        if (!isGlobalLoading && pn && orgSettings) {
            const timer = setTimeout(() => {
                window.print();
            }, 500); 
            return () => clearTimeout(timer);
        }
    }, [isGlobalLoading, pn, orgSettings]);

    if (isGlobalLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 font-black text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Syncing high-fidelity financial data...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-8 text-center">
                <p className="font-black text-xs uppercase tracking-widest text-destructive mb-2">Unauthorized Session</p>
                <p className="text-sm text-muted-foreground">Please log in to access financial documents.</p>
            </div>
        );
    }

    if (!pn) {
        return <div className="p-12 text-center font-bold text-destructive">Payment Note Record Not Found.</div>;
    }

    return (
        <div className="bg-white min-h-screen">
            <PNPrintLayout 
                pn={pn}
                mrr={mrr || undefined}
                po={po || undefined}
                vendor={vendor || undefined}
                employees={employees || []}
                designations={designations || []}
                orgSettings={orgSettings || ({} as OrganizationSettings)}
            />
        </div>
    );
}
