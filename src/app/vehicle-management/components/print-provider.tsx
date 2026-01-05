
"use client";

import React, { createContext, useContext, useState } from 'react';
import type { Driver } from './driver-entry-form';
import type { Vehicle } from './vehicle-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Trip } from './trip-entry-form';
import type { Accident } from './accident-entry-form';

type PrintableItem = Driver | Vehicle | Employee | Trip | Accident;
type PrintType = 'driver' | 'vehicle' | 'employee' | 'trip' | 'accident';

interface PrintContextType {
  itemToPrint: PrintableItem | null;
  printType: PrintType | null;
  handlePrint: (item: PrintableItem, type: PrintType) => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export const PrintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [itemToPrint, setItemToPrint] = useState<PrintableItem | null>(null);
  const [printType, setPrintType] = useState<PrintType | null>(null);

  const handlePrint = (item: PrintableItem, type: PrintType) => {
    setItemToPrint(item);
    setPrintType(type);
    // Use a timeout to allow the state to update before triggering the print dialog
    setTimeout(() => {
      window.print();
      setItemToPrint(null); // Clear after printing
      setPrintType(null);
    }, 100);
  };

  return (
    <PrintContext.Provider value={{ itemToPrint, printType, handlePrint }}>
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
