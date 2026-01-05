
"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// This is a helper function to check if the code is running in a browser
const isBrowser = typeof window !== 'undefined';

// This hook has been completely rewritten to be robust and reliable.
// It now correctly persists state changes to localStorage and syncs across tabs.

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // State to store our value
  // Pass an inline function to useState so logic is only executed once on the client
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isBrowser) {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  // useEffect to update local storage when the state changes.
  // The dependency array [key, storedValue] is CRITICAL.
  // It ensures that this effect runs every time the key or the storedValue changes.
  useEffect(() => {
    if (!isBrowser) {
      return;
    }
    try {
      // Save state to local storage
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error writing to localStorage for key “${key}”:`, error);
    }
  }, [key, storedValue]);

  // This effect listens for changes from other tabs.
  useEffect(() => {
    if (!isBrowser) {
        return;
    }
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
            setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
            console.error(`Error parsing storage change for key “${key}”:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setStoredValue];
}
