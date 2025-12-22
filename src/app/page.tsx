import { PropertyCard } from '@/components/property-card';
import { PropertyMap } from '@/components/property-map';
import { ScrollArea } from '@/components/ui/scroll-area';
import { properties } from '@/lib/data';

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
        <div className="md:col-span-1 lg:col-span-1">
          <h1 className="mb-4 text-2xl font-bold">Available Properties</h1>
          <ScrollArea className="h-auto md:h-[calc(100vh-12rem)]">
            <div className="grid grid-cols-1 gap-6 pr-4 sm:grid-cols-2 md:grid-cols-1">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="h-[50vh] min-h-[400px] md:col-span-2 md:h-auto lg:col-span-3">
          <PropertyMap properties={properties} />
        </div>
      </div>
    </div>
  );
}
