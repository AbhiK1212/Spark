'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getVideos,
  Video,
  incrementView,
} from '@/utilities/firebase/functions';
import { Card, CardContent } from '@/components/ui/card';
import { Thumbnail } from '@/components/ui/thumbnail';
import { DeleteVideoButton } from '@/components/ui/delete-video-button';
import { onAuthStateChange } from '@/utilities/firebase/firebase';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { cdnClient } from '@/utilities/cdn/cdn-client';
import { AnimatedVideoPlayer } from '@/components/video/AnimatedVideoPlayer';

function WatchContent() {
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [uploaderName, setUploaderName] = useState<string>('Loading...');
  const [hasIncrementedView, setHasIncrementedView] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoFilename = useSearchParams().get('v');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(user => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const getUploaderName = async (uid: string) => {
    try {
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.displayName || userData.name || 'Anonymous User';
      }
      return 'Anonymous User';
    } catch (error) {
      console.error('Error fetching user name:', error);
      return 'Anonymous User';
    }
  };

  const loadVideoUrl = async (videoId: string) => {
    try {
      setIsVideoLoading(true);
      setVideoError(null);

      const qualities = await cdnClient.getVideoQualities(videoId);
      const url = qualities['720p'];

      if (url) {
        setVideoUrl(url);
        setIsVideoLoading(false);
      } else {
        throw new Error('No video URL available');
      }
    } catch (error) {
      console.error('Error loading video URL:', error);
      setVideoError('Failed to load video. Please try again.');
      setIsVideoLoading(false);
    }
  };

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setIsLoading(true);
        const videos = await getVideos();
        const foundVideo = videos.find(v => v.filename === videoFilename);

        setVideo(foundVideo || null);

        // Get uploader's name if video exists
        if (foundVideo && foundVideo.uid) {
          const name = await getUploaderName(foundVideo.uid);
          setUploaderName(name);
        } else {
          setUploaderName('Anonymous User');
        }

        if (foundVideo) {
          const videoId = foundVideo.filename.split('.')[0];
          await loadVideoUrl(videoId);
        }
      } catch (error) {
        console.error('Error fetching video:', error);
        setUploaderName('Anonymous User');
      } finally {
        setIsLoading(false);
      }
    };

    if (videoFilename) {
      fetchVideo();
    } else {
      setIsLoading(false);
    }
  }, [videoFilename]);

  const handleVideoPlay = () => {
    if (video && !hasIncrementedView) {
      const videoId = video.filename.split('.')[0];
      incrementView(videoId)
        .then(() => {
          setHasIncrementedView(true);
        })
        .catch(error => {
          console.error('Failed to increment view:', error);
        });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse" data-testid="video-loading">
          <div className="bg-gray-200 h-8 w-64 mb-4 rounded"></div>
          <div className="bg-gray-200 h-96 w-full rounded"></div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Video Not Found
            </h1>
            <p className="text-gray-600">
              The video you're looking for doesn't exist or hasn't been
              processed yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Video Player */}
        <div className="mb-6">
          {!video.filename ? (
            <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Video File
                </h3>
                <p className="text-gray-600">
                  This video doesn't have a valid file associated with it.
                </p>
              </div>
            </div>
          ) : video.status === 'processing' ? (
            <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Video Processing
                </h3>
                <p className="text-gray-600 mb-4">
                  Your video is being processed. This may take a few minutes.
                </p>
                <p className="text-sm text-gray-500">
                  Please refresh the page in a few minutes to watch your video.
                </p>
              </div>
            </div>
          ) : videoError ? (
            <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Video Unavailable
                </h3>
                <p className="text-gray-600 mb-4">{videoError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : videoUrl ? (
            <AnimatedVideoPlayer
              videoUrl={videoUrl}
              poster={video.thumbnailUrl || '/placeholder-thumbnail.svg'}
              title={video.title || 'Untitled Video'}
              onLoadStart={() => setIsVideoLoading(true)}
              onCanPlay={() => setIsVideoLoading(false)}
              onPlay={handleVideoPlay}
              onError={e => {
                console.error('Video playback error:', e);
                setIsVideoLoading(false);
                setVideoError(
                  'This video is currently unavailable. It may still be processing or there was an error during upload.'
                );
              }}
              className="w-full aspect-video rounded-lg shadow-2xl overflow-hidden"
            />
          ) : (
            <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full animate-pulse"></div>
                <p className="text-gray-600">Loading video player...</p>
              </div>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900 flex-1">
                {video.title || 'Untitled Video'}
              </h1>
              {/* Delete button for video owners */}
              {user && video.uid === user.uid && (
                <div className="ml-4">
                  <DeleteVideoButton
                    videoId={video.id || video.filename?.split('.')[0] || ''}
                    videoTitle={video.title}
                    onDeleted={() => router.push('/')}
                    variant="button"
                    size="sm"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    video.status === 'processed'
                      ? 'bg-green-100 text-green-800'
                      : video.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  }`}
                >
                  {video.status === 'processed'
                    ? 'Processed'
                    : video.status === 'processing'
                      ? 'Processing...'
                      : 'Processed'}
                </span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Uploaded by:</span>
                <span className="font-medium text-gray-900">
                  {uploaderName}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">
                {video.description || 'No description available.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Video Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Status</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        video.status === 'processed'
                          ? 'bg-green-100 text-green-800'
                          : video.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {video.status === 'processed'
                        ? 'Processed'
                        : video.status === 'processing'
                          ? 'Processing...'
                          : 'Processed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Uploader</span>
                    <span className="font-medium text-gray-900">
                      {uploaderName}
                    </span>
                  </div>

                  {video.duration && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">
                        Duration
                      </span>
                      <span className="text-gray-900">
                        {Math.floor(video.duration / 60)}:
                        {(video.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  {video.views !== undefined && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Views</span>
                      <span className="text-gray-900">
                        {video.views.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {video.createdAt && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600 font-medium">
                        Uploaded
                      </span>
                      <span className="text-gray-900 text-sm">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Watch() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 w-64 mb-4 rounded"></div>
            <div className="bg-gray-200 h-96 w-full rounded"></div>
          </div>
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}
