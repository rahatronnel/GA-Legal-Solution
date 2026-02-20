'use client';

import React, { useMemo } from 'react';
import { Bell, Check, Info, AlertCircle, Clock, ExternalLink, CheckCircle2, FileText } from 'lucide-react';
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

type Task = {
    id: string;
    type: 'Demand Note' | 'Comparative Statement' | 'Purchase Order' | 'MRR';
    title: string;
    description: string;
    link: string;
    status: string;
    createdAt: string;
};

export function NotificationCenter() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { demandNotes, comparativeStatements, purchaseOrders, mrrs, employees, orgSettings, isLoading } = useProcurement();

    const currentUserEmployee = useMemo(() => employees?.find(e => e.email === user?.email), [user, employees]);
    
    const ackRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users', user.uid, 'acknowledgedTasks') : null, [firestore, user]);
    const { data: acknowledgedTasks } = useCollection(ackRef);

    const tasks = useMemo((): Task[] => {
        if (!currentUserEmployee || isLoading) return [];
        
        const list: Task[] = [];
        const uid = currentUserEmployee.id;

        // 1. Demand Notes
        demandNotes.forEach(dn => {
            if (dn.currentApproverId === uid && dn.approvalStatus !== 1 && dn.approvalStatus !== 0) {
                list.push({
                    id: dn.id, type: 'Demand Note', title: dn.demandNoteNumber,
                    description: 'Awaiting your approval in the chain.',
                    link: `/procurement/local-purchase/demand-notes/${dn.id}`,
                    status: 'Pending Approval', createdAt: dn.entryDate
                });
            }
        });

        // 2. Comparative Statements
        comparativeStatements.forEach(cs => {
            if (cs.approvalStatus === 2 && cs.vendorSelectorId === uid) {
                list.push({
                    id: cs.id, type: 'Comparative Statement', title: cs.csNumber,
                    description: 'Quotations collected. Please select the awarded vendor.',
                    link: `/procurement/local-purchase/comparative-statements/${cs.id}`,
                    status: 'Vendor Selection Required', createdAt: cs.csDate
                });
            } else if (cs.currentApproverId === uid && cs.approvalStatus !== 1 && cs.approvalStatus !== 0) {
                list.push({
                    id: cs.id, type: 'Comparative Statement', title: cs.csNumber,
                    description: 'Award selection made. Awaiting your approval.',
                    link: `/procurement/local-purchase/comparative-statements/${cs.id}`,
                    status: 'Pending Approval', createdAt: cs.csDate
                });
            }
        });

        // 3. Purchase Orders
        purchaseOrders.forEach(po => {
            if (po.currentApproverId === uid && po.approvalStatus !== 1 && po.approvalStatus !== 0) {
                list.push({
                    id: po.id, type: 'Purchase Order', title: po.poNumber,
                    description: 'Awaiting your signature.',
                    link: `/procurement/local-purchase/purchase-orders/${po.id}`,
                    status: 'Pending Approval', createdAt: po.createdAt
                });
            }
        });

        // 4. MRRs
        mrrs.forEach(mrr => {
            if (mrr.approvalStatus === 2 && mrr.createdBy === uid) {
                list.push({
                    id: mrr.id, type: 'MRR', title: mrr.mrrNumber,
                    description: 'Goods received. Please finalize with Bill and Challan scans.',
                    link: `/procurement/local-purchase/mrrs/${mrr.id}`,
                    status: 'Finalization Required', createdAt: mrr.createdAt
                });
            } else if (mrr.currentApproverId === uid && mrr.approvalStatus > 2 && mrr.approvalStatus !== 1) {
                list.push({
                    id: mrr.id, type: 'MRR', title: mrr.mrrNumber,
                    description: 'Awaiting your approval.',
                    link: `/procurement/local-purchase/mrrs/${mrr.id}`,
                    status: 'Pending Approval', createdAt: mrr.createdAt
                });
            }
        });

        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [currentUserEmployee, demandNotes, comparativeStatements, purchaseOrders, mrrs, isLoading]);

    const unacknowledgedTasks = useMemo(() => {
        if (!acknowledgedTasks) return tasks;
        return tasks.filter(t => !acknowledgedTasks.some(ack => ack.id === t.id));
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
                                <div key={task.id} className={cn("p-4 group transition-colors", isNew ? "bg-primary/5" : "bg-background")}>
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("p-1.5 rounded-md", isNew ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                                {task.type === 'Demand Note' && <FileText className="h-3 w-3" />}
                                                {task.type === 'Comparative Statement' && <Info className="h-3 w-3" />}
                                                {task.type === 'Purchase Order' && <AlertCircle className="h-3 w-3" />}
                                                {task.type === 'MRR' && <Clock className="h-3 w-3" />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider">{task.type}</span>
                                        </div>
                                        {isNew && <Badge className="h-4 text-[9px] bg-red-500">New</Badge>}
                                    </div>
                                    <p className="font-bold text-sm leading-tight mb-1">{task.title}</p>
                                    <p className="text-xs text-muted-foreground leading-snug mb-3">{task.description}</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 font-bold" asChild>
                                            <Link href={task.link} onClick={() => isNew && handleAcknowledge(task.id)}>
                                                Open Task <ExternalLink className="h-3 w-3 ml-1" />
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
                                <p className="text-sm font-medium text-muted-foreground">All clear! No pending tasks.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <Separator />
                <div className="p-2 bg-muted/20 text-center">
                    <Button variant="link" size="sm" className="text-[10px] h-auto p-0" asChild>
                        <Link href="/procurement/local-purchase">See All Activity</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}