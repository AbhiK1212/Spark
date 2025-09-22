import { getAuth } from 'firebase/auth';

interface CDNUrl {
  url: string;
  cookies: Array<{
    name: string;
    value: string;
    options: {
      domain: string;
      path: string;
      expires: string;
      secure: boolean;
      httpOnly: boolean;
      sameSite: 'strict' | 'lax' | 'none';
    };
  }>;
  expiresAt: string;
}

interface VideoQuality {
  '720p': string;
}

interface CDNConfig {
  baseUrl: string;
  functionsUrl: string;
  cookieDomain: string;
  cookieName: string;
}

class CDNClient {
  private config: CDNConfig;
  private auth: any;

  constructor() {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://cdn.abhi-yt.com',
      functionsUrl: process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'https://us-central1-abhi-yt.cloudfunctions.net',
      cookieDomain: process.env.NEXT_PUBLIC_CDN_DOMAIN || '.abhi-yt.com',
      cookieName: 'spark_cdn_auth'
    };
    
    // Initialize Firebase Auth
    if (typeof window !== 'undefined') {
      this.auth = getAuth();
    }
  }

  /**
   * Get authenticated video URL with CDN
   */
  async getVideoUrl(
    videoId: string, 
    quality: keyof VideoQuality = '720p',
    format: 'mp4' | 'hls' = 'mp4'
  ): Promise<string> {
    try {
      const user = this.auth?.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const cdnData = await this.requestCDNUrl('getVideoCDNUrl', {
        videoId,
        quality,
        format
      }, token);

      // Set cookies
      this.setCookies(cdnData.cookies);

      return cdnData.url;
    } catch (error) {
      console.error('Error getting video CDN URL:', error);
      throw error;
    }
  }

  /**
   * Get HLS playlist URL for streaming
   */
  async getHLSPlaylistUrl(videoId: string): Promise<string> {
    try {
      const user = this.auth?.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const cdnData = await this.requestCDNUrl('getHLSPlaylistUrl', {
        videoId
      }, token);

      // Set cookies
      this.setCookies(cdnData.cookies);

      return cdnData.url;
    } catch (error) {
      console.error('Error getting HLS playlist URL:', error);
      throw error;
    }
  }

  /**
   * Get thumbnail URL with CDN
   */
  async getThumbnailUrl(
    videoId: string, 
    thumbnailIndex: number = 1
  ): Promise<string> {
    try {
      // Simple direct URL approach for thumbnails
      const directUrl = `https://storage.googleapis.com/abhi-yt-processed-videos/thumbnails/${videoId}/thumb-${thumbnailIndex}.jpg`;
      
      // Test if the URL is accessible
      try {
        const response = await fetch(directUrl, { method: 'HEAD' });
        if (response.ok) {
          return directUrl;
        }
      } catch (fetchError) {
        console.warn('Direct thumbnail URL not accessible, trying CDN service');
      }

      // Fallback to CDN service
      const user = this.auth?.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const cdnData = await this.requestCDNUrl('getThumbnailCDNUrl', {
        videoId,
        thumbnailIndex
      }, token);

      // Set cookies
      this.setCookies(cdnData.cookies);

      return cdnData.url;
    } catch (error) {
      console.error('Error getting thumbnail CDN URL:', error);
      throw error;
    }
  }

  /**
   * Get all available video qualities
   */
  async getVideoQualities(videoId: string): Promise<VideoQuality> {
    try {
      // Simple direct URL approach - bypass CDN service for now
      const directUrl = `https://storage.googleapis.com/abhi-yt-processed-videos/videos/${videoId}/720p.mp4`;
      
      // Test if the URL is accessible
      try {
        const response = await fetch(directUrl, { method: 'HEAD' });
        if (response.ok) {
          return {
            '720p': directUrl,
          };
        }
      } catch (fetchError) {
        console.warn('Direct URL not accessible, trying CDN service');
      }

      // Fallback to CDN service
      const user = this.auth?.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const url720p = await this.getVideoUrl(videoId, '720p');
      return {
        '720p': url720p,
      };
    } catch (error) {
      console.error('Error getting video qualities:', error);
      throw error;
    }
  }

  /**
   * Create video element with CDN authentication
   */
  async createVideoElement(
    videoId: string,
    quality: keyof VideoQuality = '720p',
    options: {
      autoplay?: boolean;
      controls?: boolean;
      muted?: boolean;
      loop?: boolean;
      preload?: 'none' | 'metadata' | 'auto';
    } = {}
  ): Promise<HTMLVideoElement> {
    try {
      const videoUrl = await this.getVideoUrl(videoId, quality);
      
      const video = document.createElement('video');
      video.src = videoUrl;
      video.controls = options.controls !== false;
      video.autoplay = options.autoplay || false;
      video.muted = options.muted || false;
      video.loop = options.loop || false;
      video.preload = options.preload || 'metadata';

      // Add error handling
      video.addEventListener('error', (e) => {
        console.error('Video error:', e);
        this.handleVideoError(video, videoId, quality);
      });

      // Add load event
      video.addEventListener('loadeddata', () => {
        console.log(`Video ${videoId} loaded successfully`);
      });

      return video;
    } catch (error) {
      console.error('Error creating video element:', error);
      throw error;
    }
  }

  /**
   * Create HLS video element for streaming
   */
  async createHLSVideoElement(
    videoId: string,
    options: {
      autoplay?: boolean;
      controls?: boolean;
      muted?: boolean;
      loop?: boolean;
    } = {}
  ): Promise<HTMLVideoElement> {
    try {
      const playlistUrl = await this.getHLSPlaylistUrl(videoId);
      
      const video = document.createElement('video');
      video.controls = options.controls !== false;
      video.autoplay = options.autoplay || false;
      video.muted = options.muted || false;
      video.loop = options.loop || false;

      // Check if HLS is supported
      if (typeof window !== 'undefined' && (window as any).Hls) {
        const Hls = (window as any).Hls;
        
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          
          hls.loadSource(playlistUrl);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
            this.handleHLSError(hls, data);
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          video.src = playlistUrl;
        } else {
          throw new Error('HLS not supported in this browser');
        }
      } else {
        throw new Error('HLS.js library not loaded');
      }

      return video;
    } catch (error) {
      console.error('Error creating HLS video element:', error);
      throw error;
    }
  }

  /**
   * Preload video for better user experience
   */
  async preloadVideo(
    videoId: string,
    quality: keyof VideoQuality = '720p'
  ): Promise<void> {
    try {
      const videoUrl = await this.getVideoUrl(videoId, quality);
      
      // Create hidden video element for preloading
      const video = document.createElement('video');
      video.style.display = 'none';
      video.preload = 'auto';
      video.src = videoUrl;
      
      document.body.appendChild(video);
      
      // Remove after preloading
      video.addEventListener('canplaythrough', () => {
        document.body.removeChild(video);
        console.log(`Video ${videoId} preloaded successfully`);
      });
      
      video.addEventListener('error', () => {
        document.body.removeChild(video);
        console.warn(`Failed to preload video ${videoId}`);
      });
    } catch (error) {
      console.error('Error preloading video:', error);
    }
  }

  /**
   * Check if CDN cookies are valid
   */
  isCDNAuthenticated(): boolean {
    if (typeof document === 'undefined') return false;
    
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);

    const authCookie = cookies[this.config.cookieName];
    const userCookie = cookies[`${this.config.cookieName}_user`];
    const videoCookie = cookies[`${this.config.cookieName}_video`];

    return !!(authCookie && userCookie && videoCookie);
  }

  /**
   * Clear CDN authentication cookies
   */
  clearCDNAuthentication(): void {
    if (typeof document === 'undefined') return;
    
    const cookies = [
      this.config.cookieName,
      `${this.config.cookieName}_user`,
      `${this.config.cookieName}_video`
    ];

    cookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; domain=${this.config.cookieDomain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  }

  /**
   * Private method to request CDN URL from Firebase Functions
   */
  private async requestCDNUrl(
    functionName: string,
    data: any,
    token: string
  ): Promise<CDNUrl> {
    const response = await fetch(`${this.config.functionsUrl}/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to get CDN URL');
    }

    return result.data;
  }

  /**
   * Private method to set cookies
   */
  private setCookies(cookies: CDNUrl['cookies']): void {
    if (typeof document === 'undefined') return;

    cookies.forEach(cookie => {
      const cookieString = [
        `${cookie.name}=${cookie.value}`,
        `domain=${cookie.options.domain}`,
        `path=${cookie.options.path}`,
        `expires=${new Date(cookie.options.expires).toUTCString()}`,
        cookie.options.secure ? 'secure' : '',
        `samesite=${cookie.options.sameSite}`
      ].filter(Boolean).join('; ');

      document.cookie = cookieString;
    });
  }

  /**
   * Private method to handle video errors
   */
  private async handleVideoError(
    video: HTMLVideoElement,
    videoId: string,
    quality: keyof VideoQuality
  ): Promise<void> {
    console.warn(`Video error for ${videoId}, trying fallback quality`);
    
    try {
      const fallbackQuality = '720p';
      
      if (fallbackQuality) {
        const fallbackUrl = await this.getVideoUrl(videoId, fallbackQuality);
        video.src = fallbackUrl;
      }
    } catch (error) {
      console.error('Failed to load fallback quality:', error);
    }
  }

  /**
   * Private method to handle HLS errors
   */
  private handleHLSError(hls: any, data: any): void {
    if (data.fatal) {
      switch (data.type) {
        case hls.ErrorTypes.NETWORK_ERROR:
          console.error('Fatal network error, trying to recover...');
          hls.startLoad();
          break;
        case hls.ErrorTypes.MEDIA_ERROR:
          console.error('Fatal media error, trying to recover...');
          hls.recoverMediaError();
          break;
        default:
          console.error('Fatal error, cannot recover');
          hls.destroy();
          break;
      }
    }
  }
}

// Export singleton instance
export const cdnClient = new CDNClient();

// Export types
export type { CDNUrl, VideoQuality, CDNConfig };
