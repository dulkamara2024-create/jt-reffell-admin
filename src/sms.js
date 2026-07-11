const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { sendSms } = require('../utils/smsProvider');

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'teacher'));

// GET /api/sms — message log
router.get('/', asyncHandler(async (req, res) => {
  const result = await query(`SELECT * FROM sms_log ORDER BY sent_at DESC LIMIT 200`);
  res.json({ log: result.rows });
}));

// POST /api/sms — send (or simulate) a message, always logged to the database
router.post('/', asyncHandler(async (req, res) => {
  const { toLabel, to, message, recipientCount } = req.body;
  if (!toLabel || !message || !to) {
    return res.status(400).json({ error: 'toLabel, to (phone number or array of numbers), and message are required' });
  }
  const result = await sendSms({ to, message });
  const logged = await query(
    `INSERT INTO sms_log (to_label, message, status, recipient_count, sent_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [toLabel, message, result.status, recipientCount || (Array.isArray(to) ? to.length : 1), req.user.id]
  );
  res.status(201).json({ log: logged.rows[0], providerResult: result });
}));

module.exports = router;
