
"use client";

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

// This is a helper function to check if the code is running in a browser
const isBrowser = typeof window !== 'undefined';

// A more robust useLocalStorage hook that correctly saves data on change
// and syncs across tabs.

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
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

  // useEffect to update local storage when the state changes
  // This is the critical part that was flawed before.
  useEffect(() => {
    if (!isBrowser) {
      return;
    }
    try {
      // Save state to local storage on change
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]); // <-- The correct dependency array ensures this runs on every change.

  // This effect handles changes from other tabs
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
