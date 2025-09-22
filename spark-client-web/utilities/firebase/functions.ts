import { httpsCallable} from 'firebase/functions';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { functions } from './firebase';

export interface Video {
    id?: string,
    uid?: string,
    filename?: string,
    status?: 'processing' | 'processed',
    title?: string,
    description?: string,
    thumbnailUrl?: string,
    duration?: number,
    views?: number,
    createdAt?: string,
    updatedAt?: string
}

const generateUploadURL = functions ? httpsCallable(functions, 'generateUploadURL') : null;
const getVideoFunction = functions ? httpsCallable(functions, 'getVideos') : null;
const updateVideoMetadata = functions ? httpsCallable(functions, 'updateVideoMetadata') : null;
const deleteVideoFunction = functions ? httpsCallable(functions, 'deleteVideo') : null;
const incrementVideoView = functions ? httpsCallable(functions, 'incrementVideoView') : null;
const updateAllVideoStatuses = functions ? httpsCallable(functions, 'updateAllVideoStatuses') : null;
const createUserProfile = functions ? httpsCallable(functions, 'createUserProfile') : null;

export async function uploadVideo(file: File, metadata?: { title?: string; description?: string; customThumbnail?: File | null }) {
    if (!generateUploadURL) {
        throw new Error('Firebase not configured. Please set up your environment variables.');
    }
    
    
    const response: any = await generateUploadURL({
        fileExtension: file.name.split('.').pop(),
        title: metadata?.title,
        description: metadata?.description,
        hasCustomThumbnail: !!metadata?.customThumbnail
    });


    // Upload the video file to the signed URL
    await fetch(response?.data?.url, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type
        }
    });


    // If custom thumbnail provided, upload it too
    if (metadata?.customThumbnail && response?.data?.thumbnailUploadUrl) {
        try {
            await fetch(response.data.thumbnailUploadUrl, {
                method: 'PUT',
                body: metadata.customThumbnail,
                headers: {
                    'Content-Type': metadata.customThumbnail.type
                }
            });
        } catch (thumbnailError) {
            console.warn('Custom thumbnail upload failed, but video upload succeeded:', thumbnailError);
            // Don't throw error - video upload was successful, thumbnail is optional
        }
    }

    if (response?.data?.fileName && metadata && updateVideoMetadata) {
        try {
            const videoId = response.data.fileName.split('.')[0];
            
            const metadataUpdate = {
                videoId: videoId,
                title: metadata.title || 'Untitled Video',
                description: metadata.description || 'No description provided',
                views: 0,
                thumbnailUrl: metadata.customThumbnail 
                    ? `https://storage.googleapis.com/abhi-yt-processed-videos/thumbnails/${videoId}/custom-thumb.jpg`
                    : `https://storage.googleapis.com/abhi-yt-processed-videos/thumbnails/${videoId}/thumb-1.jpg`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await updateVideoMetadata(metadataUpdate);
        } catch (error) {
            // Fallback to client-side update (requires Firestore rules)
            try {
                const db = getFirestore();
                const videoId = response.data.fileName.split('.')[0];
                const videoRef = doc(db, 'videos', videoId);
                
                const metadataUpdate = {
                    title: metadata.title || 'Untitled Video',
                    description: metadata.description || 'No description provided',
                    views: 0,
                    thumbnailUrl: metadata.customThumbnail 
                        ? `https://storage.googleapis.com/abhi-yt-processed-videos/thumbnails/${videoId}/custom-thumb.jpg`
                        : `https://storage.googleapis.com/abhi-yt-processed-videos/thumbnails/${videoId}/thumb-1.jpg`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                await setDoc(videoRef, metadataUpdate, { merge: true });
            } catch (clientError) {
                console.error('Client-side update failed:', clientError);
            }
        }
    }

    // Trigger AI moderation after successful upload
    if (response?.data?.fileName) {
        try {
            const videoId = response.data.fileName.split('.')[0];
            console.log('🤖 Triggering AI moderation for video:', videoId);
            await moderateVideo(videoId);
        } catch (moderationError) {
            console.warn('AI moderation failed, but video upload succeeded:', moderationError);
            // Don't throw error - video upload was successful, moderation is optional
        }
    }

    return;
}

export async function getVideos() {
    if (!getVideoFunction) {
        return [];
    }
    
    try {
        const response = await getVideoFunction();
        return response.data as Video[];
    } catch (error) {
        console.error('Error fetching videos:', error);
        return [];
    }
}


export async function deleteVideo(videoId: string) {
    if (!deleteVideoFunction) {
        throw new Error('Firebase not configured. Please set up your environment variables.');
    }
    
    try {
        const response = await deleteVideoFunction({ videoId });
        return response.data;
    } catch (error) {
        console.error('Error deleting video:', error);
        throw error;
    }
}

// deleteAllVideos function removed - debug function not needed in production

export function validateVideoFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

    if (file.size > maxSize) {
        return { valid: false, error: 'File size must be less than 100MB' };
    }

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Only MP4, WebM, MOV, and AVI files are supported' };
    }

    return { valid: true };
}

// moderateVideo function removed - AI moderation not implemented in client

export async function incrementView(videoId: string) {
    if (!incrementVideoView) {
        throw new Error('Firebase not configured. Please set up your environment variables.');
    }

    try {
        const response = await incrementVideoView({ videoId });
        return response.data;
    } catch (error) {
        console.error('Error incrementing view:', error);
        throw error;
    }
}

export async function processVideoManually(videoId: string) {
    if (!processVideo) {
        throw new Error('Firebase not configured. Please set up your environment variables.');
    }

    try {
        const response = await processVideo({ videoId });
        return response.data;
    } catch (error) {
        console.error('Error processing video:', error);
        throw error;
    }
}

export async function updateVideoStatuses() {
    if (!updateAllVideoStatuses) {
        throw new Error('Firebase not configured. Please set up your environment variables.');
    }
    
    try {
        const response = await updateAllVideoStatuses();
        return response.data;
    } catch (error) {
        console.error('Error updating video statuses:', error);
        throw error;
    }
}

export async function ensureUserProfile(user: any) {
    if (!createUserProfile || !user) {
        return;
    }
    
    try {
        await createUserProfile({
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
        });
    } catch (error) {
        console.error('Error creating user profile:', error);
    }
}