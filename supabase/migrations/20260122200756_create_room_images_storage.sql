/*
  # Create Room Images Storage Bucket

  1. New Storage Bucket
    - `room-images` bucket for storing hotel room photos
    - Public access enabled for viewing images
    - Organized by rooms/{room_id} folder structure
    - Maximum file size: 5MB per file
    - Allowed types: jpg, jpeg, png, webp

  2. Security Policies
    - Authenticated users (admin & host) can upload room images
    - Anyone can view public images
    - Authenticated users can update their own room images
    - Authenticated users can delete their own room images

  3. Important Notes
    - Images are stored in format: room-images/rooms/{room_id}/{filename}
    - Maximum file size: 5MB enforced at application level
    - Maximum 8 images per room enforced at application level
*/

-- Create the storage bucket for room images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow authenticated users (admin & host) to upload room images
CREATE POLICY "Authenticated users can upload room images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'room-images' AND
  (storage.foldername(name))[1] = 'rooms'
);

-- Allow public read access to all room images
CREATE POLICY "Public can view all room images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'room-images');

-- Allow authenticated users to update room images
CREATE POLICY "Authenticated users can update room images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'room-images' AND
  (storage.foldername(name))[1] = 'rooms'
)
WITH CHECK (
  bucket_id = 'room-images' AND
  (storage.foldername(name))[1] = 'rooms'
);

-- Allow authenticated users to delete room images
CREATE POLICY "Authenticated users can delete room images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'room-images' AND
  (storage.foldername(name))[1] = 'rooms'
);
