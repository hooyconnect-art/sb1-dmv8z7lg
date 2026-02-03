'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, MapPin, Star, Calendar, Clock, ImageIcon, User } from 'lucide-react';

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

interface ListingReviewModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (listingId: string) => void;
  onReject: (listingId: string, reason?: string) => void;
}

export default function ListingReviewModal({
  listing,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: ListingReviewModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!listing) return null;

  const isHotel = listing.listing_type === 'hotel';
  const details = isHotel ? listing.hotel : listing.guesthouse;
  const title = isHotel ? details?.name : details?.title;
  const images = details?.images || [];
  const hasImages = images.length > 0;

  const handleApprove = () => {
    onApprove(listing.id);
    onClose();
  };

  const handleReject = () => {
    onReject(listing.id, rejectionReason);
    setRejectionReason('');
    setShowRejectForm(false);
    onClose();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-navy">
            Review Listing
          </DialogTitle>
          <DialogDescription>
            Review all details before approving or rejecting this listing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {hasImages ? (
            <div className="relative">
              <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={images[currentImageIndex]}
                  alt={`${title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                      →
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className={`w-20 h-20 object-cover rounded cursor-pointer transition-all ${
                        idx === currentImageIndex ? 'ring-2 ring-brand-green' : 'opacity-60 hover:opacity-100'
                      }`}
                      onClick={() => setCurrentImageIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-2" />
                <p>No images uploaded</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-brand-navy text-lg mb-2">Basic Information</h3>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Property Name</p>
                    <p className="font-medium text-brand-navy">{title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Property Type</p>
                    <Badge variant="outline" className="mt-1">
                      {listing.listing_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      className={
                        listing.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 mt-1'
                          : listing.status === 'approved'
                          ? 'bg-green-100 text-green-800 mt-1'
                          : 'bg-red-100 text-red-800 mt-1'
                      }
                    >
                      {listing.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-brand-navy text-lg mb-2">Owner Information</h3>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{listing.profiles?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-sm font-mono">{listing.profiles?.email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Created {new Date(listing.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-brand-navy text-lg mb-2">Location</h3>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-brand-green mt-1" />
                    <div>
                      <p className="font-medium">{details?.city}</p>
                      {isHotel && listing.hotel?.address && (
                        <p className="text-sm text-muted-foreground">{listing.hotel.address}</p>
                      )}
                      {!isHotel && listing.guesthouse?.address && (
                        <p className="text-sm text-muted-foreground">{listing.guesthouse.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isHotel && listing.hotel && (
                <>
                  {listing.hotel.rating && (
                    <div>
                      <h3 className="font-semibold text-brand-navy text-lg mb-2">Rating</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < (listing.hotel?.rating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 font-medium">{listing.hotel.rating} / 5</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {(listing.hotel.check_in_time || listing.hotel.check_out_time) && (
                    <div>
                      <h3 className="font-semibold text-brand-navy text-lg mb-2">Check-in / Check-out</h3>
                      <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                        {listing.hotel.check_in_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Check-in: {listing.hotel.check_in_time}</span>
                          </div>
                        )}
                        {listing.hotel.check_out_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Check-out: {listing.hotel.check_out_time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isHotel && listing.guesthouse && (
                <>
                  {listing.guesthouse.price && (
                    <div>
                      <h3 className="font-semibold text-brand-navy text-lg mb-2">Price</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-brand-green">
                          ${listing.guesthouse.price}
                          <span className="text-sm font-normal text-muted-foreground">
                            {' '}/ {listing.guesthouse.price_type || 'night'}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-brand-navy text-lg mb-2">Property Details</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      {listing.guesthouse.property_type && (
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-medium">{listing.guesthouse.property_type}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Bedrooms</p>
                          <p className="font-medium">{listing.guesthouse.bedrooms}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Bathrooms</p>
                          <p className="font-medium">{listing.guesthouse.bathrooms}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Guests</p>
                          <p className="font-medium">{listing.guesthouse.max_guests}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {details?.description && (
            <div>
              <h3 className="font-semibold text-brand-navy text-lg mb-2">Description</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{details.description}</p>
              </div>
            </div>
          )}

          {details?.amenities && details.amenities.length > 0 && (
            <div>
              <h3 className="font-semibold text-brand-navy text-lg mb-2">Amenities</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {details.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="bg-brand-green/10 text-brand-green">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {listing.status === 'pending' && !showRejectForm && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white"
                size="lg"
                onClick={handleApprove}
              >
                <Check className="h-5 w-5 mr-2" />
                Approve Listing
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="flex-1"
                onClick={() => setShowRejectForm(true)}
              >
                <X className="h-5 w-5 mr-2" />
                Reject Listing
              </Button>
            </div>
          )}

          {showRejectForm && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Explain why this listing is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  size="lg"
                  className="flex-1"
                  onClick={handleReject}
                >
                  <X className="h-5 w-5 mr-2" />
                  Confirm Rejection
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {listing.status !== 'pending' && (
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
