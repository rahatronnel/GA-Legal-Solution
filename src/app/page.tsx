
'use client';

import React from 'react';
import { useUser } from '@/firebase';
import LoginPage from './login/page';
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
        <main className="flex-1">
          <AppWrapper />
        </main>
    </div>
  );
}
