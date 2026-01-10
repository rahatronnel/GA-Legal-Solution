
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Search, Eye, Printer, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBillData } from './bill-flow-provider';
import { useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Bill } from './bill-entry-form';
import { BillEntryForm } from './bill-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Badge } from '@/components/ui/badge';
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


export function BillTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { handlePrint } = usePrint();
  const { user } = useUser();
  const { bills, vendors, isLoading } = useBillData();
  
  const billsRef = useMemoFirebase(() => firestore ? collection(firestore, 'bills') : null, [firestore]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Bill> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const getVendorName = (vendorId: string) => vendors.find(v => v.id === vendorId)?.vendorName || 'N/A';

  const safeBills = useMemo(() => Array.isArray(bills) ? bills : [], [bills]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return safeBills;
    const lowercasedTerm = searchTerm.toLowerCase();
    return safeBills.filter(bill => 
      (bill.billId?.toLowerCase().includes(lowercasedTerm)) ||
      (bill.billReferenceNumber?.toLowerCase().includes(lowercasedTerm)) ||
      (getVendorName(bill.vendorId).toLowerCase().includes(lowercasedTerm))
    );
  }, [safeBills, searchTerm, vendors]);

  const handleAdd = () => {
    setCurrentItem(null);
    setIsFormOpen(true);
  }
  
  const handleEdit = (bill: Bill) => {
    setCurrentItem(bill);
    setIsFormOpen(true);
  };
  
  const handleDelete = (bill: Bill) => {
    setCurrentItem(bill);
    setIsDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    if (currentItem?.id && billsRef) {
        deleteDocumentNonBlocking(doc(billsRef, currentItem.id));
        toast({ title: 'Success', description: 'Bill deleted successfully.' });
    }
    setIsDeleteConfirmOpen(false);
    setCurrentItem(null);
  };

  const handleSave = (billData: Partial<Bill>) => {
    if (!billsRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        return;
    }

    if (billData.id) {
        const { id, ...dataToSave } = billData;
        setDocumentNonBlocking(doc(billsRef, id), dataToSave, { merge: true });
        toast({ title: 'Success', description: 'Bill updated successfully.' });
    } else {
        const newBillData = {
          ...billData,
          billId: `B-${Date.now()}`
        };
        addDocumentNonBlocking(billsRef, newBillData);
        toast({ title: 'Success', description: 'Bill added successfully.' });
    }
  };

  const handleApproval = (bill: Bill, status: 'Approved' | 'Rejected') => {
      if (!firestore || !user) return;
      
      const billRef = doc(firestore, 'bills', bill.id);
      
      const newHistoryEntry = {
        approverId: user.uid,
        status,
        timestamp: new Date().toISOString(),
        remarks: `Manually ${status.toLowerCase()} from bill list`,
        level: bill.approvalHistory?.length || 0,
      };
      
      const updatedData = {
          approvalStatus: status,
          approvalHistory: [...(bill.approvalHistory || []), newHistoryEntry],
          currentApproverId: '' // Clear approver once action is taken
      };

      setDocumentNonBlocking(billRef, updatedData, { merge: true });
      toast({ title: 'Success', description: `Bill has been ${status.toLowerCase()}.` });
  };
  
  const isSuperAdmin = user?.email === 'superadmin@galsolution.com';

  return (
    <TooltipProvider>
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by ID, Ref, Vendor..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2 flex-wrap">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Bill</Button>
            </div>
        </div>
         <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Bill ID</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Bill Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Appr. Status</TableHead>
                    <TableHead>Approval Actions</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                     Array.from({length: 5}).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                         <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                         <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 float-right" /></TableCell>
                      </TableRow>
                    ))
                ) : filteredItems && filteredItems.length > 0 ? (
                  filteredItems.map(bill => {
                    const isCurrentUserApprover = user?.uid === bill.currentApproverId;
                    return (
                    <TableRow key={bill.id}>
                        <TableCell>{bill.billId}</TableCell>
                        <TableCell>{getVendorName(bill.vendorId)}</TableCell>
                        <TableCell>{bill.billDate}</TableCell>
                        <TableCell>{bill.totalPayableAmount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                        <TableCell>
                            <Badge>{bill.approvalStatus || 'Pending'}</Badge>
                        </TableCell>
                        <TableCell>
                          {(isSuperAdmin || isCurrentUserApprover) && bill.approvalStatus === 'Pending' && (
                              <div className="flex gap-2">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">Approve</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader><AlertDialogTitle>Approve Bill?</AlertDialogTitle><AlertDialogDescription>This will mark bill "{bill.billId}" as approved.</AlertDialogDescription></AlertDialogHeader>
                                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleApproval(bill, 'Approved')}>Confirm</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                     <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive">Reject</Button>
                                    </AlertDialogTrigger>
                                     <AlertDialogContent>
                                      <AlertDialogHeader><AlertDialogTitle>Reject Bill?</AlertDialogTitle><AlertDialogDescription>This will mark bill "{bill.billId}" as rejected.</AlertDialogDescription></AlertDialogHeader>
                                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleApproval(bill, 'Rejected')} className="bg-destructive hover:bg-destructive/90">Confirm Reject</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                             <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/billflow/bills/${bill.id}`}><Eye className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent>View Bill</TooltipContent></Tooltip>
                             <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(bill)}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit Bill</TooltipContent></Tooltip>
                             <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(bill, 'bill')}><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Print Bill</TooltipContent></Tooltip>
                             <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(bill)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Delete Bill</TooltipContent></Tooltip>
                          </div>
                        </TableCell>
                    </TableRow>
                  )})
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                            No bills found. Click "Add Bill" to start.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>

        <BillEntryForm
            isOpen={isFormOpen}
            setIsOpen={setIsFormOpen}
            onSave={handleSave}
            bill={currentItem}
        />
        
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>This will permanently delete the bill "{currentItem?.billId}".</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
    </TooltipProvider>
  );
}
