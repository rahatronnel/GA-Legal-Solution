'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Property } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { use } from 'react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Home,
  LandPlot,
  BedDouble,
  Bath,
  Ruler,
  Phone,
  Loader,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { UploadPlotImage } from '@/components/upload-plot-image';

type Props = {
  params: Promise<{ id: string }>;
};

export default function PropertyPage({ params }: Props) {
  const { id } = use(params);
  const firestore = useFirestore();
  const propertyRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'properties', id) : null),
    [firestore, id]
  );
  const { data: property, isLoading, error } = useDoc<Property>(propertyRef);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <div className="mb-8">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        <Skeleton className="aspect-video w-full rounded-lg mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="container text-center py-10">Error loading property.</div>
  }
  
  if (!property) {
    notFound();
  }

  const propertyImages = property.imageIds
    .map((id) => PlaceHolderImages.find((img) => img.id === id))
    .filter(Boolean);

  const agentAvatar = PlaceHolderImages.find(
    (img) => img.id === property.agent.avatarId
  );

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold tracking-tighter">
          {property.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {property.type === 'flat' ? (
              <Home className="mr-2 h-4 w-4" />
            ) : (
              <LandPlot className="mr-2 h-4 w-4" />
            )}
            <span className="capitalize">{property.type}</span>
          </Badge>
          {property.isNearRoad && <Badge variant="outline">Near Road</Badge>}
          <span className="text-3xl font-extrabold text-primary">
            ${property.price.toLocaleString()}
          </span>
        </div>
      </div>

      <Carousel className="mb-8 w-full">
        <CarouselContent>
          {propertyImages.map((image, index) => (
            <CarouselItem key={index}>
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                {image && (
                  <Image
                    src={image.imageUrl}
                    alt={`${property.title} - image ${index + 1}`}
                    data-ai-hint={image.imageHint}
                    width={1200}
                    height={675}
                    className="h-full w-full object-cover"
                    priority={index === 0}
                  />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid grid-cols-2 gap-4 text-center sm:grid-cols-3">
                <div className="rounded-lg bg-muted p-4">
                  <Ruler className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="font-semibold">{property.details.area.toLocaleString()} sqft</p>
                  <p className="text-sm text-muted-foreground">Area</p>
                </div>
                {property.details.bedrooms && (
                  <div className="rounded-lg bg-muted p-4">
                    <BedDouble className="mx-auto mb-2 h-8 w-8 text-primary" />
                    <p className="font-semibold">{property.details.bedrooms}</p>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                  </div>
                )}
                {property.details.bathrooms && (
                  <div className="rounded-lg bg-muted p-4">
                    <Bath className="mx-auto mb-2 h-8 w-8 text-primary" />
                    <p className="font-semibold">{property.details.bathrooms}</p>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                  </div>
                )}
              </div>
              <Separator className="my-6" />
              <h3 className="mb-2 text-xl font-semibold">Description</h3>
              <p className="text-muted-foreground">{property.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Contact Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {agentAvatar && (
                    <AvatarImage
                      src={agentAvatar.imageUrl}
                      alt={property.agent.name}
                      data-ai-hint={agentAvatar.imageHint}
                    />
                  )}
                  <AvatarFallback>
                    {property.agent.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{property.agent.name}</p>
                  <p className="text-sm text-muted-foreground">Real Estate Agent</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${property.agent.phone}`} className="text-primary hover:underline">
                  {property.agent.phone}
                </a>
              </div>
            </CardContent>
          </Card>
          <UploadPlotImage />
        </div>
      </div>
    </div>
  );
}
