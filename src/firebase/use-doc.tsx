'use client';

import {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  onSnapshot,
  refEqual,
  type DocumentReference,
  type DocumentData,
} from 'firebase/firestore';
import { useMemoFirebase } from './hooks';

export function useDoc<T>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const docRefRef = useRef<DocumentReference<T> | null>(null);

  const memoizedDocRef = useMemoFirebase(() => docRef, [docRef]);

  const updateState = useCallback(
    (
      newData: T | null = null,
      newIsLoading: boolean = false,
      newError: Error | null = null
    ) => {
      setData(newData);
      setIsLoading(newIsLoading);
      setError(newError);
    },
    []
  );

  useEffect(() => {
    // If the docRef is null or unchanged, do nothing
    if (
      !memoizedDocRef ||
      (docRefRef.current && refEqual(docRefRef.current, memoizedDocRef))
    ) {
        if (!memoizedDocRef) {
             // If docRef is null, we are not loading and there's no data
            updateState(null, false, null);
        }
      return;
    }

    docRefRef.current = memoizedDocRef;
    updateState(null, true, null); // Set loading state
    
    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          updateState({ id: docSnapshot.id, ...docSnapshot.data() } as T, false, null);
        } else {
          updateState(null, false, new Error('Document does not exist.'));
        }
      },
      (err) => {
        console.error(`Error fetching document:`, err);
        updateState(null, false, err);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef, updateState]);

  return { data, isLoading, error };
}
