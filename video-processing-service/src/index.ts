import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import { convertVideo, createDirectories, deleteProcessedVideo, deleteRawVideo, downloadRawvideo, uploadProcessedVideo } from './storage';
import { isVideoNew, setVideo } from './firestore';

createDirectories();

const app = express();
app.use(express.json());

app.post('/process-video', async  (req, res) => {
    
    //Get the bucket and filename from the Cloud Pub/Sub message; message queue; endpoint triggered by a message queue
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString(); // Decode the message
        data = JSON.parse(message); // Parse the message 
        if (!data.name) {
            throw new Error('No filename provided!');
        }
    } catch (error) {
        console.error(error);
        return res.status(400).send(`Bad Request: missing filename`);
    }
 

    const inputFileName = data.name; // Get the filename from the message
    const outputFileName = `processed-${inputFileName}`; // Set the output filename  
    const videoId = inputFileName.split('.')[0]; // Get the video ID from the filename
    
    if (!isVideoNew(videoId)) { // Check if the video is new
        return res.status(400).send('Bad Request: video already processing or processed');
    } else {
        await setVideo(videoId, {
            id: videoId,
            uid: videoId.split('-')[0],
            status: 'processing'
        })
    }

    //Download the raw video from Cloud Storage
    await downloadRawvideo(inputFileName); 

    // Convert the video to 360p
    try { // Try to convert the video because it may fail
        await convertVideo(inputFileName, outputFileName)
    } catch (err){
        await Promise.all([ //Promise to await the upload of the processed video and the upload of the input video in parallel
            deleteRawVideo(outputFileName), // Delete the processed video
            deleteProcessedVideo(inputFileName) // Delete the input video
        ]);
        console.error(err); // Log the error
        return res.status(500).send('Internal Server Error: Failed to process video'); // Return a 500 status code if the video processing fails    
    }

    // Upload the processed video to Cloud Storage
    await uploadProcessedVideo(outputFileName);

    await setVideo(videoId, {
        status: 'processed',
        filename: outputFileName
    });

    // Delete the raw and processed videos
    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ]);

    res.status(200).send('Video processed successfully!'); // Return a 200 status code if the video processing is successful
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});

