import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";
import {Storage} from "@google-cloud/storage";
import {onCall} from "firebase-functions/v2/https";
import {onObjectFinalized} from "firebase-functions/v2/storage";
import {exec} from "child_process";
import {promisify} from "util";

initializeApp();

const firestore = new Firestore();
const storage = new Storage();

const rawVideoBucketName = process.env.rawVideoBucketName || "abhi-yt-raw-videos";
const videoCollectionId = "videos";

// Video interface
export interface Video {
    id?: string,
    uid?: string,
    filename?: string,
    status?: "processing" | "processed";
    title?: string,
    description?: string,
    thumbnailUrl?: string,
    duration?: number,
    views?: number,
    createdAt?: string,
    updatedAt?: string,
}

// Generate signed URL for video upload
export const generateUploadURL = onCall({maxInstances: 1}, async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("failed-precondition",
      "The function must be called while authenticated"
    );
  }

  const auth = request.auth;
  const data = request.data;
  const bucket = storage.bucket(rawVideoBucketName);

  // Generate a unique file name for the video
  const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;
  const videoId = fileName.split(".")[0];

  const baseUrl = "https://storage.googleapis.com/abhi-yt-processed-videos/thumbnails";
  const thumbnailUrl = data.hasCustomThumbnail ?
    `${baseUrl}/${videoId}/custom-thumb.jpg` :
    `${baseUrl}/${videoId}/thumb-1.jpg`;

  const initialVideoData: Video = {
    id: videoId,
    uid: auth.uid,
    filename: fileName,
    status: "processing",
    title: data.title || `Video ${Date.now()}`,
    description: data.description || "No description provided",
    views: 0,
    thumbnailUrl: thumbnailUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await firestore.collection(videoCollectionId).doc(videoId)
    .set(initialVideoData);
  logger.info(`Created initial video document: ${videoId}`);
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000,
  });

  let thumbnailUploadUrl = null;
  if (data.hasCustomThumbnail) {
    const thumbnailFileName = `thumbnails/${videoId}/custom-thumb.jpg`;
    const [thumbnailUrl] = await storage.bucket("abhi-yt-processed-videos")
      .file(thumbnailFileName).getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000,
      });
    thumbnailUploadUrl = thumbnailUrl;
  }

  return {
    url: url,
    fileName: fileName,
    thumbnailUploadUrl: thumbnailUploadUrl,
  };
});

// Get all videos
export const getVideos = onCall({maxInstances: 1}, async () => {
  try {
    const videosSnapshot = await firestore.collection(videoCollectionId)
      .orderBy("createdAt", "desc")
      .get();

    const videos: Video[] = [];
    videosSnapshot.forEach((doc) => {
      videos.push({id: doc.id, ...doc.data()} as Video);
    });

    logger.info(`Retrieved ${videos.length} videos`);
    return videos;
  } catch (error) {
    logger.error("Error getting videos:", error);
    throw new functions.https.HttpsError("internal", "Failed to get videos");
  }
});

// Update video metadata
export const updateVideoMetadata = onCall({maxInstances: 1}, async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }

  const {videoId, metadata} = request.data;

  if (!videoId || !metadata) {
    throw new functions.https.HttpsError("invalid-argument", "Missing videoId or metadata");
  }

  try {
    await firestore.collection(videoCollectionId).doc(videoId).update({
      ...metadata,
      updatedAt: new Date().toISOString(),
    });

    logger.info(`Updated metadata for video ${videoId}`);
    return {success: true};
  } catch (error) {
    logger.error("Error updating video metadata:", error);
    throw new functions.https.HttpsError("internal", "Failed to update video metadata");
  }
});

// Delete a single video
export const deleteVideo = onCall({maxInstances: 1}, async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }

  const {videoId} = request.data;

  if (!videoId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing videoId");
  }

  try {
    // Get video document to check ownership
    const videoDoc = await firestore.collection(videoCollectionId).doc(videoId).get();

    if (!videoDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Video not found");
    }

    const videoData = videoDoc.data();

    // Check if user owns the video
    if (videoData?.uid !== request.auth.uid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You can only delete your own videos"
      );
    }

    // Delete video file from storage
    if (videoData?.filename) {
      const rawBucket = storage.bucket(rawVideoBucketName);
      const processedBucket = storage.bucket("abhi-yt-processed-videos");

      try {
        await rawBucket.file(videoData.filename).delete();
        await processedBucket.file(videoData.filename).delete();
      } catch (storageError) {
        logger.warn(`Failed to delete video files for ${videoId}:`, storageError);
      }
    }

    // Delete video document from Firestore
    await firestore.collection(videoCollectionId).doc(videoId).delete();

    logger.info(`Deleted video ${videoId}`);
    return {success: true};
  } catch (error) {
    logger.error("Error deleting video:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "Failed to delete video");
  }
});

