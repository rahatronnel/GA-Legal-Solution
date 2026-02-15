"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { OrganizationSettings } from '@/app/settings/page';
import type { BillItemMaster } from '@/app/billflow/components/bill-item-master-table';

const ProcurementContext = createContext<{
    employees: Employee[];
    orgSettings: OrganizationSettings | null;
    billItemMasters: BillItemMaster[];
    isLoading: boolean;
} | undefined>(undefined);

export function ProcurementProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();

    const { data: employees, isLoading: l1 } = useCollection<Employee>(useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]));
    const { data: orgSettings, isLoading: l2 } = useDoc<OrganizationSettings>(useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]));
    const { data: billItemMasters, isLoading: l3 } = useCollection<BillItemMaster>(useMemoFirebase(() => firestore ? collection(firestore, 'billItemMasters') : null, [firestore]));

    const value = useMemo(() => ({
        employees: employees || [],
        orgSettings: orgSettings || null,
        billItemMasters: billItemMasters || [],
        isLoading: l1 || l2 || l3,
    }), [employees, orgSettings, billItemMasters, l1, l2, l3]);

    return <ProcurementContext.Provider value={value}>{children}</ProcurementContext.Provider>;
}

export function useProcurement() {
    const context = useContext(ProcurementContext);
    if (!context) {
        throw new Error('useProcurement must be used within a ProcurementProvider');
    }
    return context;
}
