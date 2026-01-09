
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { type Employee } from '@/app/user-management/components/employee-entry-form';
import { type Section } from '@/app/user-management/components/section-table';
import { type Designation } from '@/app/user-management/components/designation-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, User, FileText, Phone, Mail, UserCheck, ShieldAlert, UserCog,
    Home, Building, Briefcase, Calendar, MessageSquare, Download, Printer
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';


const DocumentViewer = ({ doc, label }: { doc: string; label: string }) => {
    if (!doc) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">This document has not been uploaded.</p>
            </CardContent>
        </Card>
      );
    }
  
    const mimeType = doc.substring(doc.indexOf(':') + 1, doc.indexOf(';'));
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';
    const fileName = `${label.replace(/\s+/g, '_')}.${isPdf ? 'pdf' : mimeType.split('/')[1]}`;
  
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{label}</CardTitle>
                <Button variant="outline" size="sm" asChild>
                    <Link href={doc} download={fileName} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4"/>
                        Download
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="mt-4 border rounded-lg overflow-hidden flex justify-center items-center bg-muted/50" style={{minHeight: '400px'}}>
                    {isImage ? (
                        <Image src={doc} alt={`${label} document`} width={800} height={600} className="object-contain" />
                    ) : isPdf ? (
                        <object data={doc} type="application/pdf" width="100%" height="800px">
                            <p className="p-4 text-center">Your browser does not support PDFs. Please <Link href={doc} download={fileName} className="text-primary underline">download the PDF</Link> to view it.</p>
                        </object>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="font-semibold">Preview not available</p>
                            <p className="text-sm text-muted-foreground mb-4">You can download the file to view it.</p>
                            <Button asChild>
                                <Link href={doc} download={fileName}>
                                    <Download className="mr-2 h-4 w-4"/>
                                    Download File
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
};

const InfoItem: React.FC<{icon: React.ElementType, label: string, value: React.ReactNode, fullWidth?: boolean}> = ({ icon: Icon, label, value, fullWidth }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <p className="text-sm font-medium text-muted-foreground flex items-center"><Icon className="h-4 w-4 mr-2" />{label}</p>
        <div className="text-base font-semibold pl-6">{value || 'N/A'}</div>
    </div>
);


export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { handlePrint } = usePrint();

  const firestore = useFirestore();
  const employeeDocRef = useMemoFirebase(() => (firestore && typeof id === 'string') ? doc(firestore, 'employees', id) : null, [firestore, id]);
  const { data: employee, isLoading: isLoadingEmployee } = useDoc<Employee>(employeeDocRef);

  const sectionsRef = useMemoFirebase(() => firestore ? collection(firestore, 'sections') : null, [firestore]);
  const { data: sections, isLoading: isLoadingSections } = useCollection<Section>(sectionsRef);
  
  const designationsRef = useMemoFirebase(() => firestore ? collection(firestore, 'designations') : null, [firestore]);
  const { data: designations, isLoading: isLoadingDesignations } = useCollection<Designation>(designationsRef);

  useEffect(() => {
    if (!isLoadingEmployee && !employee) {
        const timer = setTimeout(() => notFound(), 500);
        return () => clearTimeout(timer);
    }
  }, [isLoadingEmployee, employee, notFound]);

  if (isLoadingEmployee || isLoadingSections || isLoadingDesignations) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading employee profile...</p>
      </div>
    );
  }

  if (!employee) {
      notFound();
  }
  
  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';
  }

  const department = sections?.find(s => s.id === employee.departmentId);
  const designation = designations?.find(d => d.id === employee.designationId);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  const getStatusVariant = (status: Employee['status']) => {
    return status === 'Active' ? 'default' : 'destructive';
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader className="text-center">
                    <Avatar className="mx-auto h-32 w-32 border-2 border-primary">
                        <AvatarImage src={employee.profilePicture} alt={employee.fullName} />
                        <AvatarFallback className="text-4xl">{getInitials(employee.fullName)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl pt-4">{employee.fullName}</CardTitle>
                    <CardDescription>{designation?.name || 'N/A'}</CardDescription>
                    <Badge variant={getStatusVariant(employee.status)} className="mx-auto mt-2 text-base">{employee.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => handlePrint(employee, 'employee')} className="w-full"><Printer className="mr-2 h-4 w-4" />Print Profile</Button>
                    <Button variant="outline" onClick={() => router.back()} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Key Information</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <InfoItem icon={UserCog} label="User ID / Code" value={employee.userIdCode} />
                    <InfoItem icon={Mail} label="Email" value={employee.email} />
                    <InfoItem icon={Phone} label="Mobile" value={employee.mobileNumber} />
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                            <InfoItem icon={Building} label="Department / Section" value={department?.name} />
                            <InfoItem icon={Briefcase} label="Designation" value={designation?.name} />
                            <InfoItem icon={Calendar} label="Joining Date" value={formatDate(employee.joiningDate)} />
                            <InfoItem icon={UserCheck} label="User Role" value={employee.role} />
                            <InfoItem icon={Home} label="Address" value={employee.address} fullWidth />
                            <InfoItem icon={MessageSquare} label="Remarks" value={employee.remarks} fullWidth />
                        </CardContent>
                    </Card>
                     {employee.signature && (
                        <Card>
                            <CardHeader><CardTitle>Signature</CardTitle></CardHeader>
                            <CardContent>
                                <div className="p-4 border rounded-md bg-muted/50 w-fit">
                                    <Image src={employee.signature} alt="Employee Signature" width={200} height={100} className="object-contain" />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
                <TabsContent value="documents" className="pt-4">
                    <div className="space-y-6">
                        <DocumentViewer doc={employee.documents.nid} label="National ID (NID)" />
                        <DocumentViewer doc={employee.documents.other} label="Other Document" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    </div>
  );
}
