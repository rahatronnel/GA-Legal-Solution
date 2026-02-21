
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
import type { BillItemCategory } from '@/app/billflow/components/bill-item-category-table';
import type { Vendor } from '@/app/billflow/components/vendor-entry-form';
import type { VendorCategory } from '@/app/billflow/components/vendor-category-table';
import type { VendorNatureOfBusiness } from '@/app/billflow/components/vendor-nature-of-business-table';
import type { ComparativeStatement } from './cs-entry-form';
import type { DeliveryPlace } from './delivery-place-table';
import type { Designation } from '@/app/user-management/components/designation-table';
import type { PurchaseOrder } from './po-entry-form';
import type { MRR } from './mrr-entry-form';
import type { Department } from '@/app/user-management/components/department-table';

const ProcurementContext = createContext<{
    employees: Employee[];
    sections: Section[];
    departments: Department[];
    orgSettings: OrganizationSettings | null;
    billItemMasters: BillItemMaster[];
    billItemCategories: BillItemCategory[];
    demandNotes: DemandNote[];
    processCodes: ProcessCode[];
    demandTypes: DemandType[];
    vendors: Vendor[];
    vendorCategories: VendorCategory[];
    vendorNatureOfBusiness: VendorNatureOfBusiness[];
    comparativeStatements: ComparativeStatement[];
    deliveryPlaces: DeliveryPlace[];
    designations: Designation[];
    purchaseOrders: PurchaseOrder[];
    mrrs: MRR[];
    isLoading: boolean;
} | undefined>(undefined);

export function ProcurementProvider({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();

    const { data: employees, isLoading: l1 } = useCollection<Employee>(useMemoFirebase(() => firestore ? collection(firestore, 'employees') : null, [firestore]));
    const { data: sections, isLoading: l2 } = useCollection<Section>(useMemoFirebase(() => firestore ? collection(firestore, 'sections') : null, [firestore]));
    const { data: orgSettings, isLoading: l3 } = useDoc<OrganizationSettings>(useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]));
    const { data: billItemMasters, isLoading: l4 } = useCollection<BillItemMaster>(useMemoFirebase(() => firestore ? collection(firestore, 'billItemMasters') : null, [firestore]));
    const { data: billItemCategories, isLoading: l5 } = useCollection<BillItemCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'billItemCategories') : null, [firestore]));
    const { data: demandNotes, isLoading: l6 } = useCollection<DemandNote>(useMemoFirebase(() => firestore ? collection(firestore, 'demandNotes') : null, [firestore]));
    const { data: processCodes, isLoading: l7 } = useCollection<ProcessCode>(useMemoFirebase(() => firestore ? collection(firestore, 'processCodes') : null, [firestore]));
    const { data: demandTypes, isLoading: l8 } = useCollection<DemandType>(useMemoFirebase(() => firestore ? collection(firestore, 'demandTypes') : null, [firestore]));
    const { data: vendors, isLoading: l9 } = useCollection<Vendor>(useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]));
    const { data: vendorCategories, isLoading: l10 } = useCollection<VendorCategory>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorCategories') : null, [firestore]));
    const { data: vendorNatureOfBusiness, isLoading: l11 } = useCollection<VendorNatureOfBusiness>(useMemoFirebase(() => firestore ? collection(firestore, 'vendorNatureOfBusiness') : null, [firestore]));
    const { data: comparativeStatements, isLoading: l12 } = useCollection<ComparativeStatement>(useMemoFirebase(() => firestore ? collection(firestore, 'comparativeStatements') : null, [firestore]));
    const { data: deliveryPlaces, isLoading: l13 } = useCollection<DeliveryPlace>(useMemoFirebase(() => firestore ? collection(firestore, 'deliveryPlaces') : null, [firestore]));
    const { data: designations, isLoading: l14 } = useCollection<Designation>(useMemoFirebase(() => firestore ? collection(firestore, 'designations') : null, [firestore]));
    const { data: purchaseOrders, isLoading: l15 } = useCollection<PurchaseOrder>(useMemoFirebase(() => firestore ? collection(firestore, 'purchaseOrders') : null, [firestore]));
    const { data: mrrs, isLoading: l16 } = useCollection<MRR>(useMemoFirebase(() => firestore ? collection(firestore, 'mrrs') : null, [firestore]));
    const { data: departments, isLoading: l17 } = useCollection<Department>(useMemoFirebase(() => firestore ? collection(firestore, 'departments') : null, [firestore]));

    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13 || l14 || l15 || l16 || l17;

    const value = useMemo(() => ({
        employees: employees || [],
        sections: sections || [],
        departments: departments || [],
        orgSettings: orgSettings || null,
        billItemMasters: billItemMasters || [],
        billItemCategories: billItemCategories || [],
        demandNotes: demandNotes || [],
        processCodes: processCodes || [],
        demandTypes: demandTypes || [],
        vendors: vendors || [],
        vendorCategories: vendorCategories || [],
        vendorNatureOfBusiness: vendorNatureOfBusiness || [],
        comparativeStatements: comparativeStatements || [],
        deliveryPlaces: deliveryPlaces || [],
        designations: designations || [],
        purchaseOrders: purchaseOrders || [],
        mrrs: mrrs || [],
        isLoading,
    }), [employees, sections, departments, orgSettings, billItemMasters, billItemCategories, demandNotes, processCodes, demandTypes, vendors, vendorCategories, vendorNatureOfBusiness, comparativeStatements, deliveryPlaces, designations, purchaseOrders, mrrs, isLoading]);

    return <ProcurementContext.Provider value={value}>{children}</ProcurementContext.Provider>;
}

export function useProcurement() {
    const context = useContext(ProcurementContext);
    if (!context) {
        if (typeof window === 'undefined') {
            return {
                employees: [],
                sections: [],
                departments: [],
                orgSettings: null,
                billItemMasters: [],
                billItemCategories: [],
                demandNotes: [],
                processCodes: [],
                demandTypes: [],
                vendors: [],
                vendorCategories: [],
                vendorNatureOfBusiness: [],
                comparativeStatements: [],
                deliveryPlaces: [],
                designations: [],
                purchaseOrders: [],
                mrrs: [],
                isLoading: true
            }
        }
        throw new Error('useProcurement must be used within a ProcurementProvider');
    }
    return context;
}
