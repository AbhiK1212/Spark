import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs';

const execAsync = promisify(exec);
const storage = new Storage();
const firestore = new Firestore();

const rawVideoBucketName = process.env.RAW_VIDEO_BUCKET_NAME || 'abhi-yt-raw-videos';
const processedVideoBucketName = process.env.PROCESSED_VIDEO_BUCKET_NAME || 'abhi-yt-processed-videos';
const videoCollectionId = process.env.VIDEO_COLLECTION_ID || 'videos';

export async function processVideo(videoId: string, fileName: string): Promise<void> {
  console.log(`Starting video processing for: ${videoId}`);

  const rawBucket = storage.bucket(rawVideoBucketName);
  const processedBucket = storage.bucket(processedVideoBucketName);

  // Download the video file temporarily for processing
  const tempFileName = `/tmp/${fileName}`;
  await rawBucket.file(fileName).download({ destination: tempFileName });

  try {
    // Generate multiple video qualities and thumbnails
    const videoDir = `/tmp/${videoId}`;
    fs.mkdirSync(videoDir, { recursive: true });

    // Generate thumbnail
    const thumbnailFileName = 'thumb-1.jpg';
    const thumbnailPath = `${videoDir}/${thumbnailFileName}`;

    await new Promise((resolve, reject) => {
      ffmpeg(tempFileName)
        .screenshots({
          timestamps: ['10%'],
          filename: thumbnailFileName,
          folder: videoDir,
          size: '320x180'
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Upload thumbnail to processed bucket
    const thumbnailDestination = `thumbnails/${videoId}/${thumbnailFileName}`;
    await processedBucket.upload(thumbnailPath, {
      destination: thumbnailDestination,
    });

    // Define video qualities to generate
    const qualities = [
      { name: '360p', resolution: '640x360', bitrate: '800k' },
      { name: '720p', resolution: '1280x720', bitrate: '2500k' },
      { name: '1080p', resolution: '1920x1080', bitrate: '5000k' }
    ];

    for (const quality of qualities) {
      const outputFileName = `${videoId}-${quality.name}.mp4`;
      const outputPath = `${videoDir}/${outputFileName}`;
      const outputDestination = `videos/${videoId}/${outputFileName}`;

      await new Promise((resolve, reject) => {
        ffmpeg(tempFileName)
          .videoCodec('libx264')
          .audioCodec('aac')
          .size(quality.resolution)
          .videoBitrate(quality.bitrate)
          .output(outputPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      await processedBucket.upload(outputPath, {
        destination: outputDestination,
      });

      console.log(`Generated ${quality.name} quality for video ${videoId}`);
    }

    // Update video status to processed
    await firestore.collection(videoCollectionId).doc(videoId).update({
      status: 'processed',
      processedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`Successfully processed video ${videoId}`);
  } catch (error) {
    console.error(`Failed to process video ${videoId}:`, error);

    // Update status to failed
    await firestore.collection(videoCollectionId).doc(videoId).update({
      status: 'failed',
      updatedAt: new Date().toISOString(),
    });

    throw error;
  } finally {
    // Clean up temporary files
    if (fs.existsSync(tempFileName)) {
      fs.unlinkSync(tempFileName);
    }
    const videoDir = `/tmp/${videoId}`;
    if (fs.existsSync(videoDir)) {
      fs.rmSync(videoDir, { recursive: true, force: true });
    }
  }
}
