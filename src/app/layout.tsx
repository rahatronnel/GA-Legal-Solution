"use client";

import React from 'react';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { PrintProvider } from '@/app/vehicle-management/components/print-provider';
import { PrintDriver } from '@/app/vehicle-management/components/print-driver';
import { FirebaseClientProvider } from '@/firebase';
import { usePathname } from 'next/navigation';
import { TooltipProvider } from "@/components/ui/tooltip";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  // Check if we are on a dedicated print page to avoid hiding content during print
  const isPrintPage = pathname?.includes('/print');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased')}>
        {/* Firebase initialized on the client */}
        <FirebaseClientProvider>
          <TooltipProvider delayDuration={0}>
            <PrintProvider>
                {/* We only apply 'app-container' (which hides on print) if it's NOT a dedicated print route */}
                <div className={cn(!isPrintPage && "app-container")}>
                {children}
                </div>
                {/* print-container is used for the legacy dynamic overlay print system */}
                <div className="print-container">
                <PrintDriver />
                </div>
                <Toaster />
            </PrintProvider>
          </TooltipProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}