'use client';

import React, { useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useProcurement } from '../../../components/procurement-provider';
import { MRRPrintLayout } from '../../../components/mrr-print-layout';

export default function MRRPrintPage() {
    const params = useParams();
    const { mrrs, employees, designations, orgSettings, isLoading } = useProcurement();

    const mrr = useMemo(() => {
        if (isLoading || !mrrs) return undefined;
        return mrrs.find((m: any) => m.id === params.id) || null;
    }, [params.id, mrrs, isLoading]);

    useEffect(() => {
        if (!isLoading && mrr && orgSettings) {
            // Optimized instant trigger
            const timer = setTimeout(() => {
                window.print();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isLoading, mrr, orgSettings]);

    if (isLoading || mrr === undefined) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
                <p className="font-bold text-sm text-muted-foreground italic">Formatting bilingual MRR document...</p>
            </div>
        );
    }

    if (mrr === null) {
        notFound();
    }

    if (!orgSettings) return <div className="p-8 text-center bg-white text-black font-bold">Error: Settings Not Found.</div>;

    return (
        <div className="bg-white min-h-screen">
            <MRRPrintLayout 
                mrr={mrr}
                employees={employees}
                designations={designations}
                orgSettings={orgSettings}
            />
        </div>
    );
}
