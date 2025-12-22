'use client';

import {
  AdvancedMarker,
  InfoWindow,
  Map,
  useMap,
} from '@vis.gl/react-google-maps';
import { Car, Home, LandPlot } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { Property } from '@/lib/types';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

export function PropertyMap({ properties }: { properties: Property[] }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null
  );
  const map = useMap();

  const selectedProperty =
    properties.find((p) => p.id === selectedPropertyId) || null;

  const handleMarkerClick = (propertyId: string, location: { lat: number; lng: number }) => {
    setSelectedPropertyId(propertyId);
    map?.panTo(location);
  };

  const center = properties.length > 0 ? properties[0].location : { lat: 34.052235, lng: -118.243683 };
  
  return (
    <div className="h-full w-full overflow-hidden rounded-lg shadow-lg">
      <Map
        defaultCenter={center}
        defaultZoom={11}
        mapId="realestate_vision_map"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
      >
        {properties.map((property) => (
          <AdvancedMarker
            key={property.id}
            position={property.location}
            onClick={() => handleMarkerClick(property.id, property.location)}
          >
            <div
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 ${
                property.isNearRoad ? 'bg-accent' : 'bg-primary'
              }`}
            >
              {property.type === 'flat' ? (
                <Home className="h-5 w-5 text-primary-foreground" />
              ) : (
                <LandPlot className="h-5 w-5 text-primary-foreground" />
              )}
            </div>
          </AdvancedMarker>
        ))}

        {selectedProperty && (
          <InfoWindow
            position={selectedProperty.location}
            onCloseClick={() => setSelectedPropertyId(null)}
            pixelOffset={[0, -50]}
          >
            <Card className="w-64 border-0 shadow-none">
              <CardHeader className="p-2">
                <CardTitle className="text-base">{selectedProperty.title}</CardTitle>
                <CardDescription className="text-sm font-bold text-primary">
                  ${selectedProperty.price.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="flex items-center gap-2">
                  {selectedProperty.type === 'flat' ? (
                    <Home className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <LandPlot className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm capitalize">{selectedProperty.type}</span>
                  {selectedProperty.isNearRoad && (
                    <div className="flex items-center gap-1">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Near Road</span>
                    </div>
                  )}
                </div>
                <Button asChild size="sm" className="mt-2 w-full">
                  <Link href={`/property/${selectedProperty.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
