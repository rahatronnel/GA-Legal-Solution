
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
import { Checkbox } from '@/components/ui/checkbox';


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
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  
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
  
  const pendingBills = useMemo(() => filteredItems.filter(b => b.approvalStatus === 'Pending'), [filteredItems]);
  
  const handleSelectAll = (checked: boolean) => {
      if (checked) {
          setSelectedRowIds(pendingBills.map(b => b.id));
      } else {
          setSelectedRowIds([]);
      }
  };

  const handleRowSelect = (billId: string, checked: boolean) => {
      if (checked) {
          setSelectedRowIds(prev => [...prev, billId]);
      } else {
          setSelectedRowIds(prev => prev.filter(id => id !== billId));
      }
  };

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

    // Assign a default approval status if it's a new bill
    const dataWithStatus = {
        ...billData,
        approvalStatus: billData.id ? billData.approvalStatus : 'Pending',
    };

    if (dataWithStatus.id) {
        const { id, ...dataToSave } = dataWithStatus;
        setDocumentNonBlocking(doc(billsRef, id), dataToSave, { merge: true });
        toast({ title: 'Success', description: 'Bill updated successfully.' });
    } else {
        const newBillData = {
          ...dataWithStatus,
          billId: `B-${Date.now()}`
        };
        addDocumentNonBlocking(billsRef, newBillData);
        toast({ title: 'Success', description: 'Bill added successfully.' });
    }
  };

  const handleBulkApproval = (status: 'Approved' | 'Rejected') => {
      if (!firestore || !user || selectedRowIds.length === 0) return;

      selectedRowIds.forEach(billId => {
          const billToUpdate = bills.find(b => b.id === billId);
          if (!billToUpdate) return;
          
          const billRef = doc(firestore, 'bills', billId);
          const newHistoryEntry = {
              approverId: user.uid,
              status,
              timestamp: new Date().toISOString(),
              remarks: `Bulk ${status.toLowerCase()}`,
              level: billToUpdate.approvalHistory?.length || 0,
          };
          const updatedData = {
              approvalStatus: status,
              approvalHistory: [...(billToUpdate.approvalHistory || []), newHistoryEntry],
              currentApproverId: ''
          };
          setDocumentNonBlocking(billRef, updatedData, { merge: true });
      });
      
      toast({ title: 'Success', description: `${selectedRowIds.length} bill(s) have been ${status.toLowerCase()}.` });
      setSelectedRowIds([]);
  };

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
                {selectedRowIds.length > 0 && (
                  <>
                     <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="outline"><Check className="mr-2 h-4 w-4 text-green-500" />Approve Selected ({selectedRowIds.length})</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Approve Bills?</AlertDialogTitle><AlertDialogDescription>This will approve {selectedRowIds.length} selected bills. This action can be audited.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleBulkApproval('Approved')}>Confirm Approve</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive"><X className="mr-2 h-4 w-4" />Reject Selected ({selectedRowIds.length})</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Reject Bills?</AlertDialogTitle><AlertDialogDescription>This will reject {selectedRowIds.length} selected bills. This action can be audited.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleBulkApproval('Rejected')} className="bg-destructive hover:bg-destructive/90">Confirm Reject</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </>
                )}
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Bill</Button>
            </div>
        </div>
         <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={pendingBills.length > 0 && selectedRowIds.length === pendingBills.length}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        aria-label="Select all pending bills"
                        disabled={pendingBills.length === 0}
                      />
                    </TableHead>
                    <TableHead>Bill ID</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Bill Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Appr. Status</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                     Array.from({length: 5}).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                         <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                         <TableCell><Skeleton className="h-8 w-24 float-right" /></TableCell>
                      </TableRow>
                    ))
                ) : filteredItems && filteredItems.length > 0 ? (
                  filteredItems.map(bill => (
                    <TableRow key={bill.id} data-state={selectedRowIds.includes(bill.id) && "selected"}>
                        <TableCell>
                          {bill.approvalStatus === 'Pending' && (
                            <Checkbox
                              checked={selectedRowIds.includes(bill.id)}
                              onCheckedChange={(checked) => handleRowSelect(bill.id, checked as boolean)}
                              aria-label={`Select bill ${bill.billId}`}
                            />
                          )}
                        </TableCell>
                        <TableCell>{bill.billId}</TableCell>
                        <TableCell>{getVendorName(bill.vendorId)}</TableCell>
                        <TableCell>{bill.billDate}</TableCell>
                        <TableCell>{bill.totalPayableAmount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                        <TableCell>
                            <Badge variant={bill.approvalStatus === 'Approved' ? 'default' : bill.approvalStatus === 'Rejected' ? 'destructive' : 'secondary'}>{bill.approvalStatus || 'Pending'}</Badge>
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
                  ))
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

    