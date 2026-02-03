/*
  # Create Storage Buckets for HoyConnect Images

  ## Overview
  Creates storage buckets for property, listing, and room images with proper security policies.

  ## New Buckets
  - `property-images` - For property sales images
  - `listing-images` - For hotel and guesthouse listing images  
  - `room-images` - For hotel room images

  ## Security
  - All buckets are public (images viewable by anyone)
  - Upload restricted to authenticated users only
  - Users can only upload to their own folders
  - Admins and super_admins can upload anywhere

  ## Important Notes
  - Images are organized by user/listing/room IDs in folder structure
  - 5MB file size limit per image
  - Allowed types: JPEG, PNG, WebP
*/

-- Create property-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create listing-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create room-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for property-images
CREATE POLICY "Anyone can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images' AND
    (SPLIT_PART(name, '/', 1) = auth.uid()::text OR
     (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can update their own property images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images' AND
    (SPLIT_PART(name, '/', 1) = auth.uid()::text OR
     (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can delete their own property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images' AND
    (SPLIT_PART(name, '/', 1) = auth.uid()::text OR
     (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  );

-- Storage policies for listing-images
CREATE POLICY "Anyone can view listing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images' AND
    (SPLIT_PART(name, '/', 1) = auth.uid()::text OR
     (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can update their own listing images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-images' AND
    (SPLIT_PART(name, '/', 1) = auth.uid()::text OR
     (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can delete their own listing images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images' AND
    (SPLIT_PART(name, '/', 1) = auth.uid()::text OR
     (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
  );

-- Storage policies for room-images
CREATE POLICY "Anyone can view room images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'room-images');

CREATE POLICY "Authenticated users can upload room images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'room-images' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('host', 'admin', 'super_admin')
  );

CREATE POLICY "Hosts can update room images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'room-images' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('host', 'admin', 'super_admin')
  );

CREATE POLICY "Hosts can delete room images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'room-images' AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('host', 'admin', 'super_admin')
  );
