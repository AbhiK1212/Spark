import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AnimatedVideoPlayer } from '../../../components/video/AnimatedVideoPlayer';

// Mock video element methods
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockLoad = vi.fn();

Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: mockPlay,
});

Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
  writable: true,
  value: mockPause,
});

Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  writable: true,
  value: mockLoad,
});

describe('AnimatedVideoPlayer Component', () => {
  const defaultProps = {
    videoUrl: 'https://example.com/video.mp4',
    poster: 'https://example.com/poster.jpg',
    title: 'Test Video',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders video element with correct attributes', () => {
    render(<AnimatedVideoPlayer {...defaultProps} />);
    
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
    expect(video).toHaveAttribute('poster', 'https://example.com/poster.jpg');
  });

  it('calls onPlay when video starts playing', async () => {
    const onPlay = vi.fn();
    render(<AnimatedVideoPlayer {...defaultProps} onPlay={onPlay} />);
    
    const video = document.querySelector('video');
    fireEvent.play(video);
    
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('calls onError when video fails to load', () => {
    const onError = vi.fn();
    render(<AnimatedVideoPlayer {...defaultProps} onError={onError} />);
    
    const video = document.querySelector('video');
    fireEvent.error(video);
    
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('calls onLoadStart when video starts loading', () => {
    const onLoadStart = vi.fn();
    render(<AnimatedVideoPlayer {...defaultProps} onLoadStart={onLoadStart} />);
    
    const video = document.querySelector('video');
    fireEvent.loadStart(video);
    
    expect(onLoadStart).toHaveBeenCalledTimes(1);
  });

  it('calls onCanPlay when video can start playing', () => {
    const onCanPlay = vi.fn();
    render(<AnimatedVideoPlayer {...defaultProps} onCanPlay={onCanPlay} />);
    
    const video = document.querySelector('video');
    fireEvent.canPlay(video);
    
    expect(onCanPlay).toHaveBeenCalledTimes(1);
  });

  it('toggles play/pause when video is clicked', () => {
    render(<AnimatedVideoPlayer {...defaultProps} />);
    
    const video = document.querySelector('video');
    fireEvent.click(video);
    
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const customClass = 'custom-video-class';
    render(<AnimatedVideoPlayer {...defaultProps} className={customClass} />);
    
    const video = document.querySelector('video');
    const container = video.closest('div');
    expect(container).toHaveClass(customClass);
  });

  it('shows controls on mouse move and hides on mouse leave', async () => {
    render(<AnimatedVideoPlayer {...defaultProps} />);
    
    const video = document.querySelector('video');
    const container = video.closest('div');
    
    // Initially controls should be hidden
    expect(container?.querySelector('.opacity-0')).toBeInTheDocument();
    
    // Move mouse to show controls
    fireEvent.mouseMove(container!);
    await waitFor(() => {
      expect(container?.querySelector('.opacity-100')).toBeInTheDocument();
    });
    
    // Move mouse away to hide controls
    fireEvent.mouseLeave(container!);
    await waitFor(() => {
      expect(container?.querySelector('.opacity-0')).toBeInTheDocument();
    });
  });
});
