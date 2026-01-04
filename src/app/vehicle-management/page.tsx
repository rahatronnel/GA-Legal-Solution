import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleTypeTable } from "./components/vehicle-type-table";
import { DriverTable } from "./components/driver-table";
import { VehicleTable } from "./components/vehicle-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TripPurposeTable } from "./components/trip-purpose-table";
import { LocationTable } from "./components/location-table";
import { RouteTable } from "./components/route-table";

export default function VehicleManagementPage() {
  return (
    <>
      <Tabs defaultValue="vehicles" className="w-full">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="trip-management">Trip Management</TabsTrigger>
            <TabsTrigger value="vehicle-types">Vehicle Types</TabsTrigger>
          </TabsList>
        </div>
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
        <TabsContent value="trip-management">
          <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Routes</CardTitle>
                    <CardDescription>Define routes by selecting a start and end location.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RouteTable />
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
