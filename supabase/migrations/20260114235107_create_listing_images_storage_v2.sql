/*
  # Create Listing Images Storage Bucket

  1. New Storage Bucket
    - `listing-images` bucket for storing hotel and guesthouse photos
    - Public access enabled for viewing images
    - Organized by user_id/listing_id folder structure

  2. Security Policies
    - Authenticated users can upload images to their own folders
    - Anyone can view public images
    - Users can only delete their own images

  3. Important Notes
    - Images are stored in format: listing-images/{user_id}/{listing_id}/{filename}
    - Maximum file size enforced at application level (5MB)
    - Maximum 8 images per listing enforced at application level
*/

-- Create the storage bucket for listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload listing images to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all images
CREATE POLICY "Public can view all listing images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-images');

-- Allow users to update their own images
CREATE POLICY "Users can update their own listing images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
