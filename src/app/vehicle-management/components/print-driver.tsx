
"use client";

import React from 'react';
import { usePrint } from './print-provider';
import { DriverPrintLayout } from './driver-print-layout';
import { VehiclePrintLayout } from './vehicle-print-layout';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Vehicle } from './vehicle-table';
import type { Driver } from './driver-entry-form';
import type { VehicleType } from './vehicle-type-table';
import { EmployeePrintLayout } from '@/app/user-management/components/employee-print-layout';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Section } from '@/app/user-management/components/section-table';
import type { Designation } from '@/app/user-management/components/designation-table';
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
import type { OrganizationSettings } from '@/app/settings/page';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import type { VendorCategory } from '@/app/billflow/components/vendor-category-table';
import type { VendorNatureOfBusiness } from '@/app/billflow/components/vendor-nature-of-business-table';
import { VendorPrintLayout } from '@/app/billflow/components/vendor-print-layout';
import { collection } from 'firebase/firestore';
import type { Bill } from '@/app/billflow/components/bill-entry-form';
import { BillPrintLayout } from '@/app/billflow/components/bill-print-layout';
import type { BillType } from '@/app/billflow/components/bill-type-table';
import type { BillCategory } from '@/app/billflow/components/bill-category-table';
import type { BillItemCategory } from '@/app/billflow/components/bill-item-category-table';

export const PrintDriver = () => {
  const { itemToPrint, printType } = usePrint();
  const firestore = useFirestore();

  // Vehicle Management Data
  const { data: vehicles } = useCollection<Vehicle>(useMemoFirebase(() => firestore ? collection(firestore, 'vehicles') : null, [firestore]));
  const { data: drivers } = useCollection<Driver>(useMemoFirebase(() => firestore ? collection(firestore, 'drivers') : null, [firestore]));
  const { data: vehicleTypes } = useCollection<VehicleType>(useMemoFirebase(() => firestore ? collection(firestore, 'vehicleTypes') : null, [firestore]));
  const { data: vehicleBrands } = useCollection<VehicleBrand>(useMemoFirebase(() => firestore ? collection(firestore, 'vehicleBrands') : null, [firestore]));
  const { data: trips } = useCollection<Trip>(useMemoFirebase(() => firestore ? collection(firestore, 'trips') : null, [firestore]));
  const { data: purposes } = useCollection<TripPurpose>(useMemoFirebase(() => firestore ? collection(firestore, 'tripPurposes') : null, [firestore]));
  const { data: locations } = useCollection<Location>(useMemoFirebase(() => firestore ? collection(firestore, 'locations') : null, [firestore]));
  const { data: expenseTypes } = useCollection<ExpenseType>(useMemoFirebase(() => firestore ? collection(firestore, 'expenseTypes') : null, [firestore]));
  const { data: accidents } = useCollection<Accident>(useMemoFirebase(() => firestore ? collection(firestore, 'accidents') : null, [firestore]));
  const { data: accidentTypes } = useCollection<AccidentType>(useMemoFirebase(() => firestore ? collection(firestore, 'accidentTypes') : null, [firestore]));
  const { data: severityLevels } = useCollection<SeverityLevel>(useMemoFirebase(() => firestore ? collection(firestore, 'severityLevels') : null, [firestore]));
  const { data: faultStatuses } = useCollection<FaultStatus>(useMemoFirebase(() => firestore ? collection(firestore, 'faultStatuses') : null, [firestore]));
  const { data: serviceCenters } = useCollection<ServiceCenter>(useMemoFirebase(() => firestore ? collection(firestore, 'serviceCenters') : null, [firestore]));
  const { data: routes } = useCollection<Route>(useMemoFirebase(() => firestore ? collection(firestore, 'routes') : null, [firestore]));

  // User Management Data
  const { data: employees } = useCollection<Employee>(useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]));
  const { data: sections } = useCollection<Section>(useMemoFirebase(() => firestore ? collection(firestore, 'sections') : null, [firestore]));
  const { data: designations } = useCollection<Designation>(useMemoFirebase(() => firestore ? collection(firestore, 'designations') : null, [firestore]));
  
  // Settings Data
  const { data: organizationSettings } = useCollection<OrganizationSettings>(useMemoFirebase(() => firestore ? collection(firestore, 'settings') : null, [firestore]));
  
  // BillFlow Data
  const { data: vendors } = useCollection<Vendor>(useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]));
  const { data: vendorCategories } = useCollection<VendorCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorCategories') : null, [firestore]));
  const { data: vendorNatures } = useCollection<VendorNatureOfBusiness>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorNatureOfBusiness') : null, [firestore]));
  const { data: billTypes } = useCollection<BillType>(useMemoFirebase(() => firestore ? collection(firestore, 'billTypes') : null, [firestore]));
  const { data: billCategories } = useCollection<BillCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'billCategories') : null, [firestore]));
  const { data: billItemCategories } = useCollection<BillItemCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'billItemCategories') : null, [firestore]));


  if (!itemToPrint) {
    return null;
  }
  
  const orgSettings = (organizationSettings && organizationSettings[0]) || {} as OrganizationSettings;

  const renderContent = () => {
      switch(printType) {
          case 'driver':
              return <DriverPrintLayout driver={itemToPrint as Driver} vehicles={vehicles || []} orgSettings={orgSettings} />;
          case 'vehicle':
              return <VehiclePrintLayout vehicle={itemToPrint as Vehicle} drivers={drivers || []} vehicleTypes={vehicleTypes || []} vehicleBrands={vehicleBrands || []} orgSettings={orgSettings} />;
          case 'employee':
              return <EmployeePrintLayout employee={itemToPrint as Employee} sections={sections || []} designations={designations || []} orgSettings={orgSettings} />;
          case 'trip':
              return <TripPrintLayout trip={itemToPrint as Trip} vehicles={vehicles || []} drivers={drivers || []} purposes={purposes || []} locations={locations || []} expenseTypes={expenseTypes || []} orgSettings={orgSettings} />;
          case 'accident':
              return <AccidentPrintLayout accident={itemToPrint as Accident} vehicles={vehicles || []} drivers={drivers || []} employees={employees || []} routes={routes || []} trips={trips || []} accidentTypes={accidentTypes || []} severityLevels={severityLevels || []} faultStatuses={faultStatuses || []} repairedBy={serviceCenters || []} orgSettings={orgSettings} />;
          case 'vendor':
              return <VendorPrintLayout vendor={itemToPrint as Vendor} categories={vendorCategories || []} naturesOfBusiness={vendorNatures || []} orgSettings={orgSettings} />;
          case 'bill':
              const bill = itemToPrint as Bill;
              const vendor = vendors?.find(v => v.id === bill.vendorId);
              const billType = billTypes?.find(bt => bt.id === bill.billTypeId);
              const billCategory = billCategories?.find(bc => bc.id === bill.billCategoryId);
              const employee = employees?.find(e => e.id === bill.entryBy);
              return <BillPrintLayout bill={bill} vendor={vendor} billType={billType} billCategory={billCategory} billItemCategories={billItemCategories || []} employee={employee} orgSettings={orgSettings} />;
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
