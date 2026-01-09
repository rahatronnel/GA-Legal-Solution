
import React from 'react';
import Image from 'next/image';
import type { Employee } from './employee-entry-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Section } from './section-table';
import type { Designation } from './designation-table';
import { Badge } from '@/components/ui/badge';
import type { OrganizationSettings } from '@/app/settings/page';


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
        {orgSettings.logo ? (
             <div className="w-24 h-24 relative">
                <Image src={orgSettings.logo} alt="Organization Logo" layout="fill" className="object-contain" />
            </div>
        ) : (
             <div className="w-20 h-20 bg-gray-200 flex items-center justify-center">
                <p className="text-xs text-gray-500">Logo</p>
            </div>
        )}
    </div>
);

const PrintFooter = ({ pageNumber, children }: { pageNumber: number, children?: React.ReactNode }) => (
    <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="flex justify-between items-end">
            <div className="text-xs text-gray-500">Page {pageNumber}</div>
            {children}
            <div className="text-xs text-gray-500 text-right">
                <p>Printed on: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    </div>
);

const PrintPage: React.FC<{children: React.ReactNode, pageNumber: number, orgSettings: OrganizationSettings, className?: string, footerContent?: React.ReactNode}> = ({children, pageNumber, orgSettings, className = '', footerContent}) => (
    <div className={`p-4 bg-white text-black font-sans print-page relative ${className}`} style={{ minHeight: '26cm' /* A4 height minus margins */ }}>
        <PrintHeader orgSettings={orgSettings} />
        <div className="flex-grow pt-6">
            {children}
        </div>
        <PrintFooter pageNumber={pageNumber}>{footerContent}</PrintFooter>
    </div>
)

const DocumentPage = ({ doc, label, pageNumber, orgSettings }: {doc: string, label: string, pageNumber: number, orgSettings: OrganizationSettings}) => {
    if (!doc) return null;
    const mimeType = doc.substring(doc.indexOf(':') + 1, doc.indexOf(';'));
    const isImage = mimeType.startsWith('image/');
    
    return (
        <PrintPage pageNumber={pageNumber} orgSettings={orgSettings} className="page-break">
            <h2 className="text-lg font-bold mb-4">{label}</h2>
            <div className="border rounded-lg p-2 flex justify-center items-center h-[22cm] relative">
                 {isImage ? (
                    <Image src={doc} alt={label} layout="fill" className="object-contain" />
                ) : (
                     <p>Cannot preview this document type. It is available for download on the profile page.</p>
                )}
            </div>
        </PrintPage>
    )
}

const InfoRow: React.FC<{ label: string, value?: React.ReactNode, fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
    <div className={`py-1.5 border-b border-gray-200 ${fullWidth ? 'col-span-2' : ''}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-800">{value || 'N/A'}</p>
    </div>
);

interface EmployeePrintLayoutProps {
  employee: Employee;
  sections: Section[];
  designations: Designation[];
  orgSettings: OrganizationSettings;
}


export const EmployeePrintLayout: React.FC<EmployeePrintLayoutProps> = ({ employee, sections, designations, orgSettings }) => {
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
    let pageCounter = 1;

    const department = sections.find(s => s.id === employee.departmentId);
    const designation = designations.find(d => d.id === employee.designationId);
    const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
    const getStatusVariant = (status: Employee['status']) => status === 'Active' ? 'default' : 'destructive';

    const firstPageFooter = (
      <div className="flex justify-center items-end" style={{width: '33%'}}>
        {employee.signature ? (
          <div className="text-center">
            <Image src={employee.signature} alt="Signature" width={150} height={50} className="object-contain mx-auto" />
            <p className="border-t-2 border-gray-800 mt-2 pt-1 text-sm font-semibold">Employee's Signature</p>
          </div>
        ) : (
           <div className="pt-12 border-t-2 border-gray-800 w-48 text-center text-sm font-semibold">
              Employee's Signature
           </div>
        )}
      </div>
    );

    return (
        <div className="bg-white">
            {/* Page 1: Employee Information */}
            <PrintPage pageNumber={pageCounter++} orgSettings={orgSettings} footerContent={firstPageFooter}>
                <h2 className="text-xl font-bold text-center mb-4">Employee Information</h2>
                
                <div className="flex gap-6 items-start mb-4">
                    <div className="flex-shrink-0">
                         <Avatar className="h-32 w-32 border">
                            <AvatarImage src={employee.profilePicture} alt={employee.fullName} />
                            <AvatarFallback className="text-3xl">{getInitials(employee.fullName)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-2xl font-bold">{employee.fullName}</h3>
                        <p className="text-md text-gray-600">User ID: {employee.userIdCode}</p>
                        <p className="text-md text-gray-600">{designation?.name}</p>
                        <Badge variant={getStatusVariant(employee.status)}>{employee.status}</Badge>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Contact & Login Details</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                            <InfoRow label="Mobile Number" value={employee.mobileNumber} />
                            <InfoRow label="Email Address" value={employee.email} />
                            <InfoRow label="Username / Login ID" value={employee.username} />
                            <InfoRow label="Address" value={employee.address} fullWidth />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Employment Details</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                             <InfoRow label="Department / Section" value={department?.name} />
                             <InfoRow label="Designation" value={designation?.name} />
                             <InfoRow label="Joining Date" value={formatDate(employee.joiningDate)} />
                             <InfoRow label="User Role" value={employee.role} />
                             <InfoRow label="Status" value={employee.status} />
                             <InfoRow label="Remarks" value={employee.remarks} fullWidth />
                        </div>
                    </div>
                </div>

            </PrintPage>

            {/* Subsequent Pages: Documents */}
            {employee.documents.nid && <DocumentPage doc={employee.documents.nid} label="National ID (NID)" pageNumber={pageCounter++} orgSettings={orgSettings} />}
            {employee.documents.other && <DocumentPage doc={employee.documents.other} label="Other Document" pageNumber={pageCounter++} orgSettings={orgSettings} />}
        </div>
    );
};
