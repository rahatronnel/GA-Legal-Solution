
"use client";

import React from 'react';
import Image from 'next/image';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Phone, Mail, Building, Briefcase, DollarSign, Calendar, FileText, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Vendor } from '../../components/vendor-entry-form';
import type { VendorCategory } from '../../components/vendor-category-table';
import type { VendorNatureOfBusiness } from '../../components/vendor-nature-of-business-table';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import { collection } from 'firebase/firestore';


const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean }> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <p className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</p>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
);

function VendorProfileContent() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const { handlePrint } = usePrint();
    const firestore = useFirestore();

    const { data: vendors, isLoading: l1 } = useCollection<Vendor>(useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]));
    const { data: vendorCategories, isLoading: l2 } = useCollection<VendorCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorCategories') : null, [firestore]));
    const { data: vendorNatureOfBusiness, isLoading: l3 } = useCollection<VendorNatureOfBusiness>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorNatureOfBusiness') : null, [firestore]));
    const { data: employees, isLoading: l4 } = useCollection<Employee>(useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]));

    const isLoading = l1 || l2 || l3 || l4;

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

    const category = vendorCategories?.find(c => c.id === vendor.vendorCategoryId);
    const natureOfBusiness = vendorNatureOfBusiness?.find(n => n.id === vendor.natureOfBusinessId);
    const createdBy = employees?.find(e => e.id === vendor.createdBy);
    const approvedBy = employees?.find(e => e.id === vendor.approvedBy);
    
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
         <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
            {/* Left Column */}
             <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader className="text-center">
                        <Building className="mx-auto h-16 w-16 text-muted-foreground" />
                        <CardTitle className="text-2xl pt-4">{vendor.vendorName}</CardTitle>
                        <CardDescription>Vendor ID: {vendor.vendorId}</CardDescription>
                         <Badge variant={getStatusVariant(vendor.vendorStatus)} className="mx-auto mt-2 text-base">{vendor.vendorStatus}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Button onClick={() => handlePrint(vendor, 'vendor')} className="w-full"><Printer className="mr-2 h-4 w-4"/>Print Profile</Button>
                         <Button variant="outline" onClick={() => router.back()} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <InfoItem icon={User} label="Contact Person" value={`${vendor.contactPersonName} (${vendor.contactPersonDesignation || 'N/A'})`} />
                        <InfoItem icon={Phone} label="Mobile Number" value={vendor.mobileNumber} />
                        <InfoItem icon={Mail} label="Email Address" value={vendor.email} />
                    </CardContent>
                 </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader><CardTitle>Vendor Overview</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                            <InfoItem icon={Briefcase} label="Vendor Type" value={vendor.vendorType} />
                            <InfoItem icon={Briefcase} label="Vendor Category" value={`${category?.name || 'N/A'} ${vendor.vendorSubCategory ? `(${vendor.vendorSubCategory})` : ''}`} />
                            <InfoItem icon={Building} label="Nature of Business" value={natureOfBusiness?.name} />
                            <InfoItem icon={Calendar} label="Years of Experience" value={vendor.yearsOfExperience} />
                        </div>
                        <Separator />
                         <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                            <InfoItem icon={Phone} label="Office Phone" value={vendor.officePhone} />
                            <InfoItem icon={Phone} label="WhatsApp" value={vendor.whatsAppNumber} />
                            <InfoItem icon={Building} label="Office Address" value={vendor.officeAddress} fullWidth />
                             <InfoItem icon={Building} label="Factory Address" value={vendor.factoryAddress} fullWidth/>
                        </div>
                    </CardContent>
                 </Card>
                  <Card>
                    <CardHeader><CardTitle>Legal & Financial</CardTitle></CardHeader>
                     <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                        <InfoItem icon={FileText} label="Trade License No." value={vendor.tradeLicenseNumber} />
                        <InfoItem icon={FileText} label="TIN" value={vendor.tinNumber} />
                        <InfoItem icon={FileText} label="VAT/BIN" value={vendor.vatBinNumber} />
                        <InfoItem icon={DollarSign} label="Payment Method" value={vendor.paymentMethod} />
                        <InfoItem icon={DollarSign} label="Payment Terms" value={vendor.paymentTerms} />
                        <InfoItem icon={DollarSign} label="Credit Limit" value={vendor.creditLimit > 0 ? vendor.creditLimit.toLocaleString() : 'N/A'} />
                     </CardContent>
                 </Card>
                 <Card>
                    <CardHeader><CardTitle>Internal Control</CardTitle></CardHeader>
                     <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                        <InfoItem icon={User} label="Created By" value={createdBy?.fullName} />
                        <InfoItem icon={Calendar} label="Created Date" value={formatDate(vendor.createdDate)} />
                        <InfoItem icon={User} label="Approved By" value={approvedBy?.fullName} />
                        <InfoItem icon={Calendar} label="Approval Date" value={formatDate(vendor.approvalDate)} />
                     </CardContent>
                 </Card>
            </div>
        </div>
    );
}

export default function VendorPage() {
    return <VendorProfileContent />;
}
