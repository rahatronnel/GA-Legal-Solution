
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { type Driver } from '@/app/vehicle-management/components/driver-entry-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, Phone, Cake, VenetianMask, UserSquare2, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

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
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const DocumentLink = ({ doc, label }: { doc: string; label: string }) => {
    if (!doc) {
      return (
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-800 inline-block">Not Uploaded</p>
        </div>
      );
    }
    
    // Simplistic way to get a filename from a data URL
    const fileType = doc.substring(doc.indexOf('/') + 1, doc.indexOf(';'));
    const fileName = `${label.replace(/\s+/g, '_')}.${fileType}`;

    return (
        <div>
            <p className="font-medium">{label}</p>
             <Link href={doc} download={fileName} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                View/Download Document
                <Download className="h-3 w-3"/>
             </Link>
        </div>
    )
  };

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Driver List
      </Button>
      
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-20 w-20">
                <AvatarImage src={driver.profilePicture} alt={driver.name} />
                <AvatarFallback className="text-2xl">{getInitials(driver.name)}</AvatarFallback>
            </Avatar>
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
                        <li className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                            <DocumentLink doc={driver.documents.drivingLicense} label="Driving License" />
                        </li>
                         <li className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                            <DocumentLink doc={driver.documents.nid} label="NID" />
                        </li>
                         <li className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                            <DocumentLink doc={driver.documents.other} label="Other Document" />
                        </li>
                    </ul>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
