
"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
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
    data: VehicleManagementData;
    isLoading: boolean;
};

const VehicleManagementContext = createContext<VehicleManagementDataContextType | undefined>(undefined);

const VehicleManagementDataContent = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const shouldFetch = !isUserLoading && !!user;

    const { data: locations, isLoading: l1 } = useCollection<Location>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'locations') : null, [firestore, shouldFetch]));
    const { data: routes, isLoading: l2 } = useCollection<Route>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'routes') : null, [firestore, shouldFetch]));
    const { data: tripPurposes, isLoading: l3 } = useCollection<TripPurpose>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'tripPurposes') : null, [firestore, shouldFetch]));
    const { data: expenseTypes, isLoading: l4 } = useCollection<ExpenseType>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'expenseTypes') : null, [firestore, shouldFetch]));
    const { data: vehicleTypes, isLoading: l5 } = useCollection<VehicleType>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'vehicleTypes') : null, [firestore, shouldFetch]));
    const { data: vehicleBrands, isLoading: l6 } = useCollection<VehicleBrand>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'vehicleBrands') : null, [firestore, shouldFetch]));
    const { data: employees, isLoading: l7 } = useCollection<Employee>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'employees') : null, [firestore, shouldFetch]));
    const { data: drivers, isLoading: l8 } = useCollection<Driver>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'drivers') : null, [firestore, shouldFetch]));
    const { data: vehicles, isLoading: l9 } = useCollection<Vehicle>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'vehicles') : null, [firestore, shouldFetch]));
    const { data: trips, isLoading: l10 } = useCollection<Trip>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'trips') : null, [firestore, shouldFetch]));
    const { data: maintenanceTypes, isLoading: l11 } = useCollection<MaintenanceType>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'maintenanceTypes') : null, [firestore, shouldFetch]));
    const { data: maintenanceExpenseTypes, isLoading: l12 } = useCollection<MaintenanceExpenseType>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'maintenanceExpenseTypes') : null, [firestore, shouldFetch]));
    const { data: parts, isLoading: l13 } = useCollection<Part>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'parts') : null, [firestore, shouldFetch]));
    const { data: serviceCenters, isLoading: l14 } = useCollection<ServiceCenter>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'serviceCenters') : null, [firestore, shouldFetch]));
    const { data: maintenanceRecords, isLoading: l15 } = useCollection<MaintenanceRecord>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'maintenanceRecords') : null, [firestore, shouldFetch]));
    const { data: accidentTypes, isLoading: l16 } = useCollection<AccidentType>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'accidentTypes') : null, [firestore, shouldFetch]));
    const { data: severityLevels, isLoading: l17 } = useCollection<SeverityLevel>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'severityLevels') : null, [firestore, shouldFetch]));
    const { data: faultStatuses, isLoading: l18 } = useCollection<FaultStatus>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'faultStatuses') : null, [firestore, shouldFetch]));
    const { data: accidents, isLoading: l19 } = useCollection<Accident>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'accidents') : null, [firestore, shouldFetch]));

    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13 || l14 || l15 || l16 || l17 || l18 || l19;

    const data = useMemo(() => ({
        locations: locations || [],
        routes: routes || [],
        tripPurposes: tripPurposes || [],
        expenseTypes: expenseTypes || [],
        vehicleTypes: vehicleTypes || [],
        vehicleBrands: vehicleBrands || [],
        employees: employees || [],
        drivers: drivers || [],
        vehicles: vehicles || [],
        trips: trips || [],
        maintenanceTypes: maintenanceTypes || [],
        maintenanceExpenseTypes: maintenanceExpenseTypes || [],
        parts: parts || [],
        serviceCenters: serviceCenters || [],
        maintenanceRecords: maintenanceRecords || [],
        accidentTypes: accidentTypes || [],
        severityLevels: severityLevels || [],
        faultStatuses: faultStatuses || [],
        accidents: accidents || [],
    }), [
        locations, routes, tripPurposes, expenseTypes, vehicleTypes, vehicleBrands, employees,
        drivers, vehicles, trips, maintenanceTypes, maintenanceExpenseTypes, parts, serviceCenters,
        maintenanceRecords, accidentTypes, severityLevels, faultStatuses, accidents
    ]);
    
    const value = useMemo(() => ({
        data,
        isLoading,
    }), [data, isLoading]);

    if (isLoading && shouldFetch) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Loading Vehicle Data...</p>
            </div>
        );
    }
    
    return (
        <VehicleManagementContext.Provider value={value}>
            {children}
        </VehicleManagementContext.Provider>
    );
}

export function VehicleManagementProvider({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();

     if (isUserLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Verifying authentication...</p>
            </div>
        );
    }

    if (!user) {
        // This can happen briefly between states. By not rendering children,
        // we prevent premature data fetching attempts.
        return null;
    }

    return <VehicleManagementDataContent>{children}</VehicleManagementDataContent>;
}

export function useVehicleManagement() {
    const context = useContext(VehicleManagementContext);
    if (!context) {
        throw new Error('useVehicleManagement must be used within a VehicleManagementProvider');
    }
    return { data: context.data, isLoading: context.isLoading };
}
