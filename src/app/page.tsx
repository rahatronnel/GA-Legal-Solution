'use client';

import { useMemo, useState } from 'react';
import { PropertyCard } from '@/components/property-card';
import { PropertyMap } from '@/components/property-map';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Property } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Frown } from 'lucide-react';

export default function Home() {
  const [filter, setFilter] = useState<'all' | 'flat' | 'plot'>('all');
  const firestore = useFirestore();

  const propertiesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'properties')) : null),
    [firestore]
  );
  const { data: properties, isLoading, error } = useCollection<Property>(propertiesQuery);

  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    if (filter === 'all') return properties;
    return properties.filter((property) => property.type === filter);
  }, [properties, filter]);


  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
        <div className="md:col-span-1 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Available Properties</h1>
          </div>
          <Tabs
            defaultValue="all"
            className="mb-4 w-full"
            onValueChange={(value) => setFilter(value as 'all' | 'flat' | 'plot')}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="flat">Flats</TabsTrigger>
              <TabsTrigger value="plot">Plots</TabsTrigger>
            </TabsList>
          </Tabs>
          <ScrollArea className="h-auto md:h-[calc(100vh-16rem)]">
            {isLoading && (
              <div className="grid grid-cols-1 gap-6 pr-4 sm:grid-cols-2 md:grid-cols-1">
                {[...Array(3)].map((_, i) => (
                   <div className="flex flex-col space-y-3" key={i}>
                    <Skeleton className="h-[125px] w-full rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {error && (
                <Alert variant="destructive">
                    <Frown className="h-4 w-4" />
                    <AlertTitle>Error loading properties</AlertTitle>
                    <AlertDescription>
                        Could not fetch property listings. Please try again later.
                    </AlertDescription>
                </Alert>
            )}
            {!isLoading && !error && filteredProperties && filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 pr-4 sm:grid-cols-2 md:grid-cols-1">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              !isLoading && (
                <div className="flex h-40 items-center justify-center pr-4 text-muted-foreground">
                  No properties found for this category.
                </div>
              )
            )}
          </ScrollArea>
        </div>
        <div className="h-[50vh] min-h-[400px] md:col-span-2 md:h-auto lg:col-span-3">
          <PropertyMap properties={filteredProperties || []} />
        </div>
      </div>
    </div>
  );
}
