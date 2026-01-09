'use client';

import React from 'react';
import { useUser } from '@/firebase';
import LoginPage from './login/page';
import { AppWrapper } from './app-wrapper';

export default function Home() {
  const { user, isUserLoading } = useUser();

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

  // The AppWrapper is now only rendered if a user is successfully authenticated.
  return (
    <div className="flex min-h-screen w-full flex-col">
        <main className="flex-1">
          <AppWrapper />
        </main>
    </div>
  );
}
