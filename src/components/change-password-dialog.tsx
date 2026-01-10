
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { collection } from 'firebase/firestore';
import type { Employee } from '../app/user-management/components/employee-entry-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, Building, Briefcase } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { Designation } from '../app/user-management/components/designation-table';
import type { Section } from '../app/user-management/components/section-table';


const InfoItem: React.FC<{icon: React.ElementType, label: string, value: React.ReactNode}> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base font-semibold">{value || 'N/A'}</p>
        </div>
    </div>
);


export function ChangePasswordDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();

  const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
  const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesRef);
  
  const designationsRef = useMemoFirebase(() => (firestore && isOpen) ? collection(firestore, 'designations') : null, [firestore, isOpen]);
  const { data: designations, isLoading: isLoadingDesignations } = useCollection<Designation>(designationsRef);

  const sectionsRef = useMemoFirebase(() => (firestore && isOpen) ? collection(firestore, 'sections') : null, [firestore, isOpen]);
  const { data: sections, isLoading: isLoadingSections } = useCollection<Section>(sectionsRef);

  const employee = useMemo(() => {
    if (!user || !employees) return null;
    return employees.find(e => e.id === user.uid) || employees.find(e => e.email === user.email);
  }, [user, employees]);

  const designationName = useMemo(() => {
    if (employee && designations) {
      return designations.find(d => d.id === employee.designationId)?.name || 'N/A';
    }
    return 'N/A';
  }, [employee, designations]);

  const departmentName = useMemo(() => {
    if (employee && sections) {
      return sections.find(s => s.id === employee.departmentId)?.name || 'N/A';
    }
    return 'N/A';
  }, [employee, sections]);

  useEffect(() => {
      // Reset state when dialog closes
      if (!isOpen) {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setIsLoading(false);
      }
  }, [isOpen]);


  const handlePasswordChange = async () => {
    if (!user || !user.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'No user is logged in.' });
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'New password must be at least 6 characters long.' });
      return;
    }

    setIsLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);
      
      toast({ title: 'Success', description: 'Your password has been changed successfully.' });
      setIsOpen(false);

    } catch (error: any) {
      let errorMessage = 'An unknown error occurred.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'The current password you entered is incorrect.';
      } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Too many attempts. Please try again later.'
      }
      toast({ variant: 'destructive', title: 'Password Change Failed', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  const isComponentLoading = isUserLoading || isLoadingEmployees || (isOpen && (isLoadingDesignations || isLoadingSections));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>My Account</DialogTitle>
          <DialogDescription>View your profile information and update your password.</DialogDescription>
        </DialogHeader>

        {isComponentLoading ? (
            <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
            </div>
        ) : employee ? (
            <div className="space-y-4 py-4">
                 <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border">
                        <AvatarImage src={employee.profilePicture} alt={employee.fullName} />
                        <AvatarFallback className="text-2xl">{employee.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-xl font-bold">{employee.fullName}</p>
                        <p className="text-sm text-muted-foreground">{designationName}</p>
                    </div>
                </div>
                <div className="grid gap-4">
                  <InfoItem icon={Mail} label="Email" value={employee.email} />
                  <InfoItem icon={Phone} label="Mobile Number" value={employee.mobileNumber} />
                  <InfoItem icon={Building} label="Department" value={departmentName} />
                </div>
            </div>
        ) : (
             <div className="py-4 text-center text-muted-foreground">
                <p>Could not load employee profile.</p>
             </div>
        )}
        
        <Separator />

        <div className="grid gap-4 py-4">
            <h4 className="font-semibold">Change Password</h4>
            <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handlePasswordChange} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
