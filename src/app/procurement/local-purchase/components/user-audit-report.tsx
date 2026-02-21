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
import { UserCheck, Clock, Search, Filter, Building, LayoutGrid, X, ChevronsUpDown, Check, ScrollText } from 'lucide-react';
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
        <div className="space-y-6 flex flex-col h-full min-h-0">
            <div className="p-4 border rounded-xl bg-muted/10 space-y-4 shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase font-black text-muted-foreground"><Search className="h-3 w-3" /> Quick Scenario Search</Label>
                        <Input 
                            placeholder="Type Ref#, Name, or Code..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="bg-background h-10 font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase font-black text-muted-foreground"><Building className="h-3 w-3" /> Filter by Department</Label>
                        <Select value={deptId} onValueChange={setDeptId}>
                            <SelectTrigger className="bg-background h-10"><SelectValue placeholder="All Departments" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {(departments || []).map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase font-black text-muted-foreground"><LayoutGrid className="h-3 w-3" /> Filter by Section</Label>
                        <Select value={sectionId} onValueChange={setSectionId}>
                            <SelectTrigger className="bg-background h-10"><SelectValue placeholder="All Sections" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                {(sections || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase font-black text-muted-foreground"><UserCheck className="h-3 w-3" /> Target Specific Personnel</Label>
                        <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-between h-10 bg-background font-bold">
                                    <span className="truncate">{selectedEmployeeLabel}</span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 animate-scale-in">
                                <Command>
                                    <CommandInput placeholder="Type Name or Code..." />
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
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs uppercase font-black text-muted-foreground"><Clock className="h-3 w-3" /> Execution Date Range</Label>
                        <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full bg-background" />
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            className="flex-1 font-black text-xs uppercase text-destructive hover:bg-destructive/10 border-destructive/20 h-10" 
                            onClick={() => { 
                                setSelectedUserId('all'); 
                                setDateRange(undefined); 
                                setSearchTerm(''); 
                                setDeptId('all'); 
                                setSectionId('all'); 
                            }}
                        >
                            <X className="mr-2 h-4 w-4" /> Reset Filters
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                <Card className="bg-primary/5 border-primary/20 shadow-sm animate-scale-in">
                    <CardHeader className="py-2"><CardTitle className="text-[10px] uppercase font-black text-muted-foreground">Total Filtered Actions</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black">{filteredActivities.length}</div></CardContent>
                </Card>
                <Card className="bg-green-500/5 border-green-500/20 shadow-sm animate-scale-in">
                    <CardHeader className="py-2"><CardTitle className="text-[10px] uppercase font-black text-muted-foreground">Avg Response Lag</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-green-600">
                            {formatLag(Math.round(filteredActivities.reduce((acc, a) => acc + (a.lagMinutes || 0), 0) / (filteredActivities.filter(a => a.lagMinutes !== undefined).length || 1)))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="flex-grow min-h-0 flex flex-col border-primary/10 overflow-hidden shadow-2xl">
                <CardHeader className="shrink-0 border-b bg-muted/5">
                    <CardTitle className="flex items-center gap-2 text-lg font-black"><Clock className="h-5 w-5 text-primary" /> Performance Audit Trail (Full Scenario)</CardTitle>
                    <CardDescription className="font-bold">Aggressive audit trail documenting organizational response precision.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden min-h-0">
                    <ScrollArea className="h-full">
                        <div className="pb-32">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="font-black uppercase text-[10px]">Personnel</TableHead>
                                        <TableHead className="font-black uppercase text-[10px]">Module</TableHead>
                                        <TableHead className="font-black uppercase text-[10px]">Operation</TableHead>
                                        <TableHead className="font-black uppercase text-[10px]">Reference</TableHead>
                                        <TableHead className="font-black uppercase text-[10px]">Execution Time</TableHead>
                                        <TableHead className="text-right font-black uppercase text-[10px]">Response Lag</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredActivities.map((act) => {
                                        const emp = employees.find(e => e.id === act.userId);
                                        return (
                                            <TableRow key={act.id} className="hover:bg-muted/30 transition-colors group h-16">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-10 w-10 border-2 group-hover:border-primary transition-colors">
                                                            <AvatarFallback className="text-xs font-black">{emp?.fullName?.charAt(0) || '?'}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black tracking-tight">{emp?.fullName || 'System'}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase font-bold">{emp?.userIdCode}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell><Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter border-primary/20">{act.type}</Badge></TableCell>
                                                <TableCell className="text-sm font-bold text-foreground/80">{act.action}</TableCell>
                                                <TableCell className="text-sm font-mono font-black text-primary">{act.reference}</TableCell>
                                                <TableCell className="text-[11px] font-medium leading-tight">
                                                    <div className="flex flex-col">
                                                        <span>{format(parseISO(act.timestamp), 'PP')}</span>
                                                        <span className="text-muted-foreground">{format(parseISO(act.timestamp), 'p')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={cn("text-right text-sm", getLagColor(act.lagMinutes))}>
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-black">{formatLag(act.lagMinutes)}</span>
                                                        {act.shouldHaveDoneAt && <span className="text-[9px] opacity-50 italic font-medium">Wait time since: {format(parseISO(act.shouldHaveDoneAt), 'p')}</span>}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredActivities.length === 0 && <TableRow><TableCell colSpan={6} className="h-64 text-center text-muted-foreground font-black uppercase text-xs tracking-widest opacity-30">No Audit Trail Records Match Your Parameters</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
