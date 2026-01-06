
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
import type { Trip } from "./components/trip-entry-form";
import type { Route } from "./components/route-table";
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
import type { Vehicle } from "./components/vehicle-entry-form";
import type { VehicleBrand } from "./components/vehicle-brand-table";
import type { VehicleType } from "./components/vehicle-type-table";

const initialData = {
    locations: [],
    drivers: [],
    trips: [],
    routes: [],
    tripPurposes: [],
    expenseTypes: [],
    maintenanceRecords: [],
    parts: [],
    serviceCenters: [],
    maintenanceTypes: [],
    maintenanceExpenseTypes: [],
    accidents: [],
    accidentTypes: [],
    severityLevels: [],
    faultStatuses: [],
    vehicles: [],
    vehicleBrands: [],
    vehicleTypes: [],
};

export default function VehicleManagementPage() {
  const [data, setData] = useLocalStorage<typeof initialData>('vehicleManagementData', initialData);

  const setDrivers = (newDrivers: Driver[] | ((prev: Driver[]) => Driver[])) => {
    setData(prev => ({...prev, drivers: typeof newDrivers === 'function' ? newDrivers(prev.drivers) : newDrivers}));
  };

  const setLocations = (newLocations: Location[] | ((prev: Location[]) => Location[])) => {
    setData(prev => ({...prev, locations: typeof newLocations === 'function' ? newLocations(prev.locations) : newLocations}));
  }

  const setRoutes = (newRoutes: Route[] | ((prev: Route[]) => Route[])) => {
    setData(prev => ({...prev, routes: typeof newRoutes === 'function' ? newRoutes(prev.routes) : newRoutes}));
  }
  
  const setTrips = (newTrips: Trip[] | ((prev: Trip[]) => Trip[])) => {
    setData(prev => ({...prev, trips: typeof newTrips === 'function' ? newTrips(prev.trips) : newTrips}));
  }

  const setTripPurposes = (newPurposes: TripPurpose[] | ((prev: TripPurpose[]) => TripPurpose[])) => {
    setData(prev => ({...prev, tripPurposes: typeof newPurposes === 'function' ? newPurposes(prev.tripPurposes) : newPurposes}));
  }
  
  const setExpenseTypes = (newTypes: ExpenseType[] | ((prev: ExpenseType[]) => ExpenseType[])) => {
    setData(prev => ({...prev, expenseTypes: typeof newTypes === 'function' ? newTypes(prev.expenseTypes) : newTypes}));
  }

  const setMaintenanceRecords = (newRecords: MaintenanceRecord[] | ((prev: MaintenanceRecord[]) => MaintenanceRecord[])) => {
    setData(prev => ({...prev, maintenanceRecords: typeof newRecords === 'function' ? newRecords(prev.maintenanceRecords) : newRecords}));
  }

  const setParts = (newParts: Part[] | ((prev: Part[]) => Part[])) => {
    setData(prev => ({...prev, parts: typeof newParts === 'function' ? newParts(prev.parts) : newParts}));
  }

  const setServiceCenters = (newCenters: ServiceCenter[] | ((prev: ServiceCenter[]) => ServiceCenter[])) => {
    setData(prev => ({...prev, serviceCenters: typeof newCenters === 'function' ? newCenters(prev.serviceCenters) : newCenters}));
  }

  const setMaintenanceTypes = (newTypes: MaintenanceType[] | ((prev: MaintenanceType[]) => MaintenanceType[])) => {
    setData(prev => ({...prev, maintenanceTypes: typeof newTypes === 'function' ? newTypes(prev.maintenanceTypes) : newTypes}));
  }

  const setMaintenanceExpenseTypes = (newTypes: MaintenanceExpenseType[] | ((prev: MaintenanceExpenseType[]) => MaintenanceExpenseType[])) => {
    setData(prev => ({...prev, maintenanceExpenseTypes: typeof newTypes === 'function' ? newTypes(prev.maintenanceExpenseTypes) : newTypes}));
  }

  const setAccidents = (newAccidents: Accident[] | ((prev: Accident[]) => Accident[])) => {
    setData(prev => ({...prev, accidents: typeof newAccidents === 'function' ? newAccidents(prev.accidents) : newAccidents}));
  }

  const setAccidentTypes = (newTypes: AccidentType[] | ((prev: AccidentType[]) => AccidentType[])) => {
    setData(prev => ({...prev, accidentTypes: typeof newTypes === 'function' ? newTypes(prev.accidentTypes) : newTypes}));
  }

  const setSeverityLevels = (newLevels: SeverityLevel[] | ((prev: SeverityLevel[]) => SeverityLevel[])) => {
    setData(prev => ({...prev, severityLevels: typeof newLevels === 'function' ? newLevels(prev.severityLevels) : newLevels}));
  }
  
  const setFaultStatuses = (newStatuses: FaultStatus[] | ((prev: FaultStatus[]) => FaultStatus[])) => {
    setData(prev => ({...prev, faultStatuses: typeof newStatuses === 'function' ? newStatuses(prev.faultStatuses) : newStatuses}));
  }

  const setVehicles = (newVehicles: Vehicle[] | ((prev: Vehicle[]) => Vehicle[])) => {
    setData(prev => ({...prev, vehicles: typeof newVehicles === 'function' ? newVehicles(prev.vehicles) : newVehicles}));
  }

  const setVehicleBrands = (newBrands: VehicleBrand[] | ((prev: VehicleBrand[]) => VehicleBrand[])) => {
    setData(prev => ({...prev, vehicleBrands: typeof newBrands === 'function' ? newBrands(prev.vehicleBrands) : newBrands}));
  }

  const setVehicleTypes = (newTypes: VehicleType[] | ((prev: VehicleType[]) => VehicleType[])) => {
    setData(prev => ({...prev, vehicleTypes: typeof newTypes === 'function' ? newTypes(prev.vehicleTypes) : newTypes}));
  }


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
                    <TripTable trips={data.trips} setTrips={setTrips} />
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
                  <DriverTable drivers={data.drivers} setDrivers={setDrivers} vehicles={data.vehicles} />
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
                        <MaintenanceRecordTable 
                            records={data.maintenanceRecords} 
                            setRecords={setMaintenanceRecords} 
                        />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Parts</CardTitle>
                        <CardDescription>Manage reusable vehicle parts and their details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PartTable parts={data.parts} setParts={setParts} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Service Centers / Garages</CardTitle>
                        <CardDescription>Manage your approved service centers and garages.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ServiceCenterTable 
                            serviceCenters={data.serviceCenters} 
                            setServiceCenters={setServiceCenters} 
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Maintenance Types</CardTitle>
                        <CardDescription>Manage the different types of vehicle maintenance services (e.g., Oil Change, Brake Service).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MaintenanceTypeTable 
                            maintenanceTypes={data.maintenanceTypes} 
                            setMaintenanceTypes={setMaintenanceTypes} 
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Maintenance Expense Types</CardTitle>
                        <CardDescription>Manage cost categories for maintenance jobs (e.g., Labor Cost, Spare Parts, Engine Oil).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MaintenanceExpenseTypeTable 
                            expenseTypes={data.maintenanceExpenseTypes} 
                            setExpenseTypes={setMaintenanceExpenseTypes}
                        />
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
                        <AccidentTable accidents={data.accidents} setAccidents={setAccidents} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Accident Types</CardTitle>
                        <CardDescription>Manage the predefined types of accidents (e.g., Collision, Rollover).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AccidentTypeTable accidentTypes={data.accidentTypes} setAccidentTypes={setAccidentTypes} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Severity Levels</CardTitle>
                        <CardDescription>Manage the severity levels of an accident (e.g., Minor, Moderate, Major).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SeverityLevelTable severityLevels={data.severityLevels} setSeverityLevels={setSeverityLevels} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Fault Status</CardTitle>
                        <CardDescription>Manage the fault status of an accident (e.g., Driver at Fault, Third-Party at Fault).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FaultStatusTable faultStatuses={data.faultStatuses} setFaultStatuses={setFaultStatuses} />
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
                    <RouteTable locations={data.locations} />
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
                    <LocationTable locations={data.locations} setLocations={setLocations} />
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
