'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { MapPin, Star, Bed, Bath, Users, Wifi, Car } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/SearchBar';

interface Listing {
  id: string;
  listing_type: 'hotel' | 'fully_furnished' | 'rental';
  is_available: boolean;
  hotel: {
    name: string;
    city: string;
    images: string[];
    amenities?: string[];
    rating?: number;
  } | null;
  guesthouse: {
    title: string;
    city: string;
    price: string | number;
    price_type: string;
    images: string[];
    property_type: string;
    bedrooms?: number;
    bathrooms?: number;
    max_guests?: number;
  } | null;
}

export default function PropertiesPage() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  const fetchListings = async () => {
    setLoading(true);

    const { data: listingsData, error } = await supabase
      .from('listings')
      .select(`
        *,
        hotels!hotels_listing_id_fkey(name, city, images, amenities, rating),
        guesthouses!guesthouses_listing_id_fkey(title, city, price, price_type, images, property_type, bedrooms, bathrooms, max_guests)
      `)
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .eq('is_available', true)
      .order('created_at', { ascending: false});

    if (error) {
      console.error('Error fetching listings:', error);
      setLoading(false);
      return;
    }

    if (listingsData && listingsData.length > 0) {
      const transformedListings = listingsData.map((listing: any) => {
        return {
          id: listing.id,
          listing_type: listing.listing_type,
          is_available: listing.is_available,
          hotel: listing.hotels || null,
          guesthouse: listing.guesthouses || null,
        } as Listing;
      });

      const city = searchParams.get('city');

      let filtered = transformedListings;

      if (city) {
        filtered = filtered.filter(listing => {
          const listingCity = listing.listing_type === 'hotel'
            ? listing.hotel?.city || ''
            : listing.guesthouse?.city || '';
          return listingCity.toLowerCase().includes(city.toLowerCase());
        });
      }

      setListings(filtered);
    }

    setLoading(false);
  };

  const renderPropertyCard = (listing: Listing) => {
    const isHotel = listing.listing_type === 'hotel';
    const title = isHotel ? listing.hotel?.name : listing.guesthouse?.title;
    const city = isHotel ? listing.hotel?.city : listing.guesthouse?.city;
    const images = isHotel ? listing.hotel?.images : listing.guesthouse?.images;
    const amenities = isHotel ? listing.hotel?.amenities : [];
    const rating = isHotel ? listing.hotel?.rating : null;

    const imageUrl = (images && Array.isArray(images) && images.length > 0) ? images[0] : null;

    const displayType = listing.listing_type === 'hotel'
      ? 'Hotel'
      : listing.listing_type === 'fully_furnished'
      ? 'Fully Furnished'
      : 'Rental';

    return (
      <Link key={listing.id} href={`/listings/${listing.id}`}>
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full border hover:border-brand-green/50 group">
          <div className="relative h-56 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title || 'Property'}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                No Image Available
              </div>
            )}
            <Badge className="absolute top-3 left-3 bg-brand-green/90 backdrop-blur hover:bg-brand-green text-white font-medium shadow-lg">
              {displayType}
            </Badge>
            {rating && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-sm">{rating}</span>
              </div>
            )}
          </div>

          <CardContent className="p-5">
            <h3 className="font-bold text-xl line-clamp-1 text-brand-navy mb-2 group-hover:text-brand-green transition-colors">
              {title}
            </h3>

            <div className="flex items-center text-gray-600 mb-3">
              <MapPin className="h-4 w-4 mr-1.5 text-brand-green" />
              <span className="text-sm font-medium">{city}</span>
            </div>

            {amenities && amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {amenities.slice(0, 3).map((amenity: string, idx: number) => {
                  const icon = amenity.toLowerCase().includes('wifi') ? <Wifi className="h-3.5 w-3.5" /> :
                               amenity.toLowerCase().includes('parking') || amenity.toLowerCase().includes('garage') ? <Car className="h-3.5 w-3.5" /> : null;
                  return (
                    <div key={idx} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                      {icon}
                      <span>{amenity}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {!isHotel && listing.guesthouse && (
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 pb-3 border-b">
                {listing.guesthouse.bedrooms && (
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    <span>{listing.guesthouse.bedrooms}</span>
                  </div>
                )}
                {listing.guesthouse.bathrooms && (
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    <span>{listing.guesthouse.bathrooms}</span>
                  </div>
                )}
                {listing.guesthouse.max_guests && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{listing.guesthouse.max_guests}</span>
                  </div>
                )}
              </div>
            )}

            {!isHotel && listing.guesthouse && (
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-2xl font-bold text-brand-green">
                    ${typeof listing.guesthouse.price === 'string' ? listing.guesthouse.price : listing.guesthouse.price.toFixed(0)}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">/ {listing.guesthouse.price_type}</span>
                </div>
              </div>
            )}

            {isHotel && (
              <div className="text-sm text-brand-green font-semibold">
                View Rooms & Rates →
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-to-r from-brand-navy via-brand-navy to-brand-green text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Stay</h1>
            <p className="text-lg text-gray-100 max-w-2xl mx-auto">
              Discover amazing hotels, apartments, and homes across Somalia
            </p>
          </div>
          <SearchBar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-brand-navy mb-2">
              {listings.length === 0 ? 'No' : listings.length} {listings.length === 1 ? 'Property' : 'Properties'} Available
            </h2>
            <p className="text-gray-600">Explore our curated selection of verified listings</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-green mb-4"></div>
            <p className="text-gray-600">Loading amazing properties...</p>
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((listing) => renderPropertyCard(listing))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Properties Found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any properties matching your criteria.
              </p>
              <Link
                href="/properties"
                className="inline-block bg-brand-green text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-green/90 transition-colors"
              >
                View All Properties
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
