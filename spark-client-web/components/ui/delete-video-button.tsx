'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { deleteVideo } from '@/utilities/firebase/functions';

interface DeleteVideoButtonProps {
  videoId: string;
  videoTitle?: string;
  onDeleted?: () => void;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'default' | 'lg';
}

export function DeleteVideoButton({
  videoId,
  videoTitle = 'this video',
  onDeleted,
  variant = 'button',
  size = 'default',
}: DeleteVideoButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      await deleteVideo(videoId);

      // Show success message
      console.log('✅ Video deleted successfully');

      // Call the callback to refresh the video list
      if (onDeleted) {
        onDeleted();
      }

      setShowConfirm(false);
    } catch (error) {
      console.error('❌ Failed to delete video:', error);
      alert('Failed to delete video. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (variant === 'icon') {
    return (
      <div className="relative">
        {!showConfirm ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center space-x-1">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs px-2 py-1"
            >
              {isDeleting ? 'Deleting...' : 'Confirm'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isDeleting}
              className="text-xs px-2 py-1"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!showConfirm ? (
        <Button
          variant="destructive"
          size={size}
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Video
        </Button>
      ) : (
        <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="font-semibold text-red-900">Confirm Deletion</h3>
          </div>
          <p className="text-sm text-red-800 mb-4">
            Are you sure you want to delete <strong>{videoTitle}</strong>? This
            action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
