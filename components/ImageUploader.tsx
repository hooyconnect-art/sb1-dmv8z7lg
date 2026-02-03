'use client';

import { useState, useRef, DragEvent } from 'react';
import { validateImageFiles } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  maxImages?: number;
  label?: string;
  description?: string;
  value: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

export function ImageUploader({
  maxImages = 12,
  label = 'Property Images',
  description = 'Upload images (max 12, JPG/PNG/WebP, 5MB each)',
  value,
  onChange,
  disabled = false,
}: ImageUploaderProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    if (disabled) return;

    const existingCount = value.length;
    const remainingSlots = maxImages - existingCount;

    if (files.length > remainingSlots) {
      toast.error(`You can only add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}`);
      files = files.slice(0, remainingSlots);
    }

    const validationError = validateImageFiles(files, maxImages);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const newFiles = [...value, ...files];
    onChange(newFiles);

    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      handleFiles(files);
    } else {
      toast.error('Please drop image files only');
    }
  };

  const removeImage = (index: number) => {
    if (disabled) return;

    const newFiles = value.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);

    URL.revokeObjectURL(previewUrls[index]);

    onChange(newFiles);
    setPreviewUrls(newUrls);
  };

  const openFilePicker = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={openFilePicker}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
        <div className="flex flex-col items-center text-center">
          <Upload className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            {isDragging ? 'Drop images here' : 'Drag & drop images here'}
          </p>
          <p className="text-xs text-gray-500 mb-3">or click to browse</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Select Images
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            {value.length} / {maxImages} images selected
          </p>
        </div>
      </div>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previewUrls.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200"
            >
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  disabled={disabled}
                  className="rounded-full p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
