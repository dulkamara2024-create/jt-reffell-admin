const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAuth);

// GET /api/grades?studentId=&term=&cls=
router.get('/', asyncHandler(async (req, res) => {
  const { studentId, term, cls } = req.query;
  let sql = `SELECT g.*, s.name AS student_name, s.cls FROM grades g JOIN students s ON s.id = g.student_id WHERE 1=1`;
  const params = [];
  if (studentId) { params.push(studentId); sql += ` AND g.student_id=$${params.length}`; }
  if (term) { params.push(term); sql += ` AND g.term=$${params.length}`; }
  if (cls) { params.push(cls); sql += ` AND s.cls=$${params.length}`; }
  sql += ` ORDER BY s.name, g.subject`;
  const result = await query(sql, params);
  res.json({ grades: result.rows });
}));

// POST /api/grades — upsert a single score (admin or teacher of that class)
router.post('/', requireRole('admin', 'teacher'), asyncHandler(async (req, res) => {
  const { studentId, term, subject, score } = req.body;
  if (!studentId || !term || !subject) {
    return res.status(400).json({ error: 'studentId, term, and subject are required' });
  }
  const result = await query(
    `INSERT INTO grades (student_id, term, subject, score) VALUES ($1,$2,$3,$4)
     ON CONFLICT (student_id, term, subject) DO UPDATE SET score = EXCLUDED.score
     RETURNING *`,
    [studentId, term, subject, score]
  );
  res.status(201).json({ grade: result.rows[0] });
}));

module.exports = router;
