
"use client";

import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

// Custom hook to manage data in localStorage.
// It synchronizes state with localStorage and across tabs.
export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Dispatch a storage event to sync other tabs
        window.dispatchEvent(new StorageEvent('storage', { key }));
      }
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);


  // useEffect to listen for changes in other tabs
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      // Only update if the key matches and the event is from another tab
      if (event.key === key) {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
          console.error(`Error parsing new value for localStorage key "${key}":`, error);
        }
      }
    };

    // Add event listener
    window.addEventListener('storage', handleStorageChange);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);


  return [storedValue, setValue];
}
