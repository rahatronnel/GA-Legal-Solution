import { useMemo } from 'react';
import type {
  DocumentReference,
  Query,
  DocumentData,
} from 'firebase/firestore';

// A passthrough for useMemo, but with a better name for discoverability.
export function useMemoFirebase<T extends DocumentReference | Query | null>(
  factory: () => T,
  deps: any[]
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