// Increment video view count
export const incrementVideoView = onCall(
  {maxInstances: 10},
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication required."
      );
    }

    const {videoId} = request.data;

    if (!videoId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing videoId"
      );
    }

    try {
      const videoRef = firestore.collection(videoCollectionId).doc(videoId);
      const videoDoc = await videoRef.get();

      if (!videoDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Video not found"
        );
      }

      const currentViews = videoDoc.data()?.views || 0;

      await videoRef.update({
        views: currentViews + 1,
        updatedAt: new Date().toISOString(),
      });

      logger.info(
        `View incremented for video ${videoId}. New count: ${currentViews + 1}`
      );
      return {success: true, views: currentViews + 1};
    } catch (error) {
      logger.error("Error incrementing video view:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to increment view count"
      );
    }
  });

// Storage trigger: Automatically process videos when uploaded to raw bucket
export const processVideoOnUpload = onObjectFinalized({
  bucket: rawVideoBucketName,
  region: "us-east1",
  maxInstances: 1,
  memory: "1GiB",
  timeoutSeconds: 540,
}, async (event) => {
  const file = event.data;
  const fileName = file.name;

  logger.info(`Video uploaded to raw bucket: ${fileName}`);

  // Extract video ID from filename (format: userId-timestamp.extension)
  const videoId = fileName.split(".")[0];

  try {
    // Check if video document exists in Firestore
    const videoDoc = await firestore.collection(videoCollectionId).doc(videoId).get();

    if (!videoDoc.exists) {
      logger.warn(`Video document not found for ${videoId}, skipping processing`);
      return;
    }

    const videoData = videoDoc.data();

    // Only process if status is "processing"
    if (videoData?.status !== "processing") {
      logger.info(`Video ${videoId} status is ${videoData?.status}, skipping processing`);
      return;
    }

    logger.info(`Starting automatic processing for video: ${videoId}`);

    // Process the video by generating multiple qualities and CDN structure
    const rawBucket = storage.bucket(rawVideoBucketName);
    const processedBucket = storage.bucket("abhi-yt-processed-videos");

    // Initialize video duration
    let videoDuration = 0;

    // Download the video file temporarily for processing
    const tempFileName = `/tmp/${fileName}`;
    await rawBucket.file(fileName).download({destination: tempFileName});

    // Generate multiple video qualities and thumbnails
    try {
      const execAsync = promisify(exec);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require("fs");

      // Check if ffmpeg is available
      try {
        await execAsync("ffmpeg -version");
        logger.info("ffmpeg is available");
      } catch (ffmpegError) {
        logger.warn("ffmpeg not available, skipping video processing:", ffmpegError);
        throw new Error("ffmpeg not available");
      }

      // Generate single video quality (720p)
      const qualities = [
        {name: "720p", resolution: "1280x720", bitrate: "1500k"},
      ];

      // Create video directory structure
      const videoDir = `/tmp/${videoId}`;
      if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir, {recursive: true});
      }

      // Generate each quality
      for (const quality of qualities) {
        const outputFile = `${videoDir}/${quality.name}.mp4`;
        const ffmpegCmd = `ffmpeg -i "${tempFileName}" -vf scale=${quality.resolution} ` +
          `-b:v ${quality.bitrate} -c:v libx264 -c:a aac -preset fast ` +
          `-movflags +faststart -y "${outputFile}"`;

        try {
          logger.info(`Generating ${quality.name} quality for video ${videoId}`);
          const {stdout, stderr} = await execAsync(ffmpegCmd);
          logger.info(`ffmpeg ${quality.name} stdout: ${stdout}`);
          if (stderr) logger.info(`ffmpeg ${quality.name} stderr: ${stderr}`);

          // Upload to processed bucket in CDN structure
          await processedBucket.upload(outputFile, {
            destination: `videos/${videoId}/${quality.name}.mp4`,
            metadata: {
              contentType: "video/mp4",
            },
          });

          logger.info(`Generated ${quality.name} quality for video ${videoId}`);
        } catch (qualityError) {
          logger.error(`Failed to generate ${quality.name} for video ${videoId}:`, qualityError);
        }
      }

      // Extract video duration first
      try {
        const durationCmd = "ffprobe -v quiet -show_entries format=duration " +
            `-of default=noprint_wrappers=1:nokey=1 "${tempFileName}"`;
        const {stdout: durationOutput} = await execAsync(durationCmd);
        videoDuration = Math.round(parseFloat(durationOutput.trim()));
        logger.info(`Video duration: ${videoDuration} seconds`);
      } catch (durationError) {
        logger.warn("Could not extract video duration:", durationError);
      }

      // Generate thumbnail
      const thumbnailFileName = "thumb-1.jpg";
      const thumbnailPath = `${videoDir}/${thumbnailFileName}`;

      const ffmpegCmd = `ffmpeg -i "${tempFileName}" -ss 00:00:10 -vframes 1 ` +
          `-q:v 2 -y "${thumbnailPath}"`;
      logger.info(`Running thumbnail ffmpeg command: ${ffmpegCmd}`);

      const {stdout, stderr} = await execAsync(ffmpegCmd);
      logger.info(`ffmpeg thumbnail stdout: ${stdout}`);
      if (stderr) logger.info(`ffmpeg thumbnail stderr: ${stderr}`);

      // Check if thumbnail was created
      if (!fs.existsSync(thumbnailPath)) {
        throw new Error(`Thumbnail file not created: ${thumbnailPath}`);
      }

      // Upload thumbnail to processed bucket in CDN structure
      await processedBucket.upload(thumbnailPath, {
        destination: `thumbnails/${videoId}/${thumbnailFileName}`,
        metadata: {
          contentType: "image/jpeg",
        },
      });

      // Clean up temp files
      if (fs.existsSync(tempFileName)) fs.unlinkSync(tempFileName);
      if (fs.existsSync(videoDir)) {
        fs.rmSync(videoDir, {recursive: true, force: true});
      }

      logger.info(`Successfully processed video ${videoId} with multiple qualities and thumbnail`);
    } catch (processingError) {
      logger.error(`Failed to process video ${videoId}:`, processingError);
      // Clean up temp files on error
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require("fs");
      if (fs.existsSync(tempFileName)) fs.unlinkSync(tempFileName);
      const videoDir = `/tmp/${videoId}`;
      if (fs.existsSync(videoDir)) {
        fs.rmSync(videoDir, {recursive: true, force: true});
      }
      throw processingError;
    }

    // Update video status to processed with duration
    await firestore.collection(videoCollectionId).doc(videoId).update({
      status: "processed",
      duration: videoDuration,
      processedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    logger.info(`✅ Video ${videoId} processing completed - ` +
        `Status: processed, Duration: ${videoDuration}s`);

    logger.info(`Successfully processed video ${videoId} automatically`);
  } catch (error) {
    logger.error(`Failed to process video ${videoId} automatically:`, error);

    // Update status to failed
    try {
      await firestore.collection(videoCollectionId).doc(videoId).update({
        status: "failed",
        error: `Automatic processing error: ${error}`,
        updatedAt: new Date().toISOString(),
      });
    } catch (updateError) {
      logger.error(`Failed to update video status for ${videoId}:`, updateError);
    }
  }
});

