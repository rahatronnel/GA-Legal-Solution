
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { VendorCategoryTable } from "./components/vendor-category-table";

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
              <CardTitle>Vendor Categories</CardTitle>
              <CardDescription>Manage the categories for your vendors. This is the first step in setting up the BillFlow system.</CardDescription>
          </CardHeader>
          <CardContent>
              <VendorCategoryTable />
          </CardContent>
      </Card>
    </div>
  );
}
