
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { PrintProvider } from '@/app/vehicle-management/components/print-provider';
import { PrintDriver } from '@/app/vehicle-management/components/print-driver';
import React from 'react';
import { FirebaseClientProvider } from '@/firebase';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
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
        <FirebaseClientProvider>
          <PrintProvider>
            <div className="flex min-h-screen w-full flex-col bg-muted/40 app-container">
              <Sidebar />
              <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <Header />
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                  {children}
                </main>
              </div>
            </div>
            <div className="print-container">
              <PrintDriver />
            </div>
            <Toaster />
          </PrintProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
