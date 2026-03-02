
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, ShieldAlert, Layout, CheckCircle2, Bell, Clock } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { imageToDataUrl } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { BulkDeleteSection } from './components/bulk-delete-section';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

type ApprovalStep = {
    stepName: string;
    approverId: string;
    statusName: string;
};

export type OrganizationSettings = {
  name: string;
  slogan: string;
  address: string;
  contactNumber: string;
  telephone: string;
  email: string;
  fax: string;
  registrationNumber: string;
  logo: string; 
  favicon: string; 
  notificationReminderHours: number;
  moduleVisibility?: {
    showProcurementManagement: boolean;
    showCoreModules: boolean;
    showLikeExam: boolean;
    enableNotifications: boolean;
  };
  approvalFlow?: {
      effectiveDate: string;
      steps: ApprovalStep[];
  };
  procurementSettings?: {
      departmentHeads: { sectionId: string; headId: string; technicalAdvisorId: string }[];
      managingDirectorId: string;
      factoryDirectorId: string;
      manufacturingDeptManagerId: string;
      specializedDeptManagerId: string;
      specializedDeptTaId: string;
      generalPurchaseOfficerId: string;
      gpConcernOfficerIds: string[];
      csApprovalRoles: {
          purchaseManagerId: string;
          purchaseDeptTaId: string;
          viceFactoryManagerId: string;
          accountsManagerId: string;
          gmSalesDeptId: string;
          gmAdministrationId: string;
          approvalAmountBasis: string;
      };
      poSettings: {
          mandatoryTerms: string;
          otherTerms: string;
      }
  };
};

const initialSettings: Omit<OrganizationSettings, 'approvalFlow' | 'procurementSettings'> = {
  name: 'YKK ERP Solution',
  slogan: 'Your Trusted Partner',
  address: 'Head Office: 123 Business Rd, Dhaka, Bangladesh',
  contactNumber: '+880 1234 567890',
  telephone: '+880 2 888 7777',
  email: 'contact@ykksolution.com',
  fax: '+880 2 888 7778',
  registrationNumber: 'C-12345/67',
  logo: '',
  favicon: '',
  notificationReminderHours: 24,
  moduleVisibility: {
    showProcurementManagement: true,
    showCoreModules: true,
    showLikeExam: true,
    enableNotifications: true
  }
};

