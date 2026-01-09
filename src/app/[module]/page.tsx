
'use client';

import { AppWrapper } from "@/app/app-wrapper";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { notFound } from 'next/navigation';
import { coreModules, utilityModules } from "@/lib/modules";
import VehicleManagementPage from "@/app/vehicle-management/page";
import UserManagementPage from "@/app/user-management/page";
import SettingsPage from "@/app/settings/page";
import BillFlowPage from "@/app/billflow/page";
import { useUser } from "@/firebase";


// A simple function to capitalize the first letter of a string
function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// A map to render specific components for each module
const moduleComponents: { [key: string]: React.ComponentType } = {
    'vehicle-management': VehicleManagementPage,
    'user-management': UserManagementPage,
    'settings': SettingsPage,
    'billflow': BillFlowPage,
    // Add other modules here as they are created
};


export default function ModulePage({ params }: { params: { module: string } }) {
    const { isUserLoading } = useUser();
    const allModules = [...coreModules, ...utilityModules];
    const currentModule = allModules.find(mod => mod.href === `/${params.module}`);

    if (!currentModule) {
        notFound();
    }

    const ModuleComponent = moduleComponents[params.module];

    // CRITICAL: Do not render the page content (which triggers data fetching)
    // until we know the user's auth state is resolved. This prevents the
    // race condition that causes permission errors.
    if (isUserLoading) {
        return (
            <AppWrapper>
                 <Card>
                    <CardHeader>
                        <CardTitle>Loading Module...</CardTitle>
                        <CardDescription>
                            Please wait while we load the {currentModule.name} module.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </AppWrapper>
        )
    }

    return (
        <AppWrapper>
            {ModuleComponent ? (
                <ModuleComponent />
            ) : (
                 <Card>
                    <CardHeader>
                        <CardTitle>{currentModule.name}</CardTitle>
                        <CardDescription>
                        This is the page for the {currentModule.name} module. You can start building its specific functionality here.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}
        </AppWrapper>
    );
}
