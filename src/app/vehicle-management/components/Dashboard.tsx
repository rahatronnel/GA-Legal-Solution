
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDashboardData } from './vehicle-management-provider';
import { Car, Users, Wrench, AlertTriangle, Route } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Line, LineChart } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

export function Dashboard() {
    const { data = {}, isLoading } = useDashboardData() || {};
    const { vehicles = [], drivers = [], trips = [], accidents = [], maintenanceRecords = [] } = data;

    const summaryStats = React.useMemo(() => ({
        totalVehicles: vehicles.length,
        totalDrivers: drivers.length,
        ongoingTrips: trips.filter(t => t.tripStatus === 'Ongoing').length,
        totalAccidents: accidents.length,
    }), [vehicles, drivers, trips, accidents]);

    const vehicleStatusData = React.useMemo(() => {
        const statuses = { 'Active': 0, 'Under Maintenance': 0, 'Inactive': 0 };
        vehicles.forEach(v => {
            if (v.status && statuses[v.status as keyof typeof statuses] !== undefined) {
                statuses[v.status as keyof typeof statuses]++;
            }
        });
        return Object.entries(statuses).map(([name, value]) => ({ name, value }));
    }, [vehicles]);
    
    const monthlyMaintenanceData = React.useMemo(() => {
        const last12Months = eachMonthOfInterval({
          start: subMonths(new Date(), 11),
          end: new Date(),
        });

        const monthlyCosts: { [key: string]: number } = {};
        last12Months.forEach(month => {
            monthlyCosts[format(month, 'yyyy-MM')] = 0;
        });

        maintenanceRecords.forEach(rec => {
            if (rec.serviceDate) {
                const monthKey = format(parseISO(rec.serviceDate), 'yyyy-MM');
                if (monthKey in monthlyCosts) {
                    const partsCost = rec.parts?.reduce((acc, part) => acc + (part.price * part.quantity), 0) || 0;
                    const expensesCost = rec.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
                    monthlyCosts[monthKey] += partsCost + expensesCost;
                }
            }
        });

        return Object.keys(monthlyCosts).map(monthKey => ({
            month: format(parseISO(`${monthKey}-01`), 'MMM yy'),
            cost: monthlyCosts[monthKey],
        }));
    }, [maintenanceRecords]);
    
    const monthlyAccidentData = React.useMemo(() => {
        const last12Months = eachMonthOfInterval({
          start: subMonths(new Date(), 11),
          end: new Date(),
        });
        const monthlyCounts: { [key: string]: number } = {};
        last12Months.forEach(month => {
            monthlyCounts[format(month, 'yyyy-MM')] = 0;
        });

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

    if (isLoading) {
        return <p>Loading dashboard...</p>;
    }

    const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];
    const chartConfig = {
      cost: {
        label: "Cost",
        color: "hsl(var(--chart-2))",
      },
      accidents: {
        label: "Accidents",
        color: "hsl(var(--destructive))",
      },
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Vehicles</CardTitle><Car className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{summaryStats.totalVehicles}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Drivers</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{summaryStats.totalDrivers}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ongoing Trips</CardTitle><Route className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{summaryStats.ongoingTrips}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Accidents</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{summaryStats.totalAccidents}</div></CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Vehicle Status</CardTitle>
                        <CardDescription>Distribution of current vehicle statuses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={{}} className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={vehicleStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {vehicleStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Monthly Maintenance Costs</CardTitle>
                        <CardDescription>Summary of total maintenance costs over the last 12 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyMaintenanceData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                    <YAxis />
                                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                                    <Bar dataKey="cost" fill="hsl(var(--chart-2))" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Monthly Accident Frequency</CardTitle>
                        <CardDescription>Number of accidents recorded over the last 12 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyAccidentData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" fontSize={12} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="accidents" stroke="hsl(var(--destructive))" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
