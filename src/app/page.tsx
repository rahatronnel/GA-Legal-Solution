
'use client';

import React from 'react';
import { AppWrapper } from './app-wrapper';
import { FirebaseClientProvider } from '@/firebase';

export default function Home() {
  // The AppWrapper is now the single entry point that handles auth state.
  return (
    <FirebaseClientProvider>
        <AppWrapper />
    </FirebaseClientProvider>
  );
}
