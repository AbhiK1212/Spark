import { httpsCallable} from 'firebase/functions';
import { functions } from './firebase';


const generateUploadURL = httpsCallable(functions, 'generateUploadURL');
const getVideoFunction = httpsCallable(functions, 'getVideos');

export interface Video {
    id?: string,
    uid?: string,
    filename?: string,
    status?: 'processing' | 'processed',
    title?: string,
    description?: string  
  }

export async function uploadVideo(file: File) {
    const response: any = await generateUploadURL({
        fileExtension: file.name.split('.').pop()
    });

    // Upload the file to the signed URL
    await fetch(response?.data?.url, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type
        }
    });
    return;
}

export async function getVideos() {
    const response = await getVideoFunction();
    return response.data as Video[];
}