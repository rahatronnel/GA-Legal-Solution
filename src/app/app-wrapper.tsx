
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export function AppWrapper() {
  const pathname = usePathname() || '/';

  // Find the component that matches the current path.
  // We need to handle the base path and dynamic module paths.
  let CurrentModuleComponent = null;

  if (pathname === '/') {
       return (
           <Card>
            <CardHeader>
              <CardTitle>Welcome to GA & Legal Solution</CardTitle>
              <CardDescription>
                This is your internal documentation software. Select a module from the sidebar to get started.
              </CardDescription>
            </CardHeader>
          </Card>
       );
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
