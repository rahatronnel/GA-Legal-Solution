
"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

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

const initialData = {
    locations: [] as Location[],
    drivers: [] as Driver[],
    trips: [] as Trip[],
    routes: [] as Route[],
    tripPurposes: [] as TripPurpose[],
    expenseTypes: [] as ExpenseType[],
    maintenanceRecords: [] as MaintenanceRecord[],
    parts: [] as Part[],
    serviceCenters: [] as ServiceCenter[],
    maintenanceTypes: [] as MaintenanceType[],
    maintenanceExpenseTypes: [] as MaintenanceExpenseType[],
    accidents: [] as Accident[],
    accidentTypes: [] as AccidentType[],
    severityLevels: [] as SeverityLevel[],
    faultStatuses: [] as FaultStatus[],
    vehicles: [] as Vehicle[],
    vehicleBrands: [] as VehicleBrand[],
    vehicleTypes: [] as VehicleType[],
};

type VehicleManagementDataContextType = {
    data: typeof initialData;
    setData: React.Dispatch<React.SetStateAction<typeof initialData>>;
};

const VehicleManagementContext = createContext<VehicleManagementDataContextType | undefined>(undefined);

export function VehicleManagementProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useLocalStorage('vehicleManagementData', initialData);

    const value = useMemo(() => ({
        data: data || initialData, // Ensure data is never null/undefined
        setData,
    }), [data, setData]);

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
