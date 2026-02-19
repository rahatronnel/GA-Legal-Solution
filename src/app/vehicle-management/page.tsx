
"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleHeader } from '@/app/components/module-header';
import { 
    LayoutDashboard, Route, Car, Users, Wrench, AlertTriangle, 
    FileBarChart, Database, Settings, Tag, MapPin, Hash, ListOrdered
} from 'lucide-react';

import { 
    DriverDataProvider,
    VehicleDataProvider,
    TripDataProvider,
    MaintenanceDataProvider,
    AccidentDataProvider,
    MasterDataProvider as FleetMasterDataProvider,
    DashboardDataProvider,
    ReportsDataProvider
} from "./components/vehicle-management-provider";

import { Dashboard } from "./components/Dashboard";
import { TripTable } from "./components/trip-table";
import { VehicleTable } from "./components/vehicle-table";
import { DriverTable } from "./components/driver-table";
import { MaintenanceRecordTable } from "./components/maintenance-record-table";
import { AccidentTable } from "./components/accident-table";
import ReportsPage from "./reports/page";
import { VehicleBrandTable } from "./components/vehicle-brand-table";
import { VehicleTypeTable } from "./components/vehicle-type-table";
import { RouteTable } from "./components/route-table";
import { TripPurposeTable } from "./components/trip-purpose-table";
import { LocationTable } from "./components/location-table";
import { ExpenseTypeTable } from "./components/expense-type-table";
import { PartTable } from "./components/part-table";
import { ServiceCenterTable } from "./components/service-center-table";
import { MaintenanceTypeTable } from "./components/maintenance-type-table";
import { MaintenanceExpenseTypeTable } from "./components/maintenance-expense-type-table";
import { AccidentTypeTable } from "./components/accident-type-table";
import { SeverityLevelTable } from "./components/severity-level-table";
import { FaultStatusTable } from "./components/fault-status-table";

export default function VehicleManagementPage() {
  return (
    <div className="space-y-4">
        <ModuleHeader />
        <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-8 h-auto p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3"><LayoutDashboard className="h-4 w-4" /> <span className="hidden md:inline">Dashboard</span></TabsTrigger>
                <TabsTrigger value="trips" className="flex items-center gap-2 py-3"><Route className="h-4 w-4" /> <span className="hidden md:inline">Trips</span></TabsTrigger>
                <TabsTrigger value="vehicles" className="flex items-center gap-2 py-3"><Car className="h-4 w-4" /> <span className="hidden md:inline">Vehicles</span></TabsTrigger>
                <TabsTrigger value="drivers" className="flex items-center gap-2 py-3"><Users className="h-4 w-4" /> <span className="hidden md:inline">Drivers</span></TabsTrigger>
                <TabsTrigger value="maintenance" className="flex items-center gap-2 py-3"><Wrench className="h-4 w-4" /> <span className="hidden md:inline">Maintenance</span></TabsTrigger>
                <TabsTrigger value="accidents" className="flex items-center gap-2 py-3"><AlertTriangle className="h-4 w-4" /> <span className="hidden md:inline">Accidents</span></TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2 py-3"><FileBarChart className="h-4 w-4" /> <span className="hidden md:inline">Reports</span></TabsTrigger>
                <TabsTrigger value="master-data" className="flex items-center gap-2 py-3"><Database className="h-4 w-4" /> <span className="hidden md:inline">Master Data</span></TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
                <DashboardDataProvider>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><LayoutDashboard className="h-5 w-5" /> Dashboard Overview</CardTitle>
                            <CardDescription>Real-time analytics for your vehicle fleet operations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Dashboard />
                        </CardContent>
                    </Card>
                </DashboardDataProvider>
            </TabsContent>
            
            <TabsContent value="trips">
                <TripDataProvider>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Route className="h-5 w-5" /> Trip Logs</CardTitle>
                            <CardDescription>Comprehensive record of all vehicle journeys and itineraries.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TripTable />
                        </CardContent>
                    </Card>
                </TripDataProvider>
            </TabsContent>
            
            <TabsContent value="vehicles">
                <VehicleDataProvider>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" /> Vehicle Fleet</CardTitle>
                            <CardDescription>Inventory and current status of all organization vehicles.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <VehicleTable />
                        </CardContent>
                    </Card>
                </VehicleDataProvider>
            </TabsContent>
            
            <TabsContent value="drivers">
                <DriverDataProvider>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Driver Directory</CardTitle>
                            <CardDescription>Manage driver profiles, licenses, and assignments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DriverTable />
                        </CardContent>
                    </Card>
                </DriverDataProvider>
            </TabsContent>
            
            <TabsContent value="maintenance">
                <MaintenanceDataProvider>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Maintenance History</CardTitle>
                            <CardDescription>Tracking services, part replacements, and repairs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MaintenanceRecordTable />
                        </CardContent>
                    </Card>
                </MaintenanceDataProvider>
            </TabsContent>
            
            <TabsContent value="accidents">
                <AccidentDataProvider>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Accident Registry</CardTitle>
                            <CardDescription>Official incident reports and damage assessments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AccidentTable />
                        </CardContent>
                    </Card>
                </AccidentDataProvider>
            </TabsContent>
            
            <TabsContent value="reports">
                <ReportsDataProvider>
                    <ReportsPage />
                </ReportsDataProvider>
            </TabsContent>
            
            <TabsContent value="master-data" className="pt-4">
                <FleetMasterDataProvider>
                    <Tabs defaultValue="vehicle-master" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 h-auto bg-muted/30 p-1 rounded-lg">
                            <TabsTrigger value="vehicle-master" className="flex items-center gap-2 text-xs"><Car className="h-3 w-3" /> Vehicle</TabsTrigger>
                            <TabsTrigger value="trip-master" className="flex items-center gap-2 text-xs"><Route className="h-3 w-3" /> Trips</TabsTrigger>
                            <TabsTrigger value="maintenance-master" className="flex items-center gap-2 text-xs"><Wrench className="h-3 w-3" /> Maint.</TabsTrigger>
                            <TabsTrigger value="accident-master" className="flex items-center gap-2 text-xs"><AlertTriangle className="h-3 w-3" /> Accid.</TabsTrigger>
                        </TabsList>
                        <TabsContent value="vehicle-master" className="mt-4">
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Tag className="h-5 w-5" /> Categories & Brands</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <VehicleBrandTable />
                                    <VehicleTypeTable />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="trip-master" className="mt-4">
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MapPin className="h-5 w-5" /> Itinerary & Costs</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <RouteTable />
                                    <TripPurposeTable />
                                    <LocationTable />
                                    <ExpenseTypeTable />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="maintenance-master" className="mt-4">
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Settings className="h-5 w-5" /> Service & Parts</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <PartTable />
                                    <ServiceCenterTable />
                                    <MaintenanceTypeTable />
                                    <MaintenanceExpenseTypeTable />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="accident-master" className="mt-4">
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5" /> Classifications</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <AccidentTypeTable />
                                    <SeverityLevelTable />
                                    <FaultStatusTable />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </FleetMasterDataProvider>
            </TabsContent>
        </Tabs>
    </div>
  );
}
