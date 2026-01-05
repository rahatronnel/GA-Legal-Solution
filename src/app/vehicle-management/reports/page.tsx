
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Wrench, LineChart, GitCommitHorizontal } from "lucide-react";
import Link from "next/link";

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

export default function ReportsPage() {
    return (
        <div className="space-y-8">
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <GitCommitHorizontal className="h-6 w-6" />
                    <h2 className="text-2xl font-bold tracking-tight">Vehicle Lifecycle</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <ReportCard title="Vehicle Lifecycle Report" description="A complete, top-to-bottom history of a single vehicle." href="/vehicle-management/reports/vehicle-lifecycle" />
                </div>
            </div>

            <Separator />
            
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
    );
}
