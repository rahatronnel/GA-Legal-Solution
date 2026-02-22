
'use client';

import React, { useMemo, useState } from 'react';
import { 
    Bell, Check, Clock, ExternalLink, 
    FileText, ShoppingCart, Send, Package, Copy, ClipboardCheck, Info, AlertTriangle, Wallet, BellRing 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProcurement } from './procurement-provider';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { differenceInHours, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type Task = {
    id: string;
    type: 'Demand Note' | 'Comparative Statement' | 'Purchase Order' | 'MRR' | 'Payment Note';
    title: string;
    description: string;
    link: string;
    status: string;
    createdAt: string;
    isOverdue?: boolean;
    reminderCount: number;
};

export function NotificationCenter() {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { demandNotes, comparativeStatements, purchaseOrders, mrrs, paymentNotes, employees, orgSettings, isLoading } = useProcurement();

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

        const calculateReminders = (timestamp: string) => {
            const hoursPending = differenceInHours(now, parseISO(timestamp));
            return {
                isOverdue: hoursPending >= reminderThreshold,
                reminderCount: Math.floor(hoursPending / reminderThreshold)
            };
        };

        demandNotes.forEach(dn => {
            if (dn.currentApproverId === uid && dn.approvalStatus !== 1 && dn.approvalStatus !== 0) {
                const r = calculateReminders(dn.entryDate);
                list.push({ id: dn.id, type: 'Demand Note', title: dn.demandNoteNumber, description: 'Awaiting your internal approval signature.', link: `/procurement/local-purchase/demand-notes/${dn.id}`, status: 'Pending Approval', createdAt: dn.entryDate, ...r });
            }
        });

        comparativeStatements.forEach(cs => {
            const relatedDN = demandNotes.find(d => d.id === cs.demandNoteId);
            if (cs.approvalStatus === 2 && (cs.vendorSelectorId === uid || relatedDN?.gpConcernOfficerId === uid)) {
                const r = calculateReminders(cs.csDate);
                list.push({ id: cs.id + '-award', type: 'Comparative Statement', title: cs.csNumber, description: 'CS Prepared. Please select the awarded vendor.', link: `/procurement/local-purchase/comparative-statements/${cs.id}`, status: 'Award Selection Required', createdAt: cs.csDate, ...r });
            } else if (cs.currentApproverId === uid && cs.approvalStatus !== 1 && cs.approvalStatus !== 0 && cs.approvalStatus !== 2) {
                const r = calculateReminders(cs.vendorSelectionDate || cs.csDate);
                list.push({ id: cs.id + '-appr', type: 'Comparative Statement', title: cs.csNumber, description: 'Awaiting your analysis approval signature.', link: `/procurement/local-purchase/comparative-statements/${cs.id}`, status: 'Pending Approval', createdAt: cs.vendorSelectionDate || cs.csDate, ...r });
            }
        });

        purchaseOrders.forEach(po => {
            if (po.currentApproverId === uid && po.approvalStatus !== 1 && po.approvalStatus !== 0) {
                const r = calculateReminders(po.createdAt);
                list.push({ id: po.id, type: 'Purchase Order', title: po.poNumber, description: 'Formal commitment awaiting your signature.', link: `/procurement/local-purchase/purchase-orders/${po.id}`, status: 'Pending Approval', createdAt: po.createdAt, ...r });
            }
        });

        mrrs.forEach(mrr => {
            if (mrr.currentApproverId === uid && mrr.approvalStatus > 2 && mrr.approvalStatus !== 1) {
                const r = calculateReminders(mrr.createdAt);
                list.push({ id: mrr.id, type: 'MRR', title: mrr.mrrNumber, description: 'Awaiting your report approval.', link: `/procurement/local-purchase/mrrs/${mrr.id}`, status: 'Pending Approval', createdAt: mrr.createdAt, ...r });
            }
        });

        paymentNotes.forEach(pn => {
            if (pn.approvalStatus === 2 && pn.currentApproverId === uid) {
                const r = calculateReminders(pn.createdAt);
                list.push({ id: pn.id + '-pn-appr', type: 'Payment Note', title: pn.pnNumber, description: 'New Payment Note awaiting your financial authorization.', link: `/procurement/local-purchase?tab=pn`, status: 'Audit Required', createdAt: pn.createdAt, ...r });
            }
        });

        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [currentUserEmployee, demandNotes, comparativeStatements, purchaseOrders, mrrs, paymentNotes, isLoading, orgSettings, reminderThreshold]);

    const unacknowledgedTasks = useMemo(() => {
        if (!acknowledgedTasks) return tasks;
        return tasks.filter(t => !acknowledgedTasks.some(ack => ack.taskId === t.id));
    }, [tasks, acknowledgedTasks]);

    const handleAcknowledge = (taskId: string) => {
        if (!firestore || !user) return;
        const ref = doc(firestore, 'users', user.uid, 'acknowledgedTasks', taskId);
        setDocumentNonBlocking(ref, { userId: user.uid, taskId, acknowledgedAt: new Date().toISOString() }, { merge: true });
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="relative group cursor-pointer p-1">
                    <div className={cn(
                        "absolute inset-0 bg-primary/20 blur-xl rounded-full transition-opacity duration-500",
                        unacknowledgedTasks.length > 0 ? "opacity-100 animate-pulse" : "opacity-0"
                    )} />
                    <Button 
                        variant={unacknowledgedTasks.length > 0 ? "default" : "ghost"} 
                        size="icon" 
                        className={cn(
                            "relative h-12 w-12 rounded-full shadow-2xl transition-all active:scale-95 z-10 border-4 border-background",
                            unacknowledgedTasks.length > 0 ? "bg-primary hover:bg-primary/90" : "bg-muted/50"
                        )}
                    >
                        <Bell className={cn("h-6 w-6", unacknowledgedTasks.length > 0 && "animate-bell-ring")} />
                        {unacknowledgedTasks.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 border-2 border-white items-center justify-center text-[10px] font-black">{unacknowledgedTasks.length}</span>
                            </span>
                        )}
                    </Button>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] animate-liquid-genie border-none rounded-2xl" align="end" sideOffset={12}>
                <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <BellRing className="h-4 w-4" />
                        <h3 className="font-black text-xs uppercase tracking-widest">Active Duty Queue</h3>
                    </div>
                </div>
                <ScrollArea className="h-80 bg-background rounded-b-2xl">
                    <div className="divide-y divide-primary/5">
                        {tasks.map(task => {
                            const isNew = unacknowledgedTasks.some(ut => ut.id === task.id);
                            return (
                                <div key={task.id} className={cn("p-4 transition-all duration-300", isNew ? "bg-primary/[0.03] border-l-4 border-primary" : "bg-background opacity-60")}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{task.type}</span>
                                        {task.reminderCount > 0 && <Badge variant="destructive" className="ml-auto text-[8px] h-4 animate-pulse">URGENT x{task.reminderCount}</Badge>}
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-bold text-sm truncate">{task.title}</p>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(task.title)}>
                                            {copiedId === task.title ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mb-3 leading-tight font-medium">{task.description}</p>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1 font-black uppercase tracking-tighter" asChild onClick={() => isNew && handleAcknowledge(task.id)}>
                                            <Link href={task.link}>Execute Process</Link>
                                        </Button>
                                        {isNew && <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-primary" onClick={() => handleAcknowledge(task.id)}>Ack</Button>}
                                    </div>
                                </div>
                            );
                        })}
                        {tasks.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2 opacity-30"><ClipboardCheck className="h-12 w-12" /><p className="font-bold">Queue Empty</p></div>}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
