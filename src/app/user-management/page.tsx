
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionTable } from "./components/section-table";
import { DesignationTable } from "./components/designation-table";
import { EmployeeTable } from "./components/employee-table";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Employee } from "./components/employee-entry-form";
import type { Section } from "./components/section-table";
import type { Designation } from "./components/designation-table";

export default function UserManagementPage() {
  const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
  const [sections, setSections] = useLocalStorage<Section[]>('sections', []);
  const [designations, setDesignations] = useLocalStorage<Designation[]>('designations', []);

  return (
    <>
      <Tabs defaultValue="employees" className="w-full">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="designations">Designations</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="employees">
            <Card>
                <CardHeader>
                    <CardTitle>Employees</CardTitle>
                    <CardDescription>Manage all employees in your organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmployeeTable 
                      employees={employees}
                      setEmployees={setEmployees}
                      sections={sections}
                      designations={designations}
                    />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="sections">
          <Card>
              <CardHeader>
                  <CardTitle>Sections</CardTitle>
                  <CardDescription>Manage the different sections within your organization.</CardDescription>
              </CardHeader>
              <CardContent>
                  <SectionTable sections={sections} setSections={setSections} />
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
                  <DesignationTable designations={designations} setDesignations={setDesignations} />
              </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
