
"use client";

import React from 'react';
import Image from 'next/image';
import type { OrganizationSettings } from '@/app/settings/page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DemandNote, DemandNoteItem } from './demand-note-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Designation } from '@/app/user-management/components/designation-table';
import type { Section } from '@/app/user-management/components/section-table';
import type { ProcessCode } from './process-code-table';
import type { DemandType } from './demand-type-table';
import type { BillItemMaster } from '@/app/billflow/components/bill-item-master-table';

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
    demandNote?: DemandNote;
    employees?: Employee[];
    designations?: Designation[];
    creator?: Employee;
}

const PrintFooter: React.FC<PrintFooterProps> = ({ pageNumber, demandNote, employees, designations, creator }) => {
    
    const creatorDesignation = designations?.find(d => d.id === creator?.designationId);
    
    const approvers = demandNote?.approvalHistory
        ?.filter(h => h.status === 'Approved')
        .map(h => {
            const employee = employees?.find(e => e.id === h.approverId);
            const designation = designations?.find(d => d.id === employee?.designationId);
            return {
                ...h,
                employee,
                designation,
            };
        });
    
    const signatureRowItems = [
        { employee: creator, designation: creatorDesignation, title: 'Prepared By' },
        ...(approvers || []).map(a => ({...a, title: 'Approved By' }))
    ];

    const formatDateTime = (timestamp: string) => {
        try { return new Date(timestamp).toLocaleString(); } catch { return 'N/A'; }
    }

    return (
        <div className="absolute bottom-4 left-0 right-0 px-4">
             {signatureRowItems.length > 0 && (
                <div className="flex justify-between items-end border-t-2 border-gray-300 pt-4 mt-12">
                    {signatureRowItems.map((sig, index) => (
                        <div key={index} className="text-center text-xs w-1/5 px-1">
                            {sig.employee?.signature ? (
                                <Image src={sig.employee.signature} alt="Signature" width={100} height={30} className="object-contain mx-auto h-8" />
                            ) : (
                                <div className="h-8"></div>
                            )}
                            <p className="border-t border-gray-500 mt-1 pt-1 font-semibold truncate">{sig.employee?.fullName}</p>
                            <p className="truncate">{sig.designation?.name}</p>
                            <p className="text-gray-500 text-[10px]">{sig.title}</p>
                            {(sig as any).timestamp && <p className="text-gray-500 text-[10px]">{formatDateTime((sig as any).timestamp)}</p>}
                        </div>
                    ))}
                </div>
            )}
            <div className="text-center text-xs text-gray-500 pt-2">Page {pageNumber}</div>
        </div>
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

interface DemandNotePrintLayoutProps {
  demandNote: DemandNote;
  creator?: Employee;
  department?: Section;
  processCode?: ProcessCode;
  demandType?: DemandType;
  billItemMasters: BillItemMaster[];
  employees: Employee[];
  designations: Designation[];
  orgSettings: OrganizationSettings;
}

export const DemandNotePrintLayout: React.FC<DemandNotePrintLayoutProps> = ({ demandNote, creator, department, processCode, demandType, billItemMasters, employees, designations, orgSettings }) => {
    let pageCounter = 1;
    
    return (
        <div className="bg-white">
            <div className="p-4 bg-white text-black font-sans print-page relative" style={{ minHeight: '26cm' }}>
                <PrintHeader orgSettings={orgSettings} />
                 <div className="flex-grow pt-6 pb-56">
                    <h2 className="text-xl font-bold text-center mb-6">Demand Note - {demandNote.demandNoteNumber}</h2>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Basic Information</h4>
                            <div className="grid grid-cols-2 gap-x-6">
                               <InfoRow label="Date" value={formatDate(demandNote.date)} />
                               <InfoRow label="Department" value={department?.name} />
                               <InfoRow label="Process Code" value={processCode?.name} />
                               <InfoRow label="Demand Type" value={demandType?.name} />
                               <InfoRow label="Delivery Place" value={demandNote.deliveryPlace} />
                               <InfoRow label="Contact Person" value={demandNote.contactPersonName} />
                            </div>
                        </div>
                         <div>
                            <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Items</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Particulars</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {demandNote.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.particulars}</TableCell>
                                            <TableCell>{item.requiredQty}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell>{item.remarks}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         <div>
                            <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2 mt-4">Purpose & Budget</h4>
                            <div className="grid grid-cols-2 gap-x-6">
                                <InfoRow label="Budget Amount" value={demandNote.budgetAmount > 0 ? demandNote.budgetAmount.toLocaleString() : 'N/A'} />
                                <InfoRow label="Budget Year & List No." value={demandNote.budgetYearAndListNo} />
                                <InfoRow label="Purpose" value={demandNote.purpose} fullWidth />
                            </div>
                        </div>
                    </div>
                </div>
                <PrintFooter pageNumber={pageCounter++} demandNote={demandNote} employees={employees} designations={designations} creator={creator} />
            </div>
        </div>
    );
};
