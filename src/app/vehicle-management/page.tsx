
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
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Construction, LineChart, Wrench, FileText } from "lucide-react";
import { VehicleBrandTable } from "./components/vehicle-brand-table";
import { Separator } from "@/components/ui/separator";

const ReportCard = ({ title, description, href }: { title: string; description: string; href: string }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild>
                <Link href={href}>View Report</Link>
            </Button>
        </CardContent>
    </Card>
);


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
        <TabsContent value="reports">
            <div className="space-y-8">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Wrench className="h-6 w-6" />
                        <h2 className="text-2xl font-bold tracking-tight">Maintenance Reports</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ReportCard title="Maintenance Cost Summary" description="Aggregated summary of all maintenance costs." href="/vehicle-management/reports/maintenance-cost-summary" />
                        <ReportCard title="Vehicle-wise Maintenance" description="Detailed maintenance history for each vehicle." href="/vehicle-management/reports/vehicle-maintenance" />
                        <ReportCard title="Preventive Maintenance Due" description="See upcoming or overdue maintenance." href="/vehicle-management/reports/preventive-maintenance-due" />
                        <ReportCard title="Spare Parts Usage" description="Report on quantity and cost of used parts." href="/vehicle-management/reports/spare-parts-usage" />
                        <ReportCard title="Workshop Performance" description="Analyze cost and job frequency for workshops." href="/vehicle-management/reports/workshop-performance" />
                    </div>
                </div>

                <Separator />
                
                <div className="space-y-6">
                     <div className="flex items-center gap-4">
                        <LineChart className="h-6 w-6" />
                        <h2 className="text-2xl font-bold tracking-tight">Accident Reports</h2>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ReportCard title="Accident Cost Summary" description="Aggregated summary of all accident costs." href="/vehicle-management/reports/accident-cost-summary" />
                        <ReportCard title="Accident Frequency" description="Chart of accidents over time." href="/vehicle-management/reports/accident-frequency" />
                        <ReportCard title="Vehicle-wise Accident History" description="Detailed accident history for each vehicle." href="/vehicle-management/reports/vehicle-accident" />
                        <ReportCard title="Driver-wise Accident Report" description="Report on accidents grouped by driver." href="/vehicle-management/reports/driver-accident" />
                    </div>
                </div>
            </div>
        </TabsContent>
        <TabsContent value="trip-master">
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
