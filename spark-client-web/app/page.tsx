'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getVideos, Video } from '../utilities/firebase/functions';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Thumbnail } from '@/components/ui/thumbnail';
import { DeleteVideoButton } from '@/components/ui/delete-video-button';
import { onAuthStateChange } from '@/utilities/firebase/firebase';
import { User } from 'firebase/auth';
import { Play, Eye, Clock, TrendingUp, Sparkles, Zap } from 'lucide-react';
import { ensureUserProfile } from '@/utilities/firebase/functions';

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(user => {
      setUser(user);
      if (user) {
        ensureUserProfile(user);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchVideos = async () => {
    try {
      if (videos.length === 0) {
        setIsLoading(true);
      }
      const videoData = await getVideos();
      setVideos(videoData);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section Skeleton */}
        <div className="mb-12">
          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>

        {/* Video Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" data-testid="loading-spinner">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card
              key={i}
              className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="aspect-video bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 rounded-t-lg animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div className="flex items-center justify-between mt-3">
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (videos.length === 0) {
    return (
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          {/* Hero Icon */}
          <div className="relative mx-auto mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
              <Sparkles className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Animated Title */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-fade-in">
            Welcome to Spark
          </h1>
          <p className="text-xl text-gray-600 mb-8 animate-fade-in-up">
            Upload, process, and share videos instantly!
          </p>
          <p className="text-lg text-gray-500 mb-8" data-testid="no-videos-message">
            No videos yet
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Play className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Upload Videos
                </h3>
                <p className="text-sm text-gray-600">
                  Share your content with the world
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 delay-100">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Grow Your Audience
                </h3>
                <p className="text-sm text-gray-600">
                  Build a community around your content
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 delay-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-pink-100 rounded-full flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                  <Zap className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Lightning Fast
                </h3>
                <p className="text-sm text-gray-600">
                  Optimized for speed and performance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="space-y-4 animate-fade-in-up delay-300">
            <p className="text-lg text-gray-700">
              {user
                ? '🎉 Welcome back! Ready to create something amazing?'
                : '✨ Join the community and start sharing your story'}
            </p>
            {!user && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Ready to Spark?
                </h3>
                <p className="text-sm text-blue-800">
                  Sign in to upload videos, create playlists, and engage with
                  creators worldwide.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-fade-in">
          Discover Amazing Content
        </h1>
        <p className="text-xl text-gray-600 mb-6 animate-fade-in-up">
          Watch the latest videos from creators around the world
        </p>

        {user && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 max-w-2xl mx-auto animate-scale-in">
            <p className="text-blue-900">
              <strong>Welcome back, {user.displayName || user.email}!</strong>
              <span className="ml-2">
                Ready to upload your next masterpiece?
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" data-testid="video-grid">
        {videos.map((video, index) => {
          const isOwner = user && video.uid === user.uid;

          return (
            <div
              key={video.id || video.filename || `video-${index}`}
              className="group relative animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Link href={`/watch?v=${video.filename}`} className="block">
                <Card className="video-card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] border-0 bg-white/80 backdrop-blur-sm">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <Thumbnail
                      src={video.thumbnailUrl}
                      alt={video.title || 'Video thumbnail'}
                      videoFilename={video.filename}
                      duration={video.duration}
                      className="group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-2xl">
                        <Play className="w-7 h-7 text-gray-900 ml-1" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3
                      className="font-semibold text-gray-900 mb-1 overflow-hidden text-ellipsis"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {video.title || 'Untitled Video'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {video.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
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
                            ? 'Processing'
                            : 'Processed'}
                      </span>
                      <span>{video.views || 0} views</span>
                    </div>
                    {video.createdAt && (
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>

              {/* Delete button for video owners - only show on hover */}
              {isOwner && (
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <DeleteVideoButton
                    videoId={video.id || video.filename?.split('.')[0] || ''}
                    videoTitle={video.title}
                    onDeleted={fetchVideos}
                    variant="icon"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
