'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import { uploadListingImages, uploadRoomImages } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/ImageUploader';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Room {
  id: string;
  room_type: string;
  price_per_night: string;
  max_guests: string;
  quantity: string;
  amenities: string;
  files: File[];
  previewUrls: string[];
}

function NewHotelContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    description: '',
    rating: '',
    amenities: '',
    check_in_time: '14:00',
    check_out_time: '12:00',
  });

  const handleRoomFilesChange = (roomId: string, files: File[]) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        return { ...room, files, previewUrls: [] };
      }
      return room;
    }));
  };

  const addRoom = () => {
    setRooms([...rooms, {
      id: crypto.randomUUID(),
      room_type: 'single',
      price_per_night: '',
      max_guests: '1',
      quantity: '1',
      amenities: '',
      files: [],
      previewUrls: [],
    }]);
  };

  const removeRoom = (id: string) => {
    const room = rooms.find(r => r.id === id);
    if (room) {
      room.previewUrls.forEach(url => URL.revokeObjectURL(url));
    }
    setRooms(rooms.filter(r => r.id !== id));
  };

  const updateRoom = (id: string, field: keyof Room, value: any) => {
    setRooms(rooms.map(room => room.id === id ? { ...room, [field]: value } : room));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      toast.error('Please upload at least one hotel image');
      return;
    }

    if (rooms.length === 0) {
      toast.error('Please add at least one room to publish the hotel');
      return;
    }

    for (const room of rooms) {
      if (!room.price_per_night || parseFloat(room.price_per_night) <= 0) {
        toast.error('All rooms must have a valid price');
        return;
      }
    }

    setLoading(true);

    try {
      const listingId = crypto.randomUUID();

      const totalImages = selectedFiles.length + rooms.reduce((sum, r) => sum + r.files.length, 0);
      let uploadedCount = 0;

      setUploadProgress({ current: 0, total: totalImages });

      const { urls: hotelImageUrls, errors: hotelErrors } = await uploadListingImages(
        selectedFiles,
        user!.id,
        listingId,
        'listing-images',
        8,
        (current) => {
          uploadedCount = current;
          setUploadProgress({ current: uploadedCount, total: totalImages });
        }
      );

      if (hotelErrors.length > 0) {
        toast.error(`Some hotel images failed: ${hotelErrors.join(', ')}`);
      }

      if (hotelImageUrls.length === 0) {
        toast.error('Hotel image upload failed');
        setLoading(false);
        setUploadProgress(null);
        return;
      }

      const { error: listingError } = await supabase
        .from('listings')
        .insert({
          id: listingId,
          host_id: user!.id,
          listing_type: 'hotel',
          commission_rate: 15.00,
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

      const amenitiesArray = formData.amenities.split(',').map(a => a.trim()).filter(a => a);

      const { data: hotelData, error: hotelError } = await supabase
        .from('hotels')
        .insert({
          listing_id: listingId,
          name: formData.name,
          city: formData.city,
          address: formData.address,
          description: formData.description,
          rating: formData.rating ? parseInt(formData.rating) : null,
          amenities: amenitiesArray,
          check_in_time: formData.check_in_time,
          check_out_time: formData.check_out_time,
          images: hotelImageUrls,
        })
        .select()
        .single();

      if (hotelError || !hotelData) {
        toast.error('Failed to create hotel');
        console.error(hotelError);
        setLoading(false);
        setUploadProgress(null);
        return;
      }

      for (const room of rooms) {
        const roomAmenities = room.amenities.split(',').map(a => a.trim()).filter(a => a);

        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .insert({
            hotel_id: hotelData.id,
            room_type: room.room_type,
            price_per_night: parseFloat(room.price_per_night),
            max_guests: parseInt(room.max_guests),
            quantity: parseInt(room.quantity),
            amenities: roomAmenities,
            images: [],
          })
          .select()
          .single();

        if (roomError || !roomData) {
          console.error('Failed to create room:', roomError);
          toast.error(`Failed to create ${room.room_type} room`);
          continue;
        }

        if (room.files.length > 0) {
          console.log(`Uploading ${room.files.length} images for room ${roomData.id}`);
          const { urls: roomImageUrls, errors: roomErrors } = await uploadRoomImages(
            room.files,
            roomData.id,
            8,
            (current) => {
              uploadedCount = selectedFiles.length + current;
              setUploadProgress({ current: uploadedCount, total: totalImages });
            }
          );

          if (roomErrors.length > 0) {
            console.error('Room image upload errors:', roomErrors);
            toast.error(`Some room images failed to upload: ${roomErrors.join(', ')}`);
          }

          if (roomImageUrls.length > 0) {
            const { error: updateError } = await supabase
              .from('rooms')
              .update({ images: roomImageUrls })
              .eq('id', roomData.id);

            if (updateError) {
              console.error('Failed to update room with images:', updateError);
            } else {
              console.log(`Successfully uploaded ${roomImageUrls.length} images for room ${roomData.id}`);
            }
          }
        }
      }

      setLoading(false);
      setUploadProgress(null);
      if (isAdmin) {
        toast.success('Hotel created and approved successfully!');
        router.push('/admin/listings');
      } else {
        toast.success('Hotel created successfully! Awaiting admin approval.');
        router.push('/host/dashboard');
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/host/listings/new" className="inline-flex items-center text-primary hover:text-primary/90 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>

        <h1 className="text-3xl font-bold mb-8">List Your Hotel</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Hotel Name</Label>
                <Input
                  id="name"
                  placeholder="Grand Plaza Hotel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="rating">Star Rating (Optional)</Label>
                  <Select value={formData.rating} onValueChange={(value) => setFormData({ ...formData, rating: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Star</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                    </SelectContent>
                  </Select>
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
                  placeholder="Describe your hotel..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check_in">Check-in Time</Label>
                  <Input
                    id="check_in"
                    type="time"
                    value={formData.check_in_time}
                    onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="check_out">Check-out Time</Label>
                  <Input
                    id="check_out"
                    type="time"
                    value={formData.check_out_time}
                    onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="amenities">Hotel Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  placeholder="WiFi, Restaurant, Pool, Gym, Parking"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                />
              </div>

              <ImageUploader
                maxImages={12}
                label="Hotel Images"
                description="Upload hotel photos (max 12, JPG/PNG/WebP, 5MB each)"
                value={selectedFiles}
                onChange={setSelectedFiles}
                disabled={loading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Rooms</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Add at least one room to publish your hotel</p>
                </div>
                <Button type="button" onClick={addRoom} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {rooms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No rooms added yet. Click "Add Room" to get started.</p>
                </div>
              ) : (
                rooms.map((room, idx) => (
                  <Card key={room.id} className="border-2">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Room {idx + 1}</CardTitle>
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeRoom(room.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Room Type</Label>
                          <Select value={room.room_type} onValueChange={(value) => updateRoom(room.id, 'room_type', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="double">Double</SelectItem>
                              <SelectItem value="suite">Suite</SelectItem>
                              <SelectItem value="deluxe">Deluxe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Price per Night ($)</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="50"
                            value={room.price_per_night}
                            onChange={(e) => updateRoom(room.id, 'price_per_night', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Max Guests</Label>
                          <Input
                            type="number"
                            min="1"
                            value={room.max_guests}
                            onChange={(e) => updateRoom(room.id, 'max_guests', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={room.quantity}
                            onChange={(e) => updateRoom(room.id, 'quantity', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Room Amenities (comma-separated)</Label>
                        <Input
                          placeholder="TV, Mini Bar, Balcony"
                          value={room.amenities}
                          onChange={(e) => updateRoom(room.id, 'amenities', e.target.value)}
                        />
                      </div>

                      <ImageUploader
                        maxImages={8}
                        label="Room Images"
                        description="Upload room photos (max 8, JPG/PNG/WebP, 5MB each)"
                        value={room.files}
                        onChange={(files) => handleRoomFilesChange(room.id, files)}
                        disabled={loading}
                      />
                    </CardContent>
                  </Card>
                ))
              )}
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
                'Publishing Hotel...'
              )
            ) : (
              'Publish Hotel'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function NewHotelPage() {
  return (
    <ProtectedRoute requiredRole={['host', 'admin', 'super_admin']}>
      <NewHotelContent />
    </ProtectedRoute>
  );
}
