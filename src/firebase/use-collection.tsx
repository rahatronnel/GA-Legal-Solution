'use client';

import {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  onSnapshot,
  queryEqual,
  refEqual,
  type Query,
  type DocumentData,
} from 'firebase/firestore';

import { useMemoFirebase } from './hooks';

export function useCollection<T>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const queryRef = useRef<Query<T> | null>(null);

  const memoizedQuery = useMemoFirebase(() => query, [query]);

  const updateState = useCallback(
    (
      newData: T[] | null = null,
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
    // If the query is null or unchanged, do nothing
    if (
      !memoizedQuery ||
      (queryRef.current && queryEqual(queryRef.current, memoizedQuery))
    ) {
      if (!memoizedQuery) {
        // If query is null, we are not loading and there's no data
        updateState(null, false, null);
      }
      return;
    }

    queryRef.current = memoizedQuery;
    updateState(null, true, null); // Set loading state

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (querySnapshot) => {
        const result: T[] = [];
        querySnapshot.forEach((doc) => {
          // You might want to add a converter to your query
          // to get typed objects directly.
          result.push({ id: doc.id, ...doc.data() } as T);
        });
        updateState(result, false, null);
      },
      (err) => {
        console.error(`Error fetching collection:`, err);
        updateState(null, false, err);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery, updateState]);

  return { data, isLoading, error };
}
