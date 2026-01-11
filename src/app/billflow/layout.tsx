
"use client";

import { LegacyBillFlowProvider } from "./components/bill-flow-provider";

export default function BillFlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <LegacyBillFlowProvider>
      {children}
    </LegacyBillFlowProvider>
  );
}
