'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
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


const InfoItem: React.FC<{icon: React.ElementType, label: string, value: React.ReactNode}> = ({ icon: Icon, label, value }) => (
    <li className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
        <div>
            <p className="font-medium">{label}</p>
            <p className="text-muted-foreground">{value || 'N/A'}</p>
        </div>
    </li>
);

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [employees] = useLocalStorage<Employee[]>('employees', []);
  const [sections] = useLocalStorage<Section[]>('sections', []);
  const [designations] = useLocalStorage<Designation[]>('designations', []);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const { handlePrint } = usePrint();

  useEffect(() => {
    if (id && employees.length > 0) {
      const foundEmployee = employees.find(d => d.id === id);
      if (foundEmployee) {
        setEmployee(foundEmployee);
      } else {
        notFound();
      }
    }
  }, [id, employees]);

  if (!employee) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading employee profile...</p>
      </div>
    );
  }
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const department = sections.find(s => s.id === employee.departmentId);
  const designation = designations.find(d => d.id === employee.designationId);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  const getStatusVariant = (status: Employee['status']) => {
    return status === 'Active' ? 'default' : 'destructive';
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employee List
        </Button>
        <Button onClick={() => handlePrint(employee, 'employee')}>
          <Printer className="mr-2 h-4 w-4" />
          Print Profile
        </Button>
       </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
                <AvatarImage src={employee.profilePicture} alt={employee.fullName} />
                <AvatarFallback className="text-3xl">{getInitials(employee.fullName)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-3xl">{employee.fullName}</CardTitle>
                <CardDescription>User ID: {employee.userIdCode}</CardDescription>
                <CardDescription className="mt-1">{designation?.name || 'N/A'}</CardDescription>
                <Badge variant={getStatusVariant(employee.status)} className="mt-2">{employee.status}</Badge>
            </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Contact & Login</h3>
                    <ul className="space-y-4 text-sm">
                        <InfoItem icon={Phone} label="Mobile Number" value={employee.mobileNumber} />
                        <InfoItem icon={Mail} label="Email Address" value={employee.email} />
                        <InfoItem icon={UserCog} label="Username / Login ID" value={employee.username} />
                         <InfoItem icon={Home} label="Address" value={employee.address} />
                    </ul>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Employment Details</h3>
                     <ul className="space-y-4 text-sm">
                        <InfoItem icon={Building} label="Department / Section" value={department?.name} />
                        <InfoItem icon={Briefcase} label="Designation" value={designation?.name} />
                        <InfoItem icon={Calendar} label="Joining Date" value={formatDate(employee.joiningDate)} />
                        <InfoItem icon={MessageSquare} label="Remarks" value={employee.remarks} />
                    </ul>
                </div>
                
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary border-b pb-2">Access & Status</h3>
                     <ul className="space-y-4 text-sm">
                        <InfoItem icon={UserCheck} label="User Role" value={employee.role} />
                        <InfoItem icon={ShieldAlert} label="Status" value={employee.status} />
                        <InfoItem icon={FileText} label="National ID (NID)" value="Available in Documents Tab" />
                    </ul>
                </div>

              </div>
            </TabsContent>
             <TabsContent value="documents">
                <div className="space-y-6 pt-4">
                    <DocumentViewer doc={employee.documents.nid} label="National ID (NID)" />
                    <DocumentViewer doc={employee.documents.other} label="Other Document" />
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
