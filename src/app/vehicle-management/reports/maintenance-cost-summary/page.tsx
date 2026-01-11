"use client";

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { DollarSign, Wrench, Package, Car } from 'lucide-react';
import type { MaintenanceRecord } from '../../components/maintenance-entry-form';
import { isWithinInterval, parseISO } from 'date-fns';
import type { MaintenanceType } from '../../components/maintenance-type-table';
import type { Vehicle } from '../../components/vehicle-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ReportData {
    totalRecords: number;
    totalMaintenanceCost: number;
    totalPartsCost: number;
    totalExpensesCost: number;
    costByMaintenanceType: { name: string; cost: number; count: number }[];
    costByVehicle: { reg: string; make: string; model: string; cost: number; count: number }[];
}

export default function MaintenanceCostSummaryPage() {
    const [records] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);
    const [maintenanceTypes] = useLocalStorage<MaintenanceType[]>('maintenanceTypes', []);
    const [vehicles] = useLocalStorage<Vehicle[]>('vehicles', []);

    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);


    const handleGenerateReport = () => {
        let filteredRecords = records;

        if (dateRange?.from && dateRange?.to) {
            filteredRecords = records.filter(rec => {
                if (!rec.serviceDate) return false;
                const serviceDate = parseISO(rec.serviceDate);
                return isWithinInterval(serviceDate, { start: dateRange.from!, end: dateRange.to! });
            });
        }
        
        let totalPartsCost = 0;
        let totalExpensesCost = 0;
        const costByMaintenanceType: { [key: string]: { name: string; cost: number; count: number } } = {};
        const costByVehicle: { [key: string]: { reg: string; make: string; model: string; cost: number; count: number } } = {};

        filteredRecords.forEach(rec => {
            const partsCost = rec.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
            const expensesCost = rec.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
            const recordTotalCost = partsCost + expensesCost;

            totalPartsCost += partsCost;
            totalExpensesCost += expensesCost;

            // Breakdown by Maintenance Type
            if (rec.maintenanceTypeId) {
                if (!costByMaintenanceType[rec.maintenanceTypeId]) {
                    const type = maintenanceTypes.find(t => t.id === rec.maintenanceTypeId);
                    costByMaintenanceType[rec.maintenanceTypeId] = { name: type?.name || 'Unknown', cost: 0, count: 0 };
                }
                costByMaintenanceType[rec.maintenanceTypeId].cost += recordTotalCost;
                costByMaintenanceType[rec.maintenanceTypeId].count++;
            }

            // Breakdown by Vehicle
            if (rec.vehicleId) {
                if (!costByVehicle[rec.vehicleId]) {
                    const vehicle = vehicles.find(v => v.id === rec.vehicleId);
                    costByVehicle[rec.vehicleId] = { reg: vehicle?.registrationNumber || 'Unknown', make: vehicle?.make || '', model: vehicle?.model || '', cost: 0, count: 0 };
                }
                costByVehicle[rec.vehicleId].cost += recordTotalCost;
                costByVehicle[rec.vehicleId].count++;
            }
        });
        
        const totalMaintenanceCost = totalPartsCost + totalExpensesCost;

        setReportData({
            totalRecords: filteredRecords.length,
            totalMaintenanceCost,
            totalPartsCost,
            totalExpensesCost,
            costByMaintenanceType: Object.values(costByMaintenanceType).sort((a,b) => b.cost - a.cost),
            costByVehicle: Object.values(costByVehicle).sort((a,b) => b.cost - a.cost),
        });
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
    
    if (!mounted) {
        return null;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Maintenance Cost Summary</CardTitle>
                    <CardDescription>Filter costs by date range to see an aggregated summary and detailed breakdowns.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    <Button onClick={handleGenerateReport}>Generate Report</Button>
                </CardContent>
            </Card>
            
            {reportData && (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Maintenance Jobs</CardTitle><Wrench className="h-4 w-4 text-muted-foreground" /></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{reportData.totalRecords}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Maintenance Cost</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{formatCurrency(reportData.totalMaintenanceCost)}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Parts Cost</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{formatCurrency(reportData.totalPartsCost)}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Additional Expenses</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{formatCurrency(reportData.totalExpensesCost)}</div></CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Costs by Maintenance Type</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {reportData.costByMaintenanceType.length > 0 ? (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Jobs</TableHead><TableHead className="text-right">Total Cost</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {reportData.costByMaintenanceType.map(item => (
                                                <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell>{item.count}</TableCell><TableCell className="text-right">{formatCurrency(item.cost)}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : <p className="text-sm text-muted-foreground text-center">No data for this breakdown.</p>}
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Costs by Vehicle</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {reportData.costByVehicle.length > 0 ? (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Jobs</TableHead><TableHead className="text-right">Total Cost</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {reportData.costByVehicle.map(item => (
                                                <TableRow key={item.reg}><TableCell>{item.make} {item.model} ({item.reg})</TableCell><TableCell>{item.count}</TableCell><TableCell className="text-right">{formatCurrency(item.cost)}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : <p className="text-sm text-muted-foreground text-center">No data for this breakdown.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
