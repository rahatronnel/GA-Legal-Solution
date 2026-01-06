
import React from 'react';
import Image from 'next/image';
import type { Trip } from './trip-entry-form';
import type { Vehicle } from './vehicle-table';
import type { Driver } from './driver-entry-form';
import type { TripPurpose } from './trip-purpose-table';
import type { Location } from './location-table';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import type { ExpenseType } from './expense-type-table';
import { ArrowRight } from 'lucide-react';

interface TripPrintLayoutProps {
  trip: Trip;
  vehicles: Vehicle[];
  drivers: Driver[];
  purposes: TripPurpose[];
  locations: Location[];
  expenseTypes: ExpenseType[];
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

const documentLabels: Record<keyof Omit<Trip['documents'], 'id'>, string> = {
    approvalDoc: 'Approval Document', fuelReceipt: 'Fuel Receipt/Memo', parkingBill: 'Parking Bill',
    tollBill: 'Toll Bill', miscExpense: 'Miscellaneous Expenses Bill', lunchBill: 'Lunch Bill',
    otherDoc: 'Other Document', damagePhoto: 'Damage Photo', routePermit: 'Route Permit Photo',
    specialApprove: 'Special Approval Document',
};

const DocumentPage = ({ doc, label, pageNumber }: {doc: { name: string; file: string }, label: string, pageNumber: number}) => {
    if (!doc || !doc.file) return null;
    const isImage = doc.file.startsWith('data:image/');
    
    return (
        <PrintPage pageNumber={pageNumber} className="page-break">
            <h2 className="text-lg font-bold mb-4">{label} - {doc.name}</h2>
            <div className="border rounded-lg p-2 flex justify-center items-center h-[22cm] relative">
                 {isImage ? (
                    <Image src={doc.file} alt={doc.name} layout="fill" className="object-contain" />
                ) : (
                     <p>Cannot preview this document type. It is available for download on the profile page.</p>
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

const getStatusVariant = (status: Trip['tripStatus']) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Ongoing': return 'secondary';
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
};

export const TripPrintLayout: React.FC<TripPrintLayoutProps> = ({ trip, vehicles, drivers, purposes, locations, expenseTypes }) => {
    let pageCounter = 1;

    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    const driver = drivers.find(d => d.id === trip.driverId);
    const purpose = purposes.find(p => p.id === trip.purposeId);
    const totalDistance = (trip.endingMeter > trip.startingMeter) ? trip.endingMeter - trip.startingMeter : 0;
    const totalExpenses = trip.expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
    const getExpenseTypeName = (id: string) => expenseTypes.find(et => et.id === id)?.name || 'N/A';
    
    const itinerary = trip.stops?.map(stop => locations.find(l => l.id === stop.locationId)?.name).filter(Boolean).join(' -> ') || 'N/A';


    return (
        <div className="bg-white">
            <PrintPage pageNumber={pageCounter++}>
                <h2 className="text-xl font-bold text-center mb-4">Trip Information - {trip.tripId}</h2>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold">{vehicle?.make} {vehicle?.model} ({vehicle?.registrationNumber})</h3>
                        <p className="text-sm text-gray-600">Driven by: {driver?.name}</p>
                    </div>
                    <Badge variant={getStatusVariant(trip.tripStatus)}>{trip.tripStatus}</Badge>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Trip Details</h4>
                        <div className="grid grid-cols-2 gap-x-6">
                            <InfoRow label="Purpose" value={purpose?.name} />
                            <InfoRow label="Itinerary" value={itinerary} />
                            <InfoRow label="Start" value={`${trip.startDate} ${trip.startTime}`} />
                            <InfoRow label="End" value={`${trip.endDate} ${trip.endTime}`} />
                            <InfoRow label="Remarks" value={trip.remarks} fullWidth />
                        </div>
                    </div>
                     <div>
                        <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Meter & Distance</h4>
                        <div className="grid grid-cols-3 gap-x-6">
                             <InfoRow label="Starting Meter" value={`${trip.startingMeter} km`} />
                             <InfoRow label="Ending Meter" value={`${trip.endingMeter} km`} />
                             <InfoRow label="Total Distance" value={`${totalDistance} km`} />
                        </div>
                    </div>
                    {trip.expenses && trip.expenses.length > 0 && (
                        <div>
                            <h4 className="text-base font-semibold border-b-2 border-gray-300 pb-1 mb-2">Expenses</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trip.expenses.map(exp => (
                                        <TableRow key={exp.id}>
                                            <TableCell>{getExpenseTypeName(exp.expenseTypeId)}</TableCell><TableCell>{exp.date}</TableCell><TableCell className="text-right">{exp.amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             <p className="text-right font-bold mt-2">Total Expenses: {totalExpenses.toFixed(2)}</p>
                        </div>
                    )}
                </div>
            </PrintPage>

            {(Object.keys(documentLabels) as (keyof Trip['documents'])[]).map(category => 
                trip.documents[category] && trip.documents[category].map(doc => (
                    <DocumentPage key={doc.id} doc={doc} label={documentLabels[category]} pageNumber={pageCounter++} />
                ))
            )}
        </div>
    );
};

    