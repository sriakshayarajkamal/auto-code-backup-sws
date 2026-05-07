const express = require('express');
const path = require('path');
const db = require('../db');

const router = express.Router();

// GET /api/files — list all uploaded files
router.get('/', (req, res) => {
  const files = db.prepare('SELECT * FROM files ORDER BY uploaded_at DESC').all();
  res.json(files);
});

// GET /api/files/:id/download — download a specific file
router.get('/:id/download', (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path.join(__dirname, '../uploads', file.path);
  res.download(filePath, file.name);
});

module.exports = router;
