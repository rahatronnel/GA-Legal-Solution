
"use client";

import React from 'react';
import { usePrint } from './print-provider';
import { DriverPrintLayout } from './driver-print-layout';

export const PrintDriver = () => {
  const { driverToPrint } = usePrint();

  if (!driverToPrint) {
    return null;
  }

  return (
    <div className="hidden print:block">
      <DriverPrintLayout driver={driverToPrint} />
    </div>
  );
};
