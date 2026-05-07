const express = require('express');
const db = require('../db');
const { addClient } = require('../sse');

const router = express.Router();

// GET /api/notifications/stream — frontend connects here for real-time SSE
router.get('/stream', (req, res) => {
  addClient(res);
});

// GET /api/notifications — get all notifications from database
router.get('/', (req, res) => {
  const notifications = db.prepare(
    'SELECT * FROM notifications ORDER BY created_at DESC'
  ).all();
  res.json(notifications);
});

// PATCH /api/notifications/:id/read — mark one notification as read
router.patch('/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// PATCH /api/notifications/read-all — mark all notifications as read
router.patch('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1').run();
  res.json({ success: true });
});

module.exports = router;
