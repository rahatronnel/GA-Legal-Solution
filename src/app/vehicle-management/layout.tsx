"use client";

import { VehicleManagementProvider } from "@/app/vehicle-management/components/vehicle-management-provider";

export default function VehicleManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <VehicleManagementProvider>
      {children}
    </VehicleManagementProvider>
  );
}
