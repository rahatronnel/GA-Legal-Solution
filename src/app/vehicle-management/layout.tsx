"use client";

// This layout file is no longer needed as the provider has been moved to the page component
// to allow for more granular data loading. This file can be removed, but for now we'll just
// pass children through.

export default function VehicleManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
