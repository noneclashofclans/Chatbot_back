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
app.use(express.json({ limit: '110mb' }));
app.use(express.urlencoded({ extended: true, limit: '110mb' }));

// Allow only image formats: jpg, jpeg, png, heif
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heif'];

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, JPEG, PNG, and HEIF images are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No valid file uploaded' });

  res.json({
    message: 'File uploaded successfully',
    fileBuffer: req.file.buffer.toString('base64'),
    fileType: req.file.mimetype,
  });
});

app.post('/gemini-analyse', async (req, res) => {
  try {
    const { prompt, fileBuffer, fileType } = req.body;

    if (!prompt || !fileBuffer || !fileType) {
      return res.status(400).json({ error: 'Missing required fields' });
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
    console.error('[Gemini ERROR]', err?.message);
    res.status(500).json({ error: 'Failed to analyse image/question.' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello Bunny Backend is Live!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
