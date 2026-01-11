
"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

// Import all types
import type { Location } from "./location-table";
import type { Driver } from "./driver-entry-form";
import type { Trip } from "./trip-entry-form";
import type { Route } from "./route-table";
import type { TripPurpose } from "./trip-purpose-table";
import type { ExpenseType } from "./expense-type-table";
import type { MaintenanceRecord } from "./maintenance-entry-form";
import type { Part } from "./part-table";
import type { ServiceCenter } from "./service-center-table";
import type { MaintenanceType } from "./maintenance-type-table";
import type { MaintenanceExpenseType } from "./maintenance-expense-type-table";
import type { Accident } from "./accident-entry-form";
import type { AccidentType } from "./accident-type-table";
import type { SeverityLevel } from "./severity-level-table";
import type { FaultStatus } from "./fault-status-table";
import type { Vehicle } from "./vehicle-entry-form";
import type { VehicleBrand } from "./vehicle-brand-table";
import type { VehicleType } from "./vehicle-type-table";
import type { Employee } from '@/app/user-management/components/employee-entry-form';

// --- Context Definitions ---

const DriverDataContext = createContext<any>(undefined);
const VehicleDataContext = createContext<any>(undefined);
const TripDataContext = createContext<any>(undefined);
const MaintenanceDataContext = createContext<any>(undefined);
const AccidentDataContext = createContext<any>(undefined);
const MasterDataContext = createContext<any>(undefined);
const DashboardDataContext = createContext<any>(undefined);
const ReportsDataContext = createContext<any>(undefined);


// --- Provider Implementations ---

export const DriverDataProvider = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();
    const { data: drivers, isLoading: l1 } = useCollection<Driver>(useMemoFirebase(() => collection(firestore, 'drivers'), [firestore]));
    const { data: vehicles, isLoading: l2 } = useCollection<Vehicle>(useMemoFirebase(() => collection(firestore, 'vehicles'), [firestore]));
    const value = useMemo(() => ({ drivers: drivers || [], vehicles: vehicles || [], isLoading: l1 || l2 }), [drivers, vehicles, l1, l2]);
    return <DriverDataContext.Provider value={value}>{children}</DriverDataContext.Provider>;
}

export const VehicleDataProvider = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();
    const { data: vehicles, isLoading: l1 } = useCollection<Vehicle>(useMemoFirebase(() => collection(firestore, 'vehicles'), [firestore]));
    const { data: drivers, isLoading: l2 } = useCollection<Driver>(useMemoFirebase(() => collection(firestore, 'drivers'), [firestore]));
    const { data: vehicleTypes, isLoading: l3 } = useCollection<VehicleType>(useMemoFirebase(() => collection(firestore, 'vehicleTypes'), [firestore]));
    const { data: vehicleBrands, isLoading: l4 } = useCollection<VehicleBrand>(useMemoFirebase(() => collection(firestore, 'vehicleBrands'), [firestore]));
    const value = useMemo(() => ({ vehicles: vehicles || [], drivers: drivers || [], vehicleTypes: vehicleTypes || [], vehicleBrands: vehicleBrands || [], isLoading: l1 || l2 || l3 || l4 }), [vehicles, drivers, vehicleTypes, vehicleBrands, l1, l2, l3, l4]);
    return <VehicleDataContext.Provider value={value}>{children}</VehicleDataContext.Provider>;
}

export const TripDataProvider = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();
    const { data: trips, isLoading: l1 } = useCollection<Trip>(useMemoFirebase(() => collection(firestore, 'trips'), [firestore]));
    const { data: vehicles, isLoading: l2 } = useCollection<Vehicle>(useMemoFirebase(() => collection(firestore, 'vehicles'), [firestore]));
    const { data: drivers, isLoading: l3 } = useCollection<Driver>(useMemoFirebase(() => collection(firestore, 'drivers'), [firestore]));
    const { data: locations, isLoading: l4 } = useCollection<Location>(useMemoFirebase(() => collection(firestore, 'locations'), [firestore]));
    const { data: tripPurposes, isLoading: l5 } = useCollection<TripPurpose>(useMemoFirebase(() => collection(firestore, 'tripPurposes'), [firestore]));
    const { data: expenseTypes, isLoading: l6 } = useCollection<ExpenseType>(useMemoFirebase(() => collection(firestore, 'expenseTypes'), [firestore]));
    const { data: routes, isLoading: l7 } = useCollection<Route>(useMemoFirebase(() => collection(firestore, 'routes'), [firestore]));
    const value = useMemo(() => ({ trips: trips || [], vehicles: vehicles || [], drivers: drivers || [], locations: locations || [], tripPurposes: tripPurposes || [], expenseTypes: expenseTypes || [], routes: routes || [], isLoading: l1 || l2 || l3 || l4 || l5 || l6 || l7 }), [trips, vehicles, drivers, locations, tripPurposes, expenseTypes, routes, l1, l2, l3, l4, l5, l6, l7]);
    return <TripDataContext.Provider value={value}>{children}</TripDataContext.Provider>;
}

