
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { PlusCircle, Edit, Trash2, Download, Upload, Eye, User, Printer, Search, Trash, KeyRound, Copy, FileSpreadsheet } from 'lucide-react';
import { EmployeeEntryForm, type Employee } from './employee-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import type { Designation } from './designation-table';
import type { Section } from './section-table';
import type { Department } from './department-table';
import { useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useAuth, initiateEmailSignUp, useUser, recreateUserWithPassword } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmployeeTableProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>; 
  sections: Section[];
  designations: Designation[];
  departments: Department[];
}

type ProcessedEmployee = {
  isNew: boolean;
  data: Partial<Employee>;
  original?: Employee;
};

export function EmployeeTable({ employees, setEmployees, sections, designations, departments }: EmployeeTableProps) {
  const { toast } = useToast();
  const { handlePrint } = usePrint();
  const auth = useAuth();
  const { user: loggedInUser } = useUser();
  const firestore = useFirestore();
  const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false);
  const [isUploadConfirmOpen, setIsUploadConfirmOpen] = useState(false);
  const [processedUpload, setProcessedUpload] = useState<ProcessedEmployee[]>([]);

  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const getSectionName = (sectionId?: string) => {
      if(!sectionId || !sections || sections.length === 0) return 'N/A';
      return sections.find(s => s.id === sectionId)?.name || 'N/A';
  }

  const getDepartmentName = (deptId?: string) => {
      if(!deptId || !departments || departments.length === 0) return 'N/A';
      return departments.find(d => d.id === deptId)?.name || 'N/A';
  }

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (!searchTerm) return employees;
    const lowercasedTerm = searchTerm.toLowerCase();
    return employees.filter(emp => 
      (emp.fullName && emp.fullName.toLowerCase().includes(lowercasedTerm)) ||
      (emp.userIdCode && emp.userIdCode.toLowerCase().includes(lowercasedTerm)) ||
      (emp.mobileNumber && emp.mobileNumber.toLowerCase().includes(lowercasedTerm)) ||
      (emp.processCode && emp.processCode.toLowerCase().includes(lowercasedTerm)) ||
      (emp.employeeType && emp.employeeType.toLowerCase().includes(lowercasedTerm)) ||
      (emp.location && emp.location.toLowerCase().includes(lowercasedTerm)) ||
      (getDepartmentName(emp.departmentId).toLowerCase().includes(lowercasedTerm)) ||
      (getSectionName(emp.sectionId).toLowerCase().includes(lowercasedTerm))
    );
  }, [employees, searchTerm, sections, departments]);

  const handleAdd = () => {
    setCurrentEmployee(null);
    setIsFormOpen(true);
  }
  
  const handleEdit = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsFormOpen(true);
  };
  
  const handleSave = async (data: Omit<Employee, 'id' | 'defaultPassword'>, id?: string) => {
    if (!employeesRef) {
        toast({ variant: "destructive", title: "Error", description: "Database not connected." });
        return;
    }
    if (id) {
        setDocumentNonBlocking(doc(employeesRef, id), data, { merge: true });
        toast({ title: 'Success', description: 'Employee updated successfully.' });
    } else {
        addDocumentNonBlocking(employeesRef, data);
        toast({ title: 'Success', description: 'Employee added successfully.' });
    }
  };

  const handleDelete = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsDeleteConfirmOpen(true);
  };
  
  const handleSetPassword = (employee: Employee) => {
      setCurrentEmployee(employee);
      setNewPassword('');
      setConfirmNewPassword('');
      setIsSetPasswordOpen(true);
  }

  const confirmSetPassword = async () => {
      if (!auth || !currentEmployee?.email) return;
      if (newPassword.length < 6) {
          toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters.'});
          return;
      }
      if (newPassword !== confirmNewPassword) {
          toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match.'});
          return;
      }

      try {
        await recreateUserWithPassword(auth, currentEmployee.email, newPassword);
        toast({ title: 'Success', description: `Password for ${currentEmployee.fullName} has been set.`});
        setIsSetPasswordOpen(false);
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Operation Failed', description: error.message || 'Could not set the new password.'});
      }
  }


  const confirmDelete = () => {
    if (currentEmployee?.id && employeesRef) {
        deleteDocumentNonBlocking(doc(employeesRef, currentEmployee.id));
        toast({ title: 'Success', description: 'Employee record deleted. Auth user is not removed.' });
    }
    setIsDeleteConfirmOpen(false);
    setCurrentEmployee(null);
  };
  
  const confirmDeleteAll = () => {
     if (!employeesRef) return;
     employees.forEach(employee => {
         deleteDocumentNonBlocking(doc(employeesRef, employee.id));
     });
    toast({ title: 'Success', description: 'All employee records are being deleted.' });
    setIsDeleteAllConfirmOpen(false);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 
      userIdCode: '',
      fullName: '',
      mobileNumber: '',
      email: '',
      role: 'Admin/Operator/Driver/Viewer',
      status: 'Active/Inactive',
      employeeType: 'Executive/S. Staff',
      username: '',
      departmentCode: '',
      sectionCode: '',
      designationCode: '',
      joiningDate: 'YYYY-MM-DD',
      address: '',
      remarks: '',
      defaultPassword: '',
      processCode: '',
      location: 'Dhaka Office/Factory/Gazipur Branch Office'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'EmployeeTemplate.xlsx');
  };

  const handleDownloadYKKTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 
      Location: 'Dhaka Office',
      ID: '1001',
      Name: 'John Doe',
      Designation: 'Manager',
      'Employee Type': 'Executive',
      'Department name': 'Operations',
      'Process Code': 'PC-001',
      'Process Code Wise Section': 'Sourcing',
      Gender: 'Male',
      Password: 'password123'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'YKK_Template');
    XLSX.writeFile(wb, 'YKK_Employee_Template.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && employeesRef) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as any[];

          const processed = json.map(item => {
              const dept = departments.find(d => d.code === String(item.departmentCode || '').trim());
              const sect = sections.find(s => s.sectionCode === String(item.sectionCode || '').trim());
              const desig = designations.find(d => d.designationCode === String(item.designationCode || '').trim());
              
              const existing = employees.find(e => e.email === item.email);
              
              const empData: Partial<Employee> = {
                  userIdCode: String(item.userIdCode || '').trim(),
                  fullName: String(item.fullName || '').trim(),
                  mobileNumber: String(item.mobileNumber || '').trim(),
                  email: String(item.email || '').trim(),
                  role: (item.role || 'Viewer') as any,
                  status: (item.status || 'Active') as any,
                  employeeType: (item.employeeType || '') as any,
                  username: String(item.email || '').trim(),
                  departmentId: dept?.id || '',
                  sectionId: sect?.id || '',
                  designationId: desig?.id || '',
                  joiningDate: item.joiningDate ? String(item.joiningDate) : '',
                  address: String(item.address || '').trim(),
                  remarks: String(item.remarks || '').trim(),
                  defaultPassword: String(item.defaultPassword || '').trim(),
                  processCode: String(item.processCode || '').trim(),
                  location: (String(item.location || '').trim() || '') as any,
              };
              
              return {
                  isNew: !existing,
                  data: empData,
                  original: existing
              };
          });
          
          setProcessedUpload(processed);
          setIsUploadConfirmOpen(true);

        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Upload Error', description: error.message });
        }
      };
      reader.readAsArrayBuffer(file);
    }
    event.target.value = '';
  };

  const handleYKKFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && employeesRef) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { raw: false });

          const processed = json.map(item => {
              // High-Fidelity Header Resolve Logic (Support both YKK and normalized keys)
              const idStr = String(item['ID'] || item['id'] || '').trim();
              if (!idStr) return null;

              const name = String(item['Name'] || item['name'] || '').trim();
              const desigNameStr = String(item['Designation'] || item['designation'] || '').trim().toLowerCase();
              const empTypeStr = String(item['Employee Type'] || item['employee type'] || '').trim();
              const deptNameStr = String(item['Department name'] || item['department name'] || '').trim().toLowerCase();
              const procCodeStr = String(item['Process Code'] || item['process code'] || '').trim();
              const sectNameStr = String(item['Process Code Wise Section'] || item['process code wise section'] || '').trim().toLowerCase();
              const genderStr = String(item['Gender'] || item['gender'] || '').trim();
              const locationStr = String(item['Location'] || item['location'] || '').trim();
              const passwordStr = String(item['Password'] || item['password'] || '').trim();

              const dept = departments.find(d => d.name.toLowerCase() === deptNameStr);
              const sect = sections.find(s => s.name.toLowerCase() === sectNameStr);
              const desig = designations.find(d => d.name.toLowerCase() === desigNameStr);
              
              // Security Handshake: Derive corporate login email from ID
              const loginEmail = idStr.includes('@') ? idStr : `${idStr}@ykk-erp.com`;
              
              const existing = employees.find(e => e.userIdCode === idStr || e.email === loginEmail);
              
              const empData: Partial<Employee> = {
                  userIdCode: idStr,
                  fullName: name,
                  email: loginEmail,
                  username: idStr,
                  role: 'Viewer', // Organizational Default
                  status: 'Active', // Organizational Default
                  employeeType: empTypeStr as any,
                  departmentId: dept?.id || '',
                  sectionId: sect?.id || '',
                  designationId: desig?.id || '',
                  processCode: procCodeStr,
                  gender: genderStr as any,
                  location: locationStr as any,
                  defaultPassword: passwordStr,
                  mobileNumber: '',
                  joiningDate: '',
                  address: '',
                  remarks: '',
                  documents: { nid: '', other: '' }
              };
              
              return {
                  isNew: !existing,
                  data: empData,
                  original: existing
              };
          }).filter(Boolean) as ProcessedEmployee[];
          
          setProcessedUpload(processed);
          setIsUploadConfirmOpen(true);

        } catch (error: any) {
          toast({ variant: 'destructive', title: 'YKK Upload Error', description: error.message });
        }
      };
      reader.readAsArrayBuffer(file);
    }
    event.target.value = '';
  };

  const confirmUpload = async () => {
    if (!employeesRef || !auth) return;
    
    let createdCount = 0;
    let updatedCount = 0;
    let syncedCount = 0;

    for (const item of processedUpload) {
        if (item.isNew) {
            if (item.data.email && item.data.defaultPassword && item.data.defaultPassword.length >= 6) {
                try {
                    const { defaultPassword, ...dataToSave } = item.data;
                    await initiateEmailSignUp(auth, dataToSave.email!, defaultPassword);
                    addDocumentNonBlocking(employeesRef, dataToSave as Omit<Employee, 'id'>);
                    createdCount++;
                } catch (authError: any) {
                    if (authError.code === 'auth/email-already-in-use') {
                        // High-Fidelity Identity Synchronization Pulse:
                        // If Auth exists but Firestore record was deleted, restore the data record.
                        const { defaultPassword, ...dataToSave } = item.data;
                        addDocumentNonBlocking(employeesRef, dataToSave as Omit<Employee, 'id'>);
                        syncedCount++;
                    } else {
                        toast({ variant: 'destructive', title: `Failed to create user ${item.data.email}`, description: authError.message });
                    }
                }
            } else {
                 console.warn(`Skipping user creation for ${item.data.email} due to missing data or short password.`);
            }
        } else if (item.original?.id) {
            const { defaultPassword, ...dataToUpdate } = item.data; 
            setDocumentNonBlocking(doc(firestore, 'employees', item.original.id), dataToUpdate, { merge: true });
            updatedCount++;
        }
    }
    
    toast({ 
        title: 'Upload Handshake Complete', 
        description: `${createdCount} identities registered, ${syncedCount} identities synchronized, ${updatedCount} records updated.` 
    });
    setIsUploadConfirmOpen(false);
    setProcessedUpload([]);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col sm:flex-row justify-between gap-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, ID, email..."
            className="w-full rounded-lg bg-background pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
            <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Employee</Button>
            <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
            
            <label htmlFor="upload-excel-employees" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Upload
            </label>
            <Input id="upload-excel-employees" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />

            <div className="flex gap-1 items-center bg-primary/5 p-1 rounded-lg border-2 border-primary/10">
                <Button variant="ghost" size="sm" onClick={handleDownloadYKKTemplate} className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"><Download className="mr-1 h-3 w-3"/> YKK Template</Button>
                <label htmlFor="upload-ykk-employees" className="inline-flex items-center justify-center rounded-md text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 cursor-pointer transition-all active:scale-95 shadow-lg shadow-primary/20">
                    <FileSpreadsheet className="mr-1.5 h-3 w-3" /> Upload YKK Format
                </label>
                <Input id="upload-ykk-employees" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleYKKFileUpload} />
            </div>

             <AlertDialog open={isDeleteAllConfirmOpen} onOpenChange={setIsDeleteAllConfirmOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={employees.length === 0}>
                        <Trash className="mr-2 h-4 w-4" /> Delete All
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all {employees.length} employee records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteAll}>
                            Yes, delete all
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[200px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!employees ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                ))
            ) : filteredEmployees && filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                       {employee.profilePicture ? (
                           <Image src={employee.profilePicture} alt={employee.fullName} width={40} height={40} className="object-cover" />
                       ) : (
                           <User className="h-6 w-6 text-muted-foreground" />
                       )}
                    </div>
                    <div>
                        <p className="font-medium leading-none mb-1">{employee.fullName}</p>
                        <div className="flex gap-1">
                            <Badge variant="outline" className="text-[9px] h-4 font-black uppercase tracking-tighter opacity-70">{employee.employeeType || 'Unset'}</Badge>
                            {employee.gender && <Badge variant="secondary" className="text-[9px] h-4 font-black uppercase tracking-tighter opacity-70">{employee.gender}</Badge>}
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.userIdCode}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>{employee.email}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-3 w-3"
                            onClick={() => {
                              navigator.clipboard.writeText(employee.email);
                              toast({ title: 'Copied!', description: 'Email copied to clipboard.' });
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy Email</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-bold">{employee.location || 'N/A'}</Badge></TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>{getDepartmentName(employee.departmentId)}</TableCell>
                  <TableCell>{employee.status}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                             <Link href={`/user-management/employees/${employee.id}`}>
                               <Eye className="h-4 w-4" />
                             </Link>
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Profile</TooltipContent>
                      </Tooltip>
                       <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(employee)}>
                             <Edit className="h-4 w-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Employee</TooltipContent>
                      </Tooltip>
                       <Tooltip>
                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSetPassword(employee)}><KeyRound className="h-4 w-4 text-orange-500" /></Button></TooltipTrigger>
                        <TooltipContent>Set Password</TooltipContent>
                      </Tooltip>
                       <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(employee, 'employee')}>
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Print</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(employee)}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Employee</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                    {searchTerm ? `No employees found for "${searchTerm}".` : "No employees found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EmployeeEntryForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        onSave={handleSave}
        employee={currentEmployee}
        sections={sections || []}
        designations={designations || []}
      />
      
      <Dialog open={isSetPasswordOpen} onOpenChange={setIsSetPasswordOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set New Password</DialogTitle>
                    <DialogDescription>Set a new password for {currentEmployee?.fullName}. This will immediately change their password.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2"><Label htmlFor="new-password">New Password</Label><Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="confirm-new-password">Confirm New Password</Label><Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} /></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSetPasswordOpen(false)}>Cancel</Button>
                    <Button onClick={confirmSetPassword}>Set Password</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the employee record for "{currentEmployee?.fullName}". The authentication user will NOT be deleted automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadConfirmOpen} onOpenChange={setIsUploadConfirmOpen}>
        <DialogContent className="sm:max-w-2xl flex flex-col h-[60vh]">
            <DialogHeader>
                <DialogTitle>Confirm Excel Upload</DialogTitle>
                <DialogDescription>
                    Review the changes below. Click "Confirm" to apply them.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                    <h4 className="font-semibold">New Employees to Create ({processedUpload.filter(p => p.isNew).length})</h4>
                    <ScrollArea className="flex-grow border rounded-md p-2">
                        <ul className="list-disc pl-5">
                        {processedUpload.filter(p => p.isNew).map((p, i) => <li key={i} className="text-xs font-bold text-primary">{p.data.fullName} ({p.data.email})</li>)}
                        </ul>
                    </ScrollArea>
                </div>
                <div className="space-y-2 flex flex-col">
                    <h4 className="font-semibold">Employees to Update ({processedUpload.filter(p => !p.isNew).length})</h4>
                    <ScrollArea className="flex-grow border rounded-md p-2">
                        <ul className="list-disc pl-5">
                        {processedUpload.filter(p => !p.isNew).map((p, i) => <li key={i} className="text-xs">{p.original?.fullName} ({p.original?.email})</li>)}
                        </ul>
                    </ScrollArea>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadConfirmOpen(false)}>Cancel</Button>
                <Button onClick={confirmUpload} className="bg-primary font-bold shadow-lg shadow-primary/20">Confirm & Synchronize Identities</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
