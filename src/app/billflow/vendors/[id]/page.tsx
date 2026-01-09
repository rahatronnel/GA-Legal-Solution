
"use client";

import React from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { BillFlowProvider, useBillFlow } from '../../components/bill-flow-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Phone, Mail, Building, Briefcase, DollarSign, Calendar, FileText, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePrint } from '@/app/vehicle-management/components/print-provider';

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 print-no-break">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
        <div>
            <p className="font-medium">{label}</p>
            <p className="text-muted-foreground">{value || 'N/A'}</p>
        </div>
    </div>
);

function VendorProfileContent() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const { handlePrint } = usePrint();

    const { data, isLoading } = useBillFlow();
    const { vendors, vendorCategories, vendorNatureOfBusiness, employees } = data;

    const vendor = React.useMemo(() => {
        if (isLoading || !vendors) return undefined;
        return vendors.find(v => v.id === id) || null;
    }, [id, vendors, isLoading]);

    if (isLoading || vendor === undefined) {
        return <div className="flex justify-center items-center h-full"><p>Loading Vendor Details...</p></div>;
    }

    if (vendor === null) {
        notFound();
    }

    const category = vendorCategories.find(c => c.id === vendor.vendorCategoryId);
    const natureOfBusiness = vendorNatureOfBusiness.find(n => n.id === vendor.natureOfBusinessId);
    const createdBy = employees.find(e => e.id === vendor.createdBy);
    const approvedBy = employees.find(e => e.id === vendor.approvedBy);
    
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Active': return 'default';
            case 'Pending': return 'secondary';
            case 'Suspended': return 'outline';
            case 'Blacklisted': return 'destructive';
            default: return 'outline';
        }
    };
    
    const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back to Vendor List</Button>
                <Button onClick={() => handlePrint(vendor, 'vendor')}><Printer className="mr-2 h-4 w-4"/>Print Profile</Button>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{vendor.vendorName}</CardTitle>
                            <CardDescription>Vendor ID: {vendor.vendorId}</CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(vendor.vendorStatus)} className="text-base">{vendor.vendorStatus}</Badge>
                    </div>
                </CardHeader>
                 <CardContent className="space-y-8">
                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-primary border-b pb-2">Basic Information</h3>
                            <ul className="space-y-4 text-sm">
                                <InfoItem icon={User} label="Vendor Type" value={vendor.vendorType} />
                                <InfoItem icon={Briefcase} label="Vendor Category" value={`${category?.name || 'N/A'} ${vendor.vendorSubCategory ? `(${vendor.vendorSubCategory})` : ''}`} />
                                <InfoItem icon={Building} label="Nature of Business" value={natureOfBusiness?.name} />
                                <InfoItem icon={Calendar} label="Years of Experience" value={vendor.yearsOfExperience} />
                            </ul>
                        </div>
                         <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-primary border-b pb-2">Contact Details</h3>
                            <ul className="space-y-4 text-sm">
                                <InfoItem icon={User} label="Contact Person" value={`${vendor.contactPersonName} (${vendor.contactPersonDesignation || 'N/A'})`} />
                                <InfoItem icon={Phone} label="Mobile Number" value={vendor.mobileNumber} />
                                <InfoItem icon={Mail} label="Email Address" value={vendor.email} />
                                <InfoItem icon={Building} label="Office Address" value={vendor.officeAddress} />
                            </ul>
                        </div>
                         <div className="space-y-4">
                            <h3 className="font-semibold text-lg text-primary border-b pb-2">Legal & Financial</h3>
                            <ul className="space-y-4 text-sm">
                                <InfoItem icon={FileText} label="Trade License No." value={vendor.tradeLicenseNumber} />
                                <InfoItem icon={FileText} label="TIN" value={vendor.tinNumber} />
                                <InfoItem icon={DollarSign} label="Payment Method" value={vendor.paymentMethod} />
                                <InfoItem icon={DollarSign} label="Payment Terms" value={vendor.paymentTerms} />
                            </ul>
                        </div>
                     </div>
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-primary border-b pb-2">Internal Control</h3>
                        <ul className="grid md:grid-cols-3 gap-6 text-sm">
                           <InfoItem icon={User} label="Created By" value={createdBy?.fullName} />
                           <InfoItem icon={User} label="Approved By" value={approvedBy?.fullName} />
                           <InfoItem icon={Calendar} label="Approval Date" value={formatDate(vendor.approvalDate)} />
                        </ul>
                      </div>
                 </CardContent>
            </Card>
        </div>
    );
}

export default function VendorPage() {
    return (
        <BillFlowProvider>
            <VendorProfileContent />
        </BillFlowProvider>
    );
}
