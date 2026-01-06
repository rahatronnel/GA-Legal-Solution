
import React from 'react';
import Image from 'next/image';
import type { Driver } from './driver-entry-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Vehicle } from './vehicle-table';
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

const PrintFooter = ({ pageNumber }: { pageNumber: number }) => (
    <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-500">
        Page {pageNumber}
    </div>
)

const PrintPage: React.FC<{children: React.ReactNode, pageNumber: number, orgSettings: OrganizationSettings, className?: string}> = ({children, pageNumber, orgSettings, className = ''}) => (
    <div className={`p-4 bg-white text-black font-sans print-page relative ${className}`} style={{ minHeight: '26cm' /* A4 height minus margins */ }}>
        <PrintHeader orgSettings={orgSettings} />
        <div className="flex-grow pt-6">
            {children}
        </div>
        <PrintFooter pageNumber={pageNumber} />
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

interface DriverPrintLayoutProps {
  driver: Driver;
  vehicles: Pick<Vehicle, 'id' | 'registrationNumber'>[];
  orgSettings: OrganizationSettings;
}

export const DriverPrintLayout: React.FC<DriverPrintLayoutProps> = ({ driver, vehicles, orgSettings }) => {
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
    let pageCounter = 1;

    const assignedVehicle = vehicles.find(v => v.id === driver.assignedVehicleId);
    const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

    return (
        <div className="bg-white">
            {/* Page 1: Driver Information */}
            <PrintPage pageNumber={pageCounter++} orgSettings={orgSettings}>
                <h2 className="text-xl font-bold text-center mb-4">Driver Information</h2>
                
                <div className="flex gap-6 items-start mb-4">
                    <div className="flex-shrink-0">
                         <Avatar className="h-32 w-32 border">
                            <AvatarImage src={driver.profilePicture} alt={driver.name} />
                            <AvatarFallback className="text-3xl">{getInitials(driver.name)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-2xl font-bold">{driver.name}</h3>
                        <p className="text-md text-gray-600">Driver ID: {driver.driverIdCode}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Personal Details</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                            <InfoRow label="Father's/Guardian's Name" value={driver.fatherOrGuardianName} />
                            <InfoRow label="Date of Birth" value={formatDate(driver.dateOfBirth)} />
                            <InfoRow label="Gender" value={driver.gender} />
                            <InfoRow label="National ID / Passport" value={driver.nationalIdOrPassport} />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Contact Details</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                             <InfoRow label="Mobile Number" value={driver.mobileNumber} />
                             <InfoRow label="Alternate Mobile Number" value={driver.alternateMobileNumber} />
                             <InfoRow label="Present Address" value={driver.presentAddress} fullWidth/>
                             <InfoRow label="Permanent Address" value={driver.permanentAddress} fullWidth/>
                        </div>
                    </div>
                     <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">License Details</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                             <InfoRow label="License Number" value={driver.drivingLicenseNumber} />
                             <InfoRow label="License Type" value={driver.licenseType} />
                             <InfoRow label="Issue Date" value={formatDate(driver.licenseIssueDate)} />
                             <InfoRow label="Expiry Date" value={formatDate(driver.licenseExpiryDate)} />
                             <InfoRow label="Issuing Authority" value={driver.issuingAuthority} fullWidth/>
                        </div>
                    </div>
                     <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Employment Details</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                             <InfoRow label="Joining Date" value={formatDate(driver.joiningDate)} />
                             <InfoRow label="Employment Type" value={driver.employmentType} />
                             <InfoRow label="Department / Unit" value={driver.department} />
                             <InfoRow label="Duty Shift / Schedule" value={driver.dutyShift} />
                             <InfoRow label="Supervisor" value={driver.supervisor} />
                             <InfoRow label="Assigned Vehicle" value={assignedVehicle?.registrationNumber} />
                        </div>
                    </div>
                </div>

            </PrintPage>

            {/* Subsequent Pages: Documents */}
            {driver.documents.drivingLicense && <DocumentPage doc={driver.documents.drivingLicense} label="Driving License" pageNumber={pageCounter++} orgSettings={orgSettings} />}
            {driver.documents.nid && <DocumentPage doc={driver.documents.nid} label="National ID (NID)" pageNumber={pageCounter++} orgSettings={orgSettings} />}
            {driver.documents.other && <DocumentPage doc={driver.documents.other} label="Other Document" pageNumber={pageCounter++} orgSettings={orgSettings} />}
        </div>
    );
};
