import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";
import {Storage} from "@google-cloud/storage";
import {onCall} from "firebase-functions/v2/https";
import * as dotenv from "dotenv";

dotenv.config();

initializeApp();

const firestore = new Firestore();
const storage = new Storage();

const rawVideoBucketName = process.env.rawVideoBucketName || "";
;

const videoCollectionId = "videos";


//  Makes the attribute optional
export interface Video {
    id?: string,
    uid?: string,
    filename?: string,
    status?: "processing" | "processed";
    title?: string,
    description?: string,

}

export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoURL: user.photoURL,
  };

  // Save the user to Firestore
  firestore.collection("users").doc(user.uid).set(userInfo);
  logger.info(`User created + ${JSON.stringify(userInfo)}`);
  return;
});

export const generateUploadURL = onCall({maxInstances: 1}, async (request) => {
  //  Check if the user is authenticated
  if (!request.auth) {
    //  Throw an unauthenticated error
    throw new functions.https.HttpsError("failed-precondition",
      "The function must be called while authenticated"
    );
  }

  const auth = request.auth;
  const data = request.data;
  const bucket = storage.bucket(rawVideoBucketName);

  // Generate a unique file name for the video
  const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;

  // Generate a signed URL for uploading the video
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  return {url, fileName};
});

//  Anyone can watch videos so no need to check for authentication
export const getVideos = onCall({maxInstances: 1}, async () => {
  const querySnapshot =
    await firestore.collection(videoCollectionId).limit(10).get();
  return querySnapshot.docs.map((doc) => doc.data());
});
