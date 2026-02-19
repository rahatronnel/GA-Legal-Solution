
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, History, CheckCircle2, Clock, User, ArrowRight, Building, FileText, ShoppingCart, GitCommit, ChevronRight } from 'lucide-react';
import { useProcurement } from './procurement-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

type TimelineEvent = {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    user: {
        name: string;
        designation: string;
        image?: string;
    };
    type: 'creation' | 'approval' | 'assignment' | 'award' | 'po';
    status: 'completed' | 'pending' | 'rejected';
};

export function WorkflowTracker() {
    const { demandNotes, comparativeStatements, purchaseOrders, employees, sections, designations, vendors, isLoading } = useProcurement();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDnId, setSelectedDnId] = useState<string | null>(null);

    const getEmployeeInfo = (id?: string) => {
        const emp = employees.find(e => e.id === id);
        const des = designations.find(d => d.id === emp?.designationId);
        return {
            name: emp?.fullName || 'Unknown User',
            designation: des?.name || 'N/A',
            image: emp?.profilePicture
        };
    };

    const getVendorName = (id?: string) => vendors.find(v => v.id === id)?.vendorName || 'N/A';

    const filteredNotes = useMemo(() => {
        const notes = Array.isArray(demandNotes) ? demandNotes : [];
        return notes.filter(dn => 
            dn.demandNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sections.find(s => s.id === dn.departmentId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    }, [demandNotes, searchTerm, sections]);

    const timeline = useMemo(() => {
        if (!selectedDnId) return [];
        const dn = demandNotes.find(d => d.id === selectedDnId);
        if (!dn) return [];

        const cs = comparativeStatements.find(c => c.demandNoteId === dn.id);
        const po = purchaseOrders.find(p => p.demandNoteId === dn.id);
        const events: TimelineEvent[] = [];

        // 1. Requisition Entry
        events.push({
            id: 'dn-creation',
            title: 'Demand Note Issued',
            description: `Requisition created for ${sections.find(s => s.id === dn.departmentId)?.name || 'Department'}`,
            timestamp: dn.entryDate,
            user: getEmployeeInfo(dn.createdBy),
            type: 'creation',
            status: 'completed'
        });

        // 2. DN Approvals
        dn.approvalHistory?.forEach((h: any, idx: number) => {
            events.push({
                id: `dn-appr-${idx}`,
                title: dn.approvalFlow?.steps[h.level]?.stepName || 'DN Approval',
                description: `Requisition approval received.`,
                timestamp: h.timestamp,
                user: getEmployeeInfo(h.approverId),
                type: 'approval',
                status: h.status === 'Approved' ? 'completed' : 'rejected'
            });
        });

        // 3. GP Desk Receipt
        if (dn.gpAssignedDate) {
            events.push({
                id: 'gp-assignment',
                title: 'GP Desk Received & Assigned',
                description: `Task assigned to GP Concern: ${getEmployeeInfo(dn.gpConcernOfficerId).name}`,
                timestamp: dn.gpAssignedDate,
                user: getEmployeeInfo(dn.gpAssignedBy),
                type: 'assignment',
                status: 'completed'
            });
        }

        // 4. Vendor Assignment
        if (dn.vendorAssignmentDate) {
            events.push({
                id: 'vendor-sourcing',
                title: 'Vendor Sourcing Started',
                description: `Vendors assigned for quotation collection.`,
                timestamp: dn.vendorAssignmentDate,
                user: getEmployeeInfo(dn.gpConcernOfficerId),
                type: 'assignment',
                status: 'completed'
            });
        }

        // 5. CS Preparation
        if (cs) {
            events.push({
                id: 'cs-creation',
                title: 'Comparative Statement Prepared',
                description: `Comparison summary generated for ${cs.vendorDetails?.length || 0} vendors.`,
                timestamp: cs.csDate,
                user: getEmployeeInfo(cs.createdBy),
                type: 'creation',
                status: 'completed'
            });

            // CS Awarding
            if (cs.vendorSelectionDate) {
                events.push({
                    id: 'vendor-awarded',
                    title: 'Contract Awarded',
                    description: `Vendor "${getVendorName(cs.selectedVendorId)}" chosen for procurement.`,
                    timestamp: cs.vendorSelectionDate,
                    user: getEmployeeInfo(cs.vendorSelectorId),
                    type: 'award',
                    status: 'completed'
                });
            }

            // CS Approvals
            cs.approvalHistory?.forEach((h: any, idx: number) => {
                events.push({
                    id: `cs-appr-${idx}`,
                    title: cs.approvalFlow?.steps[h.level]?.stepName || 'CS Approval',
                    description: `Comparative Statement approved.`,
                    timestamp: h.timestamp,
                    user: getEmployeeInfo(h.approverId),
                    type: 'approval',
                    status: h.status === 'Approved' ? 'completed' : 'rejected'
                });
            });
        }

        // 6. PO Generation
        if (po) {
            events.push({
                id: 'po-creation',
                title: 'Purchase Order Issued',
                description: `Official PO #${po.poNumber} generated for supplier.`,
                timestamp: po.createdAt,
                user: getEmployeeInfo(po.createdBy),
                type: 'po',
                status: 'completed'
            });

            // PO Approvals
            po.approvalHistory?.forEach((h: any, idx: number) => {
                events.push({
                    id: `po-appr-${idx}`,
                    title: po.approvalFlow?.steps[h.level]?.stepName || 'PO Approval',
                    description: `Purchase Order signature received.`,
                    timestamp: h.timestamp,
                    user: getEmployeeInfo(h.approverId),
                    type: 'approval',
                    status: h.status === 'Approved' ? 'completed' : 'rejected'
                });
            });
        }

        return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [selectedDnId, demandNotes, comparativeStatements, purchaseOrders, employees, sections, vendors]);

    const formatDateTime = (ts: string) => {
        try {
            return format(new Date(ts), 'PPP p');
        } catch { return 'N/A'; }
    };

    if (isLoading) return <div className="p-8 text-center animate-pulse">Loading Lifecycle Data...</div>;

    const selectedDn = demandNotes.find(d => d.id === selectedDnId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            {/* Sidebar: Requisition List */}
            <Card className="lg:col-span-1 flex flex-col h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Select Requisition</CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search DN#, Department..." 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="divide-y">
                            {filteredNotes.map(dn => (
                                <button
                                    key={dn.id}
                                    onClick={() => setSelectedDnId(dn.id)}
                                    className={cn(
                                        "w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between group",
                                        selectedDnId === dn.id && "bg-primary/5 border-r-4 border-primary"
                                    )}
                                >
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm">{dn.demandNoteNumber}</p>
                                        <p className="text-xs text-muted-foreground">{sections.find(s => s.id === dn.departmentId)?.name || 'N/A'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-muted-foreground italic">{new Date(dn.entryDate).toLocaleDateString()}</span>
                                            {purchaseOrders.some(p => p.demandNoteId === dn.id) && (
                                                <Badge variant="outline" className="text-[9px] h-4 bg-green-50 text-green-700 border-green-200">PO Ready</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform", selectedDnId === dn.id && "text-primary")} />
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Main Content: Timeline */}
            <Card className="lg:col-span-2 flex flex-col h-full bg-muted/5">
                <CardHeader className="border-b">
                    {selectedDn ? (
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-xl">Workflow Tracker: {selectedDn.demandNoteNumber}</CardTitle>
                                <CardDescription>Full audit trail of the procurement lifecycle.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/procurement/local-purchase/demand-notes/${selectedDn.id}`}>View Record</Link>
                            </Button>
                        </div>
                    ) : (
                        <CardTitle className="text-xl text-muted-foreground">Select a requisition to view its history</CardTitle>
                    )}
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden p-6">
                    {selectedDnId ? (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                                {timeline.map((event, idx) => (
                                    <div key={event.id} className="relative flex items-start group">
                                        {/* Dot */}
                                        <div className={cn(
                                            "absolute left-0 mt-1 h-10 w-10 rounded-full border-4 border-background flex items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-110",
                                            event.status === 'completed' ? "bg-green-500 text-white" : (event.status === 'rejected' ? "bg-destructive text-white" : "bg-orange-500 text-white")
                                        )}>
                                            {event.type === 'creation' && <FileText className="h-4 w-4" />}
                                            {event.type === 'approval' && <CheckCircle2 className="h-4 w-4" />}
                                            {event.type === 'assignment' && <User className="h-4 w-4" />}
                                            {event.type === 'award' && <ShoppingCart className="h-4 w-4" />}
                                            {event.type === 'po' && <Building className="h-4 w-4" />}
                                        </div>

                                        {/* Content */}
                                        <div className="ml-14 flex-grow bg-background border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                <h4 className="font-bold text-base flex items-center gap-2">
                                                    {event.title}
                                                    {event.status === 'rejected' && <Badge variant="destructive" className="text-[10px] h-4">Rejected</Badge>}
                                                </h4>
                                                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDateTime(event.timestamp)}
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                                            
                                            <div className="flex items-center gap-3 pt-3 border-t">
                                                <Avatar className="h-8 w-8 border">
                                                    <AvatarImage src={event.user.image} />
                                                    <AvatarFallback>{event.user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-xs font-bold leading-none">{event.user.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{event.user.designation}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Final End Point */}
                                {selectedDn.approvalStatus === 1 && purchaseOrders.some(p => p.demandNoteId === selectedDnId && p.approvalStatus === 1) && (
                                    <div className="relative flex items-center justify-center py-4">
                                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full border border-green-200 text-sm font-bold flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Workflow Completed
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <History className="h-24 w-24 mb-4" />
                            <h3 className="text-xl font-semibold">No Requisition Selected</h3>
                            <p className="text-sm max-w-[300px]">Choose a Demand Note from the left panel to track its full audit trail and lifecycle status.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
