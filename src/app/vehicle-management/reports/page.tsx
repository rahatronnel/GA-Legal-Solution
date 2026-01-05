
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleAccidentReport } from '../components/reports/VehicleAccidentReport';
import { DriverAccidentReport } from '../components/reports/DriverAccidentReport';
import { AccidentCostSummary } from '../components/reports/AccidentCostSummary';
import { AccidentFrequencyChart } from '../components/reports/AccidentFrequencyChart';
import { ArrowLeft, Construction, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { MaintenanceCostSummary } from '../components/reports/MaintenanceCostSummary';
import { PreventiveMaintenanceDueReport } from '../components/reports/PreventiveMaintenanceDueReport';
import { VehicleMaintenanceReport } from '../components/reports/VehicleMaintenanceReport';
import { SparePartsUsageReport } from '../components/reports/SparePartsUsageReport';
import { WorkshopPerformanceReport } from '../components/reports/WorkshopPerformanceReport';


export default function ReportsPage() {
    return (
        <div className="space-y-8">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/vehicle-management">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                   Reports Dashboard
                </h1>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Construction className="h-6 w-6" />
                    <h2 className="text-2xl font-bold tracking-tight">Maintenance Reports</h2>
                </div>

                <MaintenanceCostSummary />
                <PreventiveMaintenanceDueReport />
                <VehicleMaintenanceReport />
                <SparePartsUsageReport />
                <WorkshopPerformanceReport />
            </div>

            <Separator />
            
            <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <Wrench className="h-6 w-6" />
                    <h2 className="text-2xl font-bold tracking-tight">Accident Reports</h2>
                </div>
                
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Accident Frequency (Monthly)</CardTitle>
                        <CardDescription>Number of accidents reported each month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AccidentFrequencyChart />
                    </CardContent>
                </Card>

                <div className="lg:col-span-2">
                     <AccidentCostSummary />
                </div>
               
                <div className="lg:col-span-2">
                    <VehicleAccidentReport />
                </div>

                <div className="lg:col-span-2">
                    <DriverAccidentReport />
                </div>
            </div>
        </div>
    );
}
