import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { VehicleTypeTable } from "./components/vehicle-type-table";

export default function VehicleManagementPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Management</CardTitle>
        <CardDescription>
          Manage vehicle types and other vehicle-related settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VehicleTypeTable />
      </CardContent>
    </Card>
  );
}
