"use client";
import { ProcurementProvider } from "./components/procurement-provider";

export default function LocalPurchaseLayout({ children }: { children: React.ReactNode }) {
  return <ProcurementProvider>{children}</ProcurementProvider>;
}
