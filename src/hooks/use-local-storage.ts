
"use client";

import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

// This is a helper function to check if the code is running in a browser
const isBrowser = typeof window !== 'undefined';
const DISPATCH_STORAGE_EVENT = 'dispatch_storage';

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

    // The setValue function is now wrapped in useCallback to prevent unnecessary re-renders.
    const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
        if (!isBrowser) {
            console.warn(`Tried to set localStorage key “${key}” even though the code is not running in a browser.`);
            return;
        }

        try {
            // Allow value to be a function so we have the same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            
            // Save state
            setStoredValue(valueToStore);
            
            // Save to local storage
            window.localStorage.setItem(key, JSON.stringify(valueToStore));

            // We dispatch a custom event so every useLocalStorage hook are notified
            window.dispatchEvent(new Event(DISPATCH_STORAGE_EVENT));

        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);

    // This effect listens for changes from other tabs and from the custom event within the same tab.
    useEffect(() => {
        if (!isBrowser) {
            return;
        }
        
        const handleStorageChange = (e: StorageEvent | CustomEvent) => {
          // Check if the event is a StorageEvent and the key matches, or if it's our custom event.
          if ((e instanceof StorageEvent && e.key === key) || e.type === DISPATCH_STORAGE_EVENT) {
             try {
                const item = window.localStorage.getItem(key);
                if (item) {
                    setStoredValue(JSON.parse(item));
                }
             } catch (error) {
                console.error(`Error handling storage change for key “${key}”:`, error);
             }
          }
        };

        // Listen for changes from other tabs
        window.addEventListener('storage', handleStorageChange);
        // Listen for changes from the same tab (dispatched by setValue)
        window.addEventListener(DISPATCH_STORAGE_EVENT, handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener(DISPATCH_STORAGE_EVENT, handleStorageChange);
        };
    }, [key]);

    return [storedValue, setValue];
}
