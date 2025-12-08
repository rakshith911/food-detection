import React from 'react';
import { Image, ActivityIndicator, StyleSheet, View, Text, ImageProps } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

type OptimizedImageProps = ImageProps & {
  cachePolicy?: 'none' | 'memory' | 'disk' | 'memory-disk';
  priority?: 'low' | 'normal' | 'high';
  showLoader?: boolean;
  onImageLoad?: () => void;
  onImageError?: () => void;
};

export default function OptimizedImage({
  source,
  resizeMode = 'cover',
  cachePolicy = 'memory-disk',
  priority = 'normal',
  onImageLoad,
  onImageError,
  showLoader = false,
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const contentFit = resizeMode === 'cover' ? 'cover' : resizeMode === 'contain' ? 'contain' : resizeMode;

  const handleLoad = () => {
    setIsLoading(false);
    onImageLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onImageError?.();
  };

  if (typeof source === 'number') {
    return (
      <View style={[styles.container, style]}>
        <Image
          source={source}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
        {showLoader && isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#7BA21B" />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ExpoImage
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit as any}
        cachePolicy={cachePolicy}
        priority={priority}
        transition={200}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {showLoader && isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#7BA21B" />
        </View>
      )}
      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
});

