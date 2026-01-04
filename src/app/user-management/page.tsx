import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionTable } from "./components/section-table";
import { DesignationTable } from "./components/designation-table";

export default function UserManagementPage() {
  return (
    <>
      <Tabs defaultValue="sections" className="w-full">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="designations">Designations</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="sections">
          <Card>
              <CardHeader>
                  <CardTitle>Sections</CardTitle>
                  <CardDescription>Manage the different sections within your organization.</CardDescription>
              </CardHeader>
              <CardContent>
                  <SectionTable />
              </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="designations">
          <Card>
              <CardHeader>
                  <CardTitle>Designations</CardTitle>
                  <CardDescription>Manage the job titles and designations for employees.</CardDescription>
              </CardHeader>
              <CardContent>
                  <DesignationTable />
              </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
