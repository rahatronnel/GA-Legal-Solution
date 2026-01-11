
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
import { PlusCircle, Edit, Trash2, Search, Eye, Printer, Check, X, Filter, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBillFlow } from './bill-flow-provider';
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
import { getBillStatusText, getNextApprovalStatusCode } from '../lib/status-helper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';


export function BillTable() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { handlePrint } = usePrint();
  const { user } = useUser();

  const billFlowData = useBillFlow();
  if (!billFlowData) return <p>Loading...</p>;
  const { data: { bills, vendors, employees, billTypes, billCategories, sections }, isLoading } = billFlowData;
  
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
  const { data: orgSettings } = useDoc<OrganizationSettings>(settingsDocRef);
  
  const billsRef = useMemoFirebase(() => firestore ? collection(firestore, 'bills') : null, [firestore]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Bill> | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [billDateRange, setBillDateRange] = useState<DateRange | undefined>();
  const [amountFilter, setAmountFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [billTypeFilter, setBillTypeFilter] = useState('all');
  const [billCategoryFilter, setBillCategoryFilter] = useState('all');
  const [billingPeriodRange, setBillingPeriodRange] = useState<DateRange | undefined>();
  const [poFilter, setPoFilter] = useState('');
  const [woFilter, setWoFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const currentUserEmployee = useMemo(() => {
    if (!user || !employees) return null;
    return employees.find(e => e.email === user.email);
  }, [user, employees]);

  const getVendorName = (vendorId: string) => vendors.find(v => v.id === vendorId)?.vendorName || 'N/A';

  const safeBills = useMemo(() => Array.isArray(bills) ? bills : [], [bills]);

  const filteredItems = useMemo(() => {
    return safeBills.filter(bill => {
        const searchTermMatch = !searchTerm ||
            (bill.billId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (bill.billReferenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (getVendorName(bill.vendorId).toLowerCase().includes(searchTerm.toLowerCase()));

        const vendorMatch = vendorFilter === 'all' || bill.vendorId === vendorFilter;
        const statusMatch = statusFilter === 'all' || bill.approvalStatus === parseInt(statusFilter);
        const typeMatch = billTypeFilter === 'all' || bill.billTypeId === billTypeFilter;
        const categoryMatch = billCategoryFilter === 'all' || bill.billCategoryId === billCategoryFilter;
        const departmentMatch = departmentFilter === 'all' || bill.departmentName === departmentFilter;
        
        const poMatch = !poFilter || bill.poNumber?.toLowerCase().includes(poFilter.toLowerCase());
        const woMatch = !woFilter || bill.woNumber?.toLowerCase().includes(woFilter.toLowerCase());
        
        const amountMatch = !amountFilter || bill.totalPayableAmount.toString().includes(amountFilter);

        const billDateMatch = !billDateRange?.from || (bill.billDate && isWithinInterval(parseISO(bill.billDate), { start: billDateRange.from, end: billDateRange.to || billDateRange.from }));
        const billingPeriodMatch = !billingPeriodRange?.from || (bill.billingPeriodFrom && isWithinInterval(parseISO(bill.billingPeriodFrom), { start: billingPeriodRange.from, end: billingPeriodRange.to || billingPeriodRange.from }));

        return searchTermMatch && vendorMatch && statusMatch && typeMatch && categoryMatch && departmentMatch && poMatch && woMatch && amountMatch && billDateMatch && billingPeriodMatch;
    });
  }, [safeBills, searchTerm, vendorFilter, statusFilter, billTypeFilter, billCategoryFilter, departmentFilter, poFilter, woFilter, amountFilter, billDateRange, billingPeriodRange, vendors]);

  const clearFilters = () => {
    setSearchTerm('');
    setVendorFilter('all');
    setBillDateRange(undefined);
    setAmountFilter('');
    setStatusFilter('all');
    setBillTypeFilter('all');
    setBillCategoryFilter('all');
    setBillingPeriodRange(undefined);
    setPoFilter('');
    setWoFilter('');
    setDepartmentFilter('all');
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
    if (!billsRef || !orgSettings?.approvalFlow?.steps) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database or approval settings not available.' });
        return;
    }

    if (billData.id) {
        const { id, ...dataToSave } = billData;
        setDocumentNonBlocking(doc(billsRef, id), dataToSave, { merge: true });
        toast({ title: 'Success', description: 'Bill updated successfully.' });
    } else {
        const approvalFlow = orgSettings.approvalFlow;
        const newBillData = {
          ...billData,
          billId: `B-${Date.now()}`,
          approvalFlow: approvalFlow, // Copy the flow to the bill
          approvalStatus: 2, // Pending
          currentApproverId: approvalFlow.steps[0]?.approverId || '',
          approvalHistory: [],
        };
        addDocumentNonBlocking(billsRef, newBillData);
        toast({ title: 'Success', description: 'Bill added successfully.' });
    }
  };

  const handleBulkApproval = (status: number) => {
    if (!firestore || !currentUserEmployee) return;

    selectedRows.forEach(billId => {
        const bill = bills.find(b => b.id === billId);
        if (!bill || !bill.approvalFlow?.steps) return;

        const billRef = doc(firestore, 'bills', billId);
        const approvalLevels = bill.approvalFlow.steps;
        const currentLevel = bill.approvalHistory?.length || 0;

        const newHistoryEntry = {
            approverId: currentUserEmployee.id,
            status: 'Approved',
            timestamp: new Date().toISOString(),
            level: currentLevel,
            remarks: `Bulk approved from list view`,
        };

        let newApprovalStatus: number;
        let nextApproverId: string;

        if (status === 1) { // Approved
            const nextLevel = currentLevel + 1;
            if (nextLevel < approvalLevels.length) {
                newApprovalStatus = getNextApprovalStatusCode(currentLevel);
                nextApproverId = approvalLevels[nextLevel].approverId;
            } else {
                newApprovalStatus = 1; // Completed
                nextApproverId = '';
            }
        } else { // Rejected
            newApprovalStatus = 0;
            nextApproverId = '';
            newHistoryEntry.status = 'Rejected';
        }

        setDocumentNonBlocking(billRef, {
            approvalStatus: newApprovalStatus,
            currentApproverId: nextApproverId,
            approvalHistory: [...(bill.approvalHistory || []), newHistoryEntry],
        }, { merge: true });
    });
    
    toast({ title: 'Success', description: `Selected bills have been processed.` });
    setSelectedRows([]);
};

  const getStatusVariant = (status: number) => {
    if (status === 1) return 'default';
    if (status === 0) return 'destructive';
    return 'secondary';
  }

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
  };

  const canPerformBulkAction = selectedRows.length > 0;

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
                {canPerformBulkAction && (
                    <>
                        <Button size="sm" variant="outline" onClick={() => handleBulkApproval(1)}><Check className="mr-2 h-4 w-4"/>Approve Selected</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleBulkApproval(0)}><X className="mr-2 h-4 w-4"/>Reject Selected</Button>
                    </>
                )}
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Bill</Button>
            </div>
        </div>
        
        <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center gap-2 font-semibold"><Filter className="h-4 w-4" /> Filters</div>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Select value={vendorFilter} onValueChange={setVendorFilter}><SelectTrigger><SelectValue placeholder="Filter by Vendor..." /></SelectTrigger><SelectContent><SelectItem value="all">All Vendors</SelectItem>{(vendors || []).map(v => <SelectItem key={v.id} value={v.id}>{v.vendorName}</SelectItem>)}</SelectContent></Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Filter by Status..." /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="2">Pending</SelectItem><SelectItem value="1">Completed</SelectItem><SelectItem value="0">Rejected</SelectItem></SelectContent></Select>
                <Select value={billTypeFilter} onValueChange={setBillTypeFilter}><SelectTrigger><SelectValue placeholder="Filter by Bill Type..." /></SelectTrigger><SelectContent><SelectItem value="all">All Bill Types</SelectItem>{(billTypes || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
                <Select value={billCategoryFilter} onValueChange={setBillCategoryFilter}><SelectTrigger><SelectValue placeholder="Filter by Category..." /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{(billCategories || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}><SelectTrigger><SelectValue placeholder="Filter by Department..." /></SelectTrigger><SelectContent><SelectItem value="all">All Departments</SelectItem>{(sections || []).map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select>
                <Input placeholder="PO Number..." value={poFilter} onChange={(e) => setPoFilter(e.target.value)} />
                <Input placeholder="WO Number..." value={woFilter} onChange={(e) => setWoFilter(e.target.value)} />
                <Input placeholder="Amount..." value={amountFilter} onChange={(e) => setAmountFilter(e.target.value)} type="number" />
                <DateRangePicker date={billDateRange} onDateChange={setBillDateRange} />
                <DateRangePicker date={billingPeriodRange} onDateChange={setBillingPeriodRange} />
             </div>
             <Button variant="ghost" onClick={clearFilters} size="sm"><XCircle className="mr-2 h-4 w-4" /> Clear All Filters</Button>
        </div>

         <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]"><Checkbox
                        checked={selectedRows.length > 0 && selectedRows.length === filteredItems.length}
                        onCheckedChange={(checked) => {
                           const allIds = filteredItems.map(b => b.id);
                           setSelectedRows(checked ? allIds : []);
                        }}
                    /></TableHead>
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
                        <TableCell><Skeleton className="h-5 w-5"/></TableCell>
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
                        const isPending = bill.approvalStatus !== 0 && bill.approvalStatus !== 1;
                        return (
                            <TableRow key={bill.id} data-state={selectedRows.includes(bill.id) ? "selected" : ""}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedRows.includes(bill.id)}
                                        onCheckedChange={() => toggleRowSelection(bill.id)}
                                        disabled={!isPending}
                                    />
                                </TableCell>
                                <TableCell>{bill.billId}</TableCell>
                                <TableCell>{getVendorName(bill.vendorId)}</TableCell>
                                <TableCell>{bill.billDate}</TableCell>
                                <TableCell>{bill.totalPayableAmount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(bill.approvalStatus)}>{getBillStatusText(bill)}</Badge>
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

    
