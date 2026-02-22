'use client';

import React, { useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { POPrintLayout } from '../../../components/po-print-layout';
import { useDoc, useMemoFirebase, useFirestore, useCollection, useUser } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { PurchaseOrder } from '../../../components/po-entry-form';
import type { DemandNote } from '../../../components/demand-note-entry-form';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Designation } from '@/app/user-management/components/designation-table';
import type { DeliveryPlace } from '../../../components/delivery-place-table';
import type { OrganizationSettings } from '@/app/settings/page';

export default function POPrintPage() {
    const params = useParams();
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const { id } = params;

    const poRef = useMemoFirebase(() => (firestore && id) ? doc(firestore, 'purchaseOrders', id as string) : null, [firestore, id]);
    const { data: po, isLoading: l1 } = useDoc<PurchaseOrder>(poRef);

    const dnRef = useMemoFirebase(() => (firestore && po) ? doc(firestore, 'demandNotes', po.demandNoteId) : null, [firestore, po]);
    const { data: demandNote, isLoading: l2 } = useDoc<DemandNote>(dnRef);

    const vendorRef = useMemoFirebase(() => (firestore && po) ? doc(firestore, 'vendors', po.vendorId) : null, [firestore, po]);
    const { data: vendor, isLoading: l3 } = useDoc<Vendor>(vendorRef);

    const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const { data: employees, isLoading: l4 } = useCollection<Employee>(employeesRef);

    const designationsRef = useMemoFirebase(() => firestore ? collection(firestore, 'designations') : null, [firestore]);
    const { data: designations, isLoading: l5 } = useCollection<Designation>(designationsRef);

    const placesRef = useMemoFirebase(() => firestore ? collection(firestore, 'deliveryPlaces') : null, [firestore]);
    const { data: deliveryPlaces, isLoading: l6 } = useCollection<DeliveryPlace>(placesRef);

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
    const { data: orgSettings, isLoading: l7 } = useDoc<OrganizationSettings>(settingsRef);

    const isLoading = isAuthLoading || l1 || l2 || l3 || l4 || l5 || l6 || l7;

    useEffect(() => {
        if (!isLoading && po && demandNote && vendor && orgSettings) {
            // High-Performance Handshake: Trigger system print immediately after hydration
            const timer = setTimeout(() => {
                window.print();
            }, 100); 
            return () => clearTimeout(timer);
        }
    }, [isLoading, po, demandNote, vendor, orgSettings]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="font-black text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Syncing high-fidelity PO for physical output...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-8 text-center">
                <p className="font-black text-xs uppercase tracking-widest text-destructive mb-2">Unauthorized Session</p>
                <p className="text-sm text-muted-foreground">Please log in to generate official contracts.</p>
            </div>
        );
    }

    if (!po) notFound();
    if (!orgSettings) return <div className="p-8 text-center font-bold">Settings handshake failed. Check database availability.</div>;

    return (
        <div className="bg-white min-h-screen">
            <POPrintLayout 
                po={po}
                demandNote={demandNote || undefined}
                vendor={vendor || undefined}
                employees={employees || []}
                designations={designations || []}
                deliveryPlaces={deliveryPlaces || []}
                orgSettings={orgSettings}
            />
        </div>
    );
}
