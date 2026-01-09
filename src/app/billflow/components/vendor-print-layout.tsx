
"use client";

import React from 'react';
import Image from 'next/image';
import type { OrganizationSettings } from '@/app/settings/page';
import type { Vendor } from './vendor-entry-form';
import type { VendorCategory } from './vendor-category-table';
import type { VendorNatureOfBusiness } from './vendor-nature-of-business-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return dateString;
    }
}

interface VendorPrintLayoutProps {
  vendor: Vendor;
  categories: VendorCategory[];
  naturesOfBusiness: VendorNatureOfBusiness[];
  orgSettings: OrganizationSettings;
}

export const VendorPrintLayout: React.FC<VendorPrintLayoutProps> = ({ vendor, categories, naturesOfBusiness, orgSettings }) => {
    let pageCounter = 1;
    
    const category = categories.find(c => c.id === vendor.vendorCategoryId);
    const natureOfBusiness = naturesOfBusiness.find(n => n.id === vendor.natureOfBusinessId);

    return (
        <div className="bg-white">
            <PrintPage pageNumber={pageCounter++} orgSettings={orgSettings}>
                <h2 className="text-xl font-bold text-center mb-4">Vendor Profile - {vendor.vendorId}</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold">{vendor.vendorName}</h3>
                        <p className="text-sm text-gray-600">Status: {vendor.vendorStatus}</p>
                    </div>
                    <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                           <InfoRow label="Vendor Type" value={vendor.vendorType} />
                           <InfoRow label="Vendor Category" value={category?.name} />
                           <InfoRow label="Nature of Business" value={natureOfBusiness?.name} />
                           <InfoRow label="Years of Experience" value={vendor.yearsOfExperience} />
                        </div>
                    </div>
                     <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Contact Details</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                            <InfoRow label="Contact Person" value={`${vendor.contactPersonName} (${vendor.contactPersonDesignation || 'N/A'})`} />
                            <InfoRow label="Email Address" value={vendor.email} />
                            <InfoRow label="Mobile Number" value={vendor.mobileNumber} />
                            <InfoRow label="Office Phone" value={vendor.officePhone} />
                            <InfoRow label="Office Address" value={vendor.officeAddress} fullWidth />
                        </div>
                    </div>
                     <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Legal & Financial</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                             <InfoRow label="Trade License" value={vendor.tradeLicenseNumber} />
                             <InfoRow label="TIN Number" value={vendor.tinNumber} />
                             <InfoRow label="Bank Account" value={`${vendor.accountName} - ${vendor.accountNumber}`} />
                             <InfoRow label="Payment Method" value={vendor.paymentMethod} />
                             <InfoRow label="Payment Terms" value={vendor.paymentTerms} />
                             <InfoRow label="Credit Limit" value={vendor.creditLimit > 0 ? vendor.creditLimit.toLocaleString() : 'N/A'} />
                        </div>
                    </div>

                    {vendor.suppliedItems && vendor.suppliedItems.length > 0 && (
                         <div>
                            <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Supplied Items/Services</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item Name</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead className="text-right">Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vendor.suppliedItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell>{item.unitOfMeasure}</TableCell>
                                            <TableCell className="text-right">{item.rate.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </PrintPage>
        </div>
    );
};
