const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAuth);

// GET /api/enquiries — list with latest message preview
router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT e.*, (SELECT body FROM enquiry_messages m WHERE m.enquiry_id = e.id ORDER BY sent_at DESC LIMIT 1) AS last_message
     FROM enquiries e ORDER BY e.created_at DESC`
  );
  res.json({ enquiries: result.rows });
}));

// GET /api/enquiries/:id/messages
router.get('/:id/messages', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT * FROM enquiry_messages WHERE enquiry_id=$1 ORDER BY sent_at ASC`,
    [req.params.id]
  );
  res.json({ messages: result.rows });
}));

// POST /api/enquiries — start a new thread
router.post('/', asyncHandler(async (req, res) => {
  const { name, topic, body } = req.body;
  if (!name || !topic || !body) return res.status(400).json({ error: 'name, topic, body are required' });
  const e = await query(`INSERT INTO enquiries (name, topic) VALUES ($1,$2) RETURNING *`, [name, topic]);
  await query(`INSERT INTO enquiry_messages (enquiry_id, sender, body) VALUES ($1,'parent',$2)`, [e.rows[0].id, body]);
  res.status(201).json({ enquiry: e.rows[0] });
}));

// POST /api/enquiries/:id/messages — reply
router.post('/:id/messages', asyncHandler(async (req, res) => {
  const { sender, body } = req.body;
  if (!sender || !body) return res.status(400).json({ error: 'sender and body are required' });
  const result = await query(
    `INSERT INTO enquiry_messages (enquiry_id, sender, body) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, sender, body]
  );
  res.status(201).json({ message: result.rows[0] });
}));

module.exports = router;
