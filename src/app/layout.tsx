
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
import { Download } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { toast } = useToast();
  const [lastBackupDate, setLastBackupDate] = useLocalStorage<string>('lastBackupDate', '');
  
  useEffect(() => {
    const checkBackup = () => {
      const today = new Date().toISOString().split('T')[0];
      if (lastBackupDate !== today) {
        toast({
          title: "Data Backup Reminder",
          description: "It's been a while since your last backup. Please download a new backup from the Settings page to keep your data safe.",
          action: (
             <Button onClick={handleDownloadBackup}>
                <Download className="mr-2 h-4 w-4" />
                Backup Now
            </Button>
          ),
          duration: 30000 // 30 seconds
        });
      }
    };
    
    // Check every 3 hours
    const interval = setInterval(checkBackup, 3 * 60 * 60 * 1000); 

    // Initial check
    checkBackup();
    
    return () => clearInterval(interval);

  }, [lastBackupDate, setLastBackupDate, toast]);


  const handleDownloadBackup = () => {
    try {
        const backupData: { [key: string]: any } = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                 backupData[key] = JSON.parse(localStorage.getItem(key)!);
            }
        }
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ga-legal-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        const today = new Date().toISOString().split('T')[0];
        setLastBackupDate(today);

        toast({
            title: "Backup Successful",
            description: "Your data has been downloaded.",
        });
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Backup Failed",
            description: "Could not create backup file. Please try again from the Settings page.",
        });
    }
  };


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
      </body>
    </html>
  );
}
