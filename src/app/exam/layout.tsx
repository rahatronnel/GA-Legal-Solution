"use client";

import React, { Suspense } from 'react';
import { ArsProvider } from './components/ars-provider';

/**
 * ArsLayout - Standardized environment for the ARS ecosystem.
 * Includes a global Suspense boundary to prevent build failures during static analysis.
 */
export default function ArsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ArsProvider>
      <div className="dark min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-primary selection:text-primary-foreground">
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-slate-950">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            {children}
        </Suspense>
      </div>
    </ArsProvider>
  );
}
