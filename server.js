const port = process.env.PORT || 8000;
const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const genAI = require('@google/generative-ai');

dotenv.config();

const googleAI = new genAI.GoogleGenerativeAI(process.env.GEMINI_API_KEY);


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  res.json({
    message: 'File uploaded successfully',
    fileId: req.file.filename,
    fileType: req.file.mimetype,
  });
});

app.post('/gemini-analyse', async (req, res) => {
  try {
    const { prompt, fileId, fileType } = req.body;

    if (!prompt || !fileId || !fileType) {
      return res.status(400).json({ error: 'Missing prompt, fileId, or fileType' });
    }

    const filePath = path.join(__dirname, 'public', fileId);
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'Invalid file ID or file not found' });
    }

    const imageBuffer = fs.readFileSync(filePath);
    const model = googleAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: fileType,
        },
      },
    ]);

    const text = result.response.text();
    console.log("Bunny Says..:", text);
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
