'use client';

import React, { useMemo, useState } from 'react';
import { 
    Bell, Check, Info, AlertCircle, Clock, ExternalLink, 
    CheckCircle2, FileText, UserPlus, Users, ShoppingCart, 
    Send, Package, Copy, ClipboardCheck 
} from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

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
    const { toast } = useToast();
    const firestore = useFirestore();
    const { demandNotes, comparativeStatements, purchaseOrders, mrrs, employees, orgSettings, isLoading } = useProcurement();

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [user, employees]);
    
    const ackRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'acknowledgedTasks') : null, [firestore, user]);
    const { data: acknowledgedTasks } = useCollection(ackRef);

    const reminderThreshold = orgSettings?.notificationReminderHours || 24;

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        toast({ title: "Copied to Clipboard", description: `${text} is ready to paste.` });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const tasks = useMemo((): Task[] => {
        if (!currentUserEmployee || isLoading) return [];
        
        const list: Task[] = [];
        const uid = currentUserEmployee.id;
        const now = new Date();

        // 1. Demand Notes Lifecycle
        demandNotes.forEach(dn => {
            const isGPOfficer = orgSettings?.procurementSettings?.generalPurchaseOfficerId === uid;
            
            if (dn.currentApproverId === uid && dn.approvalStatus !== 1 && dn.approvalStatus !== 0) {
                list.push({
                    id: dn.id, type: 'Demand Note', title: dn.demandNoteNumber,
                    description: 'Awaiting your internal approval signature.',
                    link: `/procurement/local-purchase/demand-notes/${dn.id}`,
                    status: 'Pending Approval', createdAt: dn.entryDate,
                    isOverdue: differenceInHours(now, parseISO(dn.entryDate)) >= reminderThreshold
                });
            }
            
            if (isGPOfficer && dn.approvalStatus === 1 && !dn.gpConcernOfficerId) {
                list.push({
                    id: dn.id + '-assign', type: 'Demand Note', title: dn.demandNoteNumber,
                    description: 'Approved. Please assign a GP Concern Officer.',
                    link: `/procurement/local-purchase?tab=gp-desk`,
                    status: 'GP Assignment Needed', createdAt: dn.entryDate,
                    isOverdue: differenceInHours(now, parseISO(dn.entryDate)) >= reminderThreshold
                });
            }

            if (dn.gpConcernOfficerId === uid && dn.approvalStatus === 1) {
                if (!dn.quotations || dn.quotations.length === 0) {
                    list.push({
                        id: dn.id + '-source', type: 'Demand Note', title: dn.demandNoteNumber,
                        description: 'You are assigned. Please assign vendors for quotations.',
                        link: `/procurement/local-purchase?tab=gp-desk`,
                        status: 'Vendor Sourcing Needed', createdAt: dn.gpAssignedDate || dn.entryDate,
                        isOverdue: dn.gpAssignedDate ? differenceInHours(now, parseISO(dn.gpAssignedDate)) >= reminderThreshold : false
                    });
                } else if (!comparativeStatements.some(cs => cs.demandNoteId === dn.id)) {
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

        // 2. Comparative Statements Lifecycle
        comparativeStatements.forEach(cs => {
            const relatedDN = demandNotes.find(d => d.id === cs.demandNoteId);
            const poExists = purchaseOrders.some(p => p.csId === cs.id);
            
            if (cs.approvalStatus === 2 && (cs.vendorSelectorId === uid || relatedDN?.gpConcernOfficerId === uid)) {
                list.push({
                    id: cs.id + '-award', type: 'Comparative Statement', title: cs.csNumber,
                    description: 'CS Prepared. Please select the awarded vendor.',
                    link: `/procurement/local-purchase/comparative-statements/${cs.id}`,
                    status: 'Award Selection Required', createdAt: cs.csDate,
                    isOverdue: differenceInHours(now, parseISO(cs.csDate)) >= reminderThreshold
                });
            } 
            else if (cs.approvalStatus === 1 && !poExists && (relatedDN?.gpConcernOfficerId === uid || orgSettings?.procurementSettings?.generalPurchaseOfficerId === uid)) {
                list.push({
                    id: cs.id + '-po-prep', type: 'Purchase Order', title: cs.csNumber,
                    description: 'CS Approved. Please prepare the Purchase Order.',
                    link: `/procurement/local-purchase?tab=po`,
                    status: 'PO Preparation Needed', createdAt: cs.csDate, 
                    isOverdue: differenceInHours(now, parseISO(cs.csDate)) >= reminderThreshold
                });
            } 
            else if (cs.currentApproverId === uid && cs.approvalStatus !== 1 && cs.approvalStatus !== 0 && cs.approvalStatus !== 2) {
                list.push({
                    id: cs.id + '-appr', type: 'Comparative Statement', title: cs.csNumber,
                    description: 'Awaiting your analysis approval signature.',
                    link: `/procurement/local-purchase/comparative-statements/${cs.id}`,
                    status: 'Pending Approval', createdAt: cs.vendorSelectionDate || cs.csDate,
                    isOverdue: cs.vendorSelectionDate ? differenceInHours(now, parseISO(cs.vendorSelectionDate)) >= reminderThreshold : false
                });
            }
        });

        // 3. Purchase Orders & MRRs
        purchaseOrders.forEach(po => {
            const relatedDN = demandNotes.find(d => d.id === po.demandNoteId);
            const isConcern = relatedDN?.gpConcernOfficerId === uid;

            if (po.currentApproverId === uid && po.approvalStatus !== 1 && po.approvalStatus !== 0) {
                list.push({
                    id: po.id, type: 'Purchase Order', title: po.poNumber,
                    description: 'Formal commitment awaiting your signature.',
                    link: `/procurement/local-purchase/purchase-orders/${po.id}`,
                    status: 'Pending Approval', createdAt: po.createdAt,
                    isOverdue: differenceInHours(now, parseISO(po.createdAt)) >= reminderThreshold
                });
            }

            // TRIGGER: PO approved but not sent to vendor
            if (isConcern && po.approvalStatus === 1 && !po.isSentToVendor) {
                list.push({
                    id: po.id + '-send', type: 'Purchase Order', title: po.poNumber,
                    description: 'PO is fully approved. Please send it to the vendor.',
                    link: `/procurement/local-purchase/purchase-orders/${po.id}`,
                    status: 'PO Dispatch Required', createdAt: po.createdAt,
                    isOverdue: differenceInHours(now, parseISO(po.createdAt)) >= reminderThreshold
                });
            }

            // TRIGGER: PO sent but MRR not prepared
            if (isConcern && po.isSentToVendor && !mrrs.some(m => m.poId === po.id)) {
                list.push({
                    id: po.id + '-mrr', type: 'MRR', title: po.poNumber,
                    description: 'PO sent to vendor. Please prepare the MRR upon receipt.',
                    link: `/procurement/local-purchase/purchase-orders/${po.id}`,
                    status: 'MRR Preparation Needed', createdAt: po.sentToVendorDate || po.createdAt,
                    isOverdue: po.sentToVendorDate ? differenceInHours(now, parseISO(po.sentToVendorDate)) >= reminderThreshold : false
                });
            }
        });

        mrrs.forEach(mrr => {
            if (mrr.approvalStatus === 2 && mrr.createdBy === uid) {
                list.push({
                    id: mrr.id, type: 'MRR', title: mrr.mrrNumber,
                    description: 'Finalize with Bill/Challan scans.',
                    link: `/procurement/local-purchase/mrrs/${mrr.id}`,
                    status: 'Finalization Required', createdAt: mrr.createdAt,
                    isOverdue: differenceInHours(now, parseISO(mrr.createdAt)) >= reminderThreshold
                });
            } else if (mrr.currentApproverId === uid && mrr.approvalStatus > 2 && mrr.approvalStatus !== 1) {
                list.push({
                    id: mrr.id, type: 'MRR', title: mrr.mrrNumber,
                    description: 'Awaiting your report approval.',
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
        setDocumentNonBlocking(ref, { userId: user.uid, taskId, acknowledgedAt: new Date().toISOString() }, { merge: true });
    };

    if (orgSettings?.moduleVisibility?.enableNotifications === false) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-primary/10 transition-transform active:scale-95 group">
                    <Bell className={cn("h-5 w-5", unacknowledgedTasks.length > 0 && "animate-bell-ring text-primary")} />
                    {unacknowledgedTasks.length > 0 && (
                        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-2xl animate-liquid-genie" align="end" sideOffset={12}>
                <div className="flex items-center justify-between p-4 bg-muted/50 border-b">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm">Action Center</h3>
                        <Badge variant="secondary" className="animate-scale-in">{tasks.length}</Badge>
                    </div>
                </div>
                <ScrollArea className="h-80">
                    <div className="divide-y">
                        {tasks.map(task => {
                            const isNew = unacknowledgedTasks.some(ut => ut.id === task.id);
                            return (
                                <div key={task.id} className={cn("p-4 transition-all duration-300", isNew ? "bg-primary/5 border-l-4 border-primary" : "bg-background")}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={cn("p-1.5 rounded-md", isNew ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                            {task.type === 'Demand Note' && <FileText className="h-3 w-3" />}
                                            {task.type === 'Comparative Statement' && <Info className="h-3 w-3" />}
                                            {task.type === 'Purchase Order' && <ShoppingCart className="h-3 w-3" />}
                                            {task.type === 'MRR' && <Package className="h-3 w-3" />}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{task.type}</span>
                                        {task.isOverdue && <Badge variant="destructive" className="ml-auto text-[8px] h-4 animate-pulse">Urgent Reminder</Badge>}
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-bold text-sm truncate">{task.title}</p>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/10" onClick={() => handleCopy(task.title)}>
                                            {copiedId === task.title ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3 leading-tight">{task.description}</p>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1 font-bold shadow-sm" asChild onClick={() => isNew && handleAcknowledge(task.id)}>
                                            <Link href={task.link}>Process <ExternalLink className="ml-1 h-3 w-3"/></Link>
                                        </Button>
                                        {isNew && <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-primary" onClick={() => handleAcknowledge(task.id)}>Acknowledge</Button>}
                                    </div>
                                </div>
                            );
                        })}
                        {tasks.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2"><ClipboardCheck className="h-10 w-10 opacity-20" /><p>No pending tasks.</p></div>}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
