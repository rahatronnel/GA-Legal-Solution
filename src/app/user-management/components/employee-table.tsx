
"use client";

import React, { useState, useMemo } from 'react';
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
import { PlusCircle, Edit, Trash2, Download, Upload, Eye, User, Printer, Search } from 'lucide-react';
import { EmployeeEntryForm, type Employee } from './employee-entry-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePrint } from '@/app/vehicle-management/components/print-provider';
import type { Designation } from './designation-table';
import type { Section } from './section-table';
import { useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useAuth, initiateEmailSignUp } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface EmployeeTableProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>; // Kept for optimistic updates but Firestore is source of truth
  sections: Section[];
  designations: Designation[];
}

export function EmployeeTable({ employees, setEmployees, sections, designations }: EmployeeTableProps) {
  const { toast } = useToast();
  const { handlePrint } = usePrint();
  const auth = useAuth();
  const firestore = useFirestore();
  const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    const lowercasedTerm = searchTerm.toLowerCase();
    return employees.filter(emp => 
      (emp.fullName && emp.fullName.toLowerCase().includes(lowercasedTerm)) ||
      (emp.userIdCode && emp.userIdCode.toLowerCase().includes(lowercasedTerm)) ||
      (emp.mobileNumber && emp.mobileNumber.toLowerCase().includes(lowercasedTerm))
    );
  }, [employees, searchTerm]);

  const handleAdd = () => {
    setCurrentEmployee(null);
    setIsFormOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsFormOpen(true);
  };

  const handleSave = (data: Omit<Employee, 'id'>, id?: string) => {
    if (!employeesRef) {
        toast({ variant: "destructive", title: "Error", description: "Database not connected." });
        return;
    }
    if (id) {
        const { defaultPassword, ...restOfData } = data;
        setDocumentNonBlocking(doc(employeesRef, id), restOfData, { merge: true });
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

  const confirmDelete = () => {
    if (currentEmployee?.id && employeesRef) {
        // Note: This does not delete the Firebase Auth user.
        // That requires administrative privileges and is best handled by a server-side function.
        deleteDocumentNonBlocking(doc(employeesRef, currentEmployee.id));
        toast({ title: 'Success', description: 'Employee record deleted. Auth user is not removed.' });
    }
    setIsDeleteConfirmOpen(false);
    setCurrentEmployee(null);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 
      userIdCode: '',
      fullName: '',
      email: '',
      password: '',
      mobileNumber: '',
      role: 'Admin/Operator/Driver/Viewer',
      status: 'Active/Inactive',
      sectionCode: '',
      designationCode: '',
      joiningDate: 'YYYY-MM-DD',
      address: '',
      remarks: ''
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'EmployeeTemplate.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && employeesRef && auth) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as any[];

          const requiredHeaders = ['userIdCode', 'fullName', 'mobileNumber', 'email', 'password'];
          const headers = Object.keys(json[0] || {});
          if (!requiredHeaders.every(h => headers.includes(h))) {
             throw new Error('Invalid Excel file format. Required columns are: userIdCode, fullName, mobileNumber, email, password.');
          }

          toast({ title: 'Upload Started', description: `Processing ${json.length} records. This may take a moment.` });

          for (const item of json) {
            if (!item.email || !item.fullName || !item.password) continue;

            const section = sections.find(s => s.sectionCode === String(item.sectionCode || ''));
            const designation = designations.find(d => d.designationCode === String(item.designationCode || ''));
            const password = String(item.password);
             if (password.length < 6) {
                toast({ variant: 'destructive', title: `Skipping user ${item.email}`, description: 'Password must be at least 6 characters.' });
                continue;
            }

            const newEmployee: Omit<Employee, 'id'> = {
                userIdCode: item.userIdCode?.toString().trim() || '',
                fullName: item.fullName?.toString().trim() || '',
                email: item.email?.toString().trim() || '',
                username: item.email?.toString().trim() || '',
                mobileNumber: item.mobileNumber?.toString().trim() || '',
                role: item.userRole?.toString().trim() || 'Viewer',
                status: item.status?.toString().trim() || 'Active',
                departmentId: section?.id || '',
                designationId: designation?.id || '',
                joiningDate: item.joiningDate?.toString().trim() || '',
                address: item.address?.toString().trim() || '',
                remarks: item.remarks?.toString().trim() || '',
                profilePicture: '',
                signature: '',
                documents: { nid: '', other: '' },
                defaultPassword: password,
            };
            
            try {
                // Create auth user first
                initiateEmailSignUp(auth, newEmployee.email, password);
                // Then save employee doc
                addDocumentNonBlocking(employeesRef, newEmployee);
            } catch (authError: any) {
                 toast({ variant: 'destructive', title: `Failed to create user ${newEmployee.email}`, description: authError.message });
            }
          }
          
          toast({ title: 'Success', description: `Finished processing uploaded employees.` });

        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Upload Error', description: error.message });
        }
      };
      reader.readAsArrayBuffer(file);
    }
    event.target.value = '';
  };


  return (
    <TooltipProvider>
      <div className="flex flex-col sm:flex-row justify-between gap-2 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, ID, mobile..."
            className="w-full rounded-lg bg-background pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
            <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Employee</Button>
            <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Template</Button>
            <Label htmlFor="upload-excel-employees" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Upload
            </Label>
            <Input id="upload-excel-employees" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </div>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[160px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!employees ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
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
                    {employee.fullName}
                  </TableCell>
                  <TableCell>{employee.userIdCode}</TableCell>
                  <TableCell>{employee.mobileNumber}</TableCell>
                  <TableCell>{employee.role}</TableCell>
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
                <TableCell colSpan={6} className="h-24 text-center">
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
    </TooltipProvider>
  );
}
