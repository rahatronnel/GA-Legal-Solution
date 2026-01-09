
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
    isLoading: boolean;
};

type UserManagementDataContextType = {
    data: UserManagementData;
};

const UserManagementContext = createContext<UserManagementDataContextType | undefined>(undefined);

export function UserManagementProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    // Only fetch data if the user is authenticated
    const shouldFetch = !isUserLoading && !!user;

    const { data: employees, isLoading: l1 } = useCollection<Employee>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'employees') : null, [shouldFetch, firestore]));
    const { data: sections, isLoading: l2 } = useCollection<Section>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'sections') : null, [shouldFetch, firestore]));
    const { data: designations, isLoading: l3 } = useCollection<Designation>(useMemoFirebase(() => shouldFetch ? collection(firestore, 'designations') : null, [shouldFetch, firestore]));
    
    const isLoading = isUserLoading || l1 || l2 || l3;

    const data = useMemo(() => ({
        employees: employees || [],
        sections: sections || [],
        designations: designations || [],
        isLoading,
    }), [employees, sections, designations, isLoading]);

    const value = useMemo(() => ({
        data,
    }), [data]);

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
    return { data: context.data };
}
