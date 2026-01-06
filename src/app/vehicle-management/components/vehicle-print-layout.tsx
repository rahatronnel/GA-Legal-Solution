
import React from 'react';
import type { Vehicle } from './vehicle-entry-form';
import type { Driver } from './driver-entry-form';
import type { VehicleType } from './vehicle-type-table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import type { VehicleBrand } from './vehicle-brand-table';
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

const getStatusVariant = (status: Vehicle['status']) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Under Maintenance': return 'secondary';
      case 'Inactive': return 'destructive';
      default: return 'outline';
    }
  };

interface VehiclePrintLayoutProps {
  vehicle: Vehicle;
  drivers: Pick<Driver, 'id' | 'name'>[];
  vehicleTypes: Pick<VehicleType, 'id' | 'name'>[];
  vehicleBrands: Pick<VehicleBrand, 'id' | 'name'>[];
  orgSettings: OrganizationSettings;
}

export const VehiclePrintLayout: React.FC<VehiclePrintLayoutProps> = ({ vehicle, drivers, vehicleTypes, vehicleBrands, orgSettings }) => {
    let pageCounter = 1;
    
    const currentDriver = React.useMemo(() => {
        if (!vehicle.driverAssignmentHistory || vehicle.driverAssignmentHistory.length === 0) {
            return null;
        }
        const sortedHistory = [...vehicle.driverAssignmentHistory].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
        const latestAssignment = sortedHistory[0];
        return drivers.find(d => d.id === latestAssignment.driverId) || null;
    }, [vehicle, drivers]);
    
    const vehicleType = vehicleTypes.find(vt => vt.id === vehicle.vehicleTypeId);
    const vehicleBrand = vehicleBrands.find(vb => vb.id === vehicle.brandId);
    
    const documentLabels: Record<keyof Vehicle['documents'], string> = {
        registration: "Registration Certificate (RC / Blue Book)",
        insurance: "Insurance Certificate",
        fitness: "Fitness Certificate",
        taxToken: "Tax Token / Road Tax Receipt",
        routePermit: "Route Permit",
        other: "Other Document"
    };

    return (
        <div className="bg-white">
            {/* Page 1: Vehicle Information */}
            <PrintPage pageNumber={pageCounter++} orgSettings={orgSettings}>
                <h2 className="text-xl font-bold text-center mb-4">Vehicle Information</h2>
                
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-grow">
                        <h3 className="text-2xl font-bold">{vehicleBrand?.name} {vehicle.model}</h3>
                        <p className="text-md text-gray-600">Reg No: {vehicle.registrationNumber}</p>
                        <p className="text-sm text-gray-600">Vehicle ID: {vehicle.vehicleIdCode}</p>
                    </div>
                     <Badge variant={getStatusVariant(vehicle.status)}>{vehicle.status}</Badge>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Vehicle Details</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                            <InfoRow label="Category" value={vehicleType?.name} />
                            <InfoRow label="Brand & Model" value={`${vehicleBrand?.name} ${vehicle.model}`} />
                            <InfoRow label="Manufacture Year" value={vehicle.manufactureYear} />
                            <InfoRow label="Fuel Type" value={vehicle.fuelType} />
                            <InfoRow label="Seating / Load Capacity" value={vehicle.capacity} />
                            <InfoRow label="Ownership" value={vehicle.ownership} />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Identification & Assignment</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                             <InfoRow label="Engine Number" value={vehicle.engineNumber} />
                             <InfoRow label="Chassis Number" value={vehicle.chassisNumber} />
                             <InfoRow label="Current Driver" value={currentDriver?.name} />
                             <InfoRow label="Status" value={vehicle.status} />
                        </div>
                    </div>
                </div>

            </PrintPage>

            {/* Subsequent Pages: Documents */}
            {(Object.keys(documentLabels) as (keyof Vehicle['documents'])[]).map(key => {
                if (vehicle.documents[key]) {
                    return <DocumentPage key={key} doc={vehicle.documents[key]} label={documentLabels[key]} pageNumber={pageCounter++} orgSettings={orgSettings} />
                }
                return null;
            })}
        </div>
    );
};
