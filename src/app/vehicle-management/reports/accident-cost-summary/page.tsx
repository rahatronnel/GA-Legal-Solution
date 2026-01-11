
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { DollarSign, AlertTriangle } from 'lucide-react';
import type { Accident } from '../../components/accident-entry-form';
import { isWithinInterval, parseISO } from 'date-fns';
import { useVehicleManagement } from '../../components/vehicle-management-provider';

export default function AccidentCostSummaryPage() {
    const vm = useVehicleManagement();
    if (!vm) return null; // Build-safe guard
    const { data, isLoading } = vm;
    const { accidents = [] } = data;

    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [filteredSummary, setFilteredSummary] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);


    const handleGenerateReport = () => {
        let filteredAccidents = accidents;

        if (dateRange?.from && dateRange?.to) {
            filteredAccidents = accidents.filter((acc: Accident) => {
                const accDate = parseISO(acc.accidentDate);
                return isWithinInterval(accDate, { start: dateRange.from!, end: dateRange.to! });
            });
        }

        let totalEstimated = 0;
        let totalActual = 0;
        let totalThirdParty = 0;

        filteredAccidents.forEach((acc: Accident) => {
            totalEstimated += Number(acc.estimatedRepairCost) || 0;
            totalActual += Number(acc.actualRepairCost) || 0;
            totalThirdParty += Number(acc.thirdPartyDamageCost) || 0;
        });

        setFilteredSummary({
            totalAccidents: filteredAccidents.length,
            totalEstimated,
            totalActual,
            totalThirdParty
        });
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    if (!mounted || isLoading) {
        return <p>Loading report data...</p>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Accident Cost Summary Report</CardTitle>
                    <CardDescription>Filter and view an aggregated summary of accident costs.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    <Button onClick={handleGenerateReport}>Generate Report</Button>
                </CardContent>
            </Card>

            {filteredSummary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Accidents</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredSummary.totalAccidents}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Estimated Repair Costs</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(filteredSummary.totalEstimated)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Actual Repair Costs</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(filteredSummary.totalActual)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">3rd Party Damage Costs</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(filteredSummary.totalThirdParty)}</div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
