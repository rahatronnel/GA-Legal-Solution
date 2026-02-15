
"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Section } from '@/app/user-management/components/section-table';
import type { OrganizationSettings } from '@/app/settings/page';
import type { BillItemMaster } from '@/app/billflow/components/bill-item-master-table';
import type { DemandNote } from './demand-note-entry-form';
import type { ProcessCode } from './process-code-table';
import type { DemandType } from './demand-type-table';

const ProcurementContext = createContext<{
    employees: Employee[];
    sections: Section[];
    orgSettings: OrganizationSettings | null;
    billItemMasters: BillItemMaster[];
    demandNotes: DemandNote[];
    processCodes: ProcessCode[];
    demandTypes: DemandType[];
    isLoading: boolean;
} | undefined>(undefined);

export function ProcurementProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();

    const { data: employees, isLoading: l1 } = useCollection<Employee>(useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]));
    const { data: sections, isLoading: l2 } = useCollection<Section>(useMemoFirebase(() => firestore ? collection(firestore, 'sections') : null, [firestore]));
    const { data: orgSettings, isLoading: l3 } = useDoc<OrganizationSettings>(useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]));
    const { data: billItemMasters, isLoading: l4 } = useCollection<BillItemMaster>(useMemoFirebase(() => firestore ? collection(firestore, 'billItemMasters') : null, [firestore]));
    const { data: demandNotes, isLoading: l5 } = useCollection<DemandNote>(useMemoFirebase(() => firestore ? collection(firestore, 'demandNotes') : null, [firestore]));
    const { data: processCodes, isLoading: l6 } = useCollection<ProcessCode>(useMemoFirebase(() => firestore ? collection(firestore, 'processCodes') : null, [firestore]));
    const { data: demandTypes, isLoading: l7 } = useCollection<DemandType>(useMemoFirebase(() => firestore ? collection(firestore, 'demandTypes') : null, [firestore]));

    const value = useMemo(() => ({
        employees: employees || [],
        sections: sections || [],
        orgSettings: orgSettings || null,
        billItemMasters: billItemMasters || [],
        demandNotes: demandNotes || [],
        processCodes: processCodes || [],
        demandTypes: demandTypes || [],
        isLoading: l1 || l2 || l3 || l4 || l5 || l6 || l7,
    }), [employees, sections, orgSettings, billItemMasters, demandNotes, processCodes, demandTypes, l1, l2, l3, l4, l5, l6, l7]);

    return <ProcurementContext.Provider value={value}>{children}</ProcurementContext.Provider>;
}

export function useProcurement() {
    const context = useContext(ProcurementContext);
    if (!context) {
        if (typeof window === 'undefined') {
            return {
                employees: [],
                sections: [],
                orgSettings: null,
                billItemMasters: [],
                demandNotes: [],
                processCodes: [],
                demandTypes: [],
                isLoading: true
            }
        }
        throw new Error('useProcurement must be used within a ProcurementProvider');
    }
    return context;
}
