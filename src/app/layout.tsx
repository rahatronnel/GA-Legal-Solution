
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { PrintProvider } from '@/app/vehicle-management/components/print-provider';
import { PrintDriver } from '@/app/vehicle-management/components/print-driver';
import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { toast } = useToast();

  const ALL_LOCALSTORAGE_KEYS = [
    'organizationSettings', 'designations', 'sections', 'employees',
    'drivers', 'vehicles', 'locations', 'routes', 'tripPurposes', 'trips', 
    'vehicleTypes', 'vehicleBrands', 'expenseTypes', 'maintenanceTypes', 
    'maintenanceExpenseTypes', 'serviceCenters', 'parts', 'maintenanceRecords',
    'accidents', 'accidentTypes', 'severityLevels', 'faultStatuses'
  ];

  const handleDownloadBackup = () => {
      try {
        const backupData: { [key: string]: any } = {};
        ALL_LOCALSTORAGE_KEYS.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                backupData[key] = JSON.parse(data);
            }
        });

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `GALS_Backup_${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Success', description: 'Data backup downloaded successfully.' });
      } catch (error) {
        console.error("Backup failed:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not download backup.' });
      }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      toast({
        title: "Backup Reminder",
        description: "It's been a while! Don't forget to back up your data to prevent loss.",
        action: <Button variant="secondary" size="sm" onClick={handleDownloadBackup}>Backup Now</Button>,
        duration: 30000,
      });
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [toast]);


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
        <PrintProvider>
          <div className="flex min-h-screen w-full flex-col bg-muted/40 print:hidden">
            <Sidebar />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
              <Header />
              <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                {children}
              </main>
            </div>
          </div>
          <PrintDriver />
          <Toaster />
        </PrintProvider>
      </body>
    </html>
  );
}
