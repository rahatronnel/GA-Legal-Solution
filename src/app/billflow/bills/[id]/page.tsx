
"use client";

import React from 'react';
import Image from 'next/image';
import { useParams, useRouter, notFound } from 'next/navigation';
import { BillFlowProvider, useBillFlow } from '../../components/bill-flow-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, Calendar, DollarSign, Download, Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrint } from '@/app/vehicle-management/components/print-provider';

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
        <div>
            <p className="font-medium">{label}</p>
            <p className="text-muted-foreground">{value || 'N/A'}</p>
        </div>
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
    const { handlePrint } = usePrint();
    const { id } = params;

    const { data, isLoading } = useBillFlow();
    const { bills, vendors, billTypes, billCategories, employees, sections, billItemCategories } = data;

    const bill = React.useMemo(() => {
        if (isLoading || !bills) return undefined;
        return bills.find(b => b.id === id) || null;
    }, [id, bills, isLoading]);

    if (isLoading || bill === undefined) {
        return <div className="flex justify-center items-center h-full"><p>Loading Bill Details...</p></div>;
    }

    if (bill === null) {
        notFound();
    }
    
    const vendor = vendors.find(v => v.id === bill.vendorId);
    const billType = billTypes.find(bt => bt.id === bill.billTypeId);
    const billCategory = billCategories.find(bc => bc.id === bill.billCategoryId);
    const entryBy = employees.find(e => e.id === bill.entryBy);
    const department = sections.find(s => s.name === bill.departmentName);
    
    const getItemCategoryName = (id: string) => billItemCategories.find(c => c.id === id)?.name || 'N/A';
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
         <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back to Bill List</Button>
                 <Button onClick={() => handlePrint(bill, 'bill')}><Printer className="mr-2 h-4 w-4"/>Print Bill</Button>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">Bill: {bill.billReferenceNumber || bill.billId}</CardTitle>
                            <CardDescription>Vendor: {vendor?.vendorName || 'N/A'} | Bill Date: {bill.billDate}</CardDescription>
                        </div>
                        <Badge className="text-base">Pending</Badge>
                    </div>
                </CardHeader>
                 <CardContent>
                    <Tabs defaultValue="overview">
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="mt-6">
                            <div className="space-y-8">
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg text-primary border-b pb-2">Basic Information</h3>
                                        <ul className="space-y-4 text-sm">
                                            <InfoItem icon={User} label="Vendor" value={<Link href={`/billflow/vendors/${vendor?.id}`} className="text-primary hover:underline">{vendor?.vendorName}</Link>} />
                                            <InfoItem icon={FileText} label="Bill Type" value={billType?.name} />
                                            <InfoItem icon={FileText} label="Bill Category" value={`${billCategory?.name}${bill.billSubCategory ? ` / ${bill.billSubCategory}` : ''}`} />
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg text-primary border-b pb-2">Dates</h3>
                                        <ul className="space-y-4 text-sm">
                                            <InfoItem icon={Calendar} label="Bill Date" value={bill.billDate} />
                                            <InfoItem icon={Calendar} label="Bill Received Date" value={bill.billReceivedDate} />
                                            <InfoItem icon={Calendar} label="Entry Date" value={bill.entryDate} />
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg text-primary border-b pb-2">Internal Info</h3>
                                        <ul className="space-y-4 text-sm">
                                            <InfoItem icon={User} label="Entry By" value={entryBy?.fullName} />
                                            <InfoItem icon={FileText} label="Department" value={`${department?.name} (${department?.sectionCode || 'N/A'})`} />
                                        </ul>
                                    </div>
                                </div>
                                
                                <div className="mt-6">
                                    <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Items / Services</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Qty</TableHead>
                                                <TableHead>Unit Price</TableHead>
                                                <TableHead>Net Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {bill.items.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell>{getItemCategoryName(item.billItemCategoryId)}</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                                    <TableCell>{formatCurrency(item.netAmount)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="mt-6 grid md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Financial Summary</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span>{formatCurrency(bill.items.reduce((acc, i) => acc + i.netAmount, 0))}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">VAT ({bill.vatPercentage}%):</span><span>{formatCurrency(bill.vatAmount)}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">TDS ({bill.tdsPercentage}%):</span><span>- {formatCurrency(bill.tdsAmount)}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Other Charges:</span><span>{formatCurrency(bill.otherCharges)}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Deductions:</span><span>- {formatCurrency(bill.deductionAmount)}</span></div>
                                            <div className="flex justify-between font-bold text-base pt-2 border-t"><span className="text-foreground">Total Payable:</span><span>{formatCurrency(bill.totalPayableAmount)}</span></div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-primary border-b pb-2 mb-4">Reference Information</h3>
                                        <ul className="space-y-4 text-sm">
                                            <InfoItem icon={FileText} label="Vendor Invoice No." value={bill.invoiceNumber} />
                                            <InfoItem icon={Calendar} label="Invoice Date" value={bill.invoiceDate} />
                                            <InfoItem icon={FileText} label="PO / WO Number" value={bill.poNumber || bill.woNumber} />
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="documents" className="pt-4">
                            <div className="space-y-6">
                                {Object.entries(bill.documents || {}).map(([key, files]) => (
                                    files && files.length > 0 && (
                                        <DocumentViewer key={key} files={files} categoryLabel={documentLabels[key] || 'Other Documents'} />
                                    )
                                ))}
                                {Object.values(bill.documents || {}).every(arr => !arr || arr.length === 0) && (
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
    return (
        <BillFlowProvider>
            <BillProfileContent />
        </BillFlowProvider>
    );
}
