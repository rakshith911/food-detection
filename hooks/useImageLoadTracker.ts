import { useState, useEffect, useCallback, useRef } from 'react';

interface UseImageLoadTrackerOptions {
  imageCount: number;
  minLoadTime?: number; // Minimum time to show loader (ms)
  maxLoadTime?: number; // Maximum time to wait (ms)
}

/**
 * Hook that tracks when a specific number of images have loaded
 * This is used with ImageWithLoader components that report their load status
 */
export function useImageLoadTracker({ 
  imageCount, 
  minLoadTime = 300,
  maxLoadTime = 5000 
}: UseImageLoadTrackerOptions) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const startTimeRef = useRef<number>(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleImageLoad = useCallback(() => {
    setLoadedCount(prev => {
      // Don't exceed the expected count
      if (prev < imageCount) {
        return prev + 1;
      }
      return prev;
    });
  }, [imageCount]);

  // Check if all images are loaded
  useEffect(() => {
    if (imageCount === 0) {
      setIsLoading(false);
      return;
    }

    // Reset when image count changes
    setLoadedCount(0);
    setIsLoading(true);
    startTimeRef.current = Date.now();

    // Set maximum timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, maxLoadTime);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [imageCount, maxLoadTime]);

  // Check if we've loaded all images
  useEffect(() => {
    if (loadedCount >= imageCount && imageCount > 0) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      // Wait for minimum load time to ensure smooth transition
      const timer = setTimeout(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setIsLoading(false);
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [loadedCount, imageCount, minLoadTime]);

  return {
    isLoading,
    handleImageLoad,
    loadedCount,
    totalCount: imageCount,
  };
}

