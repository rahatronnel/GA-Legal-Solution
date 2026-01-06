
"use client";

import { useState, Dispatch, SetStateAction } from 'react';

// This hook is no longer used for permanent storage as per user request.
// It now functions identically to useState to hold temporary data for the current session only.
// The name is kept to avoid breaking imports throughout the application.

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  return [storedValue, setStoredValue];
}
