
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleTypeTable } from "./components/vehicle-type-table";
import { DriverTable } from "./components/driver-table";
import { VehicleTable } from "./components/vehicle-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TripPurposeTable } from "./components/trip-purpose-table";
import { LocationTable } from "./components/location-table";
import { RouteTable } from "./components/route-table";
import { TripTable } from "./components/trip-table";
import { ExpenseTypeTable } from "./components/expense-type-table";
import { MaintenanceTypeTable } from "./components/maintenance-type-table";
import { MaintenanceExpenseTypeTable } from "./components/maintenance-expense-type-table";
import { ServiceCenterTable } from "./components/service-center-table";
import { MaintenanceRecordTable } from "./components/maintenance-record-table";
import { PartTable } from "./components/part-table";
import { AccidentTable } from "./components/accident-table";
import { AccidentTypeTable } from "./components/accident-type-table";
import { SeverityLevelTable } from "./components/severity-level-table";
import { FaultStatusTable } from "./components/fault-status-table";
import ReportsPage from "./reports/page";
import { VehicleBrandTable } from "./components/vehicle-brand-table";
import { useVehicleManagement } from './components/vehicle-management-provider';
import { Dashboard } from "./components/Dashboard";
import { ModuleHeader } from '@/app/components/module-header';

function VehicleManagementContent() {
  const { isLoading } = useVehicleManagement();

  if (isLoading) {
      return <div className="flex items-center justify-center h-full"><p>Loading Module Data...</p></div>
  }

  return (
    <div className="space-y-4">
        <ModuleHeader />
        <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="accidents">Accidents</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="master-data">Master Data</TabsTrigger>
            </TabsList>
        <TabsContent value="dashboard">
            <Card>
                <CardHeader><CardTitle>Dashboard</CardTitle><CardDescription>An overview of your vehicle fleet and operations.</CardDescription></CardHeader>
                <CardContent><Dashboard /></CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="trips">
            <Card>
                <CardHeader>
                    <CardTitle>Trips</CardTitle>
                    <CardDescription>Manage all vehicle trips.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TripTable />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="vehicles">
            <VehicleTable />
        </TabsContent>
        <TabsContent value="drivers">
            <Card>
                <CardHeader>
                    <CardTitle>Drivers</CardTitle>
                    <CardDescription>Manage your organization's drivers and their documents.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DriverTable />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="maintenance">
            <Card>
            <CardHeader>
                <CardTitle>Maintenance Records</CardTitle>
                <CardDescription>Log and track all vehicle maintenance activities.</CardDescription>
            </CardHeader>
            <CardContent>
                <MaintenanceRecordTable />
            </CardContent>
        </Card>
        </TabsContent>
        <TabsContent value="accidents">
            <Card>
                <CardHeader>
                    <CardTitle>Accident Records</CardTitle>
                    <CardDescription>Manage and track all vehicle accident reports and history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AccidentTable />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="reports">
            <ReportsPage />
        </TabsContent>
        <TabsContent value="master-data" className="pt-4">
             <Tabs defaultValue="vehicle-master" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="vehicle-master">Vehicle Master</TabsTrigger>
                    <TabsTrigger value="trip-master">Trip Master</TabsTrigger>
                    <TabsTrigger value="maintenance-master">Maintenance Master</TabsTrigger>
                    <TabsTrigger value="accident-master">Accident Master</TabsTrigger>
                </TabsList>
                <TabsContent value="vehicle-master" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Vehicle Brands & Categories</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <VehicleBrandTable />
                            <VehicleTypeTable />
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="trip-master" className="mt-4 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Routes</CardTitle><CardDescription>Define routes by selecting a start and end location.</CardDescription></CardHeader>
                        <CardContent><RouteTable /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Trip Purposes</CardTitle><CardDescription>Manage predefined purposes for vehicle trips.</CardDescription></CardHeader>
                        <CardContent><TripPurposeTable /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Locations</CardTitle><CardDescription>Manage predefined locations and their unique codes.</CardDescription></CardHeader>
                        <CardContent><LocationTable /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Trip Expense Types</CardTitle><CardDescription>Manage predefined types for trip expenses.</CardDescription></CardHeader>
                        <CardContent><ExpenseTypeTable /></CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="maintenance-master" className="mt-4 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Parts</CardTitle><CardDescription>Manage reusable vehicle parts and their details.</CardDescription></CardHeader>
                        <CardContent><PartTable /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Service Centers / Garages</CardTitle><CardDescription>Manage your approved service centers and garages.</CardDescription></CardHeader>
                        <CardContent><ServiceCenterTable /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Maintenance Types</CardTitle><CardDescription>Manage the different types of vehicle maintenance services (e.g., Oil Change, Brake Service).</CardDescription></CardHeader>
                        <CardContent><MaintenanceTypeTable /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Maintenance Expense Types</CardTitle><CardDescription>Manage cost categories for maintenance jobs (e.g., Labor Cost, Spare Parts, Engine Oil).</CardDescription></CardHeader>
                        <CardContent><MaintenanceExpenseTypeTable /></CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="accident-master" className="mt-4 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Accident Types</CardTitle><CardDescription>Manage the predefined types of accidents (e.g., Collision, Rollover).</CardDescription></CardHeader>
                        <CardContent><AccidentTypeTable /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Severity Levels</CardTitle><CardDescription>Manage the severity levels of an accident (e.g., Minor, Moderate, Major).</CardDescription></CardHeader>
                        <CardContent><SeverityLevelTable /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Fault Status</CardTitle><CardDescription>Manage the fault status of an accident (e.g., Driver at Fault, Third-Party at Fault).</CardDescription></CardHeader>
                        <CardContent><FaultStatusTable /></CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </TabsContent>
        </Tabs>
    </div>
  );
}

export default function VehicleManagementPage() {
    // The VehicleManagementProvider is now in the layout.tsx file
    return <VehicleManagementContent />;
}
