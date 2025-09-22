# Spark 🚀

Spark is a modern, cloud-native video platform built with Next.js, Firebase, and Google Cloud Platform. This project demonstrates a full-stack video sharing application with real video processing, authentication, and cloud infrastructure.

[**Live Demo**](https://spark-video-platform.vercel.app) | [**Documentation**](#-quick-start) | [**Architecture**](#️-architecture)

## Features

### Video Management
- **📤 Video Upload**: Real video uploads with Google Cloud Storage
- **🎬 Video Processing**: FFmpeg-based processing with 720p quality output
- **🖼️ Thumbnail Generation**: Automatic thumbnail extraction and fallback system
- **🎥 Video Playback**: Professional video player with controls and duration display
- **⏱️ Duration Tracking**: Automatic duration extraction and display
- **🗑️ Video Management**: Delete videos with proper cleanup

### User Experience
- **🔐 Authentication**: Google OAuth sign-in via Firebase Auth
- **👤 User Profiles**: Automatic user profile creation and management
- **📱 Responsive Design**: Mobile-first UI with Tailwind CSS
- **⚡ Real-time Updates**: Automatic video status updates
- **🎯 Status Management**: Clean status display (Processed/Processing)
- **📊 View Counting**: Video view tracking with session management

### Technical Features
- **☁️ Cloud Infrastructure**: Google Cloud Storage, Firebase Functions
- **🔄 Event-Driven**: Automatic video processing triggers
- **📈 Scalable**: Serverless architecture with auto-scaling
- **🛡️ Type-Safe**: Full TypeScript implementation
- **🎨 Modern UI**: Shadcn/UI components with animations
- **🧹 Clean Code**: Professional codebase with proper error handling

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js Web   │    │  Firebase API   │    │ Video Processing│
│   Application   │◄──►│    Functions    │◄──►│    Service      │
│   (Frontend)    │    │   (Backend)     │    │  (Cloud Run)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │ Google Cloud    │    │   Cloud Pub/Sub │
│   Firestore     │    │    Storage      │    │   & Cloud Run   │
│   (Database)    │    │  (File Storage) │    │  (Event Queue)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/UI** - Modern component library
- **Firebase Auth** - User authentication

### Backend
- **Firebase Functions** - Serverless API endpoints
- **Firestore** - NoSQL database
- **Google Cloud Storage** - Video file storage
- **Cloud Pub/Sub** - Event-driven processing
- **Cloud Run** - Video processing service
- **FFmpeg** - Video processing and thumbnail generation

### Infrastructure
- **Google Cloud Platform** - Cloud infrastructure
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Cloud CDN** - Content delivery network
- **Firebase Hosting** - Web application hosting
- **Cloud Storage** - Raw and processed video storage

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Platform account
- Firebase project

### 1. Environment Setup

**spark-client-web/.env.local**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Install Dependencies

```bash
# Install client dependencies
cd spark-client-web
npm install

# Install API dependencies
cd ../spark-api-service/functions
npm install
```

### 3. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and deploy functions
firebase login
cd spark-api-service
firebase deploy --only functions
```

### 4. Google Cloud Setup

```bash
# Create storage buckets
gsutil mb gs://your-raw-videos
gsutil mb gs://your-processed-videos
```

### 5. Start Development

```bash
cd spark-client-web
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
spark-video-platform/
├── spark-client-web/          # Next.js frontend
│   ├── app/                   # App Router pages
│   ├── components/            # React components
│   ├── utilities/             # Firebase utilities
│   └── public/                # Static assets
└── spark-api-service/         # Firebase Functions
    └── functions/             # Cloud Functions
```

## Key Features

### Video Processing Pipeline
1. User uploads video to Google Cloud Storage
2. Storage trigger fires Firebase Function
3. FFmpeg processes video (720p quality)
4. Thumbnail generation with fallback system
5. Duration extraction and metadata storage
6. Status automatically updates to "Processed"

### Authentication Flow
1. Google OAuth sign-in via Firebase Auth
2. Automatic user profile creation in Firestore
3. Real-time authentication state management
4. User-specific video management

### Video Playback
1. CDN-optimized video delivery
2. Professional video player with controls
3. View counting with session management
4. Responsive design for all devices

## Configuration

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /videos/{videoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Deployment

### Production Deployment
```bash
# Deploy Firebase Functions
cd spark-api-service
firebase deploy --only functions

# Deploy Next.js application
cd spark-client-web
npm run build
vercel deploy
```

## Monitoring
- Firebase Console for functions and database
- Google Cloud Console for storage
- Real-time error tracking
- Performance monitoring
