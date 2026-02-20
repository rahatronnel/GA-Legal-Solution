
'use client';

import React, { useMemo } from 'react';
import { Bell, Check, Info, AlertCircle, Clock, ExternalLink, CheckCircle2, FileText, UserPlus, Users, ShoppingCart, Send, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { differenceInHours, parseISO } from 'date-fns';

type Task = {
    id: string;
    type: 'Demand Note' | 'Comparative Statement' | 'Purchase Order' | 'MRR';
    title: string;
    description: string;
    link: string;
    status: string;
    createdAt: string;
    isOverdue?: boolean;
};

export function NotificationCenter() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { demandNotes, comparativeStatements, purchaseOrders, mrrs, employees, orgSettings, isLoading } = useProcurement();

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [user, employees]);
    
    const ackRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'acknowledgedTasks') : null, [firestore, user]);
    const { data: acknowledgedTasks } = useCollection(ackRef);

    const reminderThreshold = orgSettings?.notificationReminderHours || 24;

    const tasks = useMemo((): Task[] => {
        if (!currentUserEmployee || isLoading) return [];
        
        const list: Task[] = [];
        const uid = currentUserEmployee.id;
        const now = new Date();

        // 1. Demand Notes
        demandNotes.forEach(dn => {
            const isGPOfficer = orgSettings?.procurementSettings?.generalPurchaseOfficerId === uid;
            
            // Approval stage
            if (dn.currentApproverId === uid && dn.approvalStatus !== 1 && dn.approvalStatus !== 0) {
                list.push({
                    id: dn.id, type: 'Demand Note', title: dn.demandNoteNumber,
                    description: 'Awaiting your internal approval signature.',
                    link: `/procurement/local-purchase/demand-notes/${dn.id}`,
                    status: 'Pending Approval', createdAt: dn.entryDate,
                    isOverdue: differenceInHours(now, parseISO(dn.entryDate)) >= reminderThreshold
                });
            }
            
            // GP Officer Assignment stage
            if (isGPOfficer && dn.approvalStatus === 1 && !dn.gpConcernOfficerId) {
                list.push({
                    id: dn.id + '-assign', type: 'Demand Note', title: dn.demandNoteNumber,
                    description: 'Final approved. Please assign a GP Concern Officer.',
                    link: `/procurement/local-purchase?tab=gp-desk`,
                    status: 'GP Assignment Needed', createdAt: dn.entryDate,
                    isOverdue: differenceInHours(now, parseISO(dn.entryDate)) >= reminderThreshold
                });
            }

            // GP Concern stages
            if (dn.gpConcernOfficerId === uid && dn.approvalStatus === 1) {
                // Sourcing stage
                if (!dn.quotations || dn.quotations.length === 0) {
                    list.push({
                        id: dn.id + '-source', type: 'Demand Note', title: dn.demandNoteNumber,
                        description: 'You are assigned. Please assign vendors for quotations.',
                        link: `/procurement/local-purchase?tab=gp-desk`,
                        status: 'Vendor Sourcing Needed', createdAt: dn.gpAssignedDate || dn.entryDate,
                        isOverdue: dn.gpAssignedDate ? differenceInHours(now, parseISO(dn.gpAssignedDate)) >= reminderThreshold : false
                    });
                } else if (!comparativeStatements.some(cs => cs.demandNoteId === dn.id)) {
                    // CS stage
                    list.push({
                        id: dn.id + '-cs', type: 'Demand Note', title: dn.demandNoteNumber,
                        description: 'Quotations collected. Please prepare the CS.',
                        link: `/procurement/local-purchase?tab=gp-desk`,
                        status: 'CS Preparation Needed', createdAt: dn.vendorAssignmentDate || dn.entryDate,
                        isOverdue: dn.vendorAssignmentDate ? differenceInHours(now, parseISO(dn.vendorAssignmentDate)) >= reminderThreshold : false
                    });
                }
            }
        });

        // 2. Comparative Statements
        comparativeStatements.forEach(cs => {
            if (cs.approvalStatus === 2 && cs.vendorSelectorId === uid) {
                list.push({
                    id: cs.id, type: 'Comparative Statement', title: cs.csNumber,
                    description: 'Analysis ready. Please select the awarded vendor.',
                    link: `/procurement/local-purchase/comparative-statements/${cs.id}`,
                    status: 'Award Selection Required', createdAt: cs.csDate,
                    isOverdue: differenceInHours(now, parseISO(cs.csDate)) >= reminderThreshold
                });
            } else if (cs.currentApproverId === uid && cs.approvalStatus !== 1 && cs.approvalStatus !== 0) {
                list.push({
                    id: cs.id, type: 'Comparative Statement', title: cs.csNumber,
                    description: 'Award selection made. Awaiting your approval.',
                    link: `/procurement/local-purchase/comparative-statements/${cs.id}`,
                    status: 'Pending Approval', createdAt: cs.vendorSelectionDate || cs.csDate,
                    isOverdue: cs.vendorSelectionDate ? differenceInHours(now, parseISO(cs.vendorSelectionDate)) >= reminderThreshold : false
                });
            }
        });

        // 3. Purchase Orders
        purchaseOrders.forEach(po => {
            if (po.currentApproverId === uid && po.approvalStatus !== 1 && po.approvalStatus !== 0) {
                list.push({
                    id: po.id, type: 'Purchase Order', title: po.poNumber,
                    description: 'Formal commitment awaiting your signature.',
                    link: `/procurement/local-purchase/purchase-orders/${po.id}`,
                    status: 'Pending Approval', createdAt: po.createdAt,
                    isOverdue: differenceInHours(now, parseISO(po.createdAt)) >= reminderThreshold
                });
            } else if (po.approvalStatus === 1 && !po.isSentToVendor) {
                const dn = demandNotes.find(d => d.id === po.demandNoteId);
                if (dn?.gpConcernOfficerId === uid || orgSettings?.procurementSettings?.generalPurchaseOfficerId === uid) {
                    list.push({
                        id: po.id + '-dispatch', type: 'Purchase Order', title: po.poNumber,
                        description: 'PO is fully approved. Please dispatch to the vendor.',
                        link: `/procurement/local-purchase/purchase-orders/${po.id}`,
                        status: 'Dispatch Required', createdAt: po.createdAt,
                        isOverdue: differenceInHours(now, parseISO(po.createdAt)) >= reminderThreshold
                    });
                }
            }
        });

        // 4. MRRs
        mrrs.forEach(mrr => {
            if (mrr.approvalStatus === 2 && mrr.createdBy === uid) {
                list.push({
                    id: mrr.id, type: 'MRR', title: mrr.mrrNumber,
                    description: 'Initial entry made. Please finalize with Bill and Challan scans.',
                    link: `/procurement/local-purchase/mrrs/${mrr.id}`,
                    status: 'Finalization Required', createdAt: mrr.createdAt,
                    isOverdue: differenceInHours(now, parseISO(mrr.createdAt)) >= reminderThreshold
                });
            } else if (mrr.currentApproverId === uid && mrr.approvalStatus > 2 && mrr.approvalStatus !== 1) {
                list.push({
                    id: mrr.id, type: 'MRR', title: mrr.mrrNumber,
                    description: 'Shipment verification awaiting your approval.',
                    link: `/procurement/local-purchase/mrrs/${mrr.id}`,
                    status: 'Pending Approval', createdAt: mrr.createdAt,
                    isOverdue: differenceInHours(now, parseISO(mrr.createdAt)) >= reminderThreshold
                });
            }
        });

        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [currentUserEmployee, demandNotes, comparativeStatements, purchaseOrders, mrrs, isLoading, orgSettings, reminderThreshold]);

    const unacknowledgedTasks = useMemo(() => {
        if (!acknowledgedTasks) return tasks;
        return tasks.filter(t => !acknowledgedTasks.some(ack => ack.taskId === t.id));
    }, [tasks, acknowledgedTasks]);

    const handleAcknowledge = (taskId: string) => {
        if (!firestore || !user) return;
        const ref = doc(firestore, 'users', user.uid, 'acknowledgedTasks', taskId);
        setDocumentNonBlocking(ref, { 
            userId: user.uid, 
            taskId, 
            acknowledgedAt: new Date().toISOString() 
        }, { merge: true });
    };

    if (orgSettings?.moduleVisibility?.enableNotifications === false) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-primary/10">
                    <Bell className="h-5 w-5" />
                    {unacknowledgedTasks.length > 0 && (
                        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 bg-muted/50">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm">Action Center</h3>
                        <Badge variant="secondary" className="h-5">{tasks.length}</Badge>
                    </div>
                    {unacknowledgedTasks.length > 0 && <p className="text-[10px] text-muted-foreground font-medium">{unacknowledgedTasks.length} New Actions</p>}
                </div>
                <Separator />
                <ScrollArea className="h-80">
                    <div className="divide-y">
                        {tasks.length > 0 ? tasks.map(task => {
                            const isNew = unacknowledgedTasks.some(ut => ut.id === task.id);
                            return (
                                <div key={task.id} className={cn("p-4 group transition-colors", isNew ? "bg-primary/5 border-l-2 border-primary" : "bg-background")}>
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("p-1.5 rounded-md", 
                                                task.isOverdue ? "bg-red-500 text-white animate-pulse" : (isNew ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
                                            )}>
                                                {task.type === 'Demand Note' && <FileText className="h-3 w-3" />}
                                                {task.type === 'Comparative Statement' && <ShoppingCart className="h-3 w-3" />}
                                                {task.type === 'Purchase Order' && <Send className="h-3 w-3" />}
                                                {task.type === 'MRR' && <Package className="h-3 w-3" />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider">{task.type}</span>
                                        </div>
                                        {task.isOverdue && <Badge className="h-4 text-[9px] bg-red-600 animate-bounce">Urgent Reminder</Badge>}
                                        {!task.isOverdue && isNew && <Badge className="h-4 text-[9px] bg-blue-500">New Task</Badge>}
                                    </div>
                                    <p className="font-bold text-sm leading-tight mb-1">{task.title}</p>
                                    <p className="text-xs text-muted-foreground leading-snug mb-3">{task.description}</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 font-bold hover:bg-primary/10" asChild>
                                            <Link href={task.link} onClick={() => isNew && handleAcknowledge(task.id)}>
                                                Process Action <ExternalLink className="h-3 w-3 ml-1" />
                                            </Link>
                                        </Button>
                                        {isNew && (
                                            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 font-bold hover:bg-green-500 hover:text-white" onClick={() => handleAcknowledge(task.id)}>
                                                <Check className="h-3 w-3 mr-1" /> Acknowledge
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="p-8 text-center">
                                <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm font-medium text-muted-foreground">All clear! No tasks awaiting action.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <Separator />
                <div className="p-2 bg-muted/20 text-center">
                    <Button variant="link" size="sm" className="text-[10px] h-auto p-0" asChild>
                        <Link href="/procurement/local-purchase">Access Procurement Dashboard</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
