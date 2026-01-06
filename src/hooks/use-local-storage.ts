
"use client";

import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

// This is a helper function to check if the code is running in a browser
const isBrowser = typeof window !== 'undefined';

// This custom event is used to trigger updates within the same tab,
// which is necessary because the 'storage' event only fires for other tabs.
const DISPATCH_STORAGE_EVENT = 'dispatch_storage';

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    // 1. Initialize state from localStorage or the initialValue.
    // This function is only run once on the client, avoiding server/client mismatches.
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

    // 2. Create a stable `setValue` function that updates both state and localStorage.
    // `useCallback` prevents this function from being recreated on every render.
    const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
        if (!isBrowser) {
            console.warn(`Tried to set localStorage key “${key}” on the server.`);
            return;
        }
        try {
            // Allow value to be a function, just like in useState.
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Set the state.
            setStoredValue(valueToStore);

            // Persist to localStorage.
            window.localStorage.setItem(key, JSON.stringify(valueToStore));

            // Dispatch a custom event to notify other hooks in the *same* tab.
            window.dispatchEvent(new Event(DISPATCH_STORAGE_EVENT));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]); // Dependency on `storedValue` is important for the functional update `value(storedValue)`.

    // 3. Listen for changes from other tabs AND from the custom event.
    useEffect(() => {
        if (!isBrowser) {
            return;
        }
        
        // This function will be called when localStorage changes.
        const handleStorageChange = (e: StorageEvent | CustomEvent) => {
          // Check if the event is from another tab (`StorageEvent`) or our custom event.
          if ((e instanceof StorageEvent && e.key === key) || e.type === DISPATCH_STORAGE_EVENT) {
             try {
                const item = window.localStorage.getItem(key);
                if (item) {
                    // CRITICAL: This is the correct way to update the state from the listener.
                    // This will trigger a re-render with the new data.
                    setStoredValue(JSON.parse(item));
                }
             } catch (error) {
                console.error(`Error handling storage change for key “${key}”:`, error);
             }
          }
        };

        // Add the event listeners.
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener(DISPATCH_STORAGE_EVENT, handleStorageChange);

        // Clean up the listeners when the component unmounts.
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener(DISPATCH_STORAGE_EVENT, handleStorageChange);
        };
    }, [key]); // The key is the only dependency needed here.

    return [storedValue, setValue];
}
