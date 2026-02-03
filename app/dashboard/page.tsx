'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, MapPin, Users, DollarSign, Clock, CheckCircle2, XCircle, AlertCircle, CreditCard, Smartphone, Wallet as WalletIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  total_price: number;
  status: string;
  payment_status: string;
  special_requests?: string;
  created_at: string;
  listing_id: string;
  room_id: string | null;
  propertyName?: string;
  propertyCity?: string;
  propertyType?: string;
  listingType?: string;
  roomNumber?: string;
  roomType?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('mobile_money');
  const [processingPayment, setProcessingPayment] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      router.replace('/login');
      return;
    }

    // Redirect admins and hosts to their dashboards
    if (profile.role === 'super_admin' || profile.role === 'admin') {
      router.replace('/admin');
      return;
    } else if (profile.role === 'host') {
      router.replace('/host/dashboard');
      return;
    }

    // Load guest bookings
    loadBookings();
  }, [profile, loading, router]);

  const loadBookings = async () => {
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        return;
      }

      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          const { data: listing } = await supabase
            .from('listings')
            .select('listing_type')
            .eq('id', booking.listing_id)
            .single();

          let propertyName = 'Property';
          let propertyCity = '';
          let propertyType = '';
          let listingType = listing?.listing_type || '';

          if (listing?.listing_type === 'hotel') {
            const { data: hotel } = await supabase
              .from('hotels')
              .select('name, city')
              .eq('listing_id', booking.listing_id)
              .single();

            if (hotel) {
              propertyName = hotel.name;
              propertyCity = hotel.city;
              propertyType = 'Hotel';
            }
          } else if (listing?.listing_type === 'guesthouse' || listing?.listing_type === 'fully_furnished') {
            const { data: guesthouse } = await supabase
              .from('guesthouses')
              .select('title, city, property_type')
              .eq('listing_id', booking.listing_id)
              .single();

            if (guesthouse) {
              propertyName = guesthouse.title;
              propertyCity = guesthouse.city;
              propertyType = guesthouse.property_type || 'Guesthouse';
            }
          }

          let roomNumber, roomType;
          if (booking.room_id) {
            const { data: room } = await supabase
              .from('rooms')
              .select('room_number, room_type')
              .eq('id', booking.room_id)
              .single();

            if (room) {
              roomNumber = room.room_number;
              roomType = room.room_type;
            }
          }

          return {
            ...booking,
            propertyName,
            propertyCity,
            propertyType,
            listingType,
            roomNumber,
            roomType,
          };
        })
      );

      setBookings(enrichedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Awaiting Payment</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  const handleOpenPayment = (booking: Booking) => {
    setSelectedBooking(booking);
    setPaymentDialogOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedBooking) return;

    if (paymentMethod === 'mobile_money') {
      setPaymentDialogOpen(false);
      router.push(`/payments/evc?bookingId=${selectedBooking.id}`);
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          paymentMethod: paymentMethod,
          transactionReference: `TXN-${Date.now()}-${selectedBooking.id.slice(0, 8)}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Payment successful! Your booking is confirmed.');
        setPaymentDialogOpen(false);
        await loadBookings();
      } else {
        toast.error(result.error || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading || (profile?.role === 'guest' && loadingBookings)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (profile?.role !== 'guest') {
    return null;
  }

  const upcomingBookings = bookings.filter(b => {
    const needsPayment = (b.status === 'confirmed' || b.status === 'completed') && b.payment_status === 'pending';
    const isFutureBooking = new Date(b.check_in) > new Date();
    return (b.status === 'confirmed' && isFutureBooking) || needsPayment;
  });

  const pastBookings = bookings.filter(b => {
    const isPaid = b.payment_status === 'paid' || b.payment_status === 'refunded';
    const isPastDate = new Date(b.check_out) < new Date();
    const isCompleted = b.status === 'completed';
    return (isPastDate || isCompleted) && isPaid;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">Manage and view your accommodation bookings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-brand-green">{bookings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {bookings.filter(b => b.status === 'confirmed' && b.payment_status === 'paid').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Awaiting Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">
                {bookings.filter(b => (b.status === 'confirmed' || b.status === 'completed') && b.payment_status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-600">{pastBookings.length}</p>
            </CardContent>
          </Card>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6">Start exploring amazing properties in Somalia</p>
                <Button onClick={() => router.push('/properties')} className="bg-brand-green hover:bg-brand-green/90">
                  Browse Properties
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Active & Pending Payment Bookings</h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {booking.propertyName}
                                  {booking.roomNumber && ` - Room ${booking.roomNumber}`}
                                </h3>
                                <div className="flex items-center gap-2 text-gray-600 mt-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{booking.propertyCity}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {booking.propertyType}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {getStatusBadge(booking.status)}
                                {getPaymentBadge(booking.payment_status)}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="text-gray-500 text-xs">Check-in</p>
                                  <p className="font-medium">{format(new Date(booking.check_in), 'MMM dd, yyyy')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="text-gray-500 text-xs">Check-out</p>
                                  <p className="font-medium">{format(new Date(booking.check_out), 'MMM dd, yyyy')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="text-gray-500 text-xs">Guests</p>
                                  <p className="font-medium">{booking.num_guests}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="text-gray-500 text-xs">Total</p>
                                  <p className="font-medium text-brand-green">${booking.total_price}</p>
                                </div>
                              </div>
                            </div>

                            {booking.special_requests && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Special Requests: </span>
                                  {booking.special_requests}
                                </p>
                              </div>
                            )}

                            {(booking.status === 'confirmed' || booking.status === 'completed') && booking.payment_status === 'pending' && (
                              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div>
                                    <p className="font-semibold text-yellow-900">Payment Required</p>
                                    <p className="text-sm text-yellow-700">
                                      {booking.status === 'confirmed'
                                        ? 'Host has confirmed your booking. Please complete payment to secure your reservation.'
                                        : 'Your booking is complete. Please submit payment to finalize your reservation.'}
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => handleOpenPayment(booking)}
                                    className="bg-brand-green hover:bg-brand-green/90 whitespace-nowrap"
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Pay Now
                                  </Button>
                                </div>
                              </div>
                            )}

                            {booking.status === 'pending' && (
                              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-blue-600" />
                                  <p className="text-sm text-blue-900">Waiting for host confirmation</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Past Bookings</h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <Card key={booking.id} className="opacity-75">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {booking.propertyName}
                                  {booking.roomNumber && ` - Room ${booking.roomNumber}`}
                                </h3>
                                <div className="flex items-center gap-2 text-gray-600 mt-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{booking.propertyCity}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {getStatusBadge(booking.status)}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="text-gray-500 text-xs">Dates</p>
                                  <p className="font-medium">
                                    {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="text-gray-500 text-xs">Guests</p>
                                  <p className="font-medium">{booking.num_guests}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="text-gray-500 text-xs">Total</p>
                                  <p className="font-medium">${booking.total_price}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
              <DialogDescription>
                Choose your payment method to complete your booking
              </DialogDescription>
            </DialogHeader>

            {selectedBooking && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Property:</span>
                    <span className="font-medium">{selectedBooking.propertyName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-medium">{format(new Date(selectedBooking.check_in), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-medium">{format(new Date(selectedBooking.check_out), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total Amount:</span>
                    <span className="font-bold text-brand-green text-lg">${selectedBooking.total_price}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="mobile_money" id="mobile_money" />
                      <Label htmlFor="mobile_money" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-5 w-5 text-brand-green" />
                        <div>
                          <p className="font-medium">Mobile Money</p>
                          <p className="text-xs text-gray-500">EVC Plus, Zaad, E-Dahab</p>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-xs text-gray-500">Visa, Mastercard</p>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="wallet" id="wallet" />
                      <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer flex-1">
                        <WalletIcon className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium">HoyConnect Wallet</p>
                          <p className="text-xs text-gray-500">Pay from your wallet balance</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                disabled={processingPayment}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcessPayment}
                disabled={processingPayment}
                className="bg-brand-green hover:bg-brand-green/90"
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Payment
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
