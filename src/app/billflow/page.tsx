
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon, Settings, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VendorCategoryTable } from "./components/vendor-category-table";
import { VendorNatureOfBusinessTable } from "./components/vendor-nature-of-business-table";
import { VendorTable } from "./components/vendor-table";
import { BillTypeTable } from "./components/bill-type-table";
import { BillCategoryTable } from "./components/bill-category-table";
import { BillTable } from "./components/bill-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillFlowProvider, BillDataProvider, VendorDataProvider, MasterDataProvider } from "./components/bill-flow-provider";
import { BillItemMasterTable } from "./components/bill-item-master-table";
import { BillItemCategoryTable } from "./components/bill-item-category-table";
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useCollection } from "@/firebase";
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { doc, collection } from 'firebase/firestore';
import type { OrganizationSettings } from '../settings/page';
import type { Employee } from '../user-management/components/employee-entry-form';

function ApprovalSettingsTab() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
    const { data: orgSettings, isLoading: isLoadingSettings } = useDoc<OrganizationSettings>(settingsDocRef);
    
    const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);

    const [approverId, setApproverId] = useState('');

    useEffect(() => {
        if (orgSettings) {
            setApproverId(orgSettings.billApproverId || '');
        }
    }, [orgSettings]);

    const handleSave = () => {
        if (!settingsDocRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            return;
        }
        setDocumentNonBlocking(settingsDocRef, { billApproverId: approverId }, { merge: true });
        toast({ title: 'Success', description: 'Approval settings saved.' });
    };

    if (isLoadingSettings || isLoadingEmployees) {
        return <p>Loading settings...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bill Approval Settings</CardTitle>
                <CardDescription>Designate an employee who is responsible for approving bills.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 max-w-sm">
                    <Label htmlFor="approver">Designated Approver</Label>
                    <Select value={approverId} onValueChange={setApproverId}>
                        <SelectTrigger id="approver">
                            <SelectValue placeholder="Select an employee..." />
                        </SelectTrigger>
                        <SelectContent>
                            {(employees || []).map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleSave}>Save Settings</Button>
            </CardContent>
        </Card>
    );
}


function BillFlowContent() {
    const { user } = useUser();
    const isSuperAdmin = user?.email === 'superadmin@galsolution.com';

    return (
      <div className="space-y-6">
        <div className="flex justify-end">
            <Button size="sm" variant="outline" asChild className="bg-black text-white hover:bg-gray-800">
                <Link href="/">
                    <HomeIcon className="h-4 w-4 mr-2" /> Home
                </Link>
            </Button>
        </div>
        <Tabs defaultValue="bills" className="w-full">
          <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="master">Master Data</TabsTrigger>
              {isSuperAdmin && <TabsTrigger value="approval-settings">Approval Settings</TabsTrigger>}
          </TabsList>
          <TabsContent value="bills">
            <BillDataProvider>
                <Card>
                    <CardHeader>
                        <CardTitle>Bills</CardTitle>
                        <CardDescription>Manage all submitted bills and their approval status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MasterDataProvider>
                        <BillTable />
                      </MasterDataProvider>
                    </CardContent>
                </Card>
            </BillDataProvider>
          </TabsContent>
          <TabsContent value="vendors">
            <VendorDataProvider>
                <Card>
                    <CardHeader>
                        <CardTitle>Vendors</CardTitle>
                        <CardDescription>Manage your organization's vendors and their information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <VendorTable />
                    </CardContent>
                </Card>
            </VendorDataProvider>
          </TabsContent>
          <TabsContent value="master" className="space-y-6">
            <MasterDataProvider>
              <Tabs defaultValue="bill-items" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="bill-items">Bill Items</TabsTrigger>
                  <TabsTrigger value="bill-item-categories">Bill Item Categories</TabsTrigger>
                  <TabsTrigger value="vendor-categories">Vendor Categories</TabsTrigger>
                  <TabsTrigger value="vendor-nature">Vendor Nature of Business</TabsTrigger>
                  <TabsTrigger value="bill-types">Bill Types</TabsTrigger>
                  <TabsTrigger value="bill-categories">Bill Categories</TabsTrigger>
                </TabsList>
                <TabsContent value="bill-items" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle>Bill Items</CardTitle><CardDescription>Manage the master list of billable items and services.</CardDescription></CardHeader>
                    <CardContent><BillItemMasterTable /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="bill-item-categories" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle>Bill Item Categories</CardTitle><CardDescription>Manage categories for your billable items.</CardDescription></CardHeader>
                    <CardContent><BillItemCategoryTable /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="vendor-categories" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle>Vendor Categories</CardTitle><CardDescription>Manage the categories for your vendors.</CardDescription></CardHeader>
                    <CardContent><VendorCategoryTable /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="vendor-nature" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle>Vendor Nature of Business</CardTitle><CardDescription>Manage the nature of business for your vendors.</CardDescription></CardHeader>
                    <CardContent><VendorNatureOfBusinessTable /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="bill-types" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle>Bill Types</CardTitle><CardDescription>Manage the different types of bills (e.g., Purchase, Service).</CardDescription></CardHeader>
                    <CardContent><BillTypeTable /></CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="bill-categories" className="mt-4">
                   <Card>
                    <CardHeader><CardTitle>Bill Categories</CardTitle><CardDescription>Manage the categories for your bills.</CardDescription></CardHeader>
                    <CardContent><BillCategoryTable /></CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </MasterDataProvider>
          </TabsContent>
           {isSuperAdmin && (
              <TabsContent value="approval-settings">
                <ApprovalSettingsTab />
              </TabsContent>
            )}
        </Tabs>
      </div>
    );
}

export default function BillFlowPage() {
  return (
    <BillFlowProvider>
      <BillFlowContent />
    </BillFlowProvider>
  );
}
