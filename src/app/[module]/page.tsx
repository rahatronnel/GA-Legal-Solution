
'use client';

import { notFound, usePathname } from 'next/navigation';
import VehicleManagementPage from "@/app/vehicle-management/page";
import UserManagementPage from "@/app/user-management/page";
import SettingsPage from "@/app/settings/page";
import BillFlowPage from "@/app/billflow/page";

// A map to render specific components for each module
const moduleComponents: { [key: string]: React.ComponentType } = {
    'vehicle-management': VehicleManagementPage,
    'user-management': UserManagementPage,
    'settings': SettingsPage,
    'billflow': BillFlowPage,
    // Add other modules here as they are created
};


export default function ModulePage({ params }: { params: { module: string } }) {
    const ModuleComponent = moduleComponents[params.module];

    if (!ModuleComponent) {
        notFound();
    }

    // Since the root layout now handles auth, we can just render the component.
    return <ModuleComponent />;
}
