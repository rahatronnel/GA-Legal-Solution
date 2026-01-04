
import React from 'react';
import Image from 'next/image';
import type { Driver } from './driver-entry-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DriverPrintLayoutProps {
  driver: Driver;
}

const PrintHeader = () => (
    <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4">
        <div className="text-sm">
            <h1 className="text-2xl font-bold text-gray-800">GA & Legal Solution</h1>
            <p>Head Office: 123 Business Rd, Dhaka, Bangladesh</p>
            <p>Contact: +880 1234 567890 | Email: contact@galsolution.com</p>
        </div>
        <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
            <p className="text-xs text-gray-500">Logo</p>
        </div>
    </div>
);

const PrintFooter = ({ pageNumber }: { pageNumber: number }) => (
    <div className="text-center text-xs text-gray-500 pt-4 border-t mt-auto">
        Page {pageNumber}
    </div>
)

const PrintPage: React.FC<{children: React.ReactNode, pageNumber: number}> = ({children, pageNumber}) => (
    <div className="p-8 bg-white text-black min-h-screen flex flex-col">
        <PrintHeader />
        <div className="flex-grow py-8">
            {children}
        </div>
        <PrintFooter pageNumber={pageNumber} />
    </div>
)

const DocumentPage = ({ doc, label, pageNumber }: {doc: string, label: string, pageNumber: number}) => {
    const mimeType = doc.substring(doc.indexOf(':') + 1, doc.indexOf(';'));
    const isImage = mimeType.startsWith('image/');
    
    return (
        <div className="page-break">
            <PrintPage pageNumber={pageNumber}>
                <h2 className="text-xl font-bold mb-4">{label}</h2>
                <div className="border rounded-lg p-4 flex justify-center items-center">
                     {isImage ? (
                        <Image src={doc} alt={label} width={800} height={1000} className="object-contain max-w-full" />
                    ) : (
                         <p>Cannot preview this document type. It is available for download on the profile page.</p>
                    )}
                </div>
            </PrintPage>
        </div>
    )
}


export const DriverPrintLayout: React.FC<DriverPrintLayoutProps> = ({ driver }) => {
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
    let pageCounter = 1;

    return (
        <div className="bg-white">
            {/* Page 1: Driver Information */}
            <PrintPage pageNumber={pageCounter++}>
                <h2 className="text-2xl font-bold text-center mb-6">Driver Information</h2>
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-1 flex justify-center">
                         <Avatar className="h-40 w-40 border-2">
                            <AvatarImage src={driver.profilePicture} alt={driver.name} />
                            <AvatarFallback className="text-4xl">{getInitials(driver.name)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="col-span-2 space-y-3">
                         {[
                            { label: "Driver Name", value: driver.name },
                            { label: "Driver ID / Code", value: driver.driverIdCode },
                            { label: "Father's/Guardian's Name", value: driver.fatherOrGuardianName },
                            { label: "Date of Birth", value: driver.dateOfBirth ? new Date(driver.dateOfBirth).toLocaleDateString() : 'N/A' },
                            { label: "Gender", value: driver.gender },
                            { label: "Mobile Number", value: driver.mobileNumber },
                            { label: "Alternate Mobile Number", value: driver.alternateMobileNumber || 'N/A' },
                        ].map(info => (
                             <div key={info.label} className="flex">
                                <p className="w-1/3 font-semibold text-gray-600">{info.label}:</p>
                                <p className="w-2/3">{info.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </PrintPage>

            {/* Subsequent Pages: Documents */}
            {driver.documents.drivingLicense && (
                <DocumentPage doc={driver.documents.drivingLicense} label="Driving License" pageNumber={pageCounter++} />
            )}
            {driver.documents.nid && (
                <DocumentPage doc={driver.documents.nid} label="National ID (NID)" pageNumber={pageCounter++} />
            )}
             {driver.documents.other && (
                <DocumentPage doc={driver.documents.other} label="Other Document" pageNumber={pageCounter++} />
            )}
        </div>
    );
};