export const MaintenanceDataProvider = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();
    const { data: maintenanceRecords, isLoading: l1 } = useCollection<MaintenanceRecord>(useMemoFirebase(() => collection(firestore, 'maintenanceRecords'), [firestore]));
    const { data: vehicles, isLoading: l2 } = useCollection<Vehicle>(useMemoFirebase(() => collection(firestore, 'vehicles'), [firestore]));
    const { data: maintenanceTypes, isLoading: l3 } = useCollection<MaintenanceType>(useMemoFirebase(() => collection(firestore, 'maintenanceTypes'), [firestore]));
    const { data: drivers, isLoading: l4 } = useCollection<Driver>(useMemoFirebase(() => collection(firestore, 'drivers'), [firestore]));
    const { data: serviceCenters, isLoading: l5 } = useCollection<ServiceCenter>(useMemoFirebase(() => collection(firestore, 'serviceCenters'), [firestore]));
    const { data: employees, isLoading: l6 } = useCollection<Employee>(useMemoFirebase(() => collection(firestore, 'employees'), [firestore]));
    const { data: maintenanceExpenseTypes, isLoading: l7 } = useCollection<MaintenanceExpenseType>(useMemoFirebase(() => collection(firestore, 'maintenanceExpenseTypes'), [firestore]));
    const { data: parts, isLoading: l8 } = useCollection<Part>(useMemoFirebase(() => collection(firestore, 'parts'), [firestore]));
    const value = useMemo(() => ({ maintenanceRecords: maintenanceRecords || [], vehicles: vehicles || [], maintenanceTypes: maintenanceTypes || [], drivers: drivers || [], serviceCenters: serviceCenters || [], employees: employees || [], maintenanceExpenseTypes: maintenanceExpenseTypes || [], parts: parts || [], isLoading: l1||l2||l3||l4||l5||l6||l7||l8 }), [maintenanceRecords, vehicles, maintenanceTypes, drivers, serviceCenters, employees, maintenanceExpenseTypes, parts, l1,l2,l3,l4,l5,l6,l7,l8]);
    return <MaintenanceDataContext.Provider value={value}>{children}</MaintenanceDataContext.Provider>;
}

