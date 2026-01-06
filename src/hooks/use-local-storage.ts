
"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// This is a helper function to check if the code is running in a browser
const isBrowser = typeof window !== 'undefined';

// This hook is no longer used for permanent storage as per user request.
// It now functions identically to useState to hold temporary data.
// The name is kept to avoid breaking imports, but the functionality is temporary.

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  return [storedValue, setStoredValue];
}
