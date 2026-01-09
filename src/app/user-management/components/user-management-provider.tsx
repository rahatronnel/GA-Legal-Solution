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

const UserManagementDataContent = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();

    const employeesRef = useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]);
    const sectionsRef = useMemoFirebase(() => firestore ? collection(firestore, 'sections') : null, [firestore]);
    const designationsRef = useMemoFirebase(() => firestore ? collection(firestore, 'designations') : null, [firestore]);

    const { data: employees, isLoading: l1 } = useCollection<Employee>(employeesRef);
    const { data: sections, isLoading: l2 } = useCollection<Section>(sectionsRef);
    const { data: designations, isLoading: l3 } = useCollection<Designation>(designationsRef);
    
    const isLoading = l1 || l2 || l3;

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
                <p>Loading User Data...</p>
            </div>
        );
    }
    
    return (
        <UserManagementContext.Provider value={value}>
            {children}
        </UserManagementContext.Provider>
    );
};


export function UserManagementProvider({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Verifying authentication...</p>
            </div>
        );
    }
    
    if (!user) {
        return null; // Should be handled by AppWrapper, but as a safeguard.
    }

    return <UserManagementDataContent>{children}</UserManagementDataContent>;
}

export function useUserManagement() {
    const context = useContext(UserManagementContext);
    if (!context) {
        throw new Error('useUserManagement must be used within a UserManagementProvider');
    }
    return { data: context.data };
}
