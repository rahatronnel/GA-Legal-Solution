'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Search, LogOut, User as UserIcon, Settings, Users } from 'lucide-react';
import { coreModules, majorModules } from '@/lib/modules';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import dynamic from 'next/dynamic';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import LoginPage from './login/page';
import { collection, doc, query, where, limit } from 'firebase/firestore';
import type { Employee } from './user-management/components/employee-entry-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { OrganizationSettings } from './settings/page';


const moduleComponents: { [key:string]: React.ComponentType } = {
    '/vehicle-management': dynamic(() => import('./vehicle-management/page'), { ssr: false }),
    '/user-management': dynamic(() => import('./user-management/page'), { ssr: false }),
    '/settings': dynamic(() => import('./settings/page'), { ssr: false }),
    '/billflow': dynamic(() => import('./billflow/page'), { ssr: false }),
    '/billflow/bills/[id]': dynamic(() => import('./billflow/bills/[id]/page'), { ssr: false }),
    '/billflow/vendors/[id]': dynamic(() => import('./billflow/vendors/[id]/page'), { ssr: false }),
    '/vehicle-management/drivers/[id]': dynamic(() => import('./vehicle-management/drivers/[id]/page'), { ssr: false }),
    '/vehicle-management/vehicles/[id]': dynamic(() => import('./vehicle-management/vehicles/[id]/page'), { ssr: false }),
    '/vehicle-management/trips/[id]': dynamic(() => import('./vehicle-management/trips/[id]/page'), { ssr: false }),
    '/vehicle-management/maintenance/[id]': dynamic(() => import('./vehicle-management/maintenance/[id]/page'), { ssr: false }),
    '/vehicle-management/accidents/[id]': dynamic(() => import('./vehicle-management/accidents/[id]/page'), { ssr: false }),
    '/user-management/employees/[id]': dynamic(() => import('./user-management/employees/[id]/page'), { ssr: false }),
    '/procurement/foreign-purchase': dynamic(() => import('./procurement/foreign-purchase/page'), { ssr: false }),
    '/procurement/local-purchase': dynamic(() => import('./procurement/local-purchase/page'), { ssr: false }),
    '/procurement/local-purchase/demand-notes/[id]': dynamic(() => import('./procurement/local-purchase/demand-notes/[id]/page'), { ssr: false }),
    '/procurement/local-purchase/comparative-statements/[id]': dynamic(() => import('./procurement/local-purchase/comparative-statements/[id]/page'), { ssr: false }),
    '/procurement/local-purchase/purchase-orders/[id]': dynamic(() => import('./procurement/local-purchase/purchase-orders/[id]/page'), { ssr: false }),
    '/procurement/local-purchase/mrrs/[id]': dynamic(() => import('./procurement/local-purchase/mrrs/[id]/page'), { ssr: false }),
};

