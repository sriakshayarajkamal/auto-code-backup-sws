const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { broadcast } = require('../sse');

const router = express.Router();

// Configure where and how to save uploaded files
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    // Prefix with timestamp to avoid name conflicts
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Only allow PDF files, max 50MB each
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// POST /api/upload — accepts one or many files
router.post('/', upload.array('files'), (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const inserted = [];

  // Save each file's info to the database
  for (const file of files) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO files (id, name, size, type, path, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, file.originalname, file.size, file.mimetype, file.filename, 'complete');

    inserted.push({
      id,
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      status: 'complete'
    });
  }

  // Bulk upload logic — more than 3 files triggers a notification
  if (files.length > 3) {
    const notifId = uuidv4();
    const message = `${files.length} files uploaded successfully`;
    const now = new Date().toISOString();

    // Save notification to database
    db.prepare(`
      INSERT INTO notifications (id, message, type, is_read, created_at)
      VALUES (?, ?, ?, 0, ?)
    `).run(notifId, message, 'success', now);

    // Push notification to all connected frontend clients via SSE
    broadcast('notification', {
      id: notifId,
      message,
      type: 'success',
      is_read: 0,
      created_at: now
    });
  }

  res.json({ files: inserted, bulk: files.length > 3 });
});

module.exports = router;
