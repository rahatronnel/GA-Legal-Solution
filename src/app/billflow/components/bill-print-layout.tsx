
"use client";

import React from 'react';
import Image from 'next/image';
import type { OrganizationSettings } from '@/app/settings/page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Bill } from './bill-entry-form';
import type { Vendor } from './vendor-entry-form';
import type { BillType } from './bill-type-table';
import type { BillCategory } from './bill-category-table';
import type { BillItemCategory } from './bill-item-category-table';
import type { Employee } from '@/app/user-management/components/employee-entry-form';

interface PrintHeaderProps {
  orgSettings: OrganizationSettings;
}

const PrintHeader: React.FC<PrintHeaderProps> = ({ orgSettings }) => (
    <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4">
        <div className="text-sm">
            <h1 className="text-xl font-bold text-gray-800">{orgSettings.name}</h1>
            <p className="text-xs">{orgSettings.address}</p>
            <p className="text-xs">Contact: {orgSettings.contactNumber} | Email: {orgSettings.email}</p>
        </div>
        {orgSettings.logo && (
             <div className="w-24 h-24 relative">
                <Image src={orgSettings.logo} alt="Organization Logo" layout="fill" objectFit="contain" />
            </div>
        )}
    </div>
);

const PrintFooter = ({ pageNumber }: { pageNumber: number }) => (
    <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-500">
        Page {pageNumber}
    </div>
);

const PrintPage: React.FC<{children: React.ReactNode, pageNumber: number, orgSettings: OrganizationSettings, className?: string}> = ({children, pageNumber, orgSettings, className = ''}) => (
    <div className={`p-4 bg-white text-black font-sans print-page relative ${className}`} style={{ minHeight: '26cm' }}>
        <PrintHeader orgSettings={orgSettings} />
        <div className="flex-grow pt-6">
            {children}
        </div>
        <PrintFooter pageNumber={pageNumber} />
    </div>
);

const InfoRow: React.FC<{ label: string, value?: React.ReactNode, fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
    <div className={`py-1.5 border-b border-gray-200 ${fullWidth ? 'col-span-2' : ''}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-800">{value || 'N/A'}</p>
    </div>
);

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString(); } catch { return dateString; }
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

interface BillPrintLayoutProps {
  bill: Bill;
  vendor?: Vendor;
  billType?: BillType;
  billCategory?: BillCategory;
  billItemCategories: BillItemCategory[];
  employee?: Employee;
  orgSettings: OrganizationSettings;
}

export const BillPrintLayout: React.FC<BillPrintLayoutProps> = ({ bill, vendor, billType, billCategory, billItemCategories, employee, orgSettings }) => {
    let pageCounter = 1;
    
    const getItemCategoryName = (id: string) => billItemCategories.find(c => c.id === id)?.name || 'N/A';
    const subTotal = bill.items.reduce((acc, i) => acc + i.netAmount, 0);

    return (
        <div className="bg-white">
            <PrintPage pageNumber={pageCounter++} orgSettings={orgSettings}>
                <h2 className="text-xl font-bold text-center mb-6">Bill / Invoice - {bill.billReferenceNumber || bill.billId}</h2>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                           <InfoRow label="Vendor" value={vendor?.vendorName} />
                           <InfoRow label="Bill Type" value={billType?.name} />
                           <InfoRow label="Bill Category" value={`${billCategory?.name}${bill.billSubCategory ? ` / ${bill.billSubCategory}` : ''}`} />
                           <InfoRow label="Bill Date" value={formatDate(bill.billDate)} />
                           <InfoRow label="Bill Received Date" value={formatDate(bill.billReceivedDate)} />
                           <InfoRow label="Entry By" value={employee?.fullName} />
                        </div>
                    </div>
                     <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Items / Services</h4>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Unit Price</TableHead>
                                    <TableHead className="text-right">Net Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bill.items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{getItemCategoryName(item.billItemCategoryId)}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.netAmount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="flex justify-end mt-4">
                        <div className="w-full max-w-sm space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>{formatCurrency(subTotal)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">VAT ({bill.vatPercentage}%):</span><span>{formatCurrency(bill.vatAmount)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">TDS ({bill.tdsPercentage}%):</span><span>- {formatCurrency(bill.tdsAmount)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Other Charges:</span><span>{formatCurrency(bill.otherCharges)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Deductions:</span><span>- {formatCurrency(bill.deductionAmount)}</span></div>
                            <div className="flex justify-between font-bold text-base pt-2 border-t"><span className="text-gray-800">Total Payable:</span><span>{formatCurrency(bill.totalPayableAmount)}</span></div>
                        </div>
                     </div>
                     <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2 mt-4">Reference Information</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                            <InfoRow label="Vendor Invoice No." value={bill.invoiceNumber} />
                            <InfoRow label="Invoice Date" value={formatDate(bill.invoiceDate)} />
                            <InfoRow label="PO / WO Number" value={bill.poNumber || bill.woNumber} />
                            <InfoRow label="GRN / Challan Number" value={bill.grnNumber} />
                        </div>
                    </div>
                </div>
            </PrintPage>
        </div>
    );
};
