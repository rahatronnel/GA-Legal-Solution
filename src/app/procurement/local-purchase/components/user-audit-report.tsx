'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useProcurement } from './procurement-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format, parseISO, isWithinInterval, differenceInMinutes } from 'date-fns';
import { UserCheck, Clock, Search, Filter, Building, LayoutGrid, X, ChevronsUpDown, Check, ScrollText, Timer } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type ActivityItem = {
    id: string;
    type: 'Demand Note' | 'CS' | 'PO' | 'MRR';
    action: string;
    timestamp: string;
    reference: string;
    userId: string;
    shouldHaveDoneAt?: string;
    lagMinutes?: number;
};

export function UserAuditReport() {
    const { demandNotes, comparativeStatements, purchaseOrders, mrrs, employees, departments, sections, isLoading } = useProcurement();
    
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    const [userPopoverOpen, setUserPopoverOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [searchTerm, setSearchTerm] = useState('');
    const [deptId, setDeptId] = useState('all');
    const [sectionId, setSectionId] = useState('all');

    const activities = useMemo(() => {
        if (isLoading) return [];
        const list: ActivityItem[] = [];

        demandNotes.forEach(dn => {
            list.push({ id: dn.id + '-c', type: 'Demand Note', action: 'Drafted Requisition', timestamp: dn.entryDate, reference: dn.demandNoteNumber, userId: dn.createdBy });
            
            dn.approvalHistory?.forEach((h: any, i: number) => {
                const prevActionTime = i === 0 ? dn.entryDate : dn.approvalHistory[i-1].timestamp;
                list.push({ 
                    id: dn.id + '-a-' + i, type: 'Demand Note', action: `Approved Step ${i+1}`, 
                    timestamp: h.timestamp, reference: dn.demandNoteNumber, userId: h.approverId,
                    shouldHaveDoneAt: prevActionTime,
                    lagMinutes: differenceInMinutes(parseISO(h.timestamp), parseISO(prevActionTime))
                });
            });

            if (dn.gpAssignedDate) {
                list.push({ 
                    id: dn.id + '-gpa', type: 'Demand Note', action: 'Assigned GP Concern', 
                    timestamp: dn.gpAssignedDate, reference: dn.demandNoteNumber, userId: dn.gpAssignedBy || 'System',
                    shouldHaveDoneAt: dn.entryDate,
                    lagMinutes: differenceInMinutes(parseISO(dn.gpAssignedDate), parseISO(dn.entryDate))
                });
            }

            if (dn.vendorAssignmentDate) {
                list.push({ 
                    id: dn.id + '-va', type: 'Demand Note', action: 'Assigned Vendors', 
                    timestamp: dn.vendorAssignmentDate, reference: dn.demandNoteNumber, userId: dn.gpConcernOfficerId || 'System',
                    shouldHaveDoneAt: dn.gpAssignedDate || dn.entryDate,
                    lagMinutes: differenceInMinutes(parseISO(dn.vendorAssignmentDate), parseISO(dn.gpAssignedDate || dn.entryDate))
                });
            }
        });

        comparativeStatements.forEach(cs => {
            const dn = demandNotes.find(d => d.id === cs.demandNoteId);
            list.push({ id: cs.id + '-c', type: 'CS', action: 'Prepared CS', timestamp: cs.csDate, reference: cs.csNumber, userId: cs.createdBy, shouldHaveDoneAt: dn?.vendorAssignmentDate, lagMinutes: dn?.vendorAssignmentDate ? differenceInMinutes(parseISO(cs.csDate), parseISO(dn.vendorAssignmentDate)) : undefined });
            
            if (cs.vendorSelectionDate) {
                list.push({ id: cs.id + '-vs', type: 'CS', action: 'Awarded Vendor', timestamp: cs.vendorSelectionDate, reference: cs.csNumber, userId: cs.vendorSelectorId || 'System', shouldHaveDoneAt: cs.csDate, lagMinutes: differenceInMinutes(parseISO(cs.vendorSelectionDate), parseISO(cs.csDate)) });
            }

            cs.approvalHistory?.forEach((h: any, i: number) => {
                const prev = i === 0 ? cs.vendorSelectionDate : cs.approvalHistory[i-1].timestamp;
                list.push({ id: cs.id + '-a-' + i, type: 'CS', action: `Approved CS Step ${i+1}`, timestamp: h.timestamp, reference: cs.csNumber, userId: h.approverId, shouldHaveDoneAt: prev || undefined, lagMinutes: prev ? differenceInMinutes(parseISO(h.timestamp), parseISO(prev)) : undefined });
            });
        });

        purchaseOrders.forEach(po => {
            list.push({ id: po.id + '-c', type: 'PO', action: 'Drafted PO', timestamp: po.createdAt, reference: po.poNumber, userId: po.createdBy });
            po.approvalHistory?.forEach((h: any, i: number) => {
                const prev = i === 0 ? po.createdAt : po.approvalHistory[i-1].timestamp;
                list.push({ id: po.id + '-a-' + i, type: 'PO', action: `Approved PO Step ${i+1}`, timestamp: h.timestamp, reference: po.poNumber, userId: h.approverId, shouldHaveDoneAt: prev, lagMinutes: differenceInMinutes(parseISO(h.timestamp), parseISO(prev)) });
            });
        });

        mrrs.forEach(mrr => {
            list.push({ id: mrr.id + '-c', type: 'MRR', action: 'Recorded Receipt', timestamp: mrr.createdAt, reference: mrr.mrrNumber, userId: mrr.createdBy });
            mrr.approvalHistory?.forEach((h: any, i: number) => {
                const prev = i === 0 ? mrr.createdAt : mrr.approvalHistory[i-1].timestamp;
                list.push({ id: mrr.id + '-a-' + i, type: 'MRR', action: `Approved MRR Step ${i+1}`, timestamp: h.timestamp, reference: mrr.mrrNumber, userId: h.approverId, shouldHaveDoneAt: prev, lagMinutes: differenceInMinutes(parseISO(h.timestamp), parseISO(prev)) });
            });
        });

        return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [demandNotes, comparativeStatements, purchaseOrders, mrrs, isLoading]);

    const filteredActivities = useMemo(() => {
        return activities.filter(act => {
            const emp = employees.find(e => e.id === act.userId);
            if (!emp) return false;

            const userMatch = selectedUserId === 'all' || act.userId === selectedUserId;
            const dateMatch = !dateRange?.from || isWithinInterval(parseISO(act.timestamp), { start: dateRange.from, end: dateRange.to || dateRange.from });
            const deptMatch = deptId === 'all' || emp.departmentId === deptId;
            const sectionMatch = sectionId === 'all' || emp.sectionId === sectionId;
            
            const lowerSearch = searchTerm.toLowerCase();
            const searchMatch = !searchTerm || 
                emp.fullName.toLowerCase().includes(lowerSearch) || 
                emp.userIdCode.toLowerCase().includes(lowerSearch) ||
                act.reference.toLowerCase().includes(lowerSearch);

            return userMatch && dateMatch && deptMatch && sectionMatch && searchMatch;
        });
    }, [activities, selectedUserId, dateRange, deptId, sectionId, searchTerm, employees]);

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

    const selectedEmployeeLabel = useMemo(() => {
        if (selectedUserId === 'all') return "All Personnel";
        const emp = employees.find(e => e.id === selectedUserId);
        return emp ? `${emp.fullName} (${emp.userIdCode})` : "All Personnel";
    }, [selectedUserId, employees]);

    return (
        <div className="space-y-4 flex flex-col h-full min-h-0 p-2">
            <div className="flex flex-wrap items-end gap-3 p-3 border rounded-xl bg-background shadow-sm shrink-0">
                <div className="flex-1 min-w-[120px] max-w-[180px]">
                    <Label className="text-[9px] uppercase font-black text-muted-foreground mb-1 block">Quick Search</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                        <Input 
                            placeholder="Ref#, Name..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="h-8 text-xs pl-7 font-bold"
                        />
                    </div>
                </div>

                <div className="w-[140px]">
                    <Label className="text-[9px] uppercase font-black text-muted-foreground mb-1 block text-blue-600">Personnel</Label>
                    <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between h-8 bg-background font-bold text-xs px-2">
                                <span className="truncate">{selectedEmployeeLabel}</span>
                                <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 animate-scale-in">
                            <Command>
                                <CommandInput placeholder="Search..." />
                                <CommandList>
                                    <CommandEmpty>No personnel matched.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem onSelect={() => { setSelectedUserId('all'); setUserPopoverOpen(false); }}>
                                            <Check className={cn("mr-2 h-4 w-4", selectedUserId === 'all' ? "opacity-100" : "opacity-0")} />
                                            All Personnel
                                        </CommandItem>
                                        {employees.map(emp => (
                                            <CommandItem 
                                                key={emp.id} 
                                                value={`${emp.fullName} ${emp.userIdCode}`}
                                                onSelect={() => { setSelectedUserId(emp.id); setUserPopoverOpen(false); }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", selectedUserId === emp.id ? "opacity-100" : "opacity-0")} />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs">{emp.fullName}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{emp.userIdCode}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="w-[120px]">
                    <Label className="text-[9px] uppercase font-black text-muted-foreground mb-1 block">Department</Label>
                    <Select value={deptId} onValueChange={setDeptId}>
                        <SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {(departments || []).map(d => <SelectItem key={d.id} value={d.id} className="text-xs">{d.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-[120px]">
                    <Label className="text-[9px] uppercase font-black text-muted-foreground mb-1 block">Section</Label>
                    <Select value={sectionId} onValueChange={setSectionId}>
                        <SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {(sections || []).map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-[220px]">
                    <Label className="text-[9px] uppercase font-black text-muted-foreground mb-1 block">Execution Window</Label>
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} className="h-8 [&_button]:h-8 [&_button]:text-xs [&_button]:font-bold [&_button]:w-full" />
                </div>

                <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                    onClick={() => { 
                        setSelectedUserId('all'); 
                        setDateRange(undefined); 
                        setSearchTerm(''); 
                        setDeptId('all'); 
                        setSectionId('all'); 
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex gap-4 shrink-0 px-1">
                <div className="flex-1 p-2 border rounded-lg bg-primary/5 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">Activities</span>
                    <span className="text-lg font-black">{filteredActivities.length}</span>
                </div>
                <div className="flex-1 p-2 border rounded-lg bg-green-500/5 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-green-700">Avg Lag</span>
                    <span className="text-lg font-black text-green-600">
                        {formatLag(Math.round(filteredActivities.reduce((acc, a) => acc + (a.lagMinutes || 0), 0) / (filteredActivities.filter(a => a.lagMinutes !== undefined).length || 1)))}
                    </span>
                </div>
                <div className="flex-1 p-2 border rounded-lg bg-orange-500/5 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-orange-700">Peak Wait</span>
                    <span className="text-lg font-black text-orange-600">
                        {formatLag(Math.max(...filteredActivities.map(a => a.lagMinutes || 0), 0))}
                    </span>
                </div>
            </div>

            <Card className="flex-grow min-h-0 flex flex-col border-none shadow-none overflow-hidden bg-background">
                <div className="flex-grow overflow-hidden min-h-0">
                    <ScrollArea className="h-full">
                        <div className="min-w-[1200px] pb-20">
                            <Table className="border-collapse">
                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                    <TableRow className="h-10 border-b-2 border-primary/10">
                                        <TableHead className="font-black uppercase text-[10px] w-[220px]">Personnel & Identification</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] w-[120px]">Module</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] w-[200px]">Operation Performed</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] w-[150px]">Reference #</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] w-[180px]">Execution Timestamp</TableHead>
                                        <TableHead className="text-right font-black uppercase text-[10px] w-[150px]">Efficiency (Lag)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredActivities.map((act) => {
                                        const emp = employees.find(e => e.id === act.userId);
                                        return (
                                            <TableRow key={act.id} className="hover:bg-muted/30 transition-colors group h-14 border-b border-primary/5">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8 border ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                                            <AvatarFallback className="text-[10px] font-black">{emp?.fullName?.charAt(0) || '?'}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black tracking-tight leading-none mb-1">{emp?.fullName || 'System'}</span>
                                                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">{emp?.userIdCode}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-primary/20 bg-background">
                                                        {act.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs font-bold text-foreground/80">{act.action}</TableCell>
                                                <TableCell className="text-xs font-mono font-black text-primary bg-primary/5 px-2 py-1 rounded w-fit">{act.reference}</TableCell>
                                                <TableCell className="text-[10px] font-medium leading-tight">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold">{format(parseISO(act.timestamp), 'PP')}</span>
                                                        <Separator orientation="vertical" className="h-3" />
                                                        <span className="text-muted-foreground">{format(parseISO(act.timestamp), 'p')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={cn("text-right text-xs", getLagColor(act.lagMinutes))}>
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-1">
                                                            <Timer className="h-3 w-3 opacity-50" />
                                                            <span className="font-black">{formatLag(act.lagMinutes)}</span>
                                                        </div>
                                                        {act.shouldHaveDoneAt && (
                                                            <span className="text-[8px] opacity-40 italic font-medium">Wait from: {format(parseISO(act.shouldHaveDoneAt), 'p')}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredActivities.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-64 text-center">
                                                <div className="flex flex-col items-center gap-2 opacity-20">
                                                    <ScrollText className="h-12 w-12" />
                                                    <p className="font-black uppercase text-xs tracking-[0.2em]">Zero Records in Selection</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <ScrollBar orientation="horizontal" />
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                </div>
            </Card>
        </div>
    );
}