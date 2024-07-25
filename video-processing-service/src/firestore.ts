import {credential} from 'firebase-admin';
import {Firestore} from 'firebase-admin/firestore';
import {initializeApp} from 'firebase-admin/app';

initializeApp({
  credential: credential.applicationDefault(),
});

const firestore = new Firestore();

// Note: This requires setting an env variable in Cloud Run
/** if (process.env.NODE_ENV !== 'production') {
  firestore.settings({
      host: "localhost:8080", // Default port for Firestore emulator
      ssl: false
  });
} */

const videoCollectionId = 'videos';


//? Makes the attribute optional
export interface Video {
    id?: string,
    uid?: string,
    filename?: string,
    status?: 'processing' | 'processed';
    title?: string,
    description?: string,

}

async function getVideo(videoId: string){
    const snapshot = await firestore.collection(videoCollectionId).doc(videoId).get();
    return (snapshot.data() as Video) ?? {};
}

export function setVideo(videoId: string, data: Video){
    return firestore
        .collection(videoCollectionId)
        .doc(videoId)
        .set(data, {merge: true});
}

export async function isVideoNew(videoId: string){
    const video = await getVideo(videoId);
    return video?.status === undefined;
}