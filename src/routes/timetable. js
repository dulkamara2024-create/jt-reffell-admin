const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAuth);

// GET /api/timetable?cls=
router.get('/', asyncHandler(async (req, res) => {
  const { cls } = req.query;
  let sql = `SELECT * FROM timetable`;
  const params = [];
  if (cls) { sql += ` WHERE cls=$1`; params.push(cls); }
  sql += ` ORDER BY cls, day, period_index`;
  const result = await query(sql, params);
  res.json({ timetable: result.rows });
}));

// PUT /api/timetable — upsert one slot (admin only)
router.put('/', requireRole('admin'), asyncHandler(async (req, res) => {
  const { cls, day, periodIndex, subject } = req.body;
  if (!cls || !day || periodIndex === undefined || !subject) {
    return res.status(400).json({ error: 'cls, day, periodIndex, subject are required' });
  }
  const result = await query(
    `INSERT INTO timetable (cls, day, period_index, subject) VALUES ($1,$2,$3,$4)
     ON CONFLICT (cls, day, period_index) DO UPDATE SET subject = EXCLUDED.subject
     RETURNING *`,
    [cls, day, periodIndex, subject]
  );
  res.json({ slot: result.rows[0] });
}));

module.exports = router;
