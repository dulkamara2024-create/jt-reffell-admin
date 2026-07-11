const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAuth);

// GET /api/attendance?cls=&date=
router.get('/', asyncHandler(async (req, res) => {
  const { cls, date } = req.query;
  let sql = `SELECT a.*, s.name AS student_name FROM attendance a JOIN students s ON s.id = a.student_id WHERE 1=1`;
  const params = [];
  if (cls) { params.push(cls); sql += ` AND a.cls=$${params.length}`; }
  if (date) { params.push(date); sql += ` AND a.att_date=$${params.length}`; }
  sql += ` ORDER BY a.att_date DESC, s.name`;
  const result = await query(sql, params);
  res.json({ attendance: result.rows });
}));

// POST /api/attendance — mark one student (admin or teacher)
router.post('/', requireRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { studentId, cls, date, status } = req.body;
  if (!studentId || !cls || !date || !status) {
    return res.status(400).json({ error: 'studentId, cls, date, status are required' });
  }
  if (!['present', 'absent', 'late'].includes(status)) {
    return res.status(400).json({ error: 'status must be present, absent, or late' });
  }
  const result = await query(
    `INSERT INTO attendance (student_id, cls, att_date, status) VALUES ($1,$2,$3,$4)
     ON CONFLICT (student_id, att_date) DO UPDATE SET status = EXCLUDED.status
     RETURNING *`,
    [studentId, cls, date, status]
  );
  res.status(201).json({ attendance: result.rows[0] });
}));

// POST /api/attendance/bulk — mark a whole class at once
router.post('/bulk', requireRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { cls, date, records } = req.body; // records: [{studentId, status}]
  if (!cls || !date || !Array.isArray(records)) {
    return res.status(400).json({ error: 'cls, date, and records[] are required' });
  }
  await query('BEGIN');
  try {
    for (const r of records) {
      await query(
        `INSERT INTO attendance (student_id, cls, att_date, status) VALUES ($1,$2,$3,$4)
         ON CONFLICT (student_id, att_date) DO UPDATE SET status = EXCLUDED.status`,
        [r.studentId, cls, date, r.status]
      );
    }
    await query('COMMIT');
    res.json({ success: true, count: records.length });
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
}));

module.exports = router;
