import { render, screen } from '@testing-library/react';
import { Thumbnail } from '../../../components/ui/thumbnail';

describe('Thumbnail Component', () => {
  const defaultProps = {
    src: 'https://example.com/thumbnail.jpg',
    alt: 'Test video thumbnail',
    videoFilename: 'test-video.mp4',
    duration: 120
  };

  it('renders thumbnail with correct attributes', () => {
    render(<Thumbnail {...defaultProps} />);
    
    const img = screen.getByAltText('Test video thumbnail');
    expect(img).toBeInTheDocument();
    // Next.js Image component transforms the src, so we check if it contains the original URL
    expect(img.getAttribute('src')).toContain('https%3A%2F%2Fexample.com%2Fthumbnail.jpg');
  });

  it('displays duration badge when duration is provided', () => {
    render(<Thumbnail {...defaultProps} />);
    
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('does not display duration badge when duration is 0', () => {
    render(<Thumbnail {...defaultProps} duration={0} />);
    
    expect(screen.queryByText('0:00')).not.toBeInTheDocument();
  });

  it('formats duration correctly for different values', () => {
    const { rerender } = render(<Thumbnail {...defaultProps} duration={65} />);
    expect(screen.getByText('1:05')).toBeInTheDocument();

    rerender(<Thumbnail {...defaultProps} duration={3661} />);
    expect(screen.getByText('61:01')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-thumbnail-class';
    render(<Thumbnail {...defaultProps} className={customClass} />);
    
    const container = screen.getByAltText('Test video thumbnail').closest('div');
    expect(container).toHaveClass(customClass);
  });

  it('handles missing duration gracefully', () => {
    render(<Thumbnail {...defaultProps} duration={undefined} />);
    
    // Should not crash and should not show duration badge
    expect(screen.queryByText(/:\d{2}/)).not.toBeInTheDocument();
  });
});
