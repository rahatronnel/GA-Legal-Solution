
"use client";

import React from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { MaintenanceRecord } from '../../components/maintenance-entry-form';

export function SparePartsUsageReport() {
    const [maintenanceRecords] = useLocalStorage<MaintenanceRecord[]>('maintenanceRecords', []);

    const partsUsage = React.useMemo(() => {
        const usage: { [key: string]: { name: string; brand: string; quantity: number; totalCost: number } } = {};

        maintenanceRecords.forEach(rec => {
            rec.parts?.forEach(part => {
                const key = `${part.name}-${part.brand}`;
                if (!usage[key]) {
                    usage[key] = { name: part.name, brand: part.brand, quantity: 0, totalCost: 0 };
                }
                usage[key].quantity += part.quantity;
                usage[key].totalCost += part.quantity * part.price;
            });
        });

        return Object.values(usage).sort((a, b) => b.quantity - a.quantity);
    }, [maintenanceRecords]);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Spare Parts Usage Report</CardTitle>
                <CardDescription>An aggregated report on spare parts used in maintenance jobs.</CardDescription>
            </CardHeader>
            <CardContent>
                {partsUsage.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Part Name</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>Total Quantity Used</TableHead>
                                <TableHead>Total Cost</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {partsUsage.map(part => (
                                <TableRow key={`${part.name}-${part.brand}`}>
                                    <TableCell>{part.name}</TableCell>
                                    <TableCell>{part.brand}</TableCell>
                                    <TableCell>{part.quantity}</TableCell>
                                    <TableCell>{formatCurrency(part.totalCost)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground">No spare parts usage data available.</p>
                )}
            </CardContent>
        </Card>
    );
}
