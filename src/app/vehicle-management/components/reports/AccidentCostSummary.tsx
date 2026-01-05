
"use client";

import React from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, AlertTriangle } from 'lucide-react';
import type { Accident } from '../../components/accident-entry-form';

export function AccidentCostSummary() {
    const [accidents] = useLocalStorage<Accident[]>('accidents', []);

    const summary = React.useMemo(() => {
        let totalEstimated = 0;
        let totalActual = 0;
        let totalThirdParty = 0;

        accidents.forEach(acc => {
            totalEstimated += Number(acc.estimatedRepairCost) || 0;
            totalActual += Number(acc.actualRepairCost) || 0;
            totalThirdParty += Number(acc.thirdPartyDamageCost) || 0;
        });

        return {
            totalAccidents: accidents.length,
            totalEstimated,
            totalActual,
            totalThirdParty
        };
    }, [accidents]);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Accidents</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.totalAccidents}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Estimated Repair Costs</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalEstimated)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Actual Repair Costs</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalActual)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">3rd Party Damage Costs</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalThirdParty)}</div>
                </CardContent>
            </Card>
        </div>
    );
}
