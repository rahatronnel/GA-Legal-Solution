
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { imageToDataUrl } from '@/lib/utils';


export type OrganizationSettings = {
  name: string;
  slogan: string;
  address: string;
  contactNumber: string;
  telephone: string;
  email: string;
  fax: string;
  registrationNumber: string;
  logo: string; // Stored as data URL
  billApproverId?: string;
};

const initialSettings: OrganizationSettings = {
  name: 'GA & Legal Solution',
  slogan: 'Your Trusted Partner',
  address: 'Head Office: 123 Business Rd, Dhaka, Bangladesh',
  contactNumber: '+880 1234 567890',
  telephone: '+880 2 888 7777',
  email: 'contact@galsolution.com',
  fax: '+880 2 888 7778',
  registrationNumber: 'C-12345/67',
  logo: '',
};

export default function SettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
  const { data: remoteSettings, isLoading: isLoadingSettings } = useDoc<OrganizationSettings>(settingsDocRef);

  const [settings, setSettings] = useState<OrganizationSettings>(initialSettings);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const isLoading = isUserLoading || isLoadingSettings;

  useEffect(() => {
    if (remoteSettings) {
      setSettings(remoteSettings);
      if (remoteSettings.logo) {
        setLogoPreview(remoteSettings.logo);
      }
    }
  }, [remoteSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const dataUrl = await imageToDataUrl(file);
        setLogoPreview(dataUrl);
        setSettings(prev => ({ ...prev, logo: dataUrl }));
      } catch (error) {
        console.error("Error processing image:", error);
        toast({
          variant: 'destructive',
          title: 'Image Error',
          description: 'Could not process the uploaded image. Please try another file.'
        });
      }
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setSettings(prev => ({ ...prev, logo: '' }));
  };

  const handleSave = () => {
    if (settingsDocRef) {
      setDocumentNonBlocking(settingsDocRef, settings, { merge: true });
      toast({
        title: 'Settings Saved',
        description: 'Your organization settings have been saved successfully.',
      });
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not connect to the database to save settings.',
        });
    }
  };
  
  if (isLoading) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                  <Skeleton className="h-96 w-full" />
              </CardContent>
          </Card>
      )
  }

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
    </div>
  );
}
