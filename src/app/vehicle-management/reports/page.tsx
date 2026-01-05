
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VehicleLifecycleReportPage from "./vehicle-lifecycle/page";
import MaintenanceCostSummaryPage from "./maintenance-cost-summary/page";
import VehicleMaintenanceReportPage from "./vehicle-maintenance/page";
import PreventiveMaintenanceDuePage from "./preventive-maintenance-due/page";
import SparePartsUsagePage from "./spare-parts-usage/page";
import WorkshopPerformancePage from "./workshop-performance/page";
import AccidentCostSummaryPage from "./accident-cost-summary/page";
import AccidentFrequencyPage from "./accident-frequency/page";
import VehicleAccidentReportPage from "./vehicle-accident/page";
import DriverAccidentReportPage from "./driver-accident/page";

export default function ReportsPage() {
    return (
        <Tabs defaultValue="lifecycle" orientation="vertical" className="w-full">
             <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                <div>
                     <TabsList className="w-full h-full flex-col items-start">
                        <p className="font-semibold text-lg p-3">Lifecycle</p>
                        <TabsTrigger value="lifecycle" className="w-full justify-start">Vehicle Lifecycle</TabsTrigger>
                        
                        <p className="font-semibold text-lg p-3 mt-4">Maintenance</p>
                        <TabsTrigger value="maintenance-cost" className="w-full justify-start">Cost Summary</TabsTrigger>
                        <TabsTrigger value="vehicle-maintenance" className="w-full justify-start">Vehicle-wise History</TabsTrigger>
                        <TabsTrigger value="preventive-maintenance" className="w-full justify-start">Preventive Due</TabsTrigger>
                        <TabsTrigger value="parts-usage" className="w-full justify-start">Spare Parts Usage</TabsTrigger>
                        <TabsTrigger value="workshop-performance" className="w-full justify-start">Workshop Performance</TabsTrigger>
                        
                        <p className="font-semibold text-lg p-3 mt-4">Accident</p>
                        <TabsTrigger value="accident-cost" className="w-full justify-start">Cost Summary</TabsTrigger>
                        <TabsTrigger value="accident-frequency" className="w-full justify-start">Accident Frequency</TabsTrigger>
                        <TabsTrigger value="vehicle-accident" className="w-full justify-start">Vehicle-wise History</TabsTrigger>
                        <TabsTrigger value="driver-accident" className="w-full justify-start">Driver-wise Report</TabsTrigger>
                    </TabsList>
                </div>
                <div className="w-full">
                    <TabsContent value="lifecycle"><VehicleLifecycleReportPage /></TabsContent>
                    <TabsContent value="maintenance-cost"><MaintenanceCostSummaryPage /></TabsContent>
                    <TabsContent value="vehicle-maintenance"><VehicleMaintenanceReportPage /></TabsContent>
                    <TabsContent value="preventive-maintenance"><PreventiveMaintenanceDuePage /></TabsContent>
                    <TabsContent value="parts-usage"><SparePartsUsagePage /></TabsContent>
                    <TabsContent value="workshop-performance"><WorkshopPerformancePage /></TabsContent>
                    <TabsContent value="accident-cost"><AccidentCostSummaryPage /></TabsContent>
                    <TabsContent value="accident-frequency"><AccidentFrequencyPage /></TabsContent>
                    <TabsContent value="vehicle-accident"><VehicleAccidentReportPage /></TabsContent>
                    <TabsContent value="driver-accident"><DriverAccidentReportPage /></TabsContent>
                </div>
            </div>
        </Tabs>
    );
}
