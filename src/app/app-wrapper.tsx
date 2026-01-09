
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { usePathname } from 'next/navigation';
import { coreModules, utilityModules } from '@/lib/modules';
import VehicleManagementPage from './vehicle-management/page';
import UserManagementPage from './user-management/page';
import SettingsPage from './settings/page';
import BillFlowPage from './billflow/page';

// This map is simplified. In a real app, you might use dynamic imports
// or a more sophisticated routing system if the number of modules grows.
const moduleComponents: { [key: string]: React.ComponentType } = {
    '/vehicle-management': VehicleManagementPage,
    '/user-management': UserManagementPage,
    '/settings': SettingsPage,
    '/billflow': BillFlowPage,
    // Add other top-level module pages here
};

const ModuleDashboard = () => (
    <div className="w-full">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold">GA & Legal Solution Modules</h1>
            <div className="flex items-center gap-2">
                {utilityModules.map((mod) => (
                    <Link
                        href={mod.href}
                        key={mod.href}
                        className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        <mod.icon className="h-6 w-6" />
                        <span className="sr-only">{mod.name}</span>
                    </Link>
                ))}
            </div>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {coreModules.map((mod) => (
                <Link href={mod.href} key={mod.href}>
                    <Card className="h-full flex flex-col items-center justify-center text-center p-4 transition-all hover:shadow-lg hover:scale-105">
                        <mod.icon className="h-12 w-12 text-primary mb-3" />
                        <p className="font-semibold text-sm">{mod.name}</p>
                    </Card>
                </Link>
            ))}
        </div>
    </div>
);


export function AppWrapper() {
  const pathname = usePathname() || '/';

  // Find the component that matches the current path.
  // We need to handle the base path and dynamic module paths.
  let CurrentModuleComponent = null;

  if (pathname === '/') {
       return <ModuleDashboard />;
  }

  // Check for top-level modules first.
  if (moduleComponents[pathname]) {
      CurrentModuleComponent = moduleComponents[pathname];
  } else {
      // This is a simplified check for dynamic /[module]/[subpath] pages.
      // We render the base component for the entire module.
      const moduleKey = `/${pathname.split('/')[1]}`;
       if (moduleComponents[moduleKey]) {
          CurrentModuleComponent = moduleComponents[moduleKey];
       }
  }


  if (CurrentModuleComponent) {
    return <CurrentModuleComponent />;
  }

  // Fallback for pages that don't have a specific component mapped,
  // but might still be valid routes.
  const allModules = [...coreModules, ...utilityModules];
  const currentModuleInfo = allModules.find(mod => pathname.startsWith(mod.href));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentModuleInfo?.name || 'Page Not Found'}</CardTitle>
        <CardDescription>
          {currentModuleInfo 
            ? `This is the page for the ${currentModuleInfo.name} module. You can start building its specific functionality here.`
            : 'The page you are looking for does not have a component defined in the AppWrapper.'
          }
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
