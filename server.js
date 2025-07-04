const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const genAI = require('@google/generative-ai');

dotenv.config();
const app = express();
const port = process.env.PORT || 8000;

const googleAI = new genAI.GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Use memory storage (no saving to disk)
const upload = multer({ storage: multer.memoryStorage() });

// Upload route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  res.json({
    message: 'File uploaded successfully',
    fileBuffer: req.file.buffer.toString('base64'),
    fileType: req.file.mimetype,
  });
});

// Analyse route
app.post('/gemini-analyse', async (req, res) => {
  try {
    const { prompt, fileBuffer, fileType } = req.body;

    if (!prompt || !fileBuffer || !fileType) {
      return res.status(400).json({ error: 'Missing prompt, fileBuffer, or fileType' });
    }

    const model = googleAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: fileBuffer,
          mimeType: fileType,
        },
      },
    ]);

    const text = result.response.text();
    res.json({ reply: text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyse image/question.' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
