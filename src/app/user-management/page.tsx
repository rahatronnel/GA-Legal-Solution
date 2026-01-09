
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionTable } from "./components/section-table";
import { DesignationTable } from "./components/designation-table";
import { EmployeeTable } from "./components/employee-table";
import { UserManagementProvider, useUserManagement } from "./components/user-management-provider";
import { useUser } from "@/firebase";

function UserManagementContent() {
  const { data } = useUserManagement();
  const { employees, sections, designations, isLoading } = data;

  return (
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
                    employees={employees || []}
                    setEmployees={() => {}} // This will now be handled by firestore hooks
                    sections={sections || []}
                    designations={designations || []}
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
                <SectionTable sections={sections || []} isLoading={isLoading} />
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
                <DesignationTable designations={designations || []} isLoading={isLoading} />
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default function UserManagementPage() {
    const { isUserLoading } = useUser();

    if (isUserLoading) {
        return <div className="flex items-center justify-center h-full"><p>Loading Module...</p></div>
    }

    return (
        <UserManagementProvider>
            <UserManagementContent />
        </UserManagementProvider>
    )
}
