
'use client';

import React from 'react';
import { useUser } from '@/firebase';
import LoginPage from './login/page';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // This is the main layout for an authenticated user.
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
           <Card>
            <CardHeader>
              <CardTitle>Welcome to GA & Legal Solution</CardTitle>
              <CardDescription>
                This is your internal documentation software. Select a module from the sidebar to get started.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    </div>
  );
}
