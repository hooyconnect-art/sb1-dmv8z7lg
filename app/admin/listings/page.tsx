'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Check, X, Search, ToggleLeft, ToggleRight, Star, Eye } from 'lucide-react';
import ListingReviewModal from '@/components/ListingReviewModal';

interface Listing {
  id: string;
  listing_type: string;
  status: string;
  is_available: boolean;
  is_featured: boolean;
  host_id: string;
  created_at: string;
  hotel?: {
    name: string;
    city: string;
    address: string;
    description: string;
    rating: number;
    amenities: string[];
    check_in_time: string;
    check_out_time: string;
    images: string[];
  };
  guesthouse?: {
    title: string;
    property_type: string;
    city: string;
    address: string;
    description: string;
    price: number;
    price_type: string;
    bedrooms: number;
    bathrooms: number;
    max_guests: number;
    amenities: string[];
    images: string[];
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function ListingsManagement() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [searchTerm, statusFilter, typeFilter, listings]);

  const fetchListings = async () => {
    try {
      const response = await fetch('/api/listings/list');

      if (!response.ok) {
        toast.error('Failed to fetch listings');
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to fetch listings');
        setLoading(false);
        return;
      }

      const transformedListings = (result.listings || []).map((listing: any) => ({
        ...listing,
        hotel: listing.hotels?.[0],
        guesthouse: listing.guesthouses?.[0],
      }));

      setListings(transformedListings);
      setFilteredListings(transformedListings);
    } catch (error) {
      toast.error('Failed to fetch listings');
    }
    setLoading(false);
  };

  const filterListings = () => {
    let filtered = listings;

    if (searchTerm) {
      filtered = filtered.filter((listing) => {
        const isHotel = listing.listing_type === 'hotel';
        const title = isHotel ? listing.hotel?.name : listing.guesthouse?.title;
        const city = isHotel ? listing.hotel?.city : listing.guesthouse?.city;
        const ownerEmail = listing.profiles?.email || '';

        return (
          title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((listing) => listing.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((listing) => listing.listing_type === typeFilter);
    }

    setFilteredListings(filtered);
  };

  const openReviewModal = (listing: Listing) => {
    setSelectedListing(listing);
    setIsReviewModalOpen(true);
  };

  const handleApprove = async (listingId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/listings/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          approvedBy: session?.user?.id || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to approve listing');
        console.error(result.error);
        return;
      }

      toast.success('Listing approved successfully');
      fetchListings();
    } catch (error) {
      toast.error('Failed to approve listing');
      console.error(error);
    }
  };

  const handleReject = async (listingId: string, reason?: string) => {
    try {
      const response = await fetch('/api/listings/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          reason: reason || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to reject listing');
        console.error(result.error);
        return;
      }

      toast.success('Listing rejected');
      fetchListings();
    } catch (error) {
      toast.error('Failed to reject listing');
      console.error(error);
    }
  };

  const toggleAvailability = async (listingId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/listings/toggle-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          isAvailable: !currentStatus,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to update availability');
        console.error(result.error);
        return;
      }

      toast.success(`Listing ${!currentStatus ? 'available' : 'unavailable'} for booking`);
      fetchListings();
    } catch (error) {
      toast.error('Failed to update availability');
      console.error(error);
    }
  };

  const toggleFeatured = async (listingId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/listings/toggle-featured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          isFeatured: !currentStatus,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error('Failed to update featured status');
        console.error(result.error);
        return;
      }

      toast.success(`Listing ${!currentStatus ? 'featured' : 'unfeatured'}`);
      fetchListings();
    } catch (error) {
      toast.error('Failed to update featured status');
      console.error(error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const listingStats = {
    total: listings.length,
    pending: listings.filter((l) => l.status === 'pending').length,
    approved: listings.filter((l) => l.status === 'approved').length,
    rejected: listings.filter((l) => l.status === 'rejected').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">Listings Management</h1>
            <p className="text-muted-foreground mt-2">
              Review and approve property listings
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Building2 className="h-5 w-5 text-brand-green" />
            <span className="font-semibold">{filteredListings.length}</span>
            <span className="text-muted-foreground">
              of {listings.length} listings
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Listings</p>
              <p className="text-2xl font-bold text-brand-navy">{listingStats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{listingStats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">{listingStats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{listingStats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <CardTitle>All Listings</CardTitle>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search listings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-48"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="guesthouse">Guesthouse</SelectItem>
                    <SelectItem value="fully_furnished">Fully Furnished</SelectItem>
                    <SelectItem value="rental">Rental</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
              </div>
            ) : filteredListings.length > 0 ? (
              <div className="space-y-4">
                {filteredListings.map((listing) => {
                  const isHotel = listing.listing_type === 'hotel';
                  const isGuesthouse = listing.listing_type === 'guesthouse' || listing.listing_type === 'fully_furnished' || listing.listing_type === 'rental';
                  const title = isHotel ? listing.hotel?.name : listing.guesthouse?.title;
                  const city = isHotel ? listing.hotel?.city : listing.guesthouse?.city;
                  const images = isHotel ? listing.hotel?.images : listing.guesthouse?.images;

                  return (
                    <div
                      key={listing.id}
                      className="border rounded-lg p-4 hover:border-brand-green/50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start space-x-4 flex-1">
                          {images?.[0] ? (
                            <img
                              src={images[0]}
                              alt={title}
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                              No Image
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-brand-navy truncate">{title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {listing.listing_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{city}</p>
                            <p className="text-sm text-muted-foreground">
                              Owner: {listing.profiles?.email || 'Unknown'}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge className={getStatusBadgeColor(listing.status)}>
                                {listing.status}
                              </Badge>
                              <Badge
                                className={
                                  listing.is_available
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {listing.is_available ? 'Available' : 'Unavailable'}
                              </Badge>
                              {listing.is_featured && (
                                <Badge className="bg-amber-100 text-amber-800">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Created: {new Date(listing.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 lg:items-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReviewModal(listing)}
                            className="w-full lg:w-auto border-brand-green text-brand-green hover:bg-brand-green/10"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {listing.status === 'pending' ? 'Review Listing' : 'View Details'}
                          </Button>
                          {listing.status === 'approved' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleAvailability(listing.id, listing.is_available)}
                                className="w-full lg:w-auto"
                              >
                                {listing.is_available ? (
                                  <>
                                    <ToggleRight className="h-4 w-4 mr-1" />
                                    Mark Unavailable
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="h-4 w-4 mr-1" />
                                    Mark Available
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant={listing.is_featured ? "default" : "outline"}
                                onClick={() => toggleFeatured(listing.id, listing.is_featured)}
                                className="w-full lg:w-auto"
                              >
                                <Star className="h-4 w-4 mr-1" />
                                {listing.is_featured ? 'Unfeature' : 'Feature'}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No listings found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ListingReviewModal
        listing={selectedListing}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedListing(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </AdminLayout>
  );
}