const ModuleDashboard = ({ orgSettings, currentUserEmployee }: { orgSettings: OrganizationSettings, currentUserEmployee: Employee | null }) => {    
    const auth = useAuth();
    const { user } = useUser();
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    
    const showProcurement = orgSettings?.moduleVisibility?.showProcurementManagement ?? true;
    const showCore = orgSettings?.moduleVisibility?.showCoreModules ?? true;

    return (
        <div className="dark w-full min-h-screen flex flex-col items-center justify-center p-4 relative bg-background">
             <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center w-full z-50">
                <div className="relative w-full max-sm:hidden max-w-xs">
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
                          variant="ghost"
                          size="icon"
                          className="overflow-hidden rounded-full h-9 w-9 border border-white/10"
                        >
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={currentUserEmployee?.profilePicture} alt={currentUserEmployee?.fullName}/>
                                <AvatarFallback className="bg-primary/20 text-white text-xs">{currentUserEmployee?.fullName?.charAt(0) || <UserIcon className="h-4 w-4" />}</AvatarFallback>
                            </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 mt-2 animate-scale-in" sideOffset={8}>
                        <DropdownMenuLabel className="flex flex-col">
                            <span className="font-bold truncate text-sm">{currentUserEmployee?.fullName || user?.email}</span>
                            <span className="text-[10px] text-muted-foreground font-normal truncate">{currentUserEmployee?.email || ''}</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <ChangePasswordDialog>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>My Account</span>
                            </DropdownMenuItem>
                        </ChangePasswordDialog>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setIsLogoutDialogOpen(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <div className="text-center mb-12 animate-in fade-in zoom-in duration-700">
                 <h1 className="text-5xl font-extrabold tracking-tight text-white">YKK ERP Solution</h1>
                 <p className="text-muted-foreground mt-2 font-bold uppercase tracking-widest text-xs">Certified Organizational Operating System</p>
            </div>
            <div className="w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {showProcurement && majorModules.map((majorMod) => (
                    <Card key={majorMod.name} className="w-full border-primary/20 shadow-lg bg-secondary/20 backdrop-blur-md">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <majorMod.icon className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black uppercase tracking-tight">{majorMod.name}</CardTitle>
                                    <CardDescription className="font-medium">{majorMod.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {majorMod.subModules.map((subMod) => (
                                    <Link href={subMod.href} key={subMod.href}>
                                        <Card className="h-full flex flex-col items-center justify-center text-center p-6 transition-all hover:shadow-2xl hover:scale-105 hover:bg-primary/10 hover:border-primary/40 group">
                                            <subMod.icon className="h-12 w-12 text-primary mb-3 group-hover:animate-bounce" />
                                            <p className="font-bold text-base uppercase tracking-tighter">{subMod.name}</p>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                
                {showCore && (
                  <>
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-background px-4 py-1 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                                Core Operating Modules
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {coreModules.map((mod) => (
                            <Link href={mod.href} key={mod.href}>
                                <Card className="h-full flex flex-col items-center justify-center text-center p-4 transition-all hover:shadow-xl hover:scale-110 hover:bg-white/5 group">
                                    <mod.icon className="h-10 w-10 text-primary/70 mb-3 group-hover:text-primary transition-colors" />
                                    <p className="font-bold text-xs uppercase tracking-tighter">{mod.name}</p>
                                </Card>
                            </Link>
                        ))}
                    </div>
                  </>
                )}
            </div>
             <footer className="absolute bottom-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
                © 2024 YKK ERP Solution • Secure Environment
            </footer>

            <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
               <AlertDialogContent className="animate-dialog-in">
                   <AlertDialogHeader>
                   <AlertDialogTitle>Terminate Session?</AlertDialogTitle>
                   <AlertDialogDescription>
                       You are about to log out of the YKK ERP secure session.
                   </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                   <AlertDialogAction onClick={() => { auth.signOut(); setIsLogoutDialogOpen(false); }} className="bg-destructive hover:bg-destructive/90">Confirm Logout</AlertDialogAction>
                   </AlertDialogFooter>
               </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};


export function AppWrapper() {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname() || '/';

  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'organization') : null, [firestore]);
  const { data: orgSettings, isLoading: isLoadingSettings } = useDoc<OrganizationSettings>(settingsDocRef);

  const userEmployeeQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email || user.email === 'superadmin@galsolution.com') return null;
    return query(collection(firestore, 'employees'), where('email', '==', user.email), limit(1));
  }, [firestore, user?.email]);
  
  const { data: userEmployeeData, isLoading: isLoadingUserEmployee } = useCollection<Employee>(userEmployeeQuery);
  const currentUserEmployee = userEmployeeData?.[0] || null;

  useEffect(() => {
    if (orgSettings?.favicon) {
      const link: HTMLLinkElement = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.rel = 'icon';
      link.href = orgSettings.favicon;
      const mimeType = orgSettings.favicon.match(/data:(image\/[^;]+);/);
      if (mimeType && mimeType[1]) {
        link.type = mimeType[1];
      }
      document.head.appendChild(link);
    }
  }, [orgSettings]);

  const isSuperAdmin = user?.email === 'superadmin@galsolution.com';
  const isHydratingData = isLoadingSettings || (!isSuperAdmin && isLoadingUserEmployee) || !orgSettings || !orgSettings.moduleVisibility;

  if (isUserLoading || (user && isHydratingData)) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background gap-4">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-black text-xs uppercase tracking-widest text-muted-foreground animate-pulse tracking-tighter">Establishing Secure Organizational Handshake...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const findMatchingKey = (path: string) => {
    if (moduleComponents[path]) return path;
    const dynamicKey = Object.keys(moduleComponents).find(key => {
        if (!key.includes('[')) return false;
        const regex = new RegExp(`^${key.replace(/\[\.\.\..*\]/,'.*').replace(/\[(.*?)\]/g, '([^/]+)')}$`);
        return regex.test(path);
    });
    return dynamicKey;
  }
  
  const currentKey = findMatchingKey(pathname);
  const Component = currentKey ? moduleComponents[currentKey] : null;

  if (Component) {
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

  return <ModuleDashboard orgSettings={orgSettings!} currentUserEmployee={currentUserEmployee} />;
}