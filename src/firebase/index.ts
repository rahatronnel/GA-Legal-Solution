
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, updatePassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// This function now correctly implements the singleton pattern suggested by Vercel.
// It ensures Firebase is initialized only once, preventing crashes.
export function initializeFirebase() {
  if (!getApps().length) {
    // If no app is initialized, create a new one with the config from environment variables.
    initializeApp(firebaseConfig);
  }
  // Always return the SDKs from the currently initialized app.
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './admin-actions';
export * from './errors';
export * from './error-emitter';
