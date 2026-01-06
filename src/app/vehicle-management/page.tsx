
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleTypeTable } from "./components/vehicle-type-table";
import { DriverTable } from "./components/driver-table";
import { VehicleTable } from "./components/vehicle-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TripPurposeTable } from "./components/trip-purpose-table";
import { LocationTable, type Location } from "./components/location-table";
import { RouteTable, type Route } from "./components/route-table";
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
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Driver } from "./components/driver-entry-form";
import type { Vehicle } from "./components/vehicle-entry-form";
import type { Trip } from "./components/trip-entry-form";
import type { TripPurpose } from "./components/trip-purpose-table";
import type { ExpenseType } from "./components/expense-type-table";
import type { MaintenanceRecord } from "./components/maintenance-entry-form";
import type { Part } from "./components/part-table";
import type { ServiceCenter } from "./components/service-center-table";
import type { MaintenanceType } from "./components/maintenance-type-table";
import type { MaintenanceExpenseType } from "./components/maintenance-expense-type-table";
import type { Accident } from "./components/accident-entry-form";
import type { AccidentType } from "./components/accident-type-table";
import type { SeverityLevel } from "./components/severity-level-table";
import type { FaultStatus } from "./components/fault-status-table";
import type { VehicleType } from "./components/vehicle-type-table";
import type { VehicleBrand } from "./components/vehicle-brand-table";

export default function VehicleManagementPage() {
  const [locations, setLocations] = useLocalStorage<Location[]>('locations', []);
  const [drivers, setDrivers] = useLocalStorage<Driver[]>('drivers', []);
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>('vehicles', []);
  const [trips, setTrips] = useLocalStorage<Trip[]>('trips', []);
  const [routes, setRoutes] = useLocalStorage<Route[]>('routes', []);
  const [tripPurposes, setTripPurposes] = useLocalStorage<TripPurpose[]>('tripPurposes', []);
  const [expenseTypes, setExpenseTypes] = useLocalStorage<ExpenseType[]>('expenseTypes', []);
  const [maintenanceRecords, setMaintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
  const [maintenanceTypes, setMaintenanceTypes] = useLocalStorage<MaintenanceType[]>('maintenanceTypes', []);
  const [maintenanceExpenseTypes, setMaintenanceExpenseTypes] = useLocalStorage<MaintenanceExpenseType[]>('maintenanceExpenseTypes', []);
  const [parts, setParts] = useLocalStorage<Part[]>('parts', []);
  const [serviceCenters, setServiceCenters] = useLocalStorage<ServiceCenter[]>('serviceCenters', []);
  const [accidents, setAccidents] = useLocalStorage<Accident[]>('accidents', []);
  const [accidentTypes, setAccidentTypes] = useLocalStorage<AccidentType[]>('accidentTypes', []);
  const [severityLevels, setSeverityLevels] = useLocalStorage<SeverityLevel[]>('severityLevels', []);
  const [faultStatuses, setFaultStatuses] = useLocalStorage<FaultStatus[]>('faultStatuses', []);
  const [vehicleTypes, setVehicleTypes] = useLocalStorage<VehicleType[]>("vehicleTypes", []);
  const [vehicleBrands, setVehicleBrands] = useLocalStorage<VehicleBrand[]>("vehicleBrands", []);

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
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="trip-master">Trip Master</TabsTrigger>
            <TabsTrigger value="vehicle-master">Vehicle Master</TabsTrigger>
          </TabsList>
        </div>
         <TabsContent value="trips">
            <Card>
                <CardHeader>
                    <CardTitle>Trips</CardTitle>
                    <CardDescription>Manage all vehicle trips.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TripTable trips={trips} setTrips={setTrips} />
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
                  <DriverTable drivers={drivers} setDrivers={setDrivers} vehicles={vehicles} />
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
                        <MaintenanceRecordTable records={maintenanceRecords} setRecords={setMaintenanceRecords} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Parts</CardTitle>
                        <CardDescription>Manage reusable vehicle parts and their details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PartTable parts={parts} setParts={setParts} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Service Centers / Garages</CardTitle>
                        <CardDescription>Manage your approved service centers and garages.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ServiceCenterTable serviceCenters={serviceCenters} setServiceCenters={setServiceCenters} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Maintenance Types</CardTitle>
                        <CardDescription>Manage the different types of vehicle maintenance services (e.g., Oil Change, Brake Service).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MaintenanceTypeTable maintenanceTypes={maintenanceTypes} setMaintenanceTypes={setMaintenanceTypes} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Maintenance Expense Types</CardTitle>
                        <CardDescription>Manage cost categories for maintenance jobs (e.g., Labor Cost, Spare Parts, Engine Oil).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MaintenanceExpenseTypeTable expenseTypes={maintenanceExpenseTypes} setExpenseTypes={setMaintenanceExpenseTypes}/>
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
                        <AccidentTable accidents={accidents} setAccidents={setAccidents} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Accident Types</CardTitle>
                        <CardDescription>Manage the predefined types of accidents (e.g., Collision, Rollover).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AccidentTypeTable accidentTypes={accidentTypes} setAccidentTypes={setAccidentTypes} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Severity Levels</CardTitle>
                        <CardDescription>Manage the severity levels of an accident (e.g., Minor, Moderate, Major).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SeverityLevelTable severityLevels={severityLevels} setSeverityLevels={setSeverityLevels} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Fault Status</CardTitle>
                        <CardDescription>Manage the fault status of an accident (e.g., Driver at Fault, Third-Party at Fault).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FaultStatusTable faultStatuses={faultStatuses} setFaultStatuses={setFaultStatuses} />
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
        <TabsContent value="reports">
            <ReportsPage />
        </TabsContent>
        <TabsContent value="trip-master">
          <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Routes</CardTitle>
                    <CardDescription>Define routes by selecting a start and end location.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RouteTable locations={locations} routes={routes} setRoutes={setRoutes} />
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
                    <LocationTable locations={locations} setLocations={setLocations} />
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
        <TabsContent value="vehicle-master">
           <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Brands</CardTitle>
                        <CardDescription>Manage the different brands of vehicles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <VehicleBrandTable />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Categories</CardTitle>
                        <CardDescription>Manage the different categories of vehicles available.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <VehicleTypeTable />
                    </CardContent>
                </Card>
           </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
