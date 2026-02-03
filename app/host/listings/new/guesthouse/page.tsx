'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import { uploadListingImages } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ImageUploader } from '@/components/ImageUploader';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function NewGuesthouseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingType = searchParams.get('type') || 'furnished';
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    property_category: 'apartment',
    city: '',
    address: '',
    description: '',
    price_type: listingType === 'rental' ? 'month' : 'night',
    price: '',
    bedrooms: '1',
    bathrooms: '1',
    max_guests: '2',
    amenities: '',
  });

  useEffect(() => {
    if (listingType === 'rental') {
      setFormData(prev => ({ ...prev, price_type: 'month' }));
    }
  }, [listingType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setLoading(true);

    try {
      const listingId = crypto.randomUUID();

      setUploadProgress({ current: 0, total: selectedFiles.length });

      const { urls: imageUrls, errors } = await uploadListingImages(
        selectedFiles,
        user!.id,
        listingId,
        'listing-images',
        8,
        (current, total) => setUploadProgress({ current, total })
      );

      if (errors.length > 0) {
        toast.error(`Some images failed to upload: ${errors.join(', ')}`);
      }

      if (imageUrls.length === 0) {
        toast.error('All image uploads failed. Please try again.');
        setLoading(false);
        setUploadProgress(null);
        return;
      }

      const normalizedListingType = listingType === 'furnished' ? 'fully_furnished' : listingType;
      const commissionRate = normalizedListingType === 'fully_furnished' ? 12.00 : 0.00;

      const { error: listingError } = await supabase
        .from('listings')
        .insert({
          id: listingId,
          host_id: user!.id,
          listing_type: normalizedListingType,
          commission_rate: commissionRate,
          is_available: isAdmin ? true : false,
          status: isAdmin ? 'approved' : 'pending',
          approval_status: isAdmin ? 'approved' : 'pending',
          is_active: isAdmin ? true : false,
          approved_at: isAdmin ? new Date().toISOString() : null,
          approved_by: isAdmin ? user!.id : null,
        });

      if (listingError) {
        toast.error('Failed to create listing');
        console.error(listingError);
        setLoading(false);
        setUploadProgress(null);
        return;
      }

      const amenitiesArray = formData.amenities
        .split(',')
        .map(a => a.trim())
        .filter(a => a);

      const { error: guesthouseError } = await supabase
        .from('guesthouses')
        .insert({
          listing_id: listingId,
          title: formData.title,
          property_type: formData.property_category,
          city: formData.city,
          address: formData.address,
          description: formData.description,
          price_type: formData.price_type,
          price: parseFloat(formData.price),
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          max_guests: parseInt(formData.max_guests),
          amenities: amenitiesArray,
          images: imageUrls,
        });

      setLoading(false);
      setUploadProgress(null);

      if (guesthouseError) {
        toast.error(`Failed to create ${listingType === 'rental' ? 'rental property' : 'furnished property'}`);
        console.error('Error creating property:', guesthouseError);
      } else {
        if (isAdmin) {
          toast.success(`${listingType === 'rental' ? 'Rental property' : 'Furnished property'} created and approved successfully!`);
          router.push('/admin/listings');
        } else {
          toast.success(`${listingType === 'rental' ? 'Rental property' : 'Furnished property'} created successfully! Awaiting admin approval.`);
          router.push('/host/dashboard');
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/host/listings/new" className="inline-flex items-center text-primary hover:text-primary/90 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>

        <h1 className="text-3xl font-bold mb-8">
          {listingType === 'rental' ? 'List Your Rental Property' : 'List Your Fully Furnished Property'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Property Title</Label>
                <Input
                  id="title"
                  placeholder={listingType === 'rental' ? 'Spacious apartment for rent' : 'Beautiful furnished apartment'}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property_category">Property Category</Label>
                  <Select
                    value={formData.property_category}
                    onValueChange={(value) => setFormData({ ...formData, property_category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="guesthouse">Guesthouse</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Mogadishu"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Full Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street, District"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your property..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              {listingType === 'furnished' && (
                <div>
                  <Label>Pricing Type</Label>
                  <RadioGroup
                    value={formData.price_type}
                    onValueChange={(value) => setFormData({ ...formData, price_type: value })}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="night" id="night" />
                      <Label htmlFor="night" className="font-normal cursor-pointer">Per Night</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="month" id="month" />
                      <Label htmlFor="month" className="font-normal cursor-pointer">Per Month</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div>
                <Label htmlFor="price">
                  {listingType === 'rental'
                    ? 'Monthly Rent ($)'
                    : `Price ${formData.price_type === 'night' ? 'per Night' : 'per Month'} ($)`
                  }
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  placeholder={listingType === 'rental' ? '500' : '50'}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="1"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="1"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="guests">
                    {listingType === 'rental' ? 'Max Occupants' : 'Max Guests'}
                  </Label>
                  <Input
                    id="guests"
                    type="number"
                    min="1"
                    value={formData.max_guests}
                    onChange={(e) => setFormData({ ...formData, max_guests: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  placeholder="WiFi, Parking, Pool, Air Conditioning"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                />
              </div>

              <ImageUploader
                maxImages={12}
                label="Property Images"
                description="Upload property photos (max 12, JPG/PNG/WebP, 5MB each)"
                value={selectedFiles}
                onChange={setSelectedFiles}
                disabled={loading}
              />
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              uploadProgress ? (
                `Uploading images ${uploadProgress.current}/${uploadProgress.total}...`
              ) : (
                listingType === 'rental' ? 'Publishing Rental...' : 'Publishing Property...'
              )
            ) : (
              listingType === 'rental' ? 'Publish Rental' : 'Publish Property'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function NewGuesthousePage() {
  return (
    <ProtectedRoute requiredRole={['host', 'admin', 'super_admin']}>
      <NewGuesthouseContent />
    </ProtectedRoute>
  );
}
