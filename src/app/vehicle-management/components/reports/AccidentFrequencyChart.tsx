
"use client";

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { format, parseISO } from 'date-fns';
import type { Accident } from '../../components/accident-entry-form';

export function AccidentFrequencyChart() {
    const [accidents] = useLocalStorage<Accident[]>('accidents', []);

    const chartData = React.useMemo(() => {
        const monthlyCounts: { [key: string]: number } = {};

        // Initialize last 12 months
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = format(d, 'yyyy-MM');
            monthlyCounts[monthKey] = 0;
        }

        accidents.forEach(acc => {
            if (acc.accidentDate) {
                const monthKey = format(parseISO(acc.accidentDate), 'yyyy-MM');
                if (monthKey in monthlyCounts) {
                    monthlyCounts[monthKey]++;
                }
            }
        });

        return Object.keys(monthlyCounts).map(monthKey => ({
            month: format(parseISO(`${monthKey}-01`), 'MMM yy'),
            accidents: monthlyCounts[monthKey],
        }));
    }, [accidents]);
    
    return (
        <div className="h-[350px] w-full">
            {chartData.length > 0 ? (
                <ChartContainer config={{}} className="w-full h-full">
                    <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="accidents" fill="var(--color-primary)" radius={4} />
                    </BarChart>
                </ChartContainer>
             ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <p className="text-muted-foreground">No accident data available for chart.</p>
                </div>
            )}
        </div>
    );
}
