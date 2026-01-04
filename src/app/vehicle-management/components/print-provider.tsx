
"use client";

import React, { createContext, useContext, useState } from 'react';
import type { Driver } from './driver-entry-form';

interface PrintContextType {
  driverToPrint: Driver | null;
  handlePrint: (driver: Driver) => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export const PrintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [driverToPrint, setDriverToPrint] = useState<Driver | null>(null);

  const handlePrint = (driver: Driver) => {
    setDriverToPrint(driver);
    // Use a timeout to allow the state to update before triggering the print dialog
    setTimeout(() => {
      window.print();
      setDriverToPrint(null); // Clear after printing
    }, 100);
  };

  return (
    <PrintContext.Provider value={{ driverToPrint, handlePrint }}>
      {children}
    </PrintContext.Provider>
  );
};

export const usePrint = () => {
  const context = useContext(PrintContext);
  if (context === undefined) {
    throw new Error('usePrint must be used within a PrintProvider');
  }
  return context;
};
