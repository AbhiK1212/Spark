//client side component to upload the video
'use client';

import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadVideo, validateVideoFile } from '@/utilities/firebase/functions';

export default function Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.item(0);
    if (file) {
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      setSelectedFile(file);
      setShowUploadForm(true);
      // Pre-fill title with filename
      setTitle(file.name.split('.')[0].replace(/[-_]/g, ' '));
    }
  };

  const validateThumbnailFile = (
    file: File
  ): { valid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      return { valid: false, error: 'Thumbnail size must be less than 5MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPG, PNG, and WebP images are supported for thumbnails',
      };
    }

    return { valid: true };
  };

  const handleThumbnailChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.item(0);
    if (file) {
      const validation = validateThumbnailFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      setSelectedThumbnail(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      await uploadVideo(selectedFile, {
        title,
        description,
        customThumbnail: selectedThumbnail,
      });
      alert('Video uploaded successfully! Processing will begin shortly.');
      // Reset form
      setSelectedFile(null);
      setSelectedThumbnail(null);
      setThumbnailPreview(null);
      setTitle('');
      setDescription('');
      setShowUploadForm(false);
    } catch (error) {
      console.error('Upload error:', error);
      alert(
        `Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setSelectedThumbnail(null);
    setThumbnailPreview(null);
    setTitle('');
    setDescription('');
    setShowUploadForm(false);
  };

  if (showUploadForm && selectedFile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File: {selectedFile.name}
              </label>
              <p className="text-xs text-gray-500">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spark-yellow"
                placeholder="Enter video title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spark-yellow"
                placeholder="Enter video description"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Thumbnail (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Upload a custom thumbnail or we'll auto-generate one from your
                video
              </p>

              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleThumbnailChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-spark-yellow"
                    disabled={isUploading}
                  />
                </div>

                {thumbnailPreview && (
                  <div className="w-24 h-14 relative">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover rounded border"
                    />
                    <button
                      onClick={() => {
                        setSelectedThumbnail(null);
                        setThumbnailPreview(null);
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                      disabled={isUploading}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading || !title.trim()}
                className="flex-1"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
              <Button
                onClick={cancelUpload}
                variant="outline"
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Fragment>
      <input
        id="upload"
        className="hidden"
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <Button asChild variant="outline" size="sm" disabled={isUploading}>
        <label
          htmlFor="upload"
          className="cursor-pointer flex items-center space-x-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
            />
          </svg>
          <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
        </label>
      </Button>
    </Fragment>
  );
}
