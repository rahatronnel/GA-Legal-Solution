
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Upload, X, Download, UploadCloud } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type OrganizationSettings = {
  name: string;
  address: string;
  contactNumber: string;
  telephone: string;
  email: string;
  fax: string;
  registrationNumber: string;
  slogan: string;
  logo: string; // Stored as data URL
};

const initialSettings: OrganizationSettings = {
  name: '',
  address: '',
  contactNumber: '',
  telephone: '',
  email: '',
  fax: '',
  registrationNumber: '',
  slogan: '',
  logo: '',
};

const ALL_LOCALSTORAGE_KEYS = [
    'organizationSettings', 'designations', 'sections', 'employees',
    'drivers', 'vehicles', 'locations', 'routes', 'tripPurposes', 'trips', 
    'vehicleTypes', 'vehicleBrands', 'expenseTypes', 'maintenanceTypes', 
    'maintenanceExpenseTypes', 'serviceCenters', 'parts', 'maintenanceRecords',
    'accidents', 'accidentTypes', 'severityLevels', 'faultStatuses'
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [storedSettings, setStoredSettings] = useLocalStorage<OrganizationSettings>('organizationSettings', initialSettings);
  const [settings, setSettings] = useState<OrganizationSettings>(initialSettings);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    setSettings(storedSettings);
    setLogoPreview(storedSettings.logo);
  }, [storedSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dataUrl = await fileToDataUrl(file);
      setLogoPreview(dataUrl);
      setSettings(prev => ({ ...prev, logo: dataUrl }));
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setSettings(prev => ({ ...prev, logo: '' }));
  };

  const handleSave = () => {
    setStoredSettings(settings);
    toast({
      title: 'Success',
      description: 'Organization settings have been saved.',
    });
  };

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

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
            const backupData = JSON.parse(e.target?.result as string);
            
            // Validate backup file structure
            const backupKeys = Object.keys(backupData);
            if (!backupKeys.length || !ALL_LOCALSTORAGE_KEYS.some(key => backupKeys.includes(key))) {
                throw new Error("Invalid or empty backup file.");
            }

            // Clear existing data and restore
            // This is a destructive action, so it's wrapped in an alert dialog
            ALL_LOCALSTORAGE_KEYS.forEach(key => {
                if (backupData[key]) {
                    localStorage.setItem(key, JSON.stringify(backupData[key]));
                } else {
                    localStorage.removeItem(key); // Remove keys not present in backup
                }
            });
            
            toast({ title: 'Success', description: 'Data restored successfully. The application will now reload.' });

            // Reload the page to apply changes
            setTimeout(() => window.location.reload(), 1500);

          } catch (error: any) {
             console.error("Restore failed:", error);
             toast({ variant: 'destructive', title: 'Restore Failed', description: error.message || 'Could not read or apply the backup file.' });
          }
      };
      reader.readAsText(file);
      event.target.value = ''; // Reset file input
  };

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>
              Manage your organization's general information and branding. This information will be used across the application, like in print layouts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input id="name" value={settings.name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slogan">Slogan</Label>
                  <Input id="slogan" value={settings.slogan} onChange={handleInputChange} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" value={settings.address} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input id="contactNumber" value={settings.contactNumber} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Telephone Number</Label>
                  <Input id="telephone" value={settings.telephone} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={settings.email} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fax">Fax</Label>
                  <Input id="fax" value={settings.fax} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input id="registrationNumber" value={settings.registrationNumber} onChange={handleInputChange} />
                </div>
              </div>
              <div className="md:col-span-1 space-y-4">
                <Label>Organization Logo</Label>
                <div className="flex flex-col items-center gap-4">
                  <Label htmlFor="logo-upload" className="cursor-pointer w-full">
                    <div className="aspect-video w-full rounded-md bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed">
                      {logoPreview ? (
                        <Image src={logoPreview} alt="Logo Preview" width={200} height={112} className="object-contain" />
                      ) : (
                        <div className="text-center text-muted-foreground p-4">
                            <Upload className="mx-auto h-8 w-8 mb-2"/>
                            <p className="text-sm">Click to upload logo</p>
                        </div>
                      )}
                    </div>
                  </Label>
                  <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  {logoPreview && (
                    <Button variant="link" size="sm" className="text-destructive" onClick={removeLogo}>
                      <X className="mr-2 h-4 w-4" /> Remove logo
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Settings</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Data Backup & Restore</CardTitle>
                <CardDescription>
                    Download a full backup of all your application data, including documents. Restore from a backup file to recover your work.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleDownloadBackup} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Download Full Backup
                </Button>
                
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Upload & Restore Backup
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action is destructive. Restoring from a backup will completely
                                overwrite all current data in the application. This cannot be undone.
                                Are you sure you want to proceed?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction asChild>
                                <Label htmlFor="backup-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                    I'm Sure, Restore
                                </Label>
                            </AlertDialogAction>
                             <Input id="backup-upload" type="file" accept=".json" className="hidden" onChange={handleRestoreBackup} />
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    </div>
  );
}

    
