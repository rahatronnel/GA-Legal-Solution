'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, query, getDocs } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format, startOfDay, endOfDay } from 'date-fns';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Isolated component for maintenance operations.
 * Handles hard-deletion of procurement data with optional date filtering.
 */
export function BulkDeleteSection() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [targetCollection, setTargetCollection] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleBulkDelete = async () => {
        if (!firestore || !targetCollection) return;

        setIsDeleting(true);
        try {
            const colRef = collection(firestore, targetCollection);
            const snapshot = await getDocs(query(colRef));
            let docsToDelete = snapshot.docs;

            // Manual date filtering based on common field names in procurement entities
            if (dateRange?.from) {
                const start = startOfDay(dateRange.from).getTime();
                const end = endOfDay(dateRange.to || dateRange.from).getTime();
                
                docsToDelete = docsToDelete.filter(d => {
                    const data = d.data();
                    const dateStr = data.date || data.csDate || data.poDate || data.entryDate || data.serviceDate || data.accidentDate;
                    if (!dateStr) return false;
                    const docTime = new Date(dateStr).getTime();
                    return docTime >= start && docTime <= end;
                });
            }

            if (docsToDelete.length === 0) {
                toast({ title: "No Records Found", description: "No records matched your deletion criteria." });
                setIsDeleting(false);
                return;
            }

            const batch = writeBatch(firestore);
            docsToDelete.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            toast({ title: "Success", description: `Successfully deleted ${docsToDelete.length} records from ${targetCollection}.` });
            
            // Reset form
            setTargetCollection('');
            setDateRange(undefined);

        } catch (error: any) {
            toast({ variant: 'destructive', title: "Delete Failed", description: error.message });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                    <Label>Select Collection to Wipe</Label>
                    <Select value={targetCollection} onValueChange={setTargetCollection}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose data type..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="demandNotes">Demand Notes (GP Desk)</SelectItem>
                            <SelectItem value="comparativeStatements">Comparative Statements</SelectItem>
                            <SelectItem value="purchaseOrders">Purchase Orders</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Date Range (Optional - leave empty for ALL)</Label>
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full" />
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={!targetCollection || isDeleting} className="w-full">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting ? 'Processing Hard Delete...' : 'Execute Bulk Hard Delete'}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <div className="flex items-center gap-2 text-destructive mb-2">
                                <AlertTriangle className="h-6 w-6" />
                                <AlertDialogTitle>CRITICAL SECURITY WARNING</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription>
                                You are about to perform a <strong className="text-foreground">HARD DELETE</strong> on <strong className="text-foreground">{targetCollection}</strong>.
                                <br /><br />
                                {dateRange?.from ? `Targeting records from ${format(dateRange.from, 'PPP')} to ${format(dateRange.to || dateRange.from, 'PPP')}.` : "Targeting ALL records in this collection."}
                                <br /><br />
                                This operation is irreversible. All selected data will be permanently wiped from the database.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                                Yes, WIPE DATA
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
