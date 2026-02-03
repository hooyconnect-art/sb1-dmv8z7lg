/*
  # Create Property Images Storage Bucket

  1. New Storage Bucket
    - `property-images` bucket for storing property photos
    - Public access enabled for viewing images
    - Organized by user_id/property_id folder structure

  2. Security Policies
    - Authenticated users can upload images to their own folders
    - Anyone can view public images
    - Users can only delete their own images

  3. Important Notes
    - Images are stored in format: property-images/{user_id}/{property_id}/{filename}
    - Maximum file size enforced at application level (5MB)
    - Maximum 5 images per property enforced at application level
*/

-- Create the storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Allow users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
