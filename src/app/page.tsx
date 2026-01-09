
'use client';

import React from 'react';
import { useUser } from '@/firebase';
import LoginPage from './login/page';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { AppWrapper } from './app-wrapper';

export default function Home() {
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
  // The AppWrapper will now render the page content for the current route.
  return (
    <div className="flex min-h-screen w-full flex-col main-bg">
      <Sidebar />
      <div className="flex flex-col sm:pl-14">
        <main className="flex-1 items-start p-4 sm:px-6">
          <AppWrapper />
        </main>
      </div>
    </div>
  );
}
