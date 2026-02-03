import { supabase } from './supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 8;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, and WebP images are allowed';
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }

  return null;
}

export function validateImageFiles(files: File[], maxImages: number = MAX_IMAGES): string | null {
  if (files.length === 0) {
    return 'Please select at least one image';
  }

  if (files.length > maxImages) {
    return `Maximum ${maxImages} images allowed`;
  }

  for (const file of files) {
    const error = validateImageFile(file);
    if (error) {
      return error;
    }
  }

  return null;
}

export async function uploadPropertyImage(
  file: File,
  userId: string,
  propertyId: string
): Promise<UploadResult> {
  try {
    const validationError = validateImageFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${propertyId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Unexpected upload error:', error);
    return { success: false, error: error.message || 'Failed to upload image' };
  }
}

export async function uploadPropertyImages(
  files: File[],
  userId: string,
  propertyId: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ urls: string[]; errors: string[] }> {
  const validationError = validateImageFiles(files);
  if (validationError) {
    return { urls: [], errors: [validationError] };
  }

  const urls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    if (onProgress) {
      onProgress(i + 1, files.length);
    }

    const result = await uploadPropertyImage(files[i], userId, propertyId);

    if (result.success && result.url) {
      urls.push(result.url);
    } else if (result.error) {
      errors.push(`${files[i].name}: ${result.error}`);
    }
  }

  return { urls, errors };
}

export async function deletePropertyImage(imageUrl: string): Promise<boolean> {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/property-images/');
    if (pathParts.length < 2) {
      return false;
    }

    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from('property-images')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected delete error:', error);
    return false;
  }
}

export async function deletePropertyImages(imageUrls: string[]): Promise<void> {
  for (const url of imageUrls) {
    await deletePropertyImage(url);
  }
}

export async function uploadListingImage(
  file: File,
  userId: string,
  listingId: string,
  bucketName: string = 'listing-images'
): Promise<UploadResult> {
  try {
    const validationError = validateImageFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${listingId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Unexpected upload error:', error);
    return { success: false, error: error.message || 'Failed to upload image' };
  }
}

export async function uploadListingImages(
  files: File[],
  userId: string,
  listingId: string,
  bucketName: string = 'listing-images',
  maxImages: number = MAX_IMAGES,
  onProgress?: (current: number, total: number) => void
): Promise<{ urls: string[]; errors: string[] }> {
  const validationError = validateImageFiles(files, maxImages);
  if (validationError) {
    return { urls: [], errors: [validationError] };
  }

  const urls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    if (onProgress) {
      onProgress(i + 1, files.length);
    }

    const result = await uploadListingImage(files[i], userId, listingId, bucketName);

    if (result.success && result.url) {
      urls.push(result.url);
    } else if (result.error) {
      errors.push(`${files[i].name}: ${result.error}`);
    }
  }

  return { urls, errors };
}

export async function deleteListingImage(imageUrl: string, bucketName: string = 'listing-images'): Promise<boolean> {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split(`/${bucketName}/`);
    if (pathParts.length < 2) {
      return false;
    }

    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected delete error:', error);
    return false;
  }
}

export async function deleteListingImages(imageUrls: string[], bucketName: string = 'listing-images'): Promise<void> {
  for (const url of imageUrls) {
    await deleteListingImage(url, bucketName);
  }
}

export async function uploadRoomImage(
  file: File,
  roomId: string
): Promise<UploadResult> {
  try {
    const validationError = validateImageFile(file);
    if (validationError) {
      console.error('Room image validation error:', validationError);
      return { success: false, error: validationError };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `rooms/${roomId}/${fileName}`;

    console.log('Uploading room image to:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('room-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Room image upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from('room-images')
      .getPublicUrl(filePath);

    console.log('Room image uploaded successfully:', urlData.publicUrl);
    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Unexpected room image upload error:', error);
    return { success: false, error: error.message || 'Failed to upload room image' };
  }
}

export async function uploadRoomImages(
  files: File[],
  roomId: string,
  maxImages: number = MAX_IMAGES,
  onProgress?: (current: number, total: number) => void
): Promise<{ urls: string[]; errors: string[] }> {
  const validationError = validateImageFiles(files, maxImages);
  if (validationError) {
    console.error('Room images validation error:', validationError);
    return { urls: [], errors: [validationError] };
  }

  const urls: string[] = [];
  const errors: string[] = [];

  console.log(`Starting upload of ${files.length} room images for room ${roomId}`);

  for (let i = 0; i < files.length; i++) {
    if (onProgress) {
      onProgress(i + 1, files.length);
    }

    const result = await uploadRoomImage(files[i], roomId);

    if (result.success && result.url) {
      urls.push(result.url);
    } else if (result.error) {
      const errorMsg = `${files[i].name}: ${result.error}`;
      console.error('Room image upload failed:', errorMsg);
      errors.push(errorMsg);
    }
  }

  console.log(`Room image upload complete. Successful: ${urls.length}, Failed: ${errors.length}`);
  return { urls, errors };
}

export async function deleteRoomImage(imageUrl: string): Promise<boolean> {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/room-images/');
    if (pathParts.length < 2) {
      console.error('Invalid room image URL format');
      return false;
    }

    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from('room-images')
      .remove([filePath]);

    if (error) {
      console.error('Room image delete error:', error);
      return false;
    }

    console.log('Room image deleted successfully:', filePath);
    return true;
  } catch (error) {
    console.error('Unexpected room image delete error:', error);
    return false;
  }
}

export async function deleteRoomImages(imageUrls: string[]): Promise<void> {
  for (const url of imageUrls) {
    await deleteRoomImage(url);
  }
}
