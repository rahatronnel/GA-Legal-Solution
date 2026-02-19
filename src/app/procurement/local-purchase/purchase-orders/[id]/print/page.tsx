
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
        if (!isLoading && po && demandNote && vendor && orgSettings) {
            // Short delay to ensure images/layout are rendered
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, po, demandNote, vendor, orgSettings]);

    if (isLoading || po === undefined) {
        return <div className="p-8 text-center animate-pulse">Loading Print Preview...</div>;
    }

    if (po === null) {
        notFound();
    }

    if (!orgSettings) return <div className="p-8 text-center">Settings not found.</div>;

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
