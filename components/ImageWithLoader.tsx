import React from 'react';
import { ImageProps } from 'react-native';
import OptimizedImage from './OptimizedImage';

interface ImageWithLoaderProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  onImageLoad?: () => void;
  onImageError?: () => void;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

/**
 * Image component that reports when it's actually loaded and rendered
 * Used for tracking screen-level loading, not individual image loading
 * Now uses OptimizedImage for better performance and caching
 */
export default function ImageWithLoader({ 
  onImageLoad, 
  onImageError,
  resizeMode = 'cover',
  ...imageProps 
}: ImageWithLoaderProps) {
  const handleLoad = () => {
    if (onImageLoad) {
      onImageLoad();
    }
  };

  const handleError = () => {
    if (onImageError) {
      onImageError();
    }
  };

  return (
    <OptimizedImage
      {...imageProps}
      resizeMode={resizeMode}
      cachePolicy="memory-disk"
      priority="normal"
      onImageLoad={handleLoad}
      onImageError={handleError}
    />
  );
}

