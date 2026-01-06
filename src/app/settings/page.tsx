
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
import { Upload, X } from 'lucide-react';

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
