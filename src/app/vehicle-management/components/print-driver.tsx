
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
import type { Designation, OrganizationSettings } from '@/app/user-management/components/designation-table';
import type { Trip } from './trip-entry-form';
import type { TripPurpose } from './trip-purpose-table';
import type { Location } from './location-table';
import { TripPrintLayout } from './trip-print-layout';
import type { ExpenseType } from './expense-type-table';
import type { VehicleBrand } from './vehicle-brand-table';
import type { Accident } from './accident-entry-form';
import { AccidentPrintLayout } from './accident-print-layout';
import type { AccidentType } from './accident-type-table';
import type { SeverityLevel } from './severity-level-table';
import type { FaultStatus } from './fault-status-table';
import type { ServiceCenter } from './service-center-table';
import type { Route } from './route-table';


export const PrintDriver = () => {
  const { itemToPrint, printType } = usePrint();
  const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [drivers] = useLocalStorage<Driver[]>('drivers', []);
  const [employees] = useLocalStorage<Employee[]>('employees', []);
  const [vehicleTypes] = useLocalStorage<VehicleType[]>('vehicleTypes', []);
  const [vehicleBrands] = useLocalStorage<VehicleBrand[]>('vehicleBrands', []);
  const [sections] = useLocalStorage<Section[]>('sections', []);
  const [designations] = useLocalStorage<Designation[]>('designations', []);
  const [purposes] = useLocalStorage<TripPurpose[]>('tripPurposes', []);
  const [locations] = useLocalStorage<Location[]>('locations', []);
  const [expenseTypes] = useLocalStorage<ExpenseType[]>('expenseTypes', []);
  const [trips] = useLocalStorage<Trip[]>('trips', []);
  const [accidentTypes] = useLocalStorage<AccidentType[]>('accidentTypes', []);
  const [severityLevels] = useLocalStorage<SeverityLevel[]>('severityLevels', []);
  const [faultStatuses] = useLocalStorage<FaultStatus[]>('faultStatuses', []);
  const [serviceCenters] = useLocalStorage<ServiceCenter[]>('serviceCenters', []);
  const [routes] = useLocalStorage<Route[]>('routes', []);
  const [organizationSettings] = useLocalStorage<OrganizationSettings>('organizationSettings', {} as OrganizationSettings);


  if (!itemToPrint) {
    return null;
  }

  const renderContent = () => {
      switch(printType) {
          case 'driver':
              return <DriverPrintLayout driver={itemToPrint as Driver} vehicles={vehicles} orgSettings={organizationSettings} />;
          case 'vehicle':
              return <VehiclePrintLayout vehicle={itemToPrint as Vehicle} drivers={drivers} vehicleTypes={vehicleTypes} vehicleBrands={vehicleBrands} orgSettings={organizationSettings} />;
          case 'employee':
              return <EmployeePrintLayout employee={itemToPrint as Employee} sections={sections} designations={designations} orgSettings={organizationSettings} />;
          case 'trip':
              return <TripPrintLayout trip={itemToPrint as Trip} vehicles={vehicles} drivers={drivers} purposes={purposes} locations={locations} expenseTypes={expenseTypes} orgSettings={organizationSettings} />;
          case 'accident':
              return <AccidentPrintLayout accident={itemToPrint as Accident} vehicles={vehicles} drivers={drivers} employees={employees} routes={routes} trips={trips} accidentTypes={accidentTypes} severityLevels={severityLevels} faultStatuses={faultStatuses} repairedBy={serviceCenters} orgSettings={organizationSettings} />;
          default:
              return null;
      }
  }

  return (
    <div id="report-content">
        {renderContent()}
    </div>
  );
};
