
"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';

import type { Employee } from './employee-entry-form';
import type { Section } from './section-table';
import type { Designation } from './designation-table';

export type UserManagementData = {
    employees: Employee[];
    sections: Section[];
    designations: Designation[];
};

type UserManagementDataContextType = {
    data: UserManagementData;
    isLoading: boolean;
};

const UserManagementContext = createContext<UserManagementDataContextType | undefined>(undefined);

export function UserManagementProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    // Only attempt to fetch data if the user is logged in.
    const shouldFetch = !!user;

    const { data: employees, isLoading: l1 } = useCollection<Employee>(useMemoFirebase(() => shouldFetch && firestore ? collection(firestore, 'employees') : null, [firestore, shouldFetch]));
    const { data: sections, isLoading: l2 } = useCollection<Section>(useMemoFirebase(() => shouldFetch && firestore ? collection(firestore, 'sections') : null, [firestore, shouldFetch]));
    const { data: designations, isLoading: l3 } = useCollection<Designation>(useMemoFirebase(() => shouldFetch && firestore ? collection(firestore, 'designations') : null, [firestore, shouldFetch]));
    
    const isLoading = isUserLoading || (shouldFetch && (l1 || l2 || l3));

    const data = useMemo(() => ({
        employees: employees || [],
        sections: sections || [],
        designations: designations || [],
    }), [employees, sections, designations]);

    const value = useMemo(() => ({
        data,
        isLoading,
    }), [data, isLoading]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Loading User Management Data...</p>
            </div>
        );
    }

    return (
        <UserManagementContext.Provider value={value}>
            {children}
        </UserManagementContext.Provider>
    );
}

export function useUserManagement() {
    const context = useContext(UserManagementContext);
    if (!context) {
        throw new Error('useUserManagement must be used within a UserManagementProvider');
    }
    return { ...context.data, isLoading: context.isLoading };
}
