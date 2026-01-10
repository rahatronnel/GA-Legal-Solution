
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home as HomeIcon, User as UserIcon } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Employee } from '@/app/user-management/components/employee-entry-form';

export function ModuleHeader() {
    const { user } = useUser();
    const firestore = useFirestore();

    const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const { data: employees } = useCollection<Employee>(employeesRef);

    const currentUserEmployee = React.useMemo(() => {
        if (!user || !employees) return null;
        return employees.find(e => e.id === user.uid) || employees.find(e => e.email === user.email);
    }, [user, employees]);

    return (
        <div className="flex justify-between items-center w-full mb-4">
            <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border">
                    <AvatarImage src={currentUserEmployee?.profilePicture} alt={currentUserEmployee?.fullName} />
                    <AvatarFallback>{currentUserEmployee?.fullName?.charAt(0) || <UserIcon />}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-sm">{currentUserEmployee?.fullName || user?.email}</p>
                    <p className="text-xs text-muted-foreground">Currently Logged In</p>
                </div>
            </div>
            <Button size="sm" variant="outline" asChild className="bg-black text-white hover:bg-gray-800">
                <Link href="/">
                    <HomeIcon className="h-4 w-4 mr-2" /> Home
                </Link>
            </Button>
        </div>
    );
}
