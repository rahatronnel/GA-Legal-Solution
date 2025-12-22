import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Property } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Home, LandPlot } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  className?: string;
}

export function PropertyCard({ property, className }: PropertyCardProps) {
  const image = PlaceHolderImages.find((img) => img.id === property.imageIds[0]);

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden transition-all hover:shadow-lg',
        className
      )}
    >
      <CardHeader className="p-0">
        <Link href={`/property/${property.id}`} className="block aspect-video overflow-hidden">
          {image && (
            <Image
              src={image.imageUrl}
              alt={property.title}
              width={400}
              height={300}
              data-ai-hint={image.imageHint}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <Link href={`/property/${property.id}`} className="group">
          <CardTitle className="mb-2 text-lg leading-tight group-hover:text-primary">
            {property.title}
          </CardTitle>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant={property.type === 'flat' ? 'default' : 'secondary'}>
            {property.type === 'flat' ? (
              <Home className="mr-1 h-3 w-3" />
            ) : (
              <LandPlot className="mr-1 h-3 w-3" />
            )}
            {property.type}
          </Badge>
          {property.isNearRoad && <Badge variant="outline">Near Road</Badge>}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <p className="text-xl font-bold text-primary">
          ${property.price.toLocaleString()}
        </p>
      </CardFooter>
    </Card>
  );
}
