
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { useUser } from "@/firebase";
import { ApprovalConfigTable } from "./components/approval-config-table";

function BillFlowContent() {
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
          <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="approval-config">Approval Config</TabsTrigger>
              <TabsTrigger value="master">Master Data</TabsTrigger>
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
           <TabsContent value="approval-config">
              <Card>
                  <CardHeader>
                      <CardTitle>Approval Configuration</CardTitle>
                      <CardDescription>Define rules and workflows for bill approvals.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <BillDataProvider>
                        <ApprovalConfigTable />
                      </BillDataProvider>
                  </CardContent>
              </Card>
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
        </Tabs>
      </div>
    );
}

export default function BillFlowPage() {
    const { isUserLoading } = useUser();

    if (isUserLoading) {
        return <div className="flex items-center justify-center h-full"><p>Loading Module...</p></div>
    }

  return (
    <BillFlowProvider>
      <BillFlowContent />
    </BillFlowProvider>
  );
}