export default function SettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
  const { data: remoteSettings, isLoading: isLoadingSettings } = useDoc<OrganizationSettings>(settingsDocRef);

  const [settings, setSettings] = useState<OrganizationSettings>(initialSettings as OrganizationSettings);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  
  const isLoading = isUserLoading || isLoadingSettings;

  useEffect(() => {
    if (remoteSettings) {
      setSettings({
        ...initialSettings,
        ...remoteSettings,
        moduleVisibility: {
          showProcurementManagement: remoteSettings.moduleVisibility?.showProcurementManagement ?? initialSettings.moduleVisibility!.showProcurementManagement,
          showCoreModules: remoteSettings.moduleVisibility?.showCoreModules ?? initialSettings.moduleVisibility!.showCoreModules,
          showLikeExam: remoteSettings.moduleVisibility?.showLikeExam ?? initialSettings.moduleVisibility!.showLikeExam,
          enableNotifications: remoteSettings.moduleVisibility?.enableNotifications ?? initialSettings.moduleVisibility!.enableNotifications,
        }
      });
      if (remoteSettings.logo) setLogoPreview(remoteSettings.logo);
      if (remoteSettings.favicon) setFaviconPreview(remoteSettings.favicon);
    }
  }, [remoteSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ 
        ...prev, 
        [id]: id === 'notificationReminderHours' ? parseInt(value) || 0 : value 
    }));
  };

  const handleVisibilityChange = (key: keyof NonNullable<OrganizationSettings['moduleVisibility']>, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      moduleVisibility: {
        ...prev.moduleVisibility!,
        [key]: value
      }
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const dataUrl = await imageToDataUrl(file);
        if (type === 'logo') {
          setLogoPreview(dataUrl);
          setSettings(prev => ({ ...prev, logo: dataUrl }));
        } else {
          setFaviconPreview(dataUrl);
          setSettings(prev => ({ ...prev, favicon: dataUrl }));
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Image Error' });
      }
    }
  };

  const handleSave = () => {
    if (settingsDocRef) {
      setDocumentNonBlocking(settingsDocRef, settings, { merge: true });
      toast({ title: 'Settings Saved' });
    }
  };
  
  if (isLoading) {
      return <div className="p-8 text-center animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="relative space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Manage your organization's general information, branding, and pro-active reminders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="name">Organization Name</Label><Input id="name" value={settings.name} onChange={handleInputChange} /></div>
                    <div className="space-y-2"><Label htmlFor="slogan">Slogan</Label><Input id="slogan" value={settings.slogan} onChange={handleInputChange} /></div>
                    <div className="space-y-2 sm:col-span-2"><Label htmlFor="address">Address</Label><Textarea id="address" value={settings.address} onChange={handleInputChange} /></div>
                    <div className="space-y-2"><Label htmlFor="contactNumber">Contact Number</Label><Input id="contactNumber" value={settings.contactNumber} onChange={handleInputChange} /></div>
                    <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={settings.email} onChange={handleInputChange} /></div>
                    
                    {/* PERSISTENT REMINDER CONFIGURATION */}
                    <div className="space-y-2 p-4 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 group hover:border-primary transition-colors">
                        <Label htmlFor="notificationReminderHours" className="flex items-center gap-2 font-bold text-primary"><Clock className="h-4 w-4" /> Persistent Reminder Pulse (Hours)</Label>
                        <Input id="notificationReminderHours" type="number" value={settings.notificationReminderHours} onChange={handleInputChange} className="bg-background font-bold" />
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight mt-1 leading-tight">
                            The system will automatically re-notify users and escalate the reminder count every [X] hours until the task is approved.
                        </p>
                    </div>
                </div>
                <div className="md:col-span-1 space-y-6">
                    <div className="space-y-2">
                        <Label>Organization Logo</Label>
                        <div className="flex flex-col items-center gap-2">
                            <Label htmlFor="logo-upload" className="cursor-pointer w-full">
                                <div className="aspect-video w-full rounded-md bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/20 hover:border-primary transition-colors">
                                {logoPreview ? (
                                    <Image src={logoPreview} alt="Logo" width={200} height={112} className="object-contain" />
                                ) : (
                                    <div className="text-center text-muted-foreground p-4"><Upload className="mx-auto h-8 w-8 mb-2"/><p className="text-sm">Click to upload logo</p></div>
                                )}
                                </div>
                            </Label>
                            <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'logo')} />
                        </div>
                    </div>
                </div>
                </div>
                <div className="flex justify-end"><Button onClick={handleSave} className="font-bold uppercase tracking-widest">Commit Organizational Settings</Button></div>
            </CardContent>
        </Card>

        <div className="flex justify-center pt-12">
            <Button variant="ghost" size="icon" className="opacity-10 hover:opacity-100 transition-opacity h-6 w-6 rounded-full" onClick={() => setIsMaintenanceOpen(true)}><ShieldAlert className="h-3 w-3 text-muted-foreground" /></Button>
        </div>

        <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
            <DialogContent className="sm:max-w-md animate-dialog-in">
                <DialogHeader><DialogTitle>Advanced Controls</DialogTitle><DialogDescription>Maintenance tools and module visibility settings.</DialogDescription></DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider"><Layout className="h-4 w-4" /> Feature Visibility</h4>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="vis-proc" checked={settings.moduleVisibility?.showProcurementManagement} onCheckedChange={(c) => handleVisibilityChange('showProcurementManagement', !!c)} />
                                <Label htmlFor="vis-proc">Show Procurement Management Section</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="vis-exam" checked={settings.moduleVisibility?.showLikeExam} onCheckedChange={(c) => handleVisibilityChange('showLikeExam', !!c)} />
                                <Label htmlFor="vis-exam">Show Audience Response System (ARS) Icon</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="vis-core" checked={settings.moduleVisibility?.showCoreModules} onCheckedChange={(c) => handleVisibilityChange('showCoreModules', !!c)} />
                                <Label htmlFor="vis-core">Show Core Modules Section</Label>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="font-bold flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Notification System</Label>
                                    <p className="text-xs text-muted-foreground">Derived task-driven Action Center.</p>
                                </div>
                                <Switch checked={settings.moduleVisibility?.enableNotifications} onCheckedChange={(c) => handleVisibilityChange('enableNotifications', c)} />
                            </div>
                        </div>
                        <Button className="w-full mt-2" size="sm" onClick={handleSave}><CheckCircle2 className="mr-2 h-4 w-4"/> Update Visibility</Button>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-destructive">Data Maintenance</h4>
                        <BulkDeleteSection />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
