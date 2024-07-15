// 1. ALL of GCS file interactions (google cloud storage)
// 2. Local file storage

import { Storage } from '@google-cloud/storage'; // Google Cloud Storage client library
import fs from 'fs'; // Node.js file system module
import ffmpeg from 'fluent-ffmpeg'; // ffmpeg wrapper for Node.js
import { resolve } from 'path';

//constants
const storage = new Storage(); // Create a new Storage client

const rawVideoBucketName = 'abhi-yt-raw-videos'; // The name of the bucket where raw videos are uploaded
const processedVideoBucketName = 'abhi-yt-processed-videos'; // The name of the bucket where processed videos are stored


//delete the file from the local storage after uploading to GCS to save space
const localRawVideoPath = "./raw-videos/"; // The local directory where raw videos are stored (folder)
const localProcessedVideoPath = "./processed-videos/"; // The local directory where processed videos are stored (folder)


/**
 * Creates the local directories for raw and processed videos
 */

export function createDirectories() {
    ensureDirectoryExists(localRawVideoPath);
    ensureDirectoryExists(localProcessedVideoPath);
}

/**
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}.
 * @returns A promise that resolves when the video has been processed.
 */

export function convertVideo(rawVideoName: string, processedVideoName: string) {

    // Return a new promise that resolves when the video has been processed; resolve or reject promise based on the ffmpeg command execution
   return new Promise<void>((resolve, reject) => {
    // Call the ffmpeg command to convert the video
    ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
    .outputOptions('-vf', 'scale=640:-2') // Set width to 640px and adjust height to maintain aspect ratio
    .on('end', function() {
        console.log('Processing finished!');
        resolve();
    })
    .on("error", function(err: any) {
        console.log('An error occurred: ' + err.message);
        reject(err);
    })
    .save(`${localProcessedVideoPath}/${processedVideoName}`);
    });
}

 /**
  * @param fileName - The name of the file to upload to the bucket.
  * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder. 
  * @returns A promise that resolves when the file has been uploaded.
  */

 export async function downloadRawvideo(fileName: string){
    await storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({destination: `${localRawVideoPath}/${fileName}`});

    console.log(
        // Log the name of the file that was downloaded and the path where it was downloaded to; google always uses gs:// for bucket files
        `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}.`
    )
 }

/**
* @param fileName - The name of the file to upload to the bucket.
* {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName} bucket.
* @returns A promise that resolves when the file has been uploaded.
*/

export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName); // Get the bucket where the file will be uploaded
   
    // Check if the file exists in the local directory
    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination: fileName 
    });
    console.log(
        // Log the name of the file that was uploaded and the path where it was uploaded to; google always uses gs:// for bucket files
        `${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}.`
    )


    await bucket.file(fileName).makePublic(); // Make the file public

    }


/**
 * @param fileName - The name of the file to delete from the
 * {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 */

export async function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

/**
 * @param fileName - The name of the file to delete from the
 * {@link localProcessedVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 */

export async function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

/**
 * @param fileName - The name of the file to delete from the local directory
 * @returns A promise that resolves when the file has been deleted.
*/

function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Failed to delete file at ${filePath}`, err);
                    reject(err);
                } else {
                    console.log(`File deleted at ${filePath}`);
                    resolve();
                }
        })
        } else {
            console.log(`File not found at ${filePath}, skipping deletion.`)
            resolve();
        }
    });
}

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The directory path to check
 * 
 */

function ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) { // Check if the directory exists
        fs.mkdirSync(dirPath, { recursive: true }); // Create the directory
        console.log(`Directory created at ${dirPath}`); // Log the directory creation
    }
}