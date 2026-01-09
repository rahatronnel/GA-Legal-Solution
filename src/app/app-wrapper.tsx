
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
import { Search, LogOut, User as UserIcon, LayoutGrid, Home } from 'lucide-react';
import { coreModules, utilityModules } from '@/lib/modules';
import { useAuth } from '@/firebase';
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

// Simplified pages for routing
import VehicleManagementPage from './vehicle-management/page';
import UserManagementPage from './user-management/page';
import SettingsPage from './settings/page';
import BillFlowPage from './billflow/page';


const moduleComponents: { [key: string]: React.ComponentType } = {
    '/vehicle-management': VehicleManagementPage,
    '/user-management': UserManagementPage,
    '/settings': SettingsPage,
    '/billflow': BillFlowPage,
};

const AppHeader = () => {
    const auth = useAuth();

    return (
         <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <LayoutGrid className="mr-2 h-5 w-5" />
                            Modules
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {coreModules.map((mod) => (
                            <Link href={mod.href} key={mod.href}>
                                <DropdownMenuItem>
                                    <mod.icon className="mr-2 h-4 w-4" />
                                    <span>{mod.name}</span>
                                </DropdownMenuItem>
                            </Link>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-4">
                 {utilityModules.map((mod) => (
                    <Link href={mod.href} key={mod.href}>
                        <Button variant="ghost" size="icon" title={mod.name}>
                            <mod.icon className="h-5 w-5" />
                            <span className="sr-only">{mod.name}</span>
                        </Button>
                    </Link>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="overflow-hidden rounded-full"
                    >
                      <UserIcon className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>My Account</DropdownMenuItem>
                    <DropdownMenuSeparator/>
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
    )
}

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
                        className="w-full rounded-lg bg-background pl-8"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {utilityModules.map((mod) => (
                        <Link
                            href={mod.href}
                            key={mod.href}
                            className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title={mod.name}
                        >
                            <mod.icon className="h-6 w-6" />
                            <span className="sr-only">{mod.name}</span>
                        </Link>
                    ))}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="overflow-hidden rounded-full h-9 w-9"
                        >
                          <UserIcon className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>My Account</DropdownMenuItem>
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
                 <h1 className="text-4xl font-bold tracking-tight">Enterprise Resource Planning</h1>
                 <p className="text-muted-foreground">Select a module to begin your journey.</p>
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
        </div>
    );
};


export function AppWrapper() {
  const pathname = usePathname() || '/';

  // Find the component that matches the start of the path
  const CurrentModuleComponentKey = Object.keys(moduleComponents).find(key => pathname.startsWith(key));
  
  if (CurrentModuleComponentKey && moduleComponents[CurrentModuleComponentKey]) {
    const Component = moduleComponents[CurrentModuleComponentKey];
    return (
        <div className="flex min-h-screen w-full flex-col">
          <AppHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Component />
          </main>
        </div>
    );
  }

  // Fallback to the dashboard if no specific module matches
  return <ModuleDashboard />;
}
