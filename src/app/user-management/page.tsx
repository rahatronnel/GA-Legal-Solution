
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionTable } from "./components/section-table";
import { DesignationTable } from "./components/designation-table";
import { EmployeeTable } from "./components/employee-table";
import { UserManagementProvider, useUserManagement } from "./components/user-management-provider";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home as HomeIcon, Users, Building, Tag, Briefcase } from "lucide-react";
import { ModuleHeader } from '@/app/components/module-header';
import { DepartmentTable } from "./components/department-table";

function UserManagementContent() {
  const { data } = useUserManagement();
  const { employees, sections, designations, departments, isLoading } = data;

  return (
    <div className="space-y-6">
        <ModuleHeader />
        <Tabs defaultValue="employees" className="w-full">
        <div className="flex items-center">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="employees" className="flex items-center gap-2 py-3"><Users className="h-4 w-4" /> Employees</TabsTrigger>
                <TabsTrigger value="departments" className="flex items-center gap-2 py-3"><Building className="h-4 w-4" /> Departments</TabsTrigger>
                <TabsTrigger value="sections" className="flex items-center gap-2 py-3"><Building className="h-4 w-4" /> Sections</TabsTrigger>
                <TabsTrigger value="designations" className="flex items-center gap-2 py-3"><Tag className="h-4 w-4" /> Designations</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="employees">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Employees</CardTitle>
                    <CardDescription>Manage all employees in your organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmployeeTable 
                        employees={employees || []}
                        setEmployees={() => {}} // This will now be handled by firestore hooks
                        sections={sections || []}
                        designations={designations || []}
                        departments={departments || []}
                    />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="departments">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Departments</CardTitle>
                    <CardDescription>Manage the different departments within your organization.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DepartmentTable departments={departments || []} isLoading={isLoading} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="sections">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Sections</CardTitle>
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
                    <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> Designations</CardTitle>
                    <CardDescription>Manage the job titles and designations for employees.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DesignationTable designations={designations || []} isLoading={isLoading} />
                </CardContent>
            </Card>
        </TabsContent>
        </Tabs>
    </div>
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
