
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
import { useFirestore, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser, useDoc } from '@/firebase';
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
import type { OrganizationSettings } from '@/app/settings/page';


export function BillTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { handlePrint } = usePrint();
  const { user } = useUser();
  const { bills, vendors, employees, isLoading } = useBillData();
  
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
  const { data: orgSettings } = useDoc<OrganizationSettings>(settingsDocRef);
  
  const billsRef = useMemoFirebase(() => firestore ? collection(firestore, 'bills') : null, [firestore]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Bill> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  
  const getVendorName = (vendorId: string) => vendors.find(v => v.id === vendorId)?.vendorName || 'N/A';

  const safeBills = useMemo(() => Array.isArray(bills) ? bills : [], [bills]);
  const safeEmployees = useMemo(() => Array.isArray(employees) ? employees : [], [employees]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return safeBills;
    const lowercasedTerm = searchTerm.toLowerCase();
    return safeBills.filter(bill => 
      (bill.billId?.toLowerCase().includes(lowercasedTerm)) ||
      (bill.billReferenceNumber?.toLowerCase().includes(lowercasedTerm)) ||
      (getVendorName(bill.vendorId).toLowerCase().includes(lowercasedTerm))
    );
  }, [safeBills, searchTerm, vendors]);
  
  const isSuperAdmin = user?.email === 'superadmin@galsolution.com';
  const currentUserEmployee = useMemo(() => safeEmployees.find(e => e.email === user?.email), [safeEmployees, user]);


  const canApproveSelection = useMemo(() => {
    if (selectedRowIds.length === 0) return false;
    if (isSuperAdmin) return true;
    if (!currentUserEmployee) return false;

    // Check if the current user is the approver for ALL selected bills
    return selectedRowIds.every(id => {
      const bill = safeBills.find(b => b.id === id);
      return bill && bill.currentApproverId === currentUserEmployee.id;
    });
  }, [selectedRowIds, safeBills, isSuperAdmin, currentUserEmployee]);


  const pendingBillsForCurrentUser = useMemo(() => {
    if (!currentUserEmployee && !isSuperAdmin) return [];
    return filteredItems.filter(b => b.approvalStatus === 2 && (isSuperAdmin || b.currentApproverId === currentUserEmployee?.id));
  }, [filteredItems, isSuperAdmin, currentUserEmployee]);


  const handleSelectAll = (checked: boolean) => {
      if (checked) {
          const idsToSelect = pendingBillsForCurrentUser.map(b => b.id);
          setSelectedRowIds(idsToSelect);
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

    const designatedApproverId = orgSettings?.billApproverId;
    const dataWithApproval = {
        ...billData,
        approvalStatus: billData.id ? billData.approvalStatus : 2, // 2 for Pending
        currentApproverId: billData.id ? billData.currentApproverId : designatedApproverId || '',
    };

    if (dataWithApproval.id) {
        const { id, ...dataToSave } = dataWithApproval;
        setDocumentNonBlocking(doc(billsRef, id), dataToSave, { merge: true });
        toast({ title: 'Success', description: 'Bill updated successfully.' });
    } else {
        const newBillData = {
          ...dataWithApproval,
          billId: `B-${Date.now()}`
        };
        addDocumentNonBlocking(billsRef, newBillData);
        toast({ title: 'Success', description: 'Bill added successfully.' });
    }
  };

  const handleBulkApproval = (status: 1 | 0) => { // 1 for Approved, 0 for Rejected
      if (!firestore || !user || selectedRowIds.length === 0) return;

      selectedRowIds.forEach(billId => {
          const billToUpdate = bills.find(b => b.id === billId);
          if (!billToUpdate) return;
          
          const billRef = doc(firestore, 'bills', billId);
          const statusText = status === 1 ? 'Approved' : 'Rejected';
          const newHistoryEntry = {
              approverId: currentUserEmployee?.id || user.uid, // Prefer employee doc ID
              status: statusText,
              timestamp: new Date().toISOString(),
              remarks: `Bulk ${statusText.toLowerCase()}`,
              level: (billToUpdate.approvalHistory || []).length + 1,
          };
          const updatedData = {
              approvalStatus: status,
              approvalHistory: [...(billToUpdate.approvalHistory || []), newHistoryEntry],
              currentApproverId: ''
          };
          setDocumentNonBlocking(billRef, updatedData, { merge: true });
      });
      
      toast({ title: 'Success', description: `${selectedRowIds.length} bill(s) have been updated.` });
      setSelectedRowIds([]);
  };

  const getStatusText = (status: number) => {
    if (status === 1) return 'Approved';
    if (status === 0) return 'Rejected';
    return 'Pending';
  }

  const getStatusVariant = (status: number) => {
    if (status === 1) return 'default';
    if (status === 0) return 'destructive';
    return 'secondary';
  }

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
                {selectedRowIds.length > 0 && canApproveSelection && (
                  <>
                     <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="outline"><Check className="mr-2 h-4 w-4 text-green-500" />Approve Selected ({selectedRowIds.length})</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Approve Bills?</AlertDialogTitle><AlertDialogDescription>This will approve {selectedRowIds.length} selected bills. This action can be audited.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleBulkApproval(1)}>Confirm Approve</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive"><X className="mr-2 h-4 w-4" />Reject Selected ({selectedRowIds.length})</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Reject Bills?</AlertDialogTitle><AlertDialogDescription>This will reject {selectedRowIds.length} selected bills. This action can be audited.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleBulkApproval(0)} className="bg-destructive hover:bg-destructive/90">Confirm Reject</AlertDialogAction></AlertDialogFooter>
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
                        checked={pendingBillsForCurrentUser.length > 0 && selectedRowIds.length === pendingBillsForCurrentUser.length}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        aria-label="Select all pending bills"
                        disabled={pendingBillsForCurrentUser.length === 0}
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
                  filteredItems.map(bill => {
                    const isCurrentUserApprover = bill.currentApproverId === currentUserEmployee?.id;
                    const canTakeAction = isSuperAdmin || isCurrentUserApprover;
                    
                    return (
                        <TableRow key={bill.id} data-state={selectedRowIds.includes(bill.id) ? "selected" : ""}>
                            <TableCell>
                            {bill.approvalStatus === 2 && canTakeAction && (
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
                                <Badge variant={getStatusVariant(bill.approvalStatus)}>{getStatusText(bill.approvalStatus)}</Badge>
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
                    )
                  })
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

    