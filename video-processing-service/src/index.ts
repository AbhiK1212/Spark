import express from 'express';
import { processVideo } from './video-pipeline';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Video processing endpoint
app.post('/process', async (req, res) => {
  try {
    const { videoId, fileName } = req.body;
    
    if (!videoId || !fileName) {
      return res.status(400).json({ error: 'Missing videoId or fileName' });
    }

    await processVideo(videoId, fileName);
    res.status(200).json({ success: true, message: 'Video processed successfully' });
  } catch (error) {
    console.error('Video processing error:', error);
    res.status(500).json({ error: 'Video processing failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Video processing service running on port ${PORT}`);
});
