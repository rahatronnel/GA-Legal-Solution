
"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

import type { Vendor } from './vendor-entry-form';
import type { VendorCategory } from './vendor-category-table';
import type { VendorNatureOfBusiness } from './vendor-nature-of-business-table';
import type { Bill } from './bill-entry-form';
import type { BillType } from './bill-type-table';
import type { BillCategory } from './bill-category-table';
import type { Employee } from '@/app/user-management/components/employee-entry-form';
import type { Section } from '@/app/user-management/components/section-table';
import type { BillItemMaster } from './bill-item-master-table';

export type BillFlowData = {
    vendors: Vendor[];
    vendorCategories: VendorCategory[];
    vendorNatureOfBusiness: VendorNatureOfBusiness[];
    bills: Bill[];
    billTypes: BillType[];
    billCategories: BillCategory[];
    employees: Employee[];
    sections: Section[];
    billItemMasters: BillItemMaster[];
};

type BillFlowDataContextType = {
    data: BillFlowData;
    isLoading: boolean;
};

const BillFlowContext = createContext<BillFlowDataContextType | undefined>(undefined);

export function BillFlowProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();

    const { data: vendors, isLoading: l1 } = useCollection<Vendor>(useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]));
    const { data: vendorCategories, isLoading: l2 } = useCollection<VendorCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorCategories') : null, [firestore]));
    const { data: vendorNatureOfBusiness, isLoading: l3 } = useCollection<VendorNatureOfBusiness>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorNatureOfBusiness') : null, [firestore]));
    const { data: bills, isLoading: l4 } = useCollection<Bill>(useMemoFirebase(() => firestore ? collection(firestore, 'bills') : null, [firestore]));
    const { data: billTypes, isLoading: l5 } = useCollection<BillType>(useMemoFirebase(() => firestore ? collection(firestore, 'billTypes') : null, [firestore]));
    const { data: billCategories, isLoading: l6 } = useCollection<BillCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'billCategories') : null, [firestore]));
    const { data: employees, isLoading: l7 } = useCollection<Employee>(useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]));
    const { data: sections, isLoading: l8 } = useCollection<Section>(useMemoFirebase(() => firestore ? collection(firestore, 'sections') : null, [firestore]));
    const { data: billItemMasters, isLoading: l9 } = useCollection<BillItemMaster>(useMemoFirebase(() => firestore ? collection(firestore, 'billItemMasters') : null, [firestore]));
    
    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9;

    const data = useMemo(() => ({
        vendors: vendors || [],
        vendorCategories: vendorCategories || [],
        vendorNatureOfBusiness: vendorNatureOfBusiness || [],
        bills: bills || [],
        billTypes: billTypes || [],
        billCategories: billCategories || [],
        employees: employees || [],
        sections: sections || [],
        billItemMasters: billItemMasters || [],
    }), [vendors, vendorCategories, vendorNatureOfBusiness, bills, billTypes, billCategories, employees, sections, billItemMasters]);

    const value = useMemo(() => ({
        data,
        isLoading,
    }), [data, isLoading]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Loading BillFlow Data...</p>
            </div>
        );
    }

    return (
        <BillFlowContext.Provider value={value}>
            {children}
        </BillFlowContext.Provider>
    );
}

export function useBillFlow() {
    const context = useContext(BillFlowContext);
    if (!context) {
        throw new Error('useBillFlow must be used within a BillFlowProvider');
    }
    return { data: context.data, isLoading: context.isLoading };
}
