
"use client";

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

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

export type VehicleManagementData = {
    locations: Location[];
    drivers: Driver[];
    trips: Trip[];
    routes: Route[];
    tripPurposes: TripPurpose[];
    expenseTypes: ExpenseType[];
    maintenanceRecords: MaintenanceRecord[];
    parts: Part[];
    serviceCenters: ServiceCenter[];
    maintenanceTypes: MaintenanceType[];
    maintenanceExpenseTypes: MaintenanceExpenseType[];
    accidents: Accident[];
    accidentTypes: AccidentType[];
    severityLevels: SeverityLevel[];
    faultStatuses: FaultStatus[];
    vehicles: Vehicle[];
    vehicleBrands: VehicleBrand[];
    vehicleTypes: VehicleType[];
    employees: Employee[];
};

type VehicleManagementDataContextType = {
    data: Partial<VehicleManagementData>;
    setData: (newData: Partial<VehicleManagementData>) => void;
    isLoading: boolean;
};

const VehicleManagementContext = createContext<VehicleManagementDataContextType | undefined>(undefined);

export function VehicleManagementProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();
    
    // Most data is small and can be fetched once. For larger collections, consider pagination or specific queries.
    const { data: locations, isLoading: l1 } = useCollection<Location>(useMemoFirebase(() => firestore ? collection(firestore, 'locations') : null, [firestore]));
    const { data: routes, isLoading: l2 } = useCollection<Route>(useMemoFirebase(() => firestore ? collection(firestore, 'routes') : null, [firestore]));
    const { data: tripPurposes, isLoading: l3 } = useCollection<TripPurpose>(useMemoFirebase(() => firestore ? collection(firestore, 'tripPurposes') : null, [firestore]));
    const { data: expenseTypes, isLoading: l4 } = useCollection<ExpenseType>(useMemoFirebase(() => firestore ? collection(firestore, 'expenseTypes') : null, [firestore]));
    const { data: maintenanceTypes, isLoading: l5 } = useCollection<MaintenanceType>(useMemoFirebase(() => firestore ? collection(firestore, 'maintenanceTypes') : null, [firestore]));
    const { data: maintenanceExpenseTypes, isLoading: l6 } = useCollection<MaintenanceExpenseType>(useMemoFirebase(() => firestore ? collection(firestore, 'maintenanceExpenseTypes') : null, [firestore]));
    const { data: parts, isLoading: l7 } = useCollection<Part>(useMemoFirebase(() => firestore ? collection(firestore, 'parts') : null, [firestore]));
    const { data: serviceCenters, isLoading: l8 } = useCollection<ServiceCenter>(useMemoFirebase(() => firestore ? collection(firestore, 'serviceCenters') : null, [firestore]));
    const { data: accidentTypes, isLoading: l9 } = useCollection<AccidentType>(useMemoFirebase(() => firestore ? collection(firestore, 'accidentTypes') : null, [firestore]));
    const { data: severityLevels, isLoading: l10 } = useCollection<SeverityLevel>(useMemoFirebase(() => firestore ? collection(firestore, 'severityLevels') : null, [firestore]));
    const { data: faultStatuses, isLoading: l11 } = useCollection<FaultStatus>(useMemoFirebase(() => firestore ? collection(firestore, 'faultStatuses') : null, [firestore]));
    const { data: vehicleBrands, isLoading: l12 } = useCollection<VehicleBrand>(useMemoFirebase(() => firestore ? collection(firestore, 'vehicleBrands') : null, [firestore]));
    const { data: vehicleTypes, isLoading: l13 } = useCollection<VehicleType>(useMemoFirebase(() => firestore ? collection(firestore, 'vehicleTypes') : null, [firestore]));

    // Data still in localStorage (to be migrated if necessary)
    const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
    const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
    const [drivers, setDrivers] = useLocalStorage<Driver[]>('drivers', []);
    const [trips, setTrips] = useLocalStorage<Trip[]>('trips', []);
    const [maintenanceRecords, setMaintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [accidents, setAccidents] = useLocalStorage<Accident[]>('accidents', []);

    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13;

    const data = useMemo(() => ({
        locations: locations || [],
        routes: routes || [],
        tripPurposes: tripPurposes || [],
        expenseTypes: expenseTypes || [],
        maintenanceTypes: maintenanceTypes || [],
        maintenanceExpenseTypes: maintenanceExpenseTypes || [],
        parts: parts || [],
        serviceCenters: serviceCenters || [],
        accidentTypes: accidentTypes || [],
        severityLevels: severityLevels || [],
        faultStatuses: faultStatuses || [],
        vehicleBrands: vehicleBrands || [],
        vehicleTypes: vehicleTypes || [],
        employees,
        vehicles,
        drivers,
        trips,
        maintenanceRecords,
        accidents,
    }), [
        locations, routes, tripPurposes, expenseTypes, maintenanceTypes, maintenanceExpenseTypes,
        parts, serviceCenters, accidentTypes, severityLevels, faultStatuses, vehicleBrands, vehicleTypes,
        employees, vehicles, drivers, trips, maintenanceRecords, accidents
    ]);

    const setData = (updater: React.SetStateAction<any>) => {
       // This is complex because data is coming from two different sources (Firestore and localStorage)
       // For now, we only support updating the localStorage parts.
       const newState = typeof updater === 'function' ? updater(data) : updater;
       
       if (newState.employees) setEmployees(newState.employees);
       if (newState.vehicles) setVehicles(newState.vehicles);
       if (newState.drivers) setDrivers(newState.drivers);
       if (newState.trips) setTrips(newState.trips);
       if (newState.maintenanceRecords) setMaintenanceRecords(newState.maintenanceRecords);
       if (newState.accidents) setAccidents(newState.accidents);
    };

    const value = useMemo(() => ({
        data,
        setData,
        isLoading,
    }), [data, isLoading]);

    return (
        <VehicleManagementContext.Provider value={value}>
            {children}
        </VehicleManagementContext.Provider>
    );
}

export function useVehicleManagement() {
    const context = useContext(VehicleManagementContext);
    if (!context) {
        throw new Error('useVehicleManagement must be used within a VehicleManagementProvider');
    }
    return context;
}
