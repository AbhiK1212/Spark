'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  FileVideo,
  Image,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { uploadVideo } from '@/utilities/firebase/functions';

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error';
  error?: string;
  uploadUrl?: string;
  thumbnail?: File;
  metadata: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    visibility: 'public' | 'private' | 'unlisted';
  };
}

interface DragDropUploadProps {
  onUploadComplete?: (videoId: string) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxSize = 500 * 1024 * 1024, // 500MB
  acceptedTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
  ],
  className = '',
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showMetadata, setShowMetadata] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});

  const uploadControllers = useRef<Record<string, AbortController>>({});
  const uploadProgress = useRef<Record<string, number>>({});

  // Generate unique ID for files
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Create file preview
  const createPreview = (file: File): Promise<string> => {
    return new Promise(resolve => {
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 180;
          const ctx = canvas.getContext('2d');
          video.currentTime = 1; // Get frame at 1 second
          video.onseeked = () => {
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL());
          };
        };
        video.src = URL.createObjectURL(file);
      } else {
        resolve('/placeholder-video.svg');
      }
    });
  };

  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadFile[] = [];

      for (const file of acceptedFiles) {
        if (files.length >= maxFiles) break;

        const id = generateId();
        const preview = await createPreview(file);

        newFiles.push({
          id,
          file,
          preview,
          progress: 0,
          status: 'pending',
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: '',
            category: 'general',
            tags: [],
            visibility: 'public',
          },
        });
      }

      setFiles(prev => [...prev, ...newFiles]);
    },
    [files.length, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': acceptedTypes,
    },
    maxSize,
    multiple: true,
    disabled: files.length >= maxFiles || isUploading,
  });

  // Upload file with resumable transfer
  const uploadFile = async (fileData: UploadFile) => {
    const { id, file, metadata } = fileData;

    try {
      // Update status to uploading
      setFiles(prev =>
        prev.map(f =>
          f.id === id ? { ...f, status: 'uploading', progress: 0 } : f
        )
      );

      // Create abort controller for this upload
      const controller = new AbortController();
      uploadControllers.current[id] = controller;

      // Get upload URL from Firebase
      const response = await uploadVideo(file, {
        title: metadata.title,
        description: metadata.description,
        hasCustomThumbnail: !!fileData.thumbnail,
        category: metadata.category,
        tags: metadata.tags,
        visibility: metadata.visibility,
      });

      // Upload file with progress tracking
      await uploadWithProgress(id, file, response.url, controller.signal);

      // Upload thumbnail if provided
      if (fileData.thumbnail && response.thumbnailUploadUrl) {
        await uploadThumbnail(fileData.thumbnail, response.thumbnailUploadUrl);
      }

      // Update status to completed
      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                status: 'completed',
                progress: 100,
                uploadUrl: response.url,
              }
            : f
        )
      );

      onUploadComplete?.(response.fileName.split('.')[0]);
    } catch (error) {
      console.error('Upload error:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';
      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                status: 'error',
                error: errorMessage,
              }
            : f
        )
      );

      onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      // Clean up controller
      delete uploadControllers.current[id];
    }
  };

  // Upload with progress tracking
  const uploadWithProgress = async (
    id: string,
    file: File,
    uploadUrl: string,
    signal: AbortSignal
  ) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          uploadProgress.current[id] = progress;

          setFiles(prev =>
            prev.map(f => (f.id === id ? { ...f, progress } : f))
          );
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Handle abort signal
      signal.addEventListener('abort', () => {
        xhr.abort();
      });

      // Start upload
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  // Upload thumbnail
  const uploadThumbnail = async (thumbnail: File, thumbnailUrl: string) => {
    const response = await fetch(thumbnailUrl, {
      method: 'PUT',
      body: thumbnail,
      headers: {
        'Content-Type': thumbnail.type,
      },
    });

    if (!response.ok) {
      throw new Error('Thumbnail upload failed');
    }
  };

  // Start upload
  const startUpload = async (fileId: string) => {
    const fileData = files.find(f => f.id === fileId);
    if (!fileData) return;

    await uploadFile(fileData);
  };

  // Pause upload
  const pauseUpload = (fileId: string) => {
    const controller = uploadControllers.current[fileId];
    if (controller) {
      controller.abort();
    }

    setFiles(prev =>
      prev.map(f => (f.id === fileId ? { ...f, status: 'paused' } : f))
    );
  };

  // Resume upload
  const resumeUpload = async (fileId: string) => {
    const fileData = files.find(f => f.id === fileId);
    if (!fileData) return;

    await uploadFile(fileData);
  };

  // Retry upload
  const retryUpload = async (fileId: string) => {
    const currentRetryCount = retryCount[fileId] || 0;
    setRetryCount(prev => ({ ...prev, [fileId]: currentRetryCount + 1 }));

    const fileData = files.find(f => f.id === fileId);
    if (!fileData) return;

    // Reset file status
    setFiles(prev =>
      prev.map(f =>
        f.id === fileId
          ? {
              ...f,
              status: 'pending',
              progress: 0,
              error: undefined,
            }
          : f
      )
    );

    await uploadFile(fileData);
  };

  // Remove file
  const removeFile = (fileId: string) => {
    // Cancel upload if in progress
    const controller = uploadControllers.current[fileId];
    if (controller) {
      controller.abort();
    }

    setFiles(prev => prev.filter(f => f.id !== fileId));
    setShowMetadata(prev => (prev === fileId ? null : prev));
  };

  // Update metadata
  const updateMetadata = (
    fileId: string,
    updates: Partial<UploadFile['metadata']>
  ) => {
    setFiles(prev =>
      prev.map(f =>
        f.id === fileId
          ? {
              ...f,
              metadata: { ...f.metadata, ...updates },
            }
          : f
      )
    );
  };

  // Add thumbnail
  const addThumbnail = (fileId: string, thumbnail: File) => {
    setFiles(prev =>
      prev.map(f => (f.id === fileId ? { ...f, thumbnail } : f))
    );
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status icon
  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'paused':
        return <Pause className="w-5 h-5 text-yellow-500" />;
      default:
        return <FileVideo className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop videos here'}
        </h3>
        <p className="text-gray-500 mb-4">or click to select files</p>
        <p className="text-sm text-gray-400">
          Max {maxFiles} files, up to {formatFileSize(maxSize)} each
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Supported: {acceptedTypes.join(', ')}
        </p>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            Upload Queue ({files.length})
          </h3>

          {files.map(fileData => (
            <Card key={fileData.id} className="p-4">
              <div className="flex items-start space-x-4">
                {/* Thumbnail */}
                <div className="relative">
                  <img
                    src={fileData.preview}
                    alt={fileData.file.name}
                    className="w-20 h-12 object-cover rounded"
                  />
                  {fileData.thumbnail && (
                    <div className="absolute -top-1 -right-1">
                      <Image className="w-4 h-4 text-blue-500" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium truncate">
                      {fileData.file.name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(fileData.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileData.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <span>{formatFileSize(fileData.file.size)}</span>
                    <span>{fileData.file.type}</span>
                    <Badge
                      variant={
                        fileData.status === 'completed'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {fileData.status}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  {fileData.status === 'uploading' && (
                    <div className="mb-2">
                      <Progress value={fileData.progress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {fileData.progress}% uploaded
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {fileData.status === 'error' && fileData.error && (
                    <p className="text-sm text-red-500 mb-2">
                      {fileData.error}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {fileData.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => startUpload(fileData.id)}
                        disabled={isUploading}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Upload
                      </Button>
                    )}

                    {fileData.status === 'uploading' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pauseUpload(fileData.id)}
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    )}

                    {fileData.status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => resumeUpload(fileData.id)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Resume
                      </Button>
                    )}

                    {fileData.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryUpload(fileData.id)}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setShowMetadata(
                          showMetadata === fileData.id ? null : fileData.id
                        )
                      }
                    >
                      {showMetadata === fileData.id ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Metadata Form */}
              {showMetadata === fileData.id && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Title
                      </label>
                      <Input
                        value={fileData.metadata.title}
                        onChange={e =>
                          updateMetadata(fileData.id, { title: e.target.value })
                        }
                        placeholder="Video title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Category
                      </label>
                      <Select
                        value={fileData.metadata.category}
                        onValueChange={value =>
                          updateMetadata(fileData.id, { category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="entertainment">
                            Entertainment
                          </SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="tech">Technology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Visibility
                      </label>
                      <Select
                        value={fileData.metadata.visibility}
                        onValueChange={(
                          value: 'public' | 'private' | 'unlisted'
                        ) => updateMetadata(fileData.id, { visibility: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="unlisted">Unlisted</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Custom Thumbnail
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) addThumbnail(fileData.id, file);
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Textarea
                      value={fileData.metadata.description}
                      onChange={e =>
                        updateMetadata(fileData.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="Video description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tags
                    </label>
                    <Input
                      value={fileData.metadata.tags.join(', ')}
                      onChange={e =>
                        updateMetadata(fileData.id, {
                          tags: e.target.value
                            .split(',')
                            .map(tag => tag.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Enter tags separated by commas"
                    />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Upload All Button */}
      {files.some(f => f.status === 'pending') && (
        <div className="flex justify-center">
          <Button
            onClick={() => {
              const pendingFiles = files.filter(f => f.status === 'pending');
              pendingFiles.forEach(file => startUpload(file.id));
            }}
            disabled={isUploading}
            className="px-8"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload All ({files.filter(f => f.status === 'pending').length})
          </Button>
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;
