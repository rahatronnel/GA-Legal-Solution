'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useProcurement } from './procurement-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format, parseISO, isWithinInterval, differenceInMinutes } from 'date-fns';
import { UserCheck, Clock, CheckCircle2, AlertTriangle, Timer, Calendar, Search, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type ActivityItem = {
    id: string;
    type: 'Demand Note' | 'CS' | 'PO' | 'MRR';
    action: string;
    timestamp: string;
    reference: string;
    shouldHaveDoneAt?: string;
    lagMinutes?: number;
};

export function UserAuditReport() {
    const { demandNotes, comparativeStatements, purchaseOrders, mrrs, employees, isLoading } = useProcurement();
    
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const activities = useMemo(() => {
        if (isLoading) return [];
        const list: ActivityItem[] = [];

        // Aggregate All Histories
        demandNotes.forEach(dn => {
            list.push({ id: dn.id + '-c', type: 'Demand Note', action: 'Drafted Requisition', timestamp: dn.entryDate, reference: dn.demandNoteNumber, userId: dn.createdBy } as any);
            
            dn.approvalHistory?.forEach((h: any, i: number) => {
                const prevActionTime = i === 0 ? dn.entryDate : dn.approvalHistory[i-1].timestamp;
                list.push({ 
                    id: dn.id + '-a-' + i, type: 'Demand Note', action: `Approved Step ${i+1}`, 
                    timestamp: h.timestamp, reference: dn.demandNoteNumber, userId: h.approverId,
                    shouldHaveDoneAt: prevActionTime,
                    lagMinutes: differenceInMinutes(parseISO(h.timestamp), parseISO(prevActionTime))
                } as any);
            });

            if (dn.gpAssignedDate) {
                list.push({ 
                    id: dn.id + '-gpa', type: 'Demand Note', action: 'Assigned GP Concern', 
                    timestamp: dn.gpAssignedDate, reference: dn.demandNoteNumber, userId: dn.gpAssignedBy,
                    shouldHaveDoneAt: dn.entryDate,
                    lagMinutes: differenceInMinutes(parseISO(dn.gpAssignedDate), parseISO(dn.entryDate))
                } as any);
            }

            if (dn.vendorAssignmentDate) {
                list.push({ 
                    id: dn.id + '-va', type: 'Demand Note', action: 'Assigned Vendors', 
                    timestamp: dn.vendorAssignmentDate, reference: dn.demandNoteNumber, userId: dn.gpConcernOfficerId,
                    shouldHaveDoneAt: dn.gpAssignedDate,
                    lagMinutes: dn.gpAssignedDate ? differenceInMinutes(parseISO(dn.vendorAssignmentDate), parseISO(dn.gpAssignedDate)) : undefined
                } as any);
            }
        });

        comparativeStatements.forEach(cs => {
            const dn = demandNotes.find(d => d.id === cs.demandNoteId);
            list.push({ id: cs.id + '-c', type: 'CS', action: 'Prepared CS', timestamp: cs.csDate, reference: cs.csNumber, userId: cs.createdBy, shouldHaveDoneAt: dn?.vendorAssignmentDate, lagMinutes: dn?.vendorAssignmentDate ? differenceInMinutes(parseISO(cs.csDate), parseISO(dn.vendorAssignmentDate)) : undefined } as any);
            
            if (cs.vendorSelectionDate) {
                list.push({ id: cs.id + '-vs', type: 'CS', action: 'Awarded Vendor', timestamp: cs.vendorSelectionDate, reference: cs.csNumber, userId: cs.vendorSelectorId, shouldHaveDoneAt: cs.csDate, lagMinutes: differenceInMinutes(parseISO(cs.vendorSelectionDate), parseISO(cs.csDate)) } as any);
            }

            cs.approvalHistory?.forEach((h: any, i: number) => {
                const prev = i === 0 ? cs.vendorSelectionDate : cs.approvalHistory[i-1].timestamp;
                list.push({ id: cs.id + '-a-' + i, type: 'CS', action: `Approved CS Step ${i+1}`, timestamp: h.timestamp, reference: cs.csNumber, userId: h.approverId, shouldHaveDoneAt: prev, lagMinutes: prev ? differenceInMinutes(parseISO(h.timestamp), parseISO(prev)) : undefined } as any);
            });
        });

        purchaseOrders.forEach(po => {
            list.push({ id: po.id + '-c', type: 'PO', action: 'Drafted PO', timestamp: po.createdAt, reference: po.poNumber, userId: po.createdBy } as any);
            po.approvalHistory?.forEach((h: any, i: number) => {
                const prev = i === 0 ? po.createdAt : po.approvalHistory[i-1].timestamp;
                list.push({ id: po.id + '-a-' + i, type: 'PO', action: `Approved PO Step ${i+1}`, timestamp: h.timestamp, reference: po.poNumber, userId: h.approverId, shouldHaveDoneAt: prev, lagMinutes: differenceInMinutes(parseISO(h.timestamp), parseISO(prev)) } as any);
            });
        });

        mrrs.forEach(mrr => {
            list.push({ id: mrr.id + '-c', type: 'MRR', action: 'Recorded Receipt', timestamp: mrr.createdAt, reference: mrr.mrrNumber, userId: mrr.createdBy } as any);
            mrr.approvalHistory?.forEach((h: any, i: number) => {
                const prev = i === 0 ? mrr.createdAt : mrr.approvalHistory[i-1].timestamp;
                list.push({ id: mrr.id + '-a-' + i, type: 'MRR', action: `Approved MRR Step ${i+1}`, timestamp: h.timestamp, reference: mrr.mrrNumber, userId: h.approverId, shouldHaveDoneAt: prev, lagMinutes: differenceInMinutes(parseISO(h.timestamp), parseISO(prev)) } as any);
            });
        });

        return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [demandNotes, comparativeStatements, purchaseOrders, mrrs, isLoading]);

    const filteredActivities = useMemo(() => {
        return activities.filter(act => {
            const userMatch = selectedUserId === 'all' || (act as any).userId === selectedUserId;
            const dateMatch = !dateRange?.from || isWithinInterval(parseISO(act.timestamp), { start: dateRange.from, end: dateRange.to || dateRange.from });
            return userMatch && dateMatch;
        });
    }, [activities, selectedUserId, dateRange]);

    const formatLag = (minutes?: number) => {
        if (minutes === undefined) return 'N/A';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours < 24) return `${hours}h ${mins}m`;
        const days = Math.floor(hours / 24);
        const remHrs = hours % 24;
        return `${days}d ${remHrs}h`;
    };

    const getLagColor = (minutes?: number) => {
        if (minutes === undefined) return 'text-muted-foreground';
        if (minutes < 120) return 'text-green-600 font-bold';
        if (minutes < 1440) return 'text-orange-500 font-semibold';
        return 'text-destructive font-black';
    };

    return (
        <div className="space-y-6 flex flex-col h-full min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><UserCheck className="h-4 w-4" /> Filter by User</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Personnel</SelectItem>
                            {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Date Range</Label>
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full" />
                </div>
                <div className="flex items-end">
                    <Button variant="ghost" onClick={() => { setSelectedUserId('all'); setDateRange(undefined); }} className="w-full">Reset Filters</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                <Card className="bg-primary/5">
                    <CardHeader className="py-2"><CardTitle className="text-xs uppercase">Total Actions</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{filteredActivities.length}</div></CardContent>
                </Card>
                <Card className="bg-green-500/5">
                    <CardHeader className="py-2"><CardTitle className="text-xs uppercase">Avg Response Time</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatLag(Math.round(filteredActivities.reduce((acc, a) => acc + (a.lagMinutes || 0), 0) / (filteredActivities.filter(a => a.lagMinutes !== undefined).length || 1)))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="flex-grow min-h-0 flex flex-col">
                <CardHeader className="shrink-0">
                    <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Activity Audit Trail</CardTitle>
                    <CardDescription>Comprehensive log of all user operations and efficiency metrics.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                    <ScrollArea className="h-full">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead>Personnel</TableHead>
                                    <TableHead>Module</TableHead>
                                    <TableHead>Operation</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Actual Time</TableHead>
                                    <TableHead className="text-right">Response Time (Lag)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredActivities.map((act) => {
                                    const emp = employees.find(e => e.id === (act as any).userId);
                                    return (
                                        <TableRow key={act.id} className="hover:bg-muted/30">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-7 w-7 border"><AvatarFallback className="text-[10px]">{emp?.fullName?.charAt(0)}</AvatarFallback></Avatar>
                                                    <span className="text-xs font-bold">{emp?.fullName || 'System'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline" className="text-[10px]">{act.type}</Badge></TableCell>
                                            <TableCell className="text-xs font-medium">{act.action}</TableCell>
                                            <TableCell className="text-xs font-mono">{act.reference}</TableCell>
                                            <TableCell className="text-[10px]">{format(parseISO(act.timestamp), 'PP p')}</TableCell>
                                            <TableCell className={cn("text-right text-xs", getLagColor(act.lagMinutes))}>
                                                <div className="flex flex-col items-end">
                                                    <span>{formatLag(act.lagMinutes)}</span>
                                                    {act.shouldHaveDoneAt && <span className="text-[8px] opacity-50 italic">Since: {format(parseISO(act.shouldHaveDoneAt), 'p')}</span>}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {filteredActivities.length === 0 && <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No audit data matches your filters.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}