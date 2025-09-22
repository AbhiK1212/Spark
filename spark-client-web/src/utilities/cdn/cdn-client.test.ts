import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cdnClient } from '../../../utilities/cdn/cdn-client';

// Mock fetch
global.fetch = vi.fn();

// Firebase Auth is already mocked in setup.ts

describe('CDN Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock document.cookie for setCookies method
    Object.defineProperty(document, 'cookie', {
      get: () => '',
      set: vi.fn(),
      configurable: true
    });
  });

  describe('getVideoQualities', () => {
    it('returns video qualities for valid video ID', async () => {
      // Mock the direct URL check (HEAD request)
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const result = await cdnClient.getVideoQualities('test-video');
      
      expect(result).toEqual({
        '720p': 'https://storage.googleapis.com/abhi-yt-processed-videos/videos/test-video/720p.mp4'
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://storage.googleapis.com/abhi-yt-processed-videos/videos/test-video/720p.mp4',
        { method: 'HEAD' }
      );
    });

    it('falls back to CDN service when direct URL fails', async () => {
      // Mock direct URL failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      // Mock CDN service success
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            url: 'https://cdn.abhi-yt.com/videos/test-video/720p.mp4',
            cookies: [],
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          }
        })
      });

      const result = await cdnClient.getVideoQualities('test-video');
      
      expect(result).toEqual({
        '720p': 'https://cdn.abhi-yt.com/videos/test-video/720p.mp4'
      });
    });

    it('throws error when both direct URL and CDN service fail', async () => {
      // Mock direct URL failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      // Mock CDN service failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          error: { message: 'Failed to get video URL: 500 Internal Server Error' }
        })
      });

      await expect(cdnClient.getVideoQualities('test-video')).rejects.toThrow(
        'Failed to get video URL: 500 Internal Server Error'
      );
    });
  });

  describe('getThumbnailUrl', () => {
    it('returns thumbnail URL for valid video ID', async () => {
      // Mock the direct URL check (HEAD request)
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const result = await cdnClient.getThumbnailUrl('test-video');
      
      expect(result).toBe('https://storage.googleapis.com/abhi-yt-processed-videos/thumbnails/test-video/thumb-1.jpg');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://storage.googleapis.com/abhi-yt-processed-videos/thumbnails/test-video/thumb-1.jpg',
        { method: 'HEAD' }
      );
    });

    it('falls back to CDN service when direct URL fails', async () => {
      // Mock direct URL failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      // Mock CDN service success
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            url: 'https://cdn.abhi-yt.com/thumbnails/test-video/thumb-1.jpg',
            cookies: [],
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          }
        })
      });

      const result = await cdnClient.getThumbnailUrl('test-video');
      
      expect(result).toBe('https://cdn.abhi-yt.com/thumbnails/test-video/thumb-1.jpg');
    });
  });
});
