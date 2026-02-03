'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users, CheckCircle2, XCircle, Clock, Wallet, TrendingUp, Plus, Edit, Trash2, Eye, Home, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Booking {
  id: string;
  guest_id: string;
  listing_id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  total_price: number;
  status: string;
  payment_status: string;
  created_at: string;
  guestName: string;
  guestEmail: string;
  propertyName: string;
  listingType: string;
  commissionRate: number;
  hasPayment: boolean;
  paymentAmount?: number;
}

interface WalletData {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_commission_paid: number;
}

interface Listing {
  id: string;
  listing_type: string;
  status: string;
  is_available: boolean;
  is_featured: boolean;
  created_at: string;
  propertyName: string;
  propertyDetails: any;
}

function HostDashboardContent() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchBookings(), fetchWallet(), fetchListings()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_guest_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      if (!bookingsData) {
        setBookings([]);
        return;
      }

      const { data: myListings } = await supabase
        .from('listings')
        .select('id, host_id, listing_type, commission_rate')
        .eq('host_id', user?.id);

      const myListingIds = myListings?.map(l => l.id) || [];
      const myBookings = bookingsData.filter(b => myListingIds.includes(b.listing_id));

      const enrichedBookings = await Promise.all(
        myBookings.map(async (booking: any) => {
          const listing = myListings?.find(l => l.id === booking.listing_id);

          let propertyName = 'Property';
          let listingType = listing?.listing_type || '';

          if (listing?.listing_type === 'hotel') {
            const { data: hotel } = await supabase
              .from('hotels')
              .select('name')
              .eq('listing_id', booking.listing_id)
              .single();
            if (hotel) propertyName = hotel.name;
          } else if (listing?.listing_type === 'guesthouse' || listing?.listing_type === 'fully_furnished') {
            const { data: guesthouse } = await supabase
              .from('guesthouses')
              .select('title')
              .eq('listing_id', booking.listing_id)
              .single();
            if (guesthouse) propertyName = guesthouse.title;
          }

          const { data: payment } = await supabase
            .from('booking_payments')
            .select('id, amount, status')
            .eq('booking_id', booking.id)
            .single();

          return {
            ...booking,
            guestName: booking.profiles?.full_name || 'Guest',
            guestEmail: booking.profiles?.email || '',
            propertyName,
            listingType,
            commissionRate: listing?.commission_rate || 0,
            hasPayment: !!payment,
            paymentAmount: payment?.amount || 0,
          };
        })
      );

      setBookings(enrichedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('host_wallets')
        .select('*')
        .eq('host_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setWallet(data);
      } else {
        setWallet({
          available_balance: 0,
          pending_balance: 0,
          total_earnings: 0,
          total_commission_paid: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchListings = async () => {
    try {
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('host_id', user?.id)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      if (!listingsData) {
        setListings([]);
        return;
      }

      const enrichedListings = await Promise.all(
        listingsData.map(async (listing: any) => {
          let propertyName = 'Property';
          let propertyDetails = null;

          if (listing.listing_type === 'hotel') {
            const { data: hotel } = await supabase
              .from('hotels')
              .select('*')
              .eq('listing_id', listing.id)
              .single();
            if (hotel) {
              propertyName = hotel.name;
              propertyDetails = hotel;
            }
          } else if (listing.listing_type === 'guesthouse' || listing.listing_type === 'fully_furnished') {
            const { data: guesthouse } = await supabase
              .from('guesthouses')
              .select('*')
              .eq('listing_id', listing.id)
              .single();
            if (guesthouse) {
              propertyName = guesthouse.title;
              propertyDetails = guesthouse;
            }
          }

          return {
            ...listing,
            propertyName,
            propertyDetails,
          };
        })
      );

      setListings(enrichedListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      toast.loading('Confirming booking...', { id: 'payment-processing' });

      const response = await fetch('/api/payments/process-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Booking confirmed successfully.', { id: 'payment-processing' });
        await fetchBookings();
      } else {
        toast.error(data.error || data.message || 'Booking confirmation failed', { id: 'payment-processing' });
      }
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      toast.error('Failed to confirm booking', { id: 'payment-processing' });
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: 'Rejected by host'
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Booking rejected');
      await fetchBookings();
    } catch (error: any) {
      console.error('Error rejecting booking:', error);
      toast.error('Failed to reject booking');
    }
  };

  const handleDeleteListing = async () => {
    if (!listingToDelete) return;

    try {
      const listing = listings.find(l => l.id === listingToDelete);

      if (listing?.listing_type === 'hotel') {
        await supabase.from('rooms').delete().eq('listing_id', listingToDelete);
        await supabase.from('hotels').delete().eq('listing_id', listingToDelete);
      } else if (listing?.listing_type === 'guesthouse' || listing?.listing_type === 'fully_furnished') {
        await supabase.from('guesthouses').delete().eq('listing_id', listingToDelete);
      }

      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingToDelete);

      if (error) throw error;

      toast.success('Listing deleted successfully');
      await fetchListings();
      setDeleteDialogOpen(false);
      setListingToDelete(null);
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  const handleToggleAvailability = async (listingId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_available: !currentStatus })
        .eq('id', listingId);

      if (error) throw error;

      toast.success(`Listing ${!currentStatus ? 'activated' : 'deactivated'}`);
      await fetchListings();
    } catch (error: any) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update listing');
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
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  const getListingTypeBadge = (type: string) => {
    const types: { [key: string]: { label: string; className: string } } = {
      hotel: { label: 'Hotel', className: 'bg-blue-100 text-blue-800' },
      guesthouse: { label: 'Guesthouse', className: 'bg-purple-100 text-purple-800' },
      fully_furnished: { label: 'Fully Furnished', className: 'bg-orange-100 text-orange-800' },
    };
    const typeInfo = types[type] || { label: type, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={typeInfo.className}>{typeInfo.label}</Badge>;
  };

  const getListingStatusBadge = (status: string, isAvailable: boolean) => {
    if (!isAvailable) {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
  const paidBookings = bookings.filter(b => b.payment_status === 'paid');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Host Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your bookings and earnings</p>
          </div>
          <div className="flex gap-3">
            <Link href="/host/settings/payment">
              <Button variant="outline">
                <Wallet className="h-4 w-4 mr-2" />
                Payment Settings
              </Button>
            </Link>
            <Link href="/host/listings/new">
              <Button className="bg-brand-green hover:bg-brand-green/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Listing
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4 text-brand-green" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-brand-green">
                ${wallet?.available_balance.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                ${wallet?.total_earnings.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Pending Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{pendingBookings.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Paid Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{paidBookings.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">
              <Home className="h-4 w-4 mr-2" />
              My Listings ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Approval ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Active Bookings ({confirmedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Bookings ({bookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {listings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
                  <p className="text-gray-500 mb-6">Create your first listing to start hosting</p>
                  <Link href="/host/listings/new">
                    <Button className="bg-brand-green hover:bg-brand-green/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Listing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {listing.propertyName}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {getListingTypeBadge(listing.listing_type)}
                              {getListingStatusBadge(listing.status, listing.is_available)}
                              {listing.is_featured && (
                                <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {listing.propertyDetails && (
                          <div className="text-sm text-gray-600 space-y-1">
                            {listing.propertyDetails.location && (
                              <p>📍 {listing.propertyDetails.location}</p>
                            )}
                            {listing.propertyDetails.price_per_night && (
                              <p className="text-brand-green font-semibold">
                                ${listing.propertyDetails.price_per_night}/night
                              </p>
                            )}
                          </div>
                        )}

                        <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                          <Link href={`/listings/${listing.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAvailability(listing.id, listing.is_available)}
                            className={listing.is_available ? 'text-gray-600' : 'text-green-600'}
                          >
                            {listing.is_available ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setListingToDelete(listing.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No pending bookings
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {booking.propertyName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Guest: {booking.guestName} ({booking.guestEmail})
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(booking.status)}
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

                        <div className="flex gap-3 mt-4">
                          <Button
                            onClick={() => handleConfirmBooking(booking.id)}
                            className="bg-brand-green hover:bg-brand-green/90"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Confirm Booking
                          </Button>
                          <Button
                            onClick={() => handleRejectBooking(booking.id)}
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4">
            {confirmedBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No active bookings
                </CardContent>
              </Card>
            ) : (
              confirmedBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {booking.propertyName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Guest: {booking.guestName}
                            </p>
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
                              <p className="text-gray-500 text-xs">Dates</p>
                              <p className="font-medium">
                                {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd')}
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
                          {booking.payment_status === 'paid' && (
                            <div className="flex items-center gap-2 text-sm">
                              <Wallet className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-gray-500 text-xs">Your Earnings</p>
                                <p className="font-medium text-brand-green">
                                  ${(booking.total_price * (1 - booking.commissionRate / 100)).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No bookings yet
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.propertyName}
                        </h3>
                        <p className="text-sm text-gray-600">Guest: {booking.guestName}</p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(booking.status)}
                        {getPaymentBadge(booking.payment_status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-500">Check-in</p>
                        <p className="font-medium">{format(new Date(booking.check_in), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Check-out</p>
                        <p className="font-medium">{format(new Date(booking.check_out), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Guests</p>
                        <p className="font-medium">{booking.num_guests}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-medium text-brand-green">${booking.total_price}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Listing</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this listing? This action cannot be undone.
                All associated data including rooms and bookings will be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setListingToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteListing}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function HostDashboard() {
  return (
    <ProtectedRoute allowedRoles={['host']}>
      <HostDashboardContent />
    </ProtectedRoute>
  );
}