export const AccidentDataProvider = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();
    const { data: accidents, isLoading: l1 } = useCollection<Accident>(useMemoFirebase(() => collection(firestore, 'accidents'), [firestore]));
    const { data: vehicles, isLoading: l2 } = useCollection<Vehicle>(useMemoFirebase(() => collection(firestore, 'vehicles'), [firestore]));
    const { data: drivers, isLoading: l3 } = useCollection<Driver>(useMemoFirebase(() => collection(firestore, 'drivers'), [firestore]));
    const { data: accidentTypes, isLoading: l4 } = useCollection<AccidentType>(useMemoFirebase(() => collection(firestore, 'accidentTypes'), [firestore]));
    const { data: severityLevels, isLoading: l5 } = useCollection<SeverityLevel>(useMemoFirebase(() => collection(firestore, 'severityLevels'), [firestore]));
    const { data: routes, isLoading: l6 } = useCollection<Route>(useMemoFirebase(() => collection(firestore, 'routes'), [firestore]));
    const { data: faultStatuses, isLoading: l7 } = useCollection<FaultStatus>(useMemoFirebase(() => collection(firestore, 'faultStatuses'), [firestore]));
    const { data: employees, isLoading: l8 } = useCollection<Employee>(useMemoFirebase(() => collection(firestore, 'employees'), [firestore]));
    const { data: trips, isLoading: l9 } = useCollection<Trip>(useMemoFirebase(() => collection(firestore, 'trips'), [firestore]));
    const { data: serviceCenters, isLoading: l10 } = useCollection<ServiceCenter>(useMemoFirebase(() => collection(firestore, 'serviceCenters'), [firestore]));
    const value = useMemo(() => ({ accidents: accidents || [], vehicles: vehicles || [], drivers: drivers || [], accidentTypes: accidentTypes || [], severityLevels: severityLevels || [], routes: routes || [], faultStatuses: faultStatuses || [], employees: employees || [], trips: trips || [], serviceCenters: serviceCenters || [], isLoading: l1||l2||l3||l4||l5||l6||l7||l8||l9||l10 }), [accidents, vehicles, drivers, accidentTypes, severityLevels, routes, faultStatuses, employees, trips, serviceCenters, l1,l2,l3,l4,l5,l6,l7,l8,l9,l10]);
    return <AccidentDataContext.Provider value={value}>{children}</AccidentDataContext.Provider>;
}

export const MasterDataProvider = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();
    const { data: vehicleBrands, isLoading: l1 } = useCollection<VehicleBrand>(useMemoFirebase(() => collection(firestore, 'vehicleBrands'), [firestore]));
    const { data: vehicleTypes, isLoading: l2 } = useCollection<VehicleType>(useMemoFirebase(() => collection(firestore, 'vehicleTypes'), [firestore]));
    const { data: routes, isLoading: l3 } = useCollection<Route>(useMemoFirebase(() => collection(firestore, 'routes'), [firestore]));
    const { data: locations, isLoading: l4 } = useCollection<Location>(useMemoFirebase(() => collection(firestore, 'locations'), [firestore]));
    const { data: tripPurposes, isLoading: l5 } = useCollection<TripPurpose>(useMemoFirebase(() => collection(firestore, 'tripPurposes'), [firestore]));
    const { data: expenseTypes, isLoading: l6 } = useCollection<ExpenseType>(useMemoFirebase(() => collection(firestore, 'expenseTypes'), [firestore]));
    const { data: parts, isLoading: l7 } = useCollection<Part>(useMemoFirebase(() => collection(firestore, 'parts'), [firestore]));
    const { data: serviceCenters, isLoading: l8 } = useCollection<ServiceCenter>(useMemoFirebase(() => collection(firestore, 'serviceCenters'), [firestore]));
    const { data: maintenanceTypes, isLoading: l9 } = useCollection<MaintenanceType>(useMemoFirebase(() => collection(firestore, 'maintenanceTypes'), [firestore]));
    const { data: maintenanceExpenseTypes, isLoading: l10 } = useCollection<MaintenanceExpenseType>(useMemoFirebase(() => collection(firestore, 'maintenanceExpenseTypes'), [firestore]));
    const { data: accidentTypes, isLoading: l11 } = useCollection<AccidentType>(useMemoFirebase(() => collection(firestore, 'accidentTypes'), [firestore]));
    const { data: severityLevels, isLoading: l12 } = useCollection<SeverityLevel>(useMemoFirebase(() => collection(firestore, 'severityLevels'), [firestore]));
    const { data: faultStatuses, isLoading: l13 } = useCollection<FaultStatus>(useMemoFirebase(() => collection(firestore, 'faultStatuses'), [firestore]));
    const value = useMemo(() => ({ vehicleBrands: vehicleBrands||[], vehicleTypes: vehicleTypes||[], routes: routes||[], locations: locations||[], tripPurposes: tripPurposes||[], expenseTypes: expenseTypes||[], parts: parts||[], serviceCenters: serviceCenters||[], maintenanceTypes: maintenanceTypes||[], maintenanceExpenseTypes: maintenanceExpenseTypes||[], accidentTypes: accidentTypes||[], severityLevels: severityLevels||[], faultStatuses: faultStatuses||[], isLoading: l1||l2||l3||l4||l5||l6||l7||l8||l9||l10||l11||l12||l13 }), [vehicleBrands, vehicleTypes, routes, locations, tripPurposes, expenseTypes, parts, serviceCenters, maintenanceTypes, maintenanceExpenseTypes, accidentTypes, severityLevels, faultStatuses, l1,l2,l3,l4,l5,l6,l7,l8,l9,l10,l11,l12,l13]);
    return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>;
}

