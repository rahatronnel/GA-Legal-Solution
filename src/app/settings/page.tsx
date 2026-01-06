
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Upload, X, Download, HardDriveUpload, HardDriveDownload } from 'lucide-react';
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

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [storedSettings, setStoredSettings] = useLocalStorage<OrganizationSettings>('organizationSettings', initialSettings);
  const [settings, setSettings] = useState<OrganizationSettings>(initialSettings);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        toast({
            title: "Backup Successful",
            description: "Your data has been downloaded.",
        });
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Backup Failed",
            description: "Could not create backup file. Please try again.",
        });
    }
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
     if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target?.result as string);
                Object.keys(backupData).forEach(key => {
                    localStorage.setItem(key, JSON.stringify(backupData[key]));
                });
                toast({
                    title: "Restore Successful",
                    description: "Your data has been restored. The application will now reload.",
                });
                 // Use router to navigate, which will cause a clean state reload
                setTimeout(() => {
                    router.push('/');
                }, 1000);

            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Restore Failed",
                    description: "The selected file is not a valid backup file.",
                });
            }
        };
        reader.readAsText(file);
     }
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
                <CardDescription>Download a backup of all application data, or restore from a previously saved backup file.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
                <Button onClick={handleDownloadBackup}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Backup
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Upload className="mr-2 h-4 w-4" />
                             Restore from Backup
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. Restoring from a backup will overwrite all current data in the application.
                                Make sure you have a recent backup downloaded before proceeding.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction asChild>
                                <Label htmlFor="backup-file-input" className="cursor-pointer">
                                    <HardDriveUpload className="mr-2 h-4 w-4" />
                                    Choose file and Restore
                                </Label>
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Input
                    id="backup-file-input"
                    type="file"
                    className="hidden"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleRestoreBackup}
                />
            </CardContent>
        </Card>
    </div>
  );
}
