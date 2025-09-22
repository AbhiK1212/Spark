'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Calendar,
  MapPin,
  Globe,
  Mail,
  Users,
  Video,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Edit,
  Settings,
  Bell,
  BellOff,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import Thumbnail from '@/components/ui/thumbnail';
import { getVideos } from '@/utilities/firebase/functions';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate: string;
  lastActive: string;
  isVerified: boolean;
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  stats: {
    totalVideos: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
  };
}

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  duration: number;
  status: 'processing' | 'processed' | 'failed';
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  videoCount: number;
  totalViews: number;
  isPublic: boolean;
  createdAt: string;
}

const UserProfilePage: React.FC = () => {
  const params = useParams();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>(
    'newest'
  );

  // Mock user profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);

        // Mock profile data
        const mockProfile: UserProfile = {
          id: userId,
          displayName: 'John Doe',
          email: 'john@example.com',
          photoURL:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          bio: 'Content creator passionate about technology and education. Making videos about web development, AI, and digital innovation.',
          location: 'San Francisco, CA',
          website: 'https://johndoe.dev',
          joinDate: '2023-01-15T00:00:00.000Z',
          lastActive: '2024-01-15T10:30:00.000Z',
          isVerified: true,
          subscriberCount: 12500,
          videoCount: 45,
          totalViews: 250000,
          socialLinks: {
            twitter: 'https://twitter.com/johndoe',
            instagram: 'https://instagram.com/johndoe',
            linkedin: 'https://linkedin.com/in/johndoe',
            youtube: 'https://youtube.com/@johndoe',
          },
          stats: {
            totalVideos: 45,
            totalViews: 250000,
            totalLikes: 8500,
            totalComments: 1200,
          },
        };

        setProfile(mockProfile);

        // Load videos
        const allVideos = await getVideos();
        const userVideos = allVideos
          .filter(video => video.uid === userId)
          .map(video => ({
            id: video.id || '',
            title: video.title || '',
            description: video.description || '',
            thumbnailUrl: video.thumbnailUrl || '/placeholder-thumbnail.svg',
            views: video.views || 0,
            likes: video.likes || 0,
            comments: video.comments || 0,
            createdAt: video.createdAt || '',
            duration: video.duration || 0,
            status: video.status || 'processed',
          }));

        setVideos(userVideos);

        // Mock playlists
        const mockPlaylists: Playlist[] = [
          {
            id: '1',
            name: 'Web Development Tutorials',
            description:
              'Complete web development course from beginner to advanced',
            thumbnailUrl: '/placeholder-thumbnail.svg',
            videoCount: 12,
            totalViews: 45000,
            isPublic: true,
            createdAt: '2023-06-15T00:00:00.000Z',
          },
          {
            id: '2',
            name: 'AI & Machine Learning',
            description:
              'Exploring artificial intelligence and machine learning concepts',
            thumbnailUrl: '/placeholder-thumbnail.svg',
            videoCount: 8,
            totalViews: 32000,
            isPublic: true,
            createdAt: '2023-08-20T00:00:00.000Z',
          },
        ];

        setPlaylists(mockPlaylists);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
    // TODO: Implement actual subscription logic
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const sortVideos = (videos: Video[], sortBy: string) => {
    switch (sortBy) {
      case 'oldest':
        return [...videos].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'popular':
        return [...videos].sort((a, b) => b.views - a.views);
      default:
        return [...videos].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          User Not Found
        </h1>
        <p className="text-gray-600">
          The user you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <Avatar className="w-24 h-24">
            <AvatarImage src={profile.photoURL} alt={profile.displayName} />
            <AvatarFallback>
              {profile.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              {profile.isVerified && (
                <CheckCircle className="w-6 h-6 text-blue-500" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{formatNumber(profile.subscriberCount)} subscribers</span>
              </div>
              <div className="flex items-center space-x-1">
                <Video className="w-4 h-4" />
                <span>{profile.videoCount} videos</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{formatNumber(profile.totalViews)} total views</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(profile.joinDate)}</span>
              </div>
            </div>

            {profile.bio && <p className="text-gray-700 mb-4">{profile.bio}</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {profile.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center space-x-1">
                  <Globe className="w-4 h-4" />
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 flex items-center space-x-1"
                  >
                    <span>{profile.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Social Links */}
            {Object.values(profile.socialLinks).some(link => link) && (
              <div className="flex items-center space-x-4 mt-4">
                {profile.socialLinks.twitter && (
                  <a
                    href={profile.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-500"
                  >
                    <span className="sr-only">Twitter</span>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                )}
                {profile.socialLinks.instagram && (
                  <a
                    href={profile.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-pink-500"
                  >
                    <span className="sr-only">Instagram</span>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z" />
                    </svg>
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a
                    href={profile.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-700"
                  >
                    <span className="sr-only">LinkedIn</span>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant={isSubscribed ? 'outline' : 'default'}
              onClick={handleSubscribe}
            >
              {isSubscribed ? (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Unsubscribe
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Subscribe
                </>
              )}
            </Button>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Videos ({videos.length})</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortVideos(videos, sortBy).map(video => (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <Thumbnail
                    src={video.thumbnailUrl}
                    alt={video.title}
                    videoFilename={video.id}
                    duration={video.duration}
                    className="w-full aspect-video"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{formatNumber(video.views)} views</span>
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-3 h-3" />
                      <span>{formatNumber(video.likes)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{formatNumber(video.comments)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Playlists Tab */}
        <TabsContent value="playlists" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Playlists ({playlists.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map(playlist => (
              <Card
                key={playlist.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img
                    src={playlist.thumbnailUrl}
                    alt={playlist.name}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-2xl font-bold">
                        {playlist.videoCount}
                      </div>
                      <div className="text-sm">videos</div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">
                    {playlist.name}
                  </h3>
                  {playlist.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {playlist.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{formatNumber(playlist.totalViews)} views</span>
                    <span>{formatDate(playlist.createdAt)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              About {profile.displayName}
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Bio</h3>
                <p className="text-gray-700">
                  {profile.bio || 'No bio available.'}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Channel Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(profile.stats.totalVideos)}
                    </div>
                    <div className="text-sm text-gray-600">Videos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(profile.stats.totalViews)}
                    </div>
                    <div className="text-sm text-gray-600">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatNumber(profile.stats.totalLikes)}
                    </div>
                    <div className="text-sm text-gray-600">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatNumber(profile.stats.totalComments)}
                    </div>
                    <div className="text-sm text-gray-600">Comments</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Channel Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Joined</span>
                    <span>{formatDate(profile.joinDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Active</span>
                    <span>{formatDate(profile.lastActive)}</span>
                  </div>
                  {profile.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location</span>
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Website</span>
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfilePage;
