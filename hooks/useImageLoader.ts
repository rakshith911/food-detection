import { useState, useEffect, useCallback } from 'react';
import { Image } from 'react-native';

interface UseImageLoaderOptions {
  imageSources?: (string | number)[];
  dependencies?: any[];
}

/**
 * Hook to track when images are loaded
 * @param imageSources - Array of image sources (URIs or require() paths)
 * @param dependencies - Additional dependencies that should trigger a reload check
 * @returns Object with isLoading state and imageLoadHandlers
 */
export function useImageLoader({ 
  imageSources = [], 
  dependencies = [] 
}: UseImageLoaderOptions = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string | number>>(new Set());

  const handleImageLoad = useCallback((source: string | number) => {
    setLoadedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(source);
      return newSet;
    });
  }, []);

  const handleImageError = useCallback((source: string | number) => {
    // Even on error, mark as "loaded" so we don't wait forever
    setLoadedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(source);
      return newSet;
    });
  }, []);

  // Check if all images are loaded
  useEffect(() => {
    if (imageSources.length === 0) {
      // No images to load, mark as loaded immediately
      setIsLoading(false);
      return;
    }

    // Preload images
    const preloadPromises = imageSources.map(source => {
      return new Promise<void>((resolve) => {
        if (typeof source === 'string') {
          // URI - use Image.prefetch
          Image.prefetch(source)
            .then(() => {
              handleImageLoad(source);
              resolve();
            })
            .catch(() => {
              handleImageError(source);
              resolve(); // Resolve anyway to not block
            });
        } else {
          // require() path - give it a small delay to ensure it's loaded
          // For require() paths, we assume they're bundled and load quickly
          setTimeout(() => {
            handleImageLoad(source);
            resolve();
          }, 50);
        }
      });
    });

    Promise.all(preloadPromises).then(() => {
      // Small delay to ensure images are rendered
      setTimeout(() => {
        setIsLoading(false);
      }, 150);
    });
  }, [imageSources.join(','), ...dependencies]);

  // Reset loading state when dependencies change
  useEffect(() => {
    setIsLoading(true);
    setLoadedImages(new Set());
  }, [imageSources.join(','), ...dependencies]);

  return {
    isLoading,
    handleImageLoad,
    handleImageError,
  };
}