export const DashboardDataProvider = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();
    const { data: vehicles, isLoading: l1 } = useCollection<Vehicle>(useMemoFirebase(() => collection(firestore, 'vehicles'), [firestore]));
    const { data: drivers, isLoading: l2 } = useCollection<Driver>(useMemoFirebase(() => collection(firestore, 'drivers'), [firestore]));
    const { data: trips, isLoading: l3 } = useCollection<Trip>(useMemoFirebase(() => collection(firestore, 'trips'), [firestore]));
    const { data: accidents, isLoading: l4 } = useCollection<Accident>(useMemoFirebase(() => collection(firestore, 'accidents'), [firestore]));
    const { data: maintenanceRecords, isLoading: l5 } = useCollection<MaintenanceRecord>(useMemoFirebase(() => collection(firestore, 'maintenanceRecords'), [firestore]));
    const value = useMemo(() => ({ vehicles: vehicles||[], drivers: drivers||[], trips: trips||[], accidents: accidents||[], maintenanceRecords: maintenanceRecords||[], isLoading: l1||l2||l3||l4||l5 }), [vehicles, drivers, trips, accidents, maintenanceRecords, l1,l2,l3,l4,l5]);
    return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
};

export const ReportsDataProvider = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();
    const { data: accidents, isLoading: l1 } = useCollection<Accident>(useMemoFirebase(() => collection(firestore, 'accidents'), [firestore]));
    const { data: maintenanceRecords, isLoading: l2 } = useCollection<MaintenanceRecord>(useMemoFirebase(() => collection(firestore, 'maintenanceRecords'), [firestore]));
    const { data: vehicles, isLoading: l3 } = useCollection<Vehicle>(useMemoFirebase(() => collection(firestore, 'vehicles'), [firestore]));
    const { data: drivers, isLoading: l4 } = useCollection<Driver>(useMemoFirebase(() => collection(firestore, 'drivers'), [firestore]));
    const { data: parts, isLoading: l5 } = useCollection<Part>(useMemoFirebase(() => collection(firestore, 'parts'), [firestore]));
    const { data: serviceCenters, isLoading: l6 } = useCollection<ServiceCenter>(useMemoFirebase(() => collection(firestore, 'serviceCenters'), [firestore]));
    const { data: maintenanceTypes, isLoading: l7 } = useCollection<MaintenanceType>(useMemoFirebase(() => collection(firestore, 'maintenanceTypes'), [firestore]));
    const value = useMemo(() => ({ accidents: accidents||[], maintenanceRecords: maintenanceRecords||[], vehicles: vehicles||[], drivers: drivers||[], parts: parts||[], serviceCenters: serviceCenters||[], maintenanceTypes: maintenanceTypes||[], isLoading: l1||l2||l3||l4||l5||l6||l7 }), [accidents, maintenanceRecords, vehicles, drivers, parts, serviceCenters, maintenanceTypes, l1,l2,l3,l4,l5,l6,l7]);
    return <ReportsDataContext.Provider value={value}>{children}</ReportsDataContext.Provider>;
}


// --- Hooks for Consuming Data ---

export const useDriverData = () => useContext(DriverDataContext);
export const useVehicleData = () => useContext(VehicleDataContext);
export const useTripData = () => useContext(TripDataContext);
export const useMaintenanceData = () => useContext(MaintenanceDataContext);
export const useAccidentData = () => useContext(AccidentDataContext);
export const useMasterData = () => useContext(MasterDataContext);
export const useDashboardData = () => useContext(DashboardDataContext);
export const useReportsData = () => useContext(ReportsDataContext);


// Legacy hook for pages that need a mix of everything (like detail pages)
const VehicleManagementContext = createContext<any>(undefined);

