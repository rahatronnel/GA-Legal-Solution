
"use client";

import React from 'react';
import Image from 'next/image';
import { useParams, useRouter, notFound } from 'next/navigation';
import { LegacyBillFlowProvider, useBillFlow } from '../../components/bill-flow-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, Calendar, DollarSign, Download, Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Separator } from '@/components/ui/separator';

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
         <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
            {/* Left Column */}
             <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader className="text-center">
                        <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
                        <CardTitle className="text-2xl pt-4">{bill.billReferenceNumber || bill.billId}</CardTitle>
                        <CardDescription>Bill from {vendor?.vendorName || 'N/A'}</CardDescription>
                         <Badge className="mx-auto mt-2 text-base">Pending</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Button onClick={() => handlePrint(bill, 'bill')} className="w-full"><Printer className="mr-2 h-4 w-4"/>Print Bill</Button>
                         <Button variant="outline" onClick={() => router.back()} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Key Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <InfoItem icon={User} label="Vendor" value={<Link href={`/billflow/vendors/${vendor?.id}`} className="text-primary hover:underline">{vendor?.vendorName}</Link>} />
                        <InfoItem icon={Calendar} label="Bill Date" value={bill.billDate} />
                        <InfoItem icon={FileText} label="Bill Type" value={billType?.name} />
                        <InfoItem icon={FileText} label="Bill Category" value={`${billCategory?.name}${bill.billSubCategory ? ` / ${bill.billSubCategory}` : ''}`} />
                        <InfoItem icon={User} label="Entry By" value={entryBy?.fullName} />
                    </CardContent>
                 </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
                 <Tabs defaultValue="overview">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-6 mt-6">
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
                                        {bill.items.map(item => (
                                            <TableRow key={item.id}>
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
                            <CardHeader><CardTitle>Financial Summary</CardTitle></CardHeader>
                             <CardContent className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span>{formatCurrency(bill.items.reduce((acc, i) => acc + i.netAmount, 0))}</span></div>
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
            </div>
        </div>
    );
}


export default function BillPage() {
    return (
        <LegacyBillFlowProvider>
            <BillProfileContent />
        </LegacyBillFlowProvider>
    );
}
