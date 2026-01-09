
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { VendorCategoryTable } from "./components/vendor-category-table";
import { VendorNatureOfBusinessTable } from "./components/vendor-nature-of-business-table";
import { VendorTable } from "./components/vendor-table";
import { BillTypeTable } from "./components/bill-type-table";
import { BillCategoryTable } from "./components/bill-category-table";
import { BillTable } from "./components/bill-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function BillFlowPage() {

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>BillFlow Management</CardTitle>
          <CardDescription>
            This bill represents verified expenses submitted internally, reviewed by the supervisor, approved by the reviewer, and finalized by the authorized signatory with all supporting documents attached.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="bills" className="w-full">
        <TabsList>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="master">Master Data</TabsTrigger>
        </TabsList>
        <TabsContent value="bills">
          <Card>
              <CardHeader>
                  <CardTitle>Bills</CardTitle>
                  <CardDescription>Manage all submitted bills and their approval status.</CardDescription>
              </CardHeader>
              <CardContent>
                  <BillTable />
              </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vendors">
           <Card>
              <CardHeader>
                  <CardTitle>Vendors</CardTitle>
                  <CardDescription>Manage your organization's vendors and their information.</CardDescription>
              </CardHeader>
              <CardContent>
                  <VendorTable />
              </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="master" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Vendor Categories</CardTitle>
                    <CardDescription>Manage the categories for your vendors.</CardDescription>
                </CardHeader>
                <CardContent>
                    <VendorCategoryTable />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Vendor Nature of Business</CardTitle>
                    <CardDescription>Manage the nature of business for your vendors.</CardDescription>
                </CardHeader>
                <CardContent>
                    <VendorNatureOfBusinessTable />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Bill Types</CardTitle>
                    <CardDescription>Manage the different types of bills (e.g., Purchase, Service).</CardDescription>
                </CardHeader>
                <CardContent>
                    <BillTypeTable />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Bill Categories</CardTitle>
                    <CardDescription>Manage the categories for your bills.</CardDescription>
                </CardHeader>
                <CardContent>
                    <BillCategoryTable />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
