
"use client";

import React, { useEffect } from 'react';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { PrintProvider } from '@/app/vehicle-management/components/print-provider';
import { PrintDriver } from '@/app/vehicle-management/components/print-driver';
import { FirebaseClientProvider, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { OrganizationSettings } from './settings/page';


function FaviconUpdater() {
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
  const { data: orgSettings } = useDoc<OrganizationSettings>(settingsDocRef);

  useEffect(() => {
    if (orgSettings?.logo) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = orgSettings.logo;
    }
  }, [orgSettings]);

  return null; // This component does not render anything
}


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
          <FaviconUpdater />
          <PrintProvider>
            <div className="app-container">
              {children}
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
