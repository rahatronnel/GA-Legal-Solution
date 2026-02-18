
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Trash2, AlertTriangle, CalendarIcon } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useUser, useCollection, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collection, writeBatch, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { imageToDataUrl } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

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
  logo: string; // Stored as data URL
  favicon: string; // Stored as data URL for favicon
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
  name: 'GA & Legal Solution',
  slogan: 'Your Trusted Partner',
  address: 'Head Office: 123 Business Rd, Dhaka, Bangladesh',
  contactNumber: '+880 1234 567890',
  telephone: '+880 2 888 7777',
  email: 'contact@galsolution.com',
  fax: '+880 2 888 7778',
  registrationNumber: 'C-12345/67',
  logo: '',
  favicon: '',
};

function BulkDeleteSection() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [targetCollection, setTargetCollection] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleBulkDelete = async () => {
        if (!firestore || !targetCollection) return;

        setIsDeleting(true);
        try {
            const colRef = collection(firestore, targetCollection);
            let q = query(colRef);

            const snapshot = await getDocs(q);
            let docsToDelete = snapshot.docs;

            // Manual date filtering for complex local purchase logic if needed, 
            // but for simple "all or range" we use basic filter
            if (dateRange?.from) {
                const start = startOfDay(dateRange.from).getTime();
                const end = endOfDay(dateRange.to || dateRange.from).getTime();
                
                docsToDelete = docsToDelete.filter(d => {
                    const data = d.data();
                    const dateStr = data.date || data.csDate || data.poDate || data.entryDate;
                    if (!dateStr) return false;
                    const docTime = new Date(dateStr).getTime();
                    return docTime >= start && docTime <= end;
                });
            }

            if (docsToDelete.length === 0) {
                toast({ title: "No Records Found", description: "No records matched your deletion criteria." });
                setIsDeleting(false);
                return;
            }

            const batch = writeBatch(firestore);
            docsToDelete.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            toast({ title: "Success", description: `Successfully deleted ${docsToDelete.length} records from ${targetCollection}.` });
            
            // Reset form
            setTargetCollection('');
            setDateRange(undefined);

        } catch (error: any) {
            toast({ variant: 'destructive', title: "Delete Failed", description: error.message });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card className="border-destructive/20">
            <CardHeader>
                <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <CardTitle>Bulk Hard Delete</CardTitle>
                </div>
                <CardDescription>
                    Warning: This will permanently remove data from the database. This action cannot be undone.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Select Collection</Label>
                        <Select value={targetCollection} onValueChange={setTargetCollection}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose data type..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="demandNotes">Demand Notes (GP Desk)</SelectItem>
                                <SelectItem value="comparativeStatements">Comparative Statements</SelectItem>
                                <SelectItem value="purchaseOrders">Purchase Orders</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Date Range (Optional - leave empty for ALL)</Label>
                        <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full" />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={!targetCollection || isDeleting}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {isDeleting ? 'Deleting...' : 'Execute Bulk Delete'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>CRITICAL WARNING</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You are about to perform a **HARD DELETE** on <strong className="text-foreground">{targetCollection}</strong>.
                                    {dateRange?.from ? ` Scope: Records from ${format(dateRange.from, 'PPP')} to ${format(dateRange.to || dateRange.from, 'PPP')}.` : " Scope: ALL records in this collection."}
                                    <br /><br />
                                    This data will be wiped from the database and cannot be recovered. Do you wish to proceed?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                                    Yes, HARD DELETE
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { isUserLoading, user } = useUser();
  
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
  const { data: remoteSettings, isLoading: isLoadingSettings } = useDoc<OrganizationSettings>(settingsDocRef);

  const [settings, setSettings] = useState<OrganizationSettings>(initialSettings as OrganizationSettings);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  
  const isLoading = isUserLoading || isLoadingSettings;
  const isSuperAdmin = user?.email === 'superadmin@galsolution.com';

  useEffect(() => {
    if (remoteSettings) {
      setSettings(remoteSettings);
      if (remoteSettings.logo) {
        setLogoPreview(remoteSettings.logo);
      }
      if (remoteSettings.favicon) {
        setFaviconPreview(remoteSettings.favicon);
      }
    } else {
      setSettings(initialSettings as OrganizationSettings);
    }
  }, [remoteSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
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
        console.error("Error processing image:", error);
        toast({
          variant: 'destructive',
          title: 'Image Error',
          description: 'Could not process the uploaded image. Please try another file.'
        });
      }
    }
  };

  const removeImage = (type: 'logo' | 'favicon') => {
    if (type === 'logo') {
      setLogoPreview(null);
      setSettings(prev => ({ ...prev, logo: '' }));
    } else {
      setFaviconPreview(null);
      setSettings(prev => ({ ...prev, favicon: '' }));
    }
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
        <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General Settings</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
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
                    <div className="md:col-span-1 space-y-6">
                        <div className="space-y-2">
                            <Label>Organization Logo</Label>
                            <div className="flex flex-col items-center gap-2">
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
                                <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'logo')} />
                                {logoPreview && (
                                    <Button variant="link" size="sm" className="text-destructive" onClick={() => removeImage('logo')}>
                                    <X className="mr-2 h-4 w-4" /> Remove logo
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Favicon</Label>
                            <div className="flex flex-col items-center gap-2">
                                <Label htmlFor="favicon-upload" className="cursor-pointer w-full">
                                    <div className="aspect-square w-24 h-24 rounded-md bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed">
                                    {faviconPreview ? (
                                        <Image src={faviconPreview} alt="Favicon Preview" width={96} height={96} className="object-contain" />
                                    ) : (
                                        <div className="text-center text-muted-foreground p-2">
                                            <Upload className="mx-auto h-6 w-6 mb-1"/>
                                            <p className="text-xs">Upload Favicon</p>
                                        </div>
                                    )}
                                    </div>
                                </Label>
                                <Input id="favicon-upload" type="file" accept="image/png,image/x-icon,image/svg+xml" className="hidden" onChange={(e) => handleImageChange(e, 'favicon')} />
                                {faviconPreview && (
                                    <Button variant="link" size="sm" className="text-destructive" onClick={() => removeImage('favicon')}>
                                    <X className="mr-2 h-4 w-4" /> Remove favicon
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    </div>
                    <div className="flex justify-end">
                    <Button onClick={handleSave}>Save Settings</Button>
                    </div>
                </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="maintenance">
                <BulkDeleteSection />
            </TabsContent>
        </Tabs>
    </div>
  );
}
