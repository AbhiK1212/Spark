# Video Processing Service

A microservice for processing video uploads with FFmpeg, generating multiple quality outputs and thumbnails.

## Features

- Multiple video quality generation (360p, 720p, 1080p)
- Automatic thumbnail extraction
- Google Cloud Storage integration
- Firestore database updates
- Docker containerization

## Setup

```bash
npm install
npm run build
npm start
```

## Environment Variables

- `RAW_VIDEO_BUCKET_NAME`: Source bucket for raw videos
- `PROCESSED_VIDEO_BUCKET_NAME`: Destination bucket for processed videos
- `VIDEO_COLLECTION_ID`: Firestore collection for video metadata
- `PORT`: Service port (default: 8080)

## API Endpoints

- `GET /health`: Health check
- `POST /process`: Process video with videoId and fileName
