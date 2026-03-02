
'use client';

import React from 'react';
import { ArsProvider } from './components/ars-provider';

export default function ArsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ArsProvider>
      <div className="dark min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-primary selection:text-primary-foreground">
        {children}
      </div>
    </ArsProvider>
  );
}
