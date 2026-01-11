"use client";

import { VehicleManagementProvider } from "./components/vehicle-management-provider";

export default function VehicleManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <VehicleManagementProvider>
        {children}
    </VehicleManagementProvider>
  );
}
