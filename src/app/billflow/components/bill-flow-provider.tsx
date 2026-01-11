
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
import type { Designation } from '@/app/user-management/components/designation-table';

const MasterDataContext = createContext<{
    billItemMasters: BillItemMaster[];
    billItemCategories: BillItemCategory[];
    vendorCategories: VendorCategory[];
    vendorNatureOfBusiness: VendorNatureOfBusiness[];
    billTypes: BillType[];
    billCategories: BillCategory[];
    isLoading: boolean;
} | undefined>(undefined);


export const MasterDataProvider = ({ children }: { children: React.ReactNode }) => {
    const firestore = useFirestore();
    const { data: billItemMasters, isLoading: l1 } = useCollection<BillItemMaster>(useMemoFirebase(() => firestore ? collection(firestore, 'billItemMasters') : null, [firestore]));
    const { data: billItemCategories, isLoading: l2 } = useCollection<BillItemCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'billItemCategories') : null, [firestore]));
    const { data: vendorCategories, isLoading: l3 } = useCollection<VendorCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorCategories') : null, [firestore]));
    const { data: vendorNatureOfBusiness, isLoading: l4 } = useCollection<VendorNatureOfBusiness>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorNatureOfBusiness') : null, [firestore]));
    const { data: billTypes, isLoading: l5 } = useCollection<BillType>(useMemoFirebase(() => firestore ? collection(firestore, 'billTypes') : null, [firestore]));
    const { data: billCategories, isLoading: l6 } = useCollection<BillCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'billCategories') : null, [firestore]));
    
    const value = useMemo(() => ({
        billItemMasters: billItemMasters || [],
        billItemCategories: billItemCategories || [],
        vendorCategories: vendorCategories || [],
        vendorNatureOfBusiness: vendorNatureOfBusiness || [],
        billTypes: billTypes || [],
        billCategories: billCategories || [],
        isLoading: l1 || l2 || l3 || l4 || l5 || l6,
    }), [billItemMasters, billItemCategories, vendorCategories, vendorNatureOfBusiness, billTypes, billCategories, l1, l2, l3, l4, l5, l6]);
    
    return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>;
}

export const useMasterData = () => {
    const context = useContext(MasterDataContext);
    if (!context) throw new Error('useMasterData must be used within a MasterDataProvider');
    return context;
};

const LegacyBillFlowContext = createContext<{ data: any, isLoading: boolean } | null>(undefined);

export function LegacyBillFlowProvider({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const { data: vendors, isLoading: l1 } = useCollection<Vendor>(useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]));
    const { data: bills, isLoading: l4 } = useCollection<Bill>(useMemoFirebase(() => firestore ? collection(firestore, 'bills') : null, [firestore]));
    const { data: billTypes, isLoading: l5 } = useCollection<BillType>(useMemoFirebase(() => firestore ? collection(firestore, 'billTypes') : null, [firestore]));
    const { data: billCategories, isLoading: l6 } = useCollection<BillCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'billCategories') : null, [firestore]));
    const { data: employees, isLoading: l7 } = useCollection<Employee>(useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]));
    const { data: sections, isLoading: l8 } = useCollection<Section>(useMemoFirebase(() => firestore ? collection(firestore, 'sections') : null, [firestore]));
    const { data: billItemCategories, isLoading: l10 } = useCollection<BillItemCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'billItemCategories') : null, [firestore]));
    const { data: vendorCategories, isLoading: l2 } = useCollection<VendorCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorCategories') : null, [firestore]));
    const { data: vendorNatureOfBusiness, isLoading: l3 } = useCollection<VendorNatureOfBusiness>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorNatureOfBusiness') : null, [firestore]));
    const { data: designations, isLoading: l11 } = useCollection<Designation>(useMemoFirebase(() => firestore ? collection(firestore, 'designations') : null, [firestore]));

    const isLoading = isUserLoading || l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l10 || l11;

    const data = useMemo(() => ({
        vendors: vendors || [],
        bills: bills || [],
        billTypes: billTypes || [],
        billCategories: billCategories || [],
        employees: employees || [],
        sections: sections || [],
        billItemCategories: billItemCategories || [],
        vendorCategories: vendorCategories || [],
        vendorNatureOfBusiness: vendorNatureOfBusiness || [],
        designations: designations || [],
    }), [vendors, bills, billTypes, billCategories, employees, sections, billItemCategories, vendorCategories, vendorNatureOfBusiness, designations]);
    
    const value = useMemo(() => ({ data, isLoading }), [data, isLoading]);
    
    if (isUserLoading) {
        return <div className="flex justify-center items-center h-full"><p>Verifying authentication...</p></div>;
    }
    
    if (!user) {
        return null;
    }
    
    return <LegacyBillFlowContext.Provider value={value}>{children}</LegacyBillFlowContext.Provider>;
}

export const useBillFlow = () => {
    const context = useContext(LegacyBillFlowContext);
    if (!context) {
        if (typeof window === 'undefined') {
            return null; // Prevents build crash on server
        }
        throw new Error('useBillFlow must be used within a LegacyBillFlowProvider');
    }
    return context;
};
