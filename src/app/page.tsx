
'use client';

import React from 'react';
import { AppWrapper } from './app-wrapper';

export default function Home() {
  // The AppWrapper is now the single entry point that handles auth state.
  return <AppWrapper />;
}