// Function to update all video statuses to processed
// Create or update user profile
export const createUserProfile = onCall(async (request) => {
  const uid = request.auth?.uid;
  const userData = request.data;

  if (!uid) {
    throw new Error("User not authenticated");
  }

  try {
    const userRef = firestore.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create new user profile
      await userRef.set({
        uid: uid,
        displayName: userData.displayName || "Anonymous User",
        email: userData.email || "",
        photoURL: userData.photoURL || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      logger.info(`Created user profile for: ${uid}`);
    } else {
      // Update existing profile
      await userRef.update({
        displayName: userData.displayName || userDoc.data()?.displayName || "Anonymous User",
        email: userData.email || userDoc.data()?.email || "",
        photoURL: userData.photoURL || userDoc.data()?.photoURL || "",
        updatedAt: new Date().toISOString(),
      });
      logger.info(`Updated user profile for: ${uid}`);
    }

    return {success: true};
  } catch (error) {
    logger.error("Error creating user profile:", error);
    throw new Error("Failed to create user profile");
  }
});

export const updateAllVideoStatuses = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new Error("User not authenticated");
  }

  logger.info(`Updating all video statuses for user: ${uid}`);

  try {
    // Get all videos for the user
    const videosSnapshot = await firestore.collection(videoCollectionId)
      .where("uid", "==", uid)
      .get();

    if (videosSnapshot.empty) {
      return {
        success: true,
        message: "No videos found",
        updatedCount: 0,
      };
    }

    const updatePromises: Promise<FirebaseFirestore.WriteResult>[] = [];
    let updatedCount = 0;

    videosSnapshot.forEach((doc) => {
      const videoData = doc.data();
      const videoId = doc.id;

      // Update videos that don't have 'processed' status
      if (!videoData.status || videoData.status !== "processed") {
        logger.info(`Updating video ${videoId} status to processed`);

        const updatePromise = firestore.collection(videoCollectionId).doc(videoId).update({
          status: "processed",
          processedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        updatePromises.push(updatePromise);
        updatedCount++;
      }
    });

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      logger.info(`Successfully updated ${updatedCount} video(s) to processed status`);
    }

    return {
      success: true,
      message: `Updated ${updatedCount} video(s) to processed status`,
      updatedCount,
    };
  } catch (error) {
    logger.error("Error updating video statuses:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update video statuses");
  }
});
