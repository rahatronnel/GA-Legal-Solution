
"use client";

import { LegacyBillFlowProvider } from "./components/bill-flow-provider";
import { MasterDataProvider } from "./components/bill-flow-provider";

export default function BillFlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <LegacyBillFlowProvider>
      <MasterDataProvider>
        {children}
      </MasterDataProvider>
    </LegacyBillFlowProvider>
  );
}
