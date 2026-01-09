
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
import type { Designation } from '@/app/user-management/components/designation-table';

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

interface PrintFooterProps {
    pageNumber: number;
    bill?: Bill;
    employees?: Employee[];
    designations?: Designation[];
}

const PrintFooter: React.FC<PrintFooterProps> = ({ pageNumber, bill, employees, designations }) => {
    const approvers = bill?.approvalHistory
        ?.filter(h => h.status === 'Approved')
        .map(h => {
            const employee = employees?.find(e => e.id === h.approverId);
            const designation = designations?.find(d => d.id === employee?.designationId);
            return {
                ...h,
                employee,
                designation,
            };
        })
        .slice(0, 5); // Max 5 approvers

    return (
        <div className="absolute bottom-4 left-0 right-0 px-4">
            {approvers && approvers.length > 0 && pageNumber === 1 && (
                <div className="flex justify-between items-end border-t-2 border-gray-300 pt-4 mt-6">
                    {approvers.map((approver, index) => (
                        <div key={index} className="text-center text-xs w-1/5 px-1">
                            {approver.employee?.signature ? (
                                <Image src={approver.employee.signature} alt="Signature" width={100} height={30} className="object-contain mx-auto h-8" />
                            ) : (
                                <div className="h-8"></div>
                            )}
                            <p className="border-t border-gray-500 mt-1 pt-1 font-semibold truncate">{approver.employee?.fullName}</p>
                            <p className="truncate">{approver.designation?.name}</p>
                            <p className="text-gray-500">{new Date(approver.timestamp).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}
            <div className="text-center text-xs text-gray-500 pt-2">Page {pageNumber}</div>
        </div>
    );
};

const PrintPage: React.FC<{children: React.ReactNode, pageNumber: number, orgSettings: OrganizationSettings, bill?: Bill, employees?: Employee[], designations?: Designation[], className?: string}> = ({children, pageNumber, orgSettings, bill, employees, designations, className = ''}) => (
    <div className={`p-4 bg-white text-black font-sans print-page relative ${className}`} style={{ minHeight: '26cm' }}>
        <PrintHeader orgSettings={orgSettings} />
        <div className="flex-grow pt-6 pb-24">
            {children}
        </div>
        <PrintFooter pageNumber={pageNumber} bill={bill} employees={employees} designations={designations} />
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

const DocumentPage = ({ doc, label, pageNumber, orgSettings }: {doc: {name: string, file:string}, label: string, pageNumber: number, orgSettings: OrganizationSettings}) => {
    if (!doc || !doc.file) return null;
    const isImage = doc.file.startsWith('data:image/');
    
    return (
        <PrintPage pageNumber={pageNumber} orgSettings={orgSettings} className="page-break">
            <h2 className="text-lg font-bold mb-4">{label} - {doc.name}</h2>
            <div className="border rounded-lg p-2 flex justify-center items-center h-[22cm] relative">
                 {isImage ? (
                    <Image src={doc.file} alt={doc.name} layout="fill" className="object-contain" />
                ) : (
                     <p>Cannot preview this document type.</p>
                )}
            </div>
        </PrintPage>
    );
};

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
  employees: Employee[];
  designations: Designation[];
  orgSettings: OrganizationSettings;
}

export const BillPrintLayout: React.FC<BillPrintLayoutProps> = ({ bill, vendor, billType, billCategory, billItemCategories, employee, employees, designations, orgSettings }) => {
    let pageCounter = 1;
    
    const getItemCategoryName = (id: string) => billItemCategories.find(c => c.id === id)?.name || 'N/A';
    const subTotal = bill.items.reduce((acc, i) => acc + i.netAmount, 0);

    return (
        <div className="bg-white">
            <PrintPage pageNumber={pageCounter++} orgSettings={orgSettings} bill={bill} employees={employees} designations={designations}>
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
                                {bill.items.map((item, index) => (
                                    <TableRow key={index}>
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

            {Object.entries(bill.documents || {}).flatMap(([category, files]) => 
                (files || []).map((doc: { id: string; name: string; file: string; }) => (
                    <DocumentPage key={doc.id} doc={doc} label={documentLabels[category] || 'Document'} pageNumber={pageCounter++} orgSettings={orgSettings} />
                ))
            )}
        </div>
    );
};
