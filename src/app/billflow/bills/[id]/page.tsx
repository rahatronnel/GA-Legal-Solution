
"use client";

import React from 'react';
import Image from 'next/image';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, Calendar, DollarSign, Download, Printer, Clock, Check, X, MessageSquare, Building } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Separator } from '@/components/ui/separator';
import { useUser, useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Bill } from '../../components/bill-entry-form';
import type { Vendor } from '../../components/vendor-entry-form';
import type { BillType } from '../../components/bill-type-table';
import type { BillCategory } from '../../components/bill-category-table';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Section } from '@/app/user-management/components/section-table';
import type { BillItemCategory } from '../../components/bill-item-category-table';
import type { Designation } from '@/app/user-management/components/designation-table';
import type { OrganizationSettings } from '@/app/settings/page';


const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean }> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <p className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</p>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
);

const documentLabels: Record<string, string> = {
    vendorInvoice: 'Vendor Invoice',
    deliveryChallan: 'Delivery Challan',
    workCompletionCert: 'Work Completion Certificate',
    poCopy: 'Purchase Order Copy',
    contractCopy: 'Agreement / Contract Copy',
    supportingDocs: 'Supporting Documents',
    remarksDoc: 'Remarks Document',
};

const DocumentViewer = ({ files, categoryLabel }: { files: { name: string; file: string }[]; categoryLabel: string }) => {
    if (!files || files.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{categoryLabel}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                {files.map((doc, index) => {
                    const isImage = doc.file.startsWith('data:image/');
                    const fileName = doc.name;
                    return (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="font-medium text-sm truncate">{fileName}</p>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={doc.file} download={fileName} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4"/>Download</Link>
                                </Button>
                            </div>
                             {isImage && (
                                <div className="mt-2 rounded-lg overflow-hidden flex justify-center items-center bg-muted/50 aspect-video">
                                    <Image src={doc.file} alt={fileName} width={400} height={225} className="object-contain" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};


function BillProfileContent() {
    const router = useRouter();
    const params = useParams();
    const firestore = useFirestore();
    const { user } = useUser();
    const { handlePrint } = usePrint();
    const { id } = params;
    
    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
    const { data: orgSettings } = useDoc<OrganizationSettings>(settingsDocRef);

    const billsRef = useMemoFirebase(() => firestore ? collection(firestore, 'bills') : null, [firestore]);
    const { data: bills, isLoading: l1 } = useCollection<Bill>(billsRef);
    const vendorsRef = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
    const { data: vendors, isLoading: l2 } = useCollection<Vendor>(vendorsRef);
    const billTypesRef = useMemoFirebase(() => firestore ? collection(firestore, 'billTypes') : null, [firestore]);
    const { data: billTypes, isLoading: l3 } = useCollection<BillType>(billTypesRef);
    const billCategoriesRef = useMemoFirebase(() => firestore ? collection(firestore, 'billCategories') : null, [firestore]);
    const { data: billCategories, isLoading: l4 } = useCollection<BillCategory>(billCategoriesRef);
    const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const { data: employees, isLoading: l5 } = useCollection<Employee>(employeesRef);
    const billItemCategoriesRef = useMemoFirebase(() => firestore ? collection(firestore, 'billItemCategories') : null, [firestore]);
    const { data: billItemCategories, isLoading: l6 } = useCollection<BillItemCategory>(billItemCategoriesRef);
    const designationsRef = useMemoFirebase(() => firestore ? collection(firestore, 'designations') : null, [firestore]);
    const { data: designations, isLoading: l7 } = useCollection<Designation>(designationsRef);

    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7;

    const bill = React.useMemo(() => {
        if (isLoading || !bills) return undefined;
        return bills.find((b:any) => b.id === id) || null;
    }, [id, bills, isLoading]);

    const handleApproval = (status: number) => {
        if (!firestore || !bill || !user || !orgSettings?.billApprovalLevels) return;
    
        const billRef = doc(firestore, 'bills', bill.id);
        const currentUserEmployee = employees?.find(e => e.email === user.email);
        if (!currentUserEmployee) return;
    
        const approvalLevels = orgSettings.billApprovalLevels;
        const currentLevel = bill.approvalHistory?.length || 0;
    
        const statusText = status === 1 ? 'Approved' : 'Rejected';
    
        const newHistoryEntry = {
            approverId: currentUserEmployee.id,
            status: statusText,
            timestamp: new Date().toISOString(),
            level: currentLevel + 1,
            remarks: `Manually ${statusText.toLowerCase()} from details page`,
        };
    
        let approvalStatus = bill.approvalStatus;
        let nextApproverId = '';
    
        if (status === 1) { // Approved
            if (currentLevel + 1 < approvalLevels.length) {
                // Move to next approver
                approvalStatus = 2; // Pending
                nextApproverId = approvalLevels[currentLevel + 1];
            } else {
                // Final approval
                approvalStatus = 1; // Approved
                nextApproverId = '';
            }
        } else {
            // Rejected
            approvalStatus = 0; // Rejected
            nextApproverId = '';
        }
    
        setDocumentNonBlocking(
            billRef,
            {
                approvalStatus,
                currentApproverId: nextApproverId,
                approvalHistory: [...(bill.approvalHistory || []), newHistoryEntry],
            },
            { merge: true }
        );
    };

    if (isLoading || bill === undefined) {
        return <div className="flex justify-center items-center h-full"><p>Loading Bill Details...</p></div>;
    }

    if (bill === null) {
        notFound();
    }
    
    const vendor = vendors?.find((v:any) => v.id === bill.vendorId);
    const billType = billTypes?.find((bt:any) => bt.id === bill.billTypeId);
    const billCategory = billCategories?.find((bc:any) => bc.id === bill.billCategoryId);
    const entryBy = employees?.find((e:any) => e.id === bill.entryBy);
    
    const getStatusText = (status: number) => {
        if (status === 1) return 'Approved';
        if (status === 0) return 'Rejected';
        return 'Pending';
    }

    const getItemCategoryName = (id: string) => billItemCategories?.find((c:any) => c.id === id)?.name || 'N/A';
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    const formatDateTime = (dateStr: string) => {
        try { return new Date(dateStr).toLocaleString(); } catch { return 'N/A'; }
    }
    
    const isSuperAdmin = user?.email === 'superadmin@galsolution.com';
    const currentUserEmployee = employees?.find(e => e.email === user?.email);
    const isCurrentUserApprover = bill.currentApproverId === currentUserEmployee?.id;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{bill.billReferenceNumber || bill.billId}</CardTitle>
                            <CardDescription>Bill from {vendor?.vendorName || 'N/A'} - Status: <Badge>{getStatusText(bill.approvalStatus)}</Badge></CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             {bill.approvalStatus === 2 && (isSuperAdmin || isCurrentUserApprover) && (
                                <>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-green-500 border-green-500 hover:bg-green-50 hover:text-green-600"><Check className="mr-2 h-4 w-4"/>Approve</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Approve Bill?</AlertDialogTitle><AlertDialogDescription>This will mark the bill as approved and send it to the next approver if applicable. This action can be audited.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleApproval(1)}>Confirm</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                   <AlertDialog>
                                    <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><X className="mr-2 h-4 w-4"/>Reject</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Reject Bill?</AlertDialogTitle><AlertDialogDescription>This will mark the bill as rejected and stop the approval process. This action can be audited.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleApproval(0)} className="bg-destructive hover:bg-destructive/90">Confirm Reject</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                   </AlertDialog>
                                </>
                             )}
                             <Button onClick={() => handlePrint(bill, 'bill')} variant="outline"><Printer className="mr-2 h-4 w-4"/>Print</Button>
                             <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="overview">
                        <TabsList className="mb-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="space-y-6">
                             <Card>
                                <CardHeader><CardTitle>Key Information</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <InfoItem icon={User} label="Vendor" value={<Link href={`/billflow/vendors/${vendor?.id}`} className="text-primary hover:underline">{vendor?.vendorName}</Link>} />
                                    <InfoItem icon={FileText} label="Bill Type" value={billType?.name} />
                                    <InfoItem icon={FileText} label="Bill Category" value={`${billCategory?.name}${bill.billSubCategory ? ` / ${bill.billSubCategory}` : ''}`} />
                                    <InfoItem icon={Calendar} label="Bill Date" value={bill.billDate} />
                                    <InfoItem icon={User} label="Entry By" value={entryBy?.fullName} />
                                    <InfoItem icon={Clock} label="Entry Date & Time" value={formatDateTime(bill.entryDate)} />
                                </CardContent>
                            </Card>
                            
                            {bill.approvalHistory && bill.approvalHistory.length > 0 && (
                                <Card>
                                    <CardHeader><CardTitle>Approval History</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        {bill.approvalHistory.map((entry: any, index: number) => {
                                            const approver = employees?.find((e: any) => e.id === entry.approverId);
                                            const designation = designations?.find((d: any) => d.id === approver?.designationId);
                                            const statusColor = entry.status === 'Approved' ? 'text-green-500' : 'text-red-500';

                                            return (
                                                <div key={index} className="flex gap-4 p-3 border rounded-lg">
                                                     <Avatar>
                                                        <AvatarImage src={approver?.profilePicture} alt={approver?.fullName}/>
                                                        <AvatarFallback>{approver?.fullName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-semibold">{approver?.fullName || 'Unknown User'}</p>
                                                                <p className="text-xs text-muted-foreground">{designation?.name || 'N/A'}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className={`font-semibold text-sm ${statusColor}`}>{entry.status}</p>
                                                                <p className="text-xs text-muted-foreground">{formatDateTime(entry.timestamp)}</p>
                                                            </div>
                                                        </div>
                                                        {entry.remarks && <p className="text-sm mt-2 p-2 bg-muted rounded-md">{entry.remarks}</p>}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardHeader><CardTitle>Items / Services</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead className="text-right">Qty</TableHead>
                                                <TableHead className="text-right">Unit Price</TableHead>
                                                <TableHead className="text-right">Net Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {bill.items.map((item: any, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell>{getItemCategoryName(item.billItemCategoryId)}</TableCell>
                                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.netAmount)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Financial Summary & References</CardTitle></CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span>{formatCurrency(bill.items.reduce((acc: number, i: any) => acc + i.netAmount, 0))}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">VAT ({bill.vatPercentage}%):</span><span>{formatCurrency(bill.vatAmount)}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">TDS ({bill.tdsPercentage}%):</span><span>- {formatCurrency(bill.tdsAmount)}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Other Charges:</span><span>{formatCurrency(bill.otherCharges)}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Deductions:</span><span>- {formatCurrency(bill.deductionAmount)}</span></div>
                                        <Separator className="my-2" />
                                        <div className="flex justify-between font-bold text-base"><span className="text-foreground">Total Payable:</span><span>{formatCurrency(bill.totalPayableAmount)}</span></div>
                                    </div>
                                    <div className="space-y-4">
                                        <InfoItem icon={FileText} label="Vendor Invoice No." value={bill.invoiceNumber} />
                                        <InfoItem icon={Calendar} label="Invoice Date" value={bill.invoiceDate} />
                                        <InfoItem icon={FileText} label="PO / WO Number" value={bill.poNumber || bill.woNumber} />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="documents">
                            <div className="space-y-6">
                                {Object.entries(bill.documents || {}).map(([key, files]: [string, any]) => (
                                    files && files.length > 0 && (
                                        <DocumentViewer key={key} files={files} categoryLabel={documentLabels[key] || 'Other Documents'} />
                                    )
                                ))}
                                {Object.values(bill.documents || {}).every((arr: any) => !arr || arr.length === 0) && (
                                    <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No documents were uploaded for this bill.</p>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}


export default function BillPage() {
    return <BillProfileContent />;
}

