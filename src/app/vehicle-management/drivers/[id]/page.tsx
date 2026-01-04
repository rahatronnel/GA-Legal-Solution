'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { type Driver } from '@/app/vehicle-management/components/driver-entry-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, Phone, Cake, VenetianMask, UserSquare2 } from 'lucide-react';

export default function DriverProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [drivers] = useLocalStorage<Driver[]>('drivers', []);
  const [driver, setDriver] = useState<Driver | null>(null);

  useEffect(() => {
    if (id && drivers.length > 0) {
      const foundDriver = drivers.find(d => d.id === id);
      if (foundDriver) {
        setDriver(foundDriver);
      } else {
        notFound();
      }
    }
  }, [id, drivers]);

  if (!driver) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading driver profile...</p>
      </div>
    );
  }

  const getDocumentStatus = (doc: string | undefined) => {
    return doc ? 'Uploaded' : 'Not Uploaded';
  }

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Driver List
      </Button>
      
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
                <User className="h-8 w-8" />
            </div>
            <div>
                <CardTitle className="text-3xl">{driver.name}</CardTitle>
                <CardDescription>Driver ID: {driver.driverIdCode}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Personal Information</h3>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-3">
                            <UserSquare2 className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Father's/Guardian's Name</p>
                                <p className="text-muted-foreground">{driver.fatherOrGuardianName || 'N/A'}</p>
                            </div>
                        </li>
                        <li className="flex items-center gap-3">
                            <Cake className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Date of Birth</p>
                                <p className="text-muted-foreground">{driver.dateOfBirth ? new Date(driver.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </li>
                        <li className="flex items-center gap-3">
                            <VenetianMask className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Gender</p>
                                <p className="text-muted-foreground">{driver.gender || 'N/A'}</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Contact Information</h3>
                     <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Mobile Number</p>
                                <p className="text-muted-foreground">{driver.mobileNumber}</p>
                            </div>
                        </li>
                         <li className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Alternate Mobile Number</p>
                                <p className="text-muted-foreground">{driver.alternateMobileNumber || 'N/A'}</p>
                            </div>
                        </li>
                    </ul>
                </div>
                
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Documents</h3>
                     <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Driving License</p>
                                <p className={`text-xs font-semibold px-2 py-1 rounded-full ${driver.documents.drivingLicense ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{getDocumentStatus(driver.documents.drivingLicense)}</p>
                            </div>
                        </li>
                         <li className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                             <div>
                                <p className="font-medium">NID</p>
                                <p className={`text-xs font-semibold px-2 py-1 rounded-full ${driver.documents.nid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{getDocumentStatus(driver.documents.nid)}</p>
                            </div>
                        </li>
                         <li className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                             <div>
                                <p className="font-medium">Other Document</p>
                                <p className={`text-xs font-semibold px-2 py-1 rounded-full ${driver.documents.other ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{getDocumentStatus(driver.documents.other)}</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
