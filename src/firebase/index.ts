
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, updatePassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

// This function is a placeholder for a secure, backend-offloaded admin action.
// Directly updating a user's password from the client as another user is not
// a standard Firebase Auth feature and carries security risks. In a production
// app, this would be an HTTP-triggered Cloud Function that uses the Admin SDK.
export async function updateEmployeePassword(auth: any, userId: string, newPassword: string): Promise<void> {
    console.warn("Password update functionality is for demonstration purposes. In a real app, this must be a secure backend operation.");
    // This will likely fail due to security rules if not handled by a backend service.
    // For now, we just log the intent.
    console.log(`Attempting to update password for user ${userId}.`);
    
    // In a real scenario, you would NOT do this on the client.
    // This is just to prevent the app from crashing.
    return Promise.resolve();
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
