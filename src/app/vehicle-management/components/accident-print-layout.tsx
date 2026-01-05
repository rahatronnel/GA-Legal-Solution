
import React from 'react';
import type { Accident } from './accident-entry-form';
import type { Vehicle } from './vehicle-table';
import type { Driver } from './driver-entry-form';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Route as RouteType } from './route-table';
import type { Trip } from './trip-entry-form';
import type { AccidentType } from './accident-type-table';
import type { SeverityLevel } from './severity-level-table';
import type { FaultStatus } from './fault-status-table';
import type { ServiceCenter } from './service-center-table';
import Image from 'next/image';

interface AccidentPrintLayoutProps {
  accident: Accident;
  vehicles: Vehicle[];
  drivers: Driver[];
  employees: Employee[];
  routes: RouteType[];
  trips: Trip[];
  accidentTypes: AccidentType[];
  severityLevels: SeverityLevel[];
  faultStatuses: FaultStatus[];
  repairedBy: ServiceCenter[];
}

const PrintHeader = () => (
    <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4">
        <div className="text-sm">
            <h1 className="text-xl font-bold text-gray-800">GA & Legal Solution</h1>
            <p className="text-xs">Head Office: 123 Business Rd, Dhaka, Bangladesh</p>
            <p className="text-xs">Contact: +880 1234 567890 | Email: contact@galsolution.com</p>
        </div>
        <div className="w-20 h-20 bg-gray-200 flex items-center justify-center">
            <p className="text-xs text-gray-500">Logo</p>
        </div>
    </div>
);

const PrintFooter = ({ pageNumber }: { pageNumber: number }) => (
    <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-500">
        Page {pageNumber}
    </div>
);

const PrintPage: React.FC<{children: React.ReactNode, pageNumber: number, className?: string}> = ({children, pageNumber, className = ''}) => (
    <div className={`p-4 bg-white text-black font-sans print-page relative ${className}`} style={{ minHeight: '26cm' }}>
        <PrintHeader />
        <div className="flex-grow pt-6">
            {children}
        </div>
        <PrintFooter pageNumber={pageNumber} />
    </div>
);

const DocumentPage = ({ doc, label, pageNumber }: {doc: {name: string, file:string}, label: string, pageNumber: number}) => {
    if (!doc || !doc.file) return null;
    const isImage = doc.file.startsWith('data:image/');
    
    return (
        <PrintPage pageNumber={pageNumber} className="page-break">
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

const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const documentCategories: Record<keyof Accident['documents'], string> = {
    accidentPhotos: 'Accident Photos',
    policeReport: 'Police Report',
    insuranceClaimForm: 'Insurance Claim Form',
    workshopQuotation: 'Workshop Quotation',
    repairInvoice: 'Repair Invoice',
    medicalReport: 'Medical Report (if any)',
};

export const AccidentPrintLayout: React.FC<AccidentPrintLayoutProps> = ({ 
    accident, vehicles, drivers, employees, routes, trips, accidentTypes, severityLevels, faultStatuses, repairedBy 
}) => {
    let pageCounter = 1;

    const vehicle = vehicles.find(v => v.id === accident.vehicleId);
    const driver = drivers.find(d => d.id === accident.driverId);
    const employee = employees.find(e => e.id === accident.employeeId);
    const route = routes.find(r => r.id === accident.routeId);
    const trip = trips.find(t => t.id === accident.tripId);
    const accidentType = accidentTypes.find(t => t.id === accident.accidentTypeId);
    const severityLevel = severityLevels.find(sl => sl.id === accident.severityLevelId);
    const faultStatus = faultStatuses.find(fs => fs.id === accident.faultStatusId);
    const garage = repairedBy.find(sc => sc.id === accident.repairedById);

    return (
        <div className="bg-white">
            <PrintPage pageNumber={pageCounter++}>
                <h2 className="text-xl font-bold text-center mb-4">Accident Report - {accident.accidentId}</h2>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Incident Details</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                            <InfoRow label="Vehicle" value={vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'N/A'} />
                            <InfoRow label="Driver" value={driver?.name} />
                            <InfoRow label="Reporting Employee" value={employee?.fullName} />
                            <InfoRow label="Accident Date & Time" value={`${accident.accidentDate} ${accident.accidentTime}`} />
                            <InfoRow label="Location" value={accident.location} fullWidth />
                            <InfoRow label="Route" value={route?.name} />
                            <InfoRow label="Trip ID" value={trip?.tripId} />
                            <InfoRow label="Description" value={accident.description} fullWidth />
                        </div>
                    </div>
                     <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Classification & Damage</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                            <InfoRow label="Accident Type" value={accidentType?.name} />
                            <InfoRow label="Severity Level" value={severityLevel?.name} />
                            <InfoRow label="Fault Status" value={faultStatus?.name} />
                            <InfoRow label="Human Injury" value={accident.humanInjury} />
                            <InfoRow label="Third-Party Damage" value={accident.thirdPartyDamage} />
                            <InfoRow label="Vehicle Status After Accident" value={accident.vehicleStatusAfterAccident} />
                             <InfoRow label="Vehicle Damage Description" value={accident.vehicleDamageDescription} fullWidth/>
                        </div>
                    </div>
                     <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Financial & Legal</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                            <InfoRow label="Estimated Repair Cost" value={formatCurrency(accident.estimatedRepairCost)} />
                            <InfoRow label="Actual Repair Cost" value={formatCurrency(accident.actualRepairCost)} />
                            <InfoRow label="Third-Party Damage Cost" value={formatCurrency(accident.thirdPartyDamageCost)} />
                            <InfoRow label="Repaired By (Garage)" value={garage?.name} />
                            <InfoRow label="Repair Payment Status" value={accident.repairPaymentStatus} />
                            <InfoRow label="Police Report Filed" value={accident.policeReportFiled ? `Yes (${accident.policeReportNumber})` : 'No'} />
                            <InfoRow label="Insurance Claim Filed" value={accident.insuranceClaimFiled ? `Yes (${accident.insuranceClaimNumber})` : 'No'} />
                        </div>
                    </div>
                </div>
            </PrintPage>
            
            {/* Documents */}
            {(Object.keys(documentCategories) as (keyof Accident['documents'])[]).map(category => 
                accident.documents[category] && accident.documents[category].map(doc => (
                    <DocumentPage key={doc.id} doc={doc} label={documentCategories[category]} pageNumber={pageCounter++} />
                ))
            )}
        </div>
    );
};
