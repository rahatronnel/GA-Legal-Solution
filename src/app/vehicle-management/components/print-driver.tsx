"use client";

import React from 'react';
import { usePrint } from './print-provider';
import { DriverPrintLayout } from './driver-print-layout';
import { VehiclePrintLayout } from './vehicle-print-layout';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Vehicle } from './vehicle-table';
import type { Driver } from './driver-entry-form';
import type { VehicleType } from './vehicle-type-table';
import { EmployeePrintLayout } from '@/app/user-management/components/employee-print-layout';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Section } from '@/app/user-management/components/section-table';
import type { Designation } from '@/app/user-management/components/designation-table';


export const PrintDriver = () => {
  const { itemToPrint, printType } = usePrint();
  const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [drivers] = useLocalStorage<Driver[]>('drivers', []);
  const [vehicleTypes] = useLocalStorage<VehicleType[]>('vehicleTypes', []);
  const [sections] = useLocalStorage<Section[]>('sections', []);
  const [designations] = useLocalStorage<Designation[]>('designations', []);

  if (!itemToPrint) {
    return null;
  }

  return (
    <div className="hidden print:block">
      {printType === 'driver' && <DriverPrintLayout driver={itemToPrint as Driver} vehicles={vehicles} />}
      {printType === 'vehicle' && <VehiclePrintLayout vehicle={itemToPrint as Vehicle} drivers={drivers} vehicleTypes={vehicleTypes} />}
      {printType === 'employee' && <EmployeePrintLayout employee={itemToPrint as Employee} sections={sections} designations={designations} />}
    </div>
  );
};