export const VehicleManagementProvider = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();
    // This fetches everything, kept for pages that haven't been migrated yet.
    const { data: locations, isLoading: l1 } = useCollection<Location>(useMemoFirebase(() => collection(firestore, 'locations'), [firestore]));
    const { data: routes, isLoading: l2 } = useCollection<Route>(useMemoFirebase(() => collection(firestore, 'routes'), [firestore]));
    const { data: tripPurposes, isLoading: l3 } = useCollection<TripPurpose>(useMemoFirebase(() => collection(firestore, 'tripPurposes'), [firestore]));
    const { data: expenseTypes, isLoading: l4 } = useCollection<ExpenseType>(useMemoFirebase(() => collection(firestore, 'expenseTypes'), [firestore]));
    const { data: vehicleTypes, isLoading: l5 } = useCollection<VehicleType>(useMemoFirebase(() => collection(firestore, 'vehicleTypes'), [firestore]));
    const { data: vehicleBrands, isLoading: l6 } = useCollection<VehicleBrand>(useMemoFirebase(() => collection(firestore, 'vehicleBrands'), [firestore]));
    const { data: employees, isLoading: l7 } = useCollection<Employee>(useMemoFirebase(() => collection(firestore, 'employees'), [firestore]));
    const { data: drivers, isLoading: l8 } = useCollection<Driver>(useMemoFirebase(() => collection(firestore, 'drivers'), [firestore]));
    const { data: vehicles, isLoading: l9 } = useCollection<Vehicle>(useMemoFirebase(() => collection(firestore, 'vehicles'), [firestore]));
    const { data: trips, isLoading: l10 } = useCollection<Trip>(useMemoFirebase(() => collection(firestore, 'trips'), [firestore]));
    const { data: maintenanceTypes, isLoading: l11 } = useCollection<MaintenanceType>(useMemoFirebase(() => collection(firestore, 'maintenanceTypes'), [firestore]));
    const { data: maintenanceExpenseTypes, isLoading: l12 } = useCollection<MaintenanceExpenseType>(useMemoFirebase(() => collection(firestore, 'maintenanceExpenseTypes'), [firestore]));
    const { data: parts, isLoading: l13 } = useCollection<Part>(useMemoFirebase(() => collection(firestore, 'parts'), [firestore]));
    const { data: serviceCenters, isLoading: l14 } = useCollection<ServiceCenter>(useMemoFirebase(() => collection(firestore, 'serviceCenters'), [firestore]));
    const { data: maintenanceRecords, isLoading: l15 } = useCollection<MaintenanceRecord>(useMemoFirebase(() => collection(firestore, 'maintenanceRecords'), [firestore]));
    const { data: accidentTypes, isLoading: l16 } = useCollection<AccidentType>(useMemoFirebase(() => collection(firestore, 'accidentTypes'), [firestore]));
    const { data: severityLevels, isLoading: l17 } = useCollection<SeverityLevel>(useMemoFirebase(() => collection(firestore, 'severityLevels'), [firestore]));
    const { data: faultStatuses, isLoading: l18 } = useCollection<FaultStatus>(useMemoFirebase(() => collection(firestore, 'faultStatuses'), [firestore]));
    const { data: accidents, isLoading: l19 } = useCollection<Accident>(useMemoFirebase(() => collection(firestore, 'accidents'), [firestore]));
    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13 || l14 || l15 || l16 || l17 || l18 || l19;
    const data = useMemo(() => ({ locations, routes, tripPurposes, expenseTypes, vehicleTypes, vehicleBrands, employees, drivers, vehicles, trips, maintenanceTypes, maintenanceExpenseTypes, parts, serviceCenters, maintenanceRecords, accidentTypes, severityLevels, faultStatuses, accidents }), [locations, routes, tripPurposes, expenseTypes, vehicleTypes, vehicleBrands, employees, drivers, vehicles, trips, maintenanceTypes, maintenanceExpenseTypes, parts, serviceCenters, maintenanceRecords, accidentTypes, severityLevels, faultStatuses, accidents]);
    const value = useMemo(() => ({ data, isLoading }), [data, isLoading]);
    return <VehicleManagementContext.Provider value={value}>{children}</VehicleManagementContext.Provider>;
}

export function useVehicleManagement() {
    const context = useContext(VehicleManagementContext);
    if (!context) throw new Error('useVehicleManagement must be used within a VehicleManagementProvider');
    return context;
}
