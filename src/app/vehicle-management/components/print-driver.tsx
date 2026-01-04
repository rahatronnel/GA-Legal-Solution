"use client";

import React from 'react';
import { usePrint } from './print-provider';
import { DriverPrintLayout } from './driver-print-layout';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Vehicle } from './vehicle-table';

export const PrintDriver = () => {
  const { driverToPrint } = usePrint();
  const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);


  if (!driverToPrint) {
    return null;
  }

  return (
    <div className="hidden print:block">
      <DriverPrintLayout driver={driverToPrint} vehicles={vehicles} />
    </div>
  );
};