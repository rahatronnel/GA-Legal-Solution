'use client';

import React from 'react';
import { useUser } from '@/firebase';
import LoginPage from '@/app/login/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { coreModules, utilityModules } from '@/lib/modules';
import { ChangePasswordDialog } from '@/components/change-password-dialog';

const ModuleCard = ({ name, href, icon: Icon }: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }) => (
  <Link href={href} className="block hover:scale-105 transition-transform duration-200">
    <Card className="h-full bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-lg flex flex-col items-center justify-center p-6 text-center">
      <Icon className="h-10 w-10 mb-3 text-cyan-300" />
      <h3 className="font-semibold">{name}</h3>
    </Card>
  </Link>
);

function ModuleDashboard() {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Application Modules</h1>
        <ChangePasswordDialog>
            <Button variant="outline">Change Password</Button>
        </ChangePasswordDialog>
      </div>
      
      <h2 className="text-lg font-semibold text-cyan-300/80 mb-3">Core Modules</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {coreModules.map(module => <ModuleCard key={module.name} {...module} />)}
      </div>

      <h2 className="text-lg font-semibold text-cyan-300/80 mt-8 mb-3">Utilities</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {utilityModules.map(module => <ModuleCard key={module.name} {...module} />)}
      </div>

       <div className="text-center text-xs text-white/40 mt-20 pb-6">
        © 2024 GA & Legal Solution
      </div>
    </div>
  );
}


export function AppWrapper() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    // Show a loading state while Firebase is determining the auth state.
    // This is crucial to prevent rendering protected content or the login page prematurely.
    return (
      <div className="relative min-h-screen w-full bg-[#0b0e13] text-white overflow-hidden flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#0b0e13] text-white overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 -z-10">
            <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] bg-cyan-400/20 rounded-full blur-[160px]" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] bg-indigo-500/20 rounded-full blur-[160px]" />
        </div>

        {user ? <ModuleDashboard /> : <LoginPage />}
    </div>
  );
}
