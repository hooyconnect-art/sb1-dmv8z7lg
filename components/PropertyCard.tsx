import Link from 'next/link';
import { MapPin, Users, Bed, Bath, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type PropertyCardProps = {
  id: string;
  title: string;
  city: string;
  property_type: string;
  price_per_night: number;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  images: string[];
  averageRating?: number;
  reviewCount?: number;
};

export function PropertyCard({
  id,
  title,
  city,
  property_type,
  price_per_night,
  bedrooms,
  bathrooms,
  max_guests,
  images,
  averageRating,
  reviewCount,
}: PropertyCardProps) {
  const imageUrl = images && images.length > 0
    ? images[0]
    : 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <Link href={`/properties/${id}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-border hover:border-brand-green/50">
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          />
          <Badge className="absolute top-3 left-3 bg-brand-green hover:bg-brand-green/90 text-white font-semibold">
            {property_type}
          </Badge>
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg line-clamp-1 text-brand-navy">{title}</h3>
            {averageRating && (
              <div className="flex items-center space-x-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{averageRating.toFixed(1)}</span>
                {reviewCount && <span className="text-muted-foreground">({reviewCount})</span>}
              </div>
            )}
          </div>

          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1 text-brand-green" />
            <span className="text-sm">{city}</span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{bedrooms} Beds</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{bathrooms} Baths</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{max_guests} Guests</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t">
            <div>
              <span className="text-2xl font-bold text-brand-green">${price_per_night}</span>
              <span className="text-muted-foreground text-sm"> / night</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
