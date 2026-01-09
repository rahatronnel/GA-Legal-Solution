
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { VendorCategoryTable } from "./components/vendor-category-table";
import { VendorNatureOfBusinessTable } from "./components/vendor-nature-of-business-table";
import { VendorTable } from "./components/vendor-table";

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
      
      <Card>
          <CardHeader>
              <CardTitle>Vendors</CardTitle>
              <CardDescription>Manage your organization's vendors and their information.</CardDescription>
          </CardHeader>
          <CardContent>
              <VendorTable />
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Vendor Categories</CardTitle>
              <CardDescription>Manage the categories for your vendors. This is the first step in setting up the BillFlow system.</CardDescription>
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
    </div>
  );
}
