'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ThumbnailProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  videoFilename?: string;
  duration?: number;
}

export function Thumbnail({
  src,
  alt,
  width = 320,
  height = 180,
  className = '',
  videoFilename,
  duration,
}: ThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [fallbackAttempt, setFallbackAttempt] = useState(0);

  // Smart thumbnail URL selection with priority system
  const getThumbnailSources = (): string[] => {
    const sources: string[] = [];

    // 1. Use provided src if available
    if (src) {
      sources.push(src);
    }

    // 2. Try custom thumbnail from video filename
    if (videoFilename) {
      const videoId = videoFilename.replace('processed-', '').split('.')[0];
      // Try new CDN structure first
      sources.push(
        `https://storage.googleapis.com/abhi-yt-processed-videos/thumbnails/${videoId}/custom-thumb.jpg`
      );
      sources.push(
        `https://storage.googleapis.com/abhi-yt-processed-videos/thumbnails/${videoId}/thumb-1.jpg`
      );
      // Fallback to old structure for existing videos
      sources.push(
        `https://storage.googleapis.com/abhi-yt-processed-videos/${videoId}-custom-thumb.jpg`
      );
      sources.push(
        `https://storage.googleapis.com/abhi-yt-processed-videos/${videoId}-thumb-1.jpg`
      );
    }

    // 3. Always fallback to placeholder
    sources.push('/placeholder-thumbnail.svg');

    return sources;
  };

  const thumbnailSources = getThumbnailSources();
  const currentSource =
    thumbnailSources[fallbackAttempt] || '/placeholder-thumbnail.svg';

  const handleError = () => {
    // Try next fallback
    if (fallbackAttempt < thumbnailSources.length - 1) {
      setFallbackAttempt(prev => prev + 1);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Loading skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Main thumbnail image */}
      <Image
        src={currentSource}
        alt={alt}
        fill
        className="object-cover"
        onError={handleError}
        onLoad={handleLoad}
        sizes={`${width}px`}
        priority={false}
        key={`${currentSource}-${fallbackAttempt}`} // Force re-render on fallback
      />

      {/* Duration badge */}
      {duration && duration > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {Math.floor(duration / 60)}:
          {(duration % 60).toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
}

export default Thumbnail;
