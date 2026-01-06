
"use client";

import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

// Custom event to notify all instances of the hook on the same page
const isBrowser = typeof window !== 'undefined';
const DISPATCH_STORAGE_EVENT = 'dispatchstorages';

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
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

    const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
        if (!isBrowser) {
            return;
        }
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            // Dispatch a custom event to notify other instances of this hook on the same page
            window.dispatchEvent(new CustomEvent(DISPATCH_STORAGE_EVENT, { detail: { key } }));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);


    useEffect(() => {
        if (!isBrowser) {
            return;
        }
        
        const handleStorageChange = (event: StorageEvent | CustomEvent) => {
            let eventKey: string | null = null;
            if (event instanceof StorageEvent) {
                eventKey = event.key;
            } else if (event instanceof CustomEvent && event.detail) {
                eventKey = event.detail.key;
            }

            if (eventKey === key) {
                try {
                    const item = window.localStorage.getItem(key);
                    if (item !== null) {
                        setStoredValue(JSON.parse(item));
                    }
                } catch (error) {
                    console.error(`Error handling storage change for key “${key}”:`, error);
                }
            }
        };

        // Listen for changes from other tabs
        window.addEventListener('storage', handleStorageChange);
        // Listen for changes from the same tab
        window.addEventListener(DISPATCH_STORAGE_EVENT, handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener(DISPATCH_STORAGE_EVENT, handleStorageChange);
        };
    }, [key]);

    return [storedValue, setValue];
}
