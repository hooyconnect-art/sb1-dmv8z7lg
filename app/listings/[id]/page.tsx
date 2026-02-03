'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { WaitingListButton } from '@/components/WaitingListButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Bed, Bath, Star, Hotel as HotelIcon, Chrome as Home, Phone, MessageCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import { PropertyType, getPropertyTypeConfig, isBookablePropertyType } from '@/lib/property-types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ListingDetailPage() {
  const params = useParams();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchListing();
    }
  }, [params.id]);

  const fetchListing = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        hotels!hotels_listing_id_fkey(*),
        guesthouses!guesthouses_listing_id_fkey(*)
      `)
      .eq('id', params.id)
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      const hotel = data.hotels || null;
      const guesthouse = data.guesthouses || null;
      let rooms = [];

      if (hotel?.id) {
        const { data: roomsData } = await supabase
          .from('rooms')
          .select('*')
          .eq('hotel_id', hotel.id);

        rooms = roomsData || [];
      }

      setListing({
        ...data,
        hotel,
        guesthouse,
        rooms,
      });
    }
    setLoading(false);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInquiry(true);

    try {
      const { error } = await supabase.from('listing_inquiries').insert({
        listing_id: listing.id,
        guest_name: inquiryForm.name,
        guest_email: inquiryForm.email,
        guest_phone: inquiryForm.phone,
        message: inquiryForm.message,
        status: 'pending',
      });

      if (error) throw error;

      setInquirySubmitted(true);
      setInquiryForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('Failed to submit inquiry. Please try again.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleCallAgent = () => {
    // Contact functionality requires authentication
    alert('Please sign in to contact the agent');
  };

  const handleWhatsAppAgent = () => {
    // Contact functionality requires authentication
    alert('Please sign in to contact the agent');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
        <Link href="/properties">
          <Button>Browse Listings</Button>
        </Link>
      </div>
    );
  }

  // Determine property type: use listing_type as the source of truth
  const propertyType = listing.listing_type as PropertyType;

  const propertyConfig = getPropertyTypeConfig(propertyType);
  const isBookable = isBookablePropertyType(propertyType);
  const isInquiryBased = propertyConfig.inquiryEnabled;

  const isHotel = listing.listing_type === 'hotel';
  const title = isHotel ? listing.hotel?.name : listing.guesthouse?.title;
  const city = isHotel ? listing.hotel?.city : listing.guesthouse?.city;
  const description = isHotel ? listing.hotel?.description : listing.guesthouse?.description;
  const images = isHotel ? listing.hotel?.images : listing.guesthouse?.images;
  const amenities = isHotel ? listing.hotel?.amenities : listing.guesthouse?.amenities;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {images && images.length > 0 ? (
              <>
                <div className="bg-white rounded-lg overflow-hidden shadow-lg mb-6">
                  <img
                    src={images[selectedImageIndex]}
                    alt={title}
                    className="w-full h-96 object-cover"
                  />
                </div>

                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {images.slice(0, 4).map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${title} ${idx + 1}`}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-full h-32 object-cover rounded-lg hover:opacity-90 transition-all cursor-pointer ${
                          selectedImageIndex === idx ? 'ring-4 ring-brand-green opacity-100' : 'opacity-75'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center mb-6">
                <div className="text-center">
                  <Home className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No images available</p>
                </div>
              </div>
            )}

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {isHotel ? (
                    <HotelIcon className="h-6 w-6 text-primary" />
                  ) : (
                    <Home className="h-6 w-6 text-primary" />
                  )}
                  <h1 className="text-3xl font-bold">{title}</h1>
                </div>

                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{city}</span>
                </div>

                {isHotel && listing.hotel?.rating && (
                  <div className="flex items-center mb-4">
                    {Array.from({ length: listing.hotel.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                    ))}
                    <span className="ml-2 text-gray-600">{listing.hotel.rating} Star Hotel</span>
                  </div>
                )}

                <p className="text-gray-700 mb-4">{description}</p>

                {amenities && amenities.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((amenity: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {isHotel && listing.rooms?.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Available Rooms</h2>
                  <div className="space-y-4">
                    {listing.rooms.map((room: any) => (
                      <div
                        key={room.id}
                        className="border rounded-lg p-4 flex justify-between items-center"
                      >
                        <div>
                          <h3 className="font-semibold text-lg capitalize">{room.room_type} Room</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {room.max_guests} guests
                            </span>
                            <span>{room.quantity} rooms available</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            ${room.price_per_night}
                          </p>
                          <p className="text-sm text-gray-600">per night</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!isHotel && listing.guesthouse && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Property Details</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <Bed className="h-5 w-5 mr-2 text-primary" />
                      <span>{listing.guesthouse.bedrooms} Bedrooms</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-5 w-5 mr-2 text-primary" />
                      <span>{listing.guesthouse.bathrooms} Bathrooms</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      <span>{listing.guesthouse.max_guests} Guests</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <Badge variant="outline" className="mb-4">
                  {propertyConfig.label}
                </Badge>

                {!isHotel && listing.guesthouse && (
                  <div className="mb-6">
                    <p className="text-3xl font-bold text-brand-green">
                      ${typeof listing.guesthouse.price === 'string' ? listing.guesthouse.price : listing.guesthouse.price.toFixed(0)}
                    </p>
                    <p className="text-gray-600">per {listing.guesthouse.price_type}</p>
                  </div>
                )}

                {isBookable && listing.is_available && (
                  <Link href={`/book/${listing.id}`} className="block">
                    <Button className="w-full bg-brand-green hover:bg-brand-green/90 text-white" size="lg">
                      Book Now
                    </Button>
                  </Link>
                )}

                {isBookable && !listing.is_available && (
                  <div>
                    <Badge variant="destructive" className="w-full mb-4 justify-center py-2">
                      Currently Unavailable
                    </Badge>
                    <WaitingListButton listingId={listing.id} />
                  </div>
                )}

                {isInquiryBased && (
                  <div className="space-y-4">
                    {!inquirySubmitted ? (
                      <>
                        <div className="mb-4">
                          <h3 className="font-semibold mb-2">Contact Agent</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            This property is available for inquiry. Contact the agent directly or submit an inquiry form.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleCallAgent}
                              variant="outline"
                              className="flex-1"
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </Button>
                            <Button
                              onClick={handleWhatsAppAgent}
                              variant="outline"
                              className="flex-1"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h3 className="font-semibold mb-3">Send Inquiry</h3>
                          <form onSubmit={handleInquirySubmit} className="space-y-3">
                            <Input
                              placeholder="Your Name"
                              value={inquiryForm.name}
                              onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                              required
                            />
                            <Input
                              type="email"
                              placeholder="Your Email"
                              value={inquiryForm.email}
                              onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                              required
                            />
                            <Input
                              type="tel"
                              placeholder="Your Phone"
                              value={inquiryForm.phone}
                              onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                              required
                            />
                            <Textarea
                              placeholder="Your message..."
                              value={inquiryForm.message}
                              onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                              rows={4}
                              required
                            />
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={submittingInquiry}
                            >
                              {submittingInquiry ? 'Sending...' : 'Send Inquiry'}
                            </Button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <h3 className="font-semibold text-green-800 mb-1">Inquiry Sent!</h3>
                          <p className="text-sm text-green-700">
                            The agent will contact you soon.
                          </p>
                        </div>
                        <Button
                          onClick={() => setInquirySubmitted(false)}
                          variant="outline"
                          className="w-full"
                        >
                          Send Another Inquiry
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {isHotel && listing.hotel?.check_in_time && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Check-in</p>
                        <p className="font-semibold">{listing.hotel.check_in_time}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Check-out</p>
                        <p className="font-semibold">{listing.hotel.check_out_time}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
