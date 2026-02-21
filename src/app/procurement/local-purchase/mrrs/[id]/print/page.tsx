'use client';

import React, { useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { MRRPrintLayout } from '../../../components/mrr-print-layout';
import { useDoc, useMemoFirebase, useFirestore, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { MRR } from '../../../components/mrr-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Designation } from '@/app/user-management/components/designation-table';
import type { OrganizationSettings } from '@/app/settings/page';

export default function MRRPrintPage() {
    const params = useParams();
    const firestore = useFirestore();
    const { id } = params;

    const mrrRef = useMemoFirebase(() => (firestore && id) ? doc(firestore, 'mrrs', id as string) : null, [firestore, id]);
    const { data: mrr, isLoading: l1 } = useDoc<MRR>(mrrRef);

    const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const { data: employees, isLoading: l2 } = useCollection<Employee>(employeesRef);

    const designationsRef = useMemoFirebase(() => firestore ? collection(firestore, 'designations') : null, [firestore]);
    const { data: designations, isLoading: l3 } = useCollection<Designation>(designationsRef);

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
    const { data: orgSettings, isLoading: l4 } = useDoc<OrganizationSettings>(settingsRef);

    const isLoading = l1 || l2 || l3 || l4;

    useEffect(() => {
        if (!isLoading && mrr && orgSettings) {
            // High-Performance Handshake: Trigger system print immediately after hydration
            const timer = setTimeout(() => {
                window.print();
            }, 100); 
            return () => clearTimeout(timer);
        }
    }, [isLoading, mrr, orgSettings]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="font-black text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Syncing high-fidelity MRR for physical output...</p>
                </div>
            </div>
        );
    }

    if (!mrr) notFound();
    if (!orgSettings) return <div className="p-8 text-center font-bold">Settings handshake failed. Check database availability.</div>;

    return (
        <div className="bg-white min-h-screen">
            <MRRPrintLayout 
                mrr={mrr}
                employees={employees || []}
                designations={designations || []}
                orgSettings={orgSettings}
            />
        </div>
    );
}