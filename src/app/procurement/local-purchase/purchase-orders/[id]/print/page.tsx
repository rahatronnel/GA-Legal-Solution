
'use client';

import React, { useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useProcurement } from '../../../components/procurement-provider';
import { POPrintLayout } from '../../../components/po-print-layout';

export default function POPrintPage() {
    const params = useParams();
    const { purchaseOrders, demandNotes, vendors, employees, designations, deliveryPlaces, orgSettings, isLoading } = useProcurement();

    const po = useMemo(() => {
        if (isLoading || !purchaseOrders) return undefined;
        return purchaseOrders.find((p: any) => p.id === params.id) || null;
    }, [params.id, purchaseOrders, isLoading]);

    const demandNote = useMemo(() => {
        if (!po || !demandNotes) return undefined;
        return demandNotes.find((dn: any) => dn.id === po.demandNoteId);
    }, [po, demandNotes]);

    const vendor = useMemo(() => {
        if (!po || !vendors) return undefined;
        return vendors.find((v: any) => v.id === po.vendorId);
    }, [po, vendors]);

    useEffect(() => {
        // High-performance instant print trigger
        if (!isLoading && po && demandNote && vendor && orgSettings) {
            const timer = setTimeout(() => {
                window.print();
            }, 300); // 300ms rendering handshake
            return () => clearTimeout(timer);
        }
    }, [isLoading, po, demandNote, vendor, orgSettings]);

    if (isLoading || po === undefined) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
                <p className="font-bold text-sm text-muted-foreground animate-pulse italic">Preparing high-fidelity Purchase Order...</p>
            </div>
        );
    }

    if (po === null) {
        notFound();
    }

    if (!orgSettings) return <div className="p-8 text-center bg-white text-black font-bold">Error: Organization Settings Not Found.</div>;

    return (
        <div className="bg-white min-h-screen">
            <POPrintLayout 
                po={po}
                demandNote={demandNote}
                vendor={vendor}
                employees={employees}
                designations={designations}
                deliveryPlaces={deliveryPlaces}
                orgSettings={orgSettings}
            />
        </div>
    );
}
