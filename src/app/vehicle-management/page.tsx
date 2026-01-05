
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleTypeTable } from "./components/vehicle-type-table";
import { DriverTable } from "./components/driver-table";
import { VehicleTable } from "./components/vehicle-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TripPurposeTable } from "./components/trip-purpose-table";
import { LocationTable, type Location } from "./components/location-table";
import { RouteTable } from "./components/route-table";
import { TripTable } from "./components/trip-table";
import { useLocalStorage } from "@/hooks/use-local-storage";
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

export default function VehicleManagementPage() {
  const [locations] = useLocalStorage<Location[]>('locations', []);
  
  return (
    <>
      <Tabs defaultValue="trips" className="w-full">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="accidents">Accidents</TabsTrigger>
            <TabsTrigger value="trip-management">Trip Master</TabsTrigger>
            <TabsTrigger value="vehicle-types">Vehicle Types</TabsTrigger>
          </TabsList>
        </div>
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
            <div className="grid gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Maintenance Records</CardTitle>
                        <CardDescription>Log and track all vehicle maintenance activities.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MaintenanceRecordTable />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Parts</CardTitle>
                        <CardDescription>Manage reusable vehicle parts and their details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PartTable />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Service Centers / Garages</CardTitle>
                        <CardDescription>Manage your approved service centers and garages.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ServiceCenterTable />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Maintenance Types</CardTitle>
                        <CardDescription>Manage the different types of vehicle maintenance services (e.g., Oil Change, Brake Service).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MaintenanceTypeTable />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Maintenance Expense Types</CardTitle>
                        <CardDescription>Manage cost categories for maintenance jobs (e.g., Labor Cost, Spare Parts, Engine Oil).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MaintenanceExpenseTypeTable />
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
        <TabsContent value="accidents">
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Accident Records</CardTitle>
                        <CardDescription>Manage and track all vehicle accident reports and history.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AccidentTable />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Accident Types</CardTitle>
                        <CardDescription>Manage the predefined types of accidents (e.g., Collision, Rollover).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AccidentTypeTable />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Severity Levels</CardTitle>
                        <CardDescription>Manage the severity levels of an accident (e.g., Minor, Moderate, Major).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SeverityLevelTable />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Fault Status</CardTitle>
                        <CardDescription>Manage the fault status of an accident (e.g., Driver at Fault, Third-Party at Fault).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FaultStatusTable />
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
        <TabsContent value="trip-management">
          <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Routes</CardTitle>
                    <CardDescription>Define routes by selecting a start and end location.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RouteTable locations={locations} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Trip Purposes</CardTitle>
                    <CardDescription>Manage predefined purposes for vehicle trips.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TripPurposeTable />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Locations</CardTitle>
                    <CardDescription>Manage predefined locations and their unique codes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LocationTable />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Expense Types</CardTitle>
                    <CardDescription>Manage predefined types for trip expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ExpenseTypeTable />
                </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="vehicle-types">
          <Card>
              <CardHeader>
                  <CardTitle>Vehicle Types</CardTitle>
                  <CardDescription>Manage the different types of vehicles available.</CardDescription>
              </CardHeader>
              <CardContent>
                  <VehicleTypeTable />
              </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
