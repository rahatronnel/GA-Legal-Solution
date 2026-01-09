
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
        <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 relative">
             <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center w-full">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search modules..."
                        className="w-full rounded-lg bg-card/80 pl-8 backdrop-blur-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {utilityModules.map((mod) => (
                        <Link
                            href={mod.href}
                            key={mod.href}
                            className="p-2 rounded-full text-muted-foreground hover:bg-card/80 hover:text-accent-foreground transition-colors"
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
                          className="overflow-hidden rounded-full h-9 w-9 bg-card/80"
                        >
                          <UserIcon className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>My Account</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => auth.signOut()}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <div className="absolute inset-0 -z-10 h-full w-full bg-background">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
            </div>

            <div className="text-center mb-12">
                 <h1 className="text-4xl font-bold tracking-tight">GA & Legal Solution</h1>
                 <p className="text-muted-foreground">Select a module to begin</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-4xl">
                {coreModules.map((mod) => (
                    <Link href={mod.href} key={mod.href}>
                        <Card className="h-full flex flex-col items-center justify-center text-center p-4 transition-all hover:shadow-lg hover:scale-110 hover:shadow-primary/20 bg-card/80 backdrop-blur-sm">
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

  if (pathname === '/') {
       return <ModuleDashboard />;
  }

  const CurrentModuleComponent = Object.keys(moduleComponents).find(key => pathname.startsWith(key));
  
  if (CurrentModuleComponent && moduleComponents[CurrentModuleComponent]) {
    const Component = moduleComponents[CurrentModuleComponent];
    return <Component />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Not Found</CardTitle>
        <CardDescription>
            The page you are looking for does not have a component defined in the AppWrapper.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
