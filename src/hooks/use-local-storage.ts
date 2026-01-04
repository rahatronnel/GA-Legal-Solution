"use client";

import { useState, useEffect, useCallback } from 'react';

// This is a helper function to check if the code is running in a browser
const isBrowser = typeof window !== 'undefined';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Use a state to store the value, initializing it from localStorage if available
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isBrowser) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  // This effect runs whenever the key or storedValue changes, updating localStorage
  useEffect(() => {
    if (!isBrowser) {
        return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);
  
  // This effect listens for changes in other tabs
  useEffect(() => {
    if (!isBrowser) {
        return;
    }
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
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
