'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Calendar as CalendarIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { calculateBookingCommission } from '@/lib/commission';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [numGuests, setNumGuests] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchListing();
    }
  }, [params.id]);

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          hotels!hotels_listing_id_fkey(*),
          guesthouses!guesthouses_listing_id_fkey(*),
          profiles:host_id(full_name, phone, email)
        `)
        .eq('id', params.id)
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching listing:', error);
        setListing(null);
        setLoading(false);
        return;
      }

      if (!data) {
        console.log('No listing found with id:', params.id);
        setListing(null);
        setLoading(false);
        return;
      }

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

      console.log('Fetched listing for booking:', { data, hotel, guesthouse, rooms });

      setListing({
        ...data,
        hotel,
        guesthouse,
        rooms,
        host: data.profiles,
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      setListing(null);
    }
    setLoading(false);
  };

  const calculateTotalPrice = () => {
    if (!checkIn || !checkOut || !listing) return 0;

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (listing.listing_type === 'hotel' && listing.rooms?.[0]) {
      return listing.rooms[0].price_per_night * nights;
    }

    if (listing.guesthouse) {
      const price = typeof listing.guesthouse.price === 'string'
        ? parseFloat(listing.guesthouse.price)
        : listing.guesthouse.price;

      if (listing.guesthouse.price_type === 'night') {
        return price * nights;
      }
      return price;
    }

    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    console.log('[Booking] Submit handler called, user state:', { userId: user?.id, authLoading });

    if (!user) {
      console.error('[Booking] No user found, redirecting to login');
      toast.error('Please login to continue');
      router.push('/login');
      return;
    }

    setSubmitting(true);

    try {
      console.log('[Booking] Verifying session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('[Booking] Session error:', sessionError);
        toast.error('Your session has expired. Please login again.');
        router.push('/login');
        return;
      }

      console.log('[Booking] Session valid, user:', session.user.id);

      const totalPrice = calculateTotalPrice();

      let propertyType: 'hotel' | 'fully_furnished' | 'rental' = 'rental';
      if (listing.listing_type === 'hotel') {
        propertyType = 'hotel';
      } else if (listing.listing_type === 'fully_furnished' || listing.listing_type === 'furnished') {
        propertyType = 'fully_furnished';
      } else if (listing.listing_type === 'guesthouse') {
        propertyType = 'fully_furnished';
      } else if (listing.listing_type === 'rental') {
        propertyType = 'rental';
      }

      const commissionBreakdown = calculateBookingCommission(totalPrice, propertyType);
      const commissionAmount = commissionBreakdown.commissionAmount;

      const bookingData = {
        guest_id: session.user.id,
        listing_id: listing.id,
        room_id: listing.rooms?.[0]?.id || null,
        booking_type: 'listing',
        property_type: propertyType,
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
        num_guests: parseInt(numGuests),
        total_price: totalPrice,
        commission_amount: commissionAmount,
        status: 'pending',
        payment_status: 'pending',
        special_requests: specialRequests || null,
      };

      console.log('[Booking] Creating booking with data:', bookingData);

      const { data, error } = await supabase.from('bookings').insert(bookingData).select();

      if (error) {
        console.error('[Booking] Insert error:', error);
        throw error;
      }

      console.log('[Booking] Created successfully:', data);
      toast.success('Booking request submitted successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('[Booking] Error:', error);
      toast.error(error.message || 'Failed to submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
        <p className="text-gray-600 mb-4">This property may not be available for booking at the moment.</p>
        <Button onClick={() => router.push('/properties')}>Browse Available Properties</Button>
      </div>
    );
  }

  const isHotel = listing.listing_type === 'hotel';
  const title = isHotel ? listing.hotel?.name : listing.guesthouse?.title;
  const city = isHotel ? listing.hotel?.city : listing.guesthouse?.city;
  const images = isHotel ? listing.hotel?.images : listing.guesthouse?.images;
  const totalPrice = calculateTotalPrice();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-navy mb-2">Complete Your Booking</h1>
          <p className="text-gray-600">Fill in the details below to confirm your reservation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Check-in Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {checkIn ? format(checkIn, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={checkIn}
                            onSelect={setCheckIn}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>Check-out Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {checkOut ? format(checkOut, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={checkOut}
                            onSelect={setCheckOut}
                            disabled={(date) => !checkIn || date <= checkIn}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guests">Number of Guests</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="guests"
                        type="number"
                        min="1"
                        value={numGuests}
                        onChange={(e) => setNumGuests(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="requests">Special Requests (Optional)</Label>
                    <Textarea
                      id="requests"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Any special requirements or requests..."
                      rows={4}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={submitting || !checkIn || !checkOut}
                  >
                    {submitting ? 'Processing...' : 'Confirm Booking'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="mb-4">
                  {images && images[0] && (
                    <img
                      src={images[0]}
                      alt={title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-bold text-lg">{title}</h3>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{city}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  {checkIn && checkOut && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Check-in</span>
                        <span className="font-medium">{format(checkIn, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Check-out</span>
                        <span className="font-medium">{format(checkOut, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Nights</span>
                        <span className="font-medium">
                          {Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Guests</span>
                        <span className="font-medium">{numGuests}</span>
                      </div>
                    </>
                  )}

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Price</span>
                      <span className="text-2xl font-bold text-brand-green">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
