import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleTypeTable } from "./components/vehicle-type-table";
import { DriverTable } from "./components/driver-table";
import { VehicleTable } from "./components/vehicle-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VehicleManagementPage() {
  return (
    <>
      <Tabs defaultValue="vehicles" className="w-full">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
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
