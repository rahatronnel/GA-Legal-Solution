
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
import { Search, LogOut, User as UserIcon } from 'lucide-react';
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

const ModuleDashboard = () => {
    const auth = useAuth();
    
    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 relative bg-[#0a0a0a] text-white">
             <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center w-full">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        type="search"
                        placeholder="Search modules..."
                        className="w-full rounded-lg bg-gray-800/80 border-gray-700 text-white pl-8 backdrop-blur-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {utilityModules.map((mod) => (
                        <Link
                            href={mod.href}
                            key={mod.href}
                            className="p-2 rounded-full text-gray-400 hover:bg-gray-800/80 hover:text-white transition-colors"
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
                          className="overflow-hidden rounded-full h-9 w-9 bg-gray-800/80 border-gray-700 hover:bg-gray-700"
                        >
                          <UserIcon className="h-5 w-5 text-gray-300" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 text-white">
                        <DropdownMenuItem className="hover:bg-gray-800">My Account</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700"/>
                        <AlertDialog>
                           <AlertDialogTrigger asChild>
                               <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-400 hover:bg-red-900/50">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Logout</span>
                               </DropdownMenuItem>
                           </AlertDialogTrigger>
                           <AlertDialogContent className="bg-gray-950 border-gray-800 text-white">
                               <AlertDialogHeader>
                               <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                               <AlertDialogDescription className="text-gray-400">
                                   You will be returned to the login page.
                               </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                               <AlertDialogCancel className="bg-gray-800 border-gray-700 hover:bg-gray-700">Cancel</AlertDialogCancel>
                               <AlertDialogAction onClick={() => auth.signOut()} className="bg-red-600 hover:bg-red-700">Logout</AlertDialogAction>
                               </AlertDialogFooter>
                           </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <div className="absolute inset-0 -z-10 h-full w-full bg-[#0a0a0a]">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
            </div>

            <div className="text-center mb-12">
                 <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">Enterprise Resource Planning</h1>
                 <p className="text-gray-400">Select a module to begin your journey.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-4xl">
                {coreModules.map((mod) => (
                    <Link href={mod.href} key={mod.href}>
                        <Card className="h-full flex flex-col items-center justify-center text-center p-4 transition-all hover:shadow-lg hover:scale-110 hover:shadow-cyan-500/20 bg-gray-900/60 border-gray-800 backdrop-blur-sm">
                            <mod.icon className="h-12 w-12 text-cyan-400 mb-3" />
                            <p className="font-semibold text-sm text-gray-200">{mod.name}</p>
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
    return <div className="p-4 sm:px-6 sm:py-0"><Component /></div>;
  }

  // Fallback to the dashboard if no specific module matches
  return <ModuleDashboard />;
}
