
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, LogOut, User as UserIcon, Settings, Users } from 'lucide-react';
import { coreModules, utilityModules } from '@/lib/modules';
import { useAuth, useUser } from '@/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import dynamic from 'next/dynamic';
import { ChangePasswordDialog } from '@/app/components/change-password-dialog';
import LoginPage from './login/page';

const VehicleManagementPage = dynamic(() => import('./vehicle-management/page'));
const UserManagementPage = dynamic(() => import('./user-management/page'));
const SettingsPage = dynamic(() => import('./settings/page'));
const BillFlowPage = dynamic(() => import('./billflow/page'));
const BillPage = dynamic(() => import('./billflow/bills/[id]/page'));
const VendorPage = dynamic(() => import('./billflow/vendors/[id]/page'));
const DriverProfilePage = dynamic(() => import('./vehicle-management/drivers/[id]/page'));
const VehicleProfilePage = dynamic(() => import('./vehicle-management/vehicles/[id]/page'));
const TripProfilePage = dynamic(() => import('./vehicle-management/trips/[id]/page'));
const MaintenanceProfilePage = dynamic(() => import('./vehicle-management/maintenance/[id]/page'));
const AccidentProfilePage = dynamic(() => import('./vehicle-management/accidents/[id]/page'));
const EmployeeProfilePage = dynamic(() => import('./user-management/employees/[id]/page'));


const moduleComponents: { [key:string]: React.ComponentType } = {
    '/vehicle-management': VehicleManagementPage,
    '/user-management': UserManagementPage,
    '/settings': SettingsPage,
    '/billflow': BillFlowPage,
    '/billflow/bills/[id]': BillPage,
    '/billflow/vendors/[id]': VendorPage,
    '/vehicle-management/drivers/[id]': DriverProfilePage,
    '/vehicle-management/vehicles/[id]': VehicleProfilePage,
    '/vehicle-management/trips/[id]': TripProfilePage,
    '/vehicle-management/maintenance/[id]': MaintenanceProfilePage,
    '/vehicle-management/accidents/[id]': AccidentProfilePage,
    '/user-management/employees/[id]': EmployeeProfilePage,
};

const ModuleDashboard = () => {    
    const auth = useAuth();

    return (
        <div className="dark w-full min-h-screen flex flex-col items-center justify-center p-4 relative bg-background">
             <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center w-full">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search modules..."
                        className="w-full rounded-lg bg-background pl-8 text-white"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-white" asChild>
                        <Link href="/user-management"><Users /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white" asChild>
                        <Link href="/settings"><Settings /></Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="overflow-hidden rounded-full h-9 w-9 bg-white text-black hover:bg-gray-200"
                        >
                          <UserIcon className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <ChangePasswordDialog>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                My Account
                            </DropdownMenuItem>
                        </ChangePasswordDialog>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                           <AlertDialogTrigger asChild>
                               <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Logout</span>
                               </DropdownMenuItem>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                               <AlertDialogHeader>
                               <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                               <AlertDialogDescription>
                                   You will be returned to the login page.
                               </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction onClick={() => auth.signOut()} className="bg-destructive hover:bg-destructive/90">Logout</AlertDialogAction>
                               </AlertDialogFooter>
                           </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <div className="text-center mb-12">
                 <h1 className="text-5xl font-extrabold tracking-tight text-white">GA & Legal Solution</h1>
                 <p className="text-muted-foreground mt-2">Select a module to begin your journey.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-4xl">
                {coreModules.map((mod) => (
                    <Link href={mod.href} key={mod.href}>
                        <Card className="h-full flex flex-col items-center justify-center text-center p-4 transition-all hover:shadow-lg hover:scale-110">
                            <mod.icon className="h-12 w-12 text-primary mb-3" />
                            <p className="font-semibold text-sm">{mod.name}</p>
                        </Card>
                    </Link>
                ))}
            </div>
             <footer className="absolute bottom-4 text-xs text-muted-foreground">
                developed and maintain by "A Dedicated Team"
            </footer>
        </div>
    );
};


export function AppWrapper() {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname() || '/';

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const findMatchingKey = (path: string) => {
    // Exact match first
    if (moduleComponents[path]) return path;
    // Dynamic match for paths like /billflow/bills/some-id
    const dynamicKey = Object.keys(moduleComponents).find(key => {
        if (!key.includes('[')) return false;
        const regex = new RegExp(`^${key.replace(/\[\.\.\..*\]/,'.*').replace(/\[(.*?)\]/g, '([^/]+)')}$`);
        return regex.test(path);
    });
    return dynamicKey;
  }
  
  const currentKey = findMatchingKey(pathname);

  if (currentKey && moduleComponents[currentKey]) {
    const Component = moduleComponents[currentKey];
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <div className="flex flex-col sm:gap-4 sm:py-4">
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Component />
          </main>
        </div>
      </div>
    );
  }

  // Fallback to the dashboard if no specific module matches
  return <ModuleDashboard />;
}
