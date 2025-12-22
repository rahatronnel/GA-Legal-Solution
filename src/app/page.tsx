'use client';

import { useState } from 'react';
import { PropertyCard } from '@/components/property-card';
import { PropertyMap } from '@/components/property-map';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { properties } from '@/lib/data';
import type { Property } from '@/lib/types';

export default function Home() {
  const [filter, setFilter] = useState<'all' | 'flat' | 'plot'>('all');

  const filteredProperties = properties.filter((property) => {
    if (filter === 'all') return true;
    return property.type === filter;
  });

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
            {filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 pr-4 sm:grid-cols-2 md:grid-cols-1">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center pr-4 text-muted-foreground">
                No properties found for this category.
              </div>
            )}
          </ScrollArea>
        </div>
        <div className="h-[50vh] min-h-[400px] md:col-span-2 md:h-auto lg:col-span-3">
          <PropertyMap properties={filteredProperties} />
        </div>
      </div>
    </div>
  );
}
