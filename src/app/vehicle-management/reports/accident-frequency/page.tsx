
"use client";

import React, { useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import type { Accident } from '../../components/accident-entry-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

export default function AccidentFrequencyPage() {
    const [accidents] = useLocalStorage<Accident[]>('accidents', []);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date(new Date().setFullYear(new Date().getFullYear() - 1))),
        to: endOfMonth(new Date())
    });
    const [chartData, setChartData] = useState<any[]>([]);

    const handleGenerateReport = () => {
        if (!dateRange?.from || !dateRange?.to) {
            setChartData([]);
            return;
        }

        const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
        const monthlyCounts: { [key: string]: number } = {};

        months.forEach(month => {
            const monthKey = format(month, 'yyyy-MM');
            monthlyCounts[monthKey] = 0;
        });

        accidents.forEach(acc => {
            if (acc.accidentDate) {
                const accidentDate = parseISO(acc.accidentDate);
                if (accidentDate >= dateRange.from! && accidentDate <= dateRange.to!) {
                    const monthKey = format(accidentDate, 'yyyy-MM');
                    if (monthKey in monthlyCounts) {
                        monthlyCounts[monthKey]++;
                    }
                }
            }
        });

        const data = Object.keys(monthlyCounts).map(monthKey => ({
            month: format(parseISO(`${monthKey}-01`), 'MMM yy'),
            accidents: monthlyCounts[monthKey],
        }));
        setChartData(data);
    };
    
    // Generate initial report on load
    React.useEffect(() => {
        handleGenerateReport();
    }, [accidents]);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Accident Frequency Report</CardTitle>
                    <CardDescription>Filter and view the number of accidents per month.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    <Button onClick={handleGenerateReport}>Generate Report</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Chart</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px] w-full">
                    {chartData.length > 0 ? (
                        <ChartContainer config={{}} className="w-full h-full">
                            <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis allowDecimals={false} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Bar dataKey="accidents" fill="var(--color-primary)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <p className="text-muted-foreground">No data to display. Please generate a report.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
