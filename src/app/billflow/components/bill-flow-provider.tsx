
"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
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
import type { BillItemCategory } from './bill-item-category-table';

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
    billItemCategories: BillItemCategory[];
};

type BillFlowDataContextType = {
    data: BillFlowData;
    isLoading: boolean;
};

const BillFlowContext = createContext<BillFlowDataContextType | undefined>(undefined);

const BillFlowDataContent = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();

    const { data: vendors, isLoading: l1 } = useCollection<Vendor>(useMemoFirebase(() => collection(firestore, 'vendors'), [firestore]));
    const { data: vendorCategories, isLoading: l2 } = useCollection<VendorCategory>(useMemoFirebase(() => collection(firestore, 'vendorCategories'), [firestore]));
    const { data: vendorNatureOfBusiness, isLoading: l3 } = useCollection<VendorNatureOfBusiness>(useMemoFirebase(() => collection(firestore, 'vendorNatureOfBusiness'), [firestore]));
    const { data: bills, isLoading: l4 } = useCollection<Bill>(useMemoFirebase(() => collection(firestore, 'bills'), [firestore]));
    const { data: billTypes, isLoading: l5 } = useCollection<BillType>(useMemoFirebase(() => collection(firestore, 'billTypes'), [firestore]));
    const { data: billCategories, isLoading: l6 } = useCollection<BillCategory>(useMemoFirebase(() => collection(firestore, 'billCategories'), [firestore]));
    const { data: employees, isLoading: l7 } = useCollection<Employee>(useMemoFirebase(() => collection(firestore, 'employees'), [firestore]));
    const { data: sections, isLoading: l8 } = useCollection<Section>(useMemoFirebase(() => collection(firestore, 'sections'), [firestore]));
    const { data: billItemMasters, isLoading: l9 } = useCollection<BillItemMaster>(useMemoFirebase(() => collection(firestore, 'billItemMasters'), [firestore]));
    const { data: billItemCategories, isLoading: l10 } = useCollection<BillItemCategory>(useMemoFirebase(() => collection(firestore, 'billItemCategories'), [firestore]));
    
    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10;

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
        billItemCategories: billItemCategories || [],
    }), [vendors, vendorCategories, vendorNatureOfBusiness, bills, billTypes, billCategories, employees, sections, billItemMasters, billItemCategories]);

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
};

export function BillFlowProvider({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Verifying authentication...</p>
            </div>
        );
    }
    
    if (!user) {
        return null;
    }

    return <BillFlowDataContent>{children}</BillFlowDataContent>;
}

export function useBillFlow() {
    const context = useContext(BillFlowContext);
    if (!context) {
        throw new Error('useBillFlow must be used within a BillFlowProvider');
    }
    return { data: context.data, isLoading: context.isLoading };
}
