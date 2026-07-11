const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAuth);

// GET /api/students  (teachers only see their class; admin sees all)
router.get('/', asyncHandler(async (req, res) => {
  let sql = `SELECT s.*, f.due, f.paid FROM students s LEFT JOIN fees f ON f.student_id = s.id`;
  const params = [];
  if (req.user.role === 'teacher' && req.user.cls) {
    sql += ` WHERE s.cls = $1`;
    params.push(req.user.cls);
  }
  sql += ` ORDER BY s.cls, s.name`;
  const result = await query(sql, params);
  res.json({ students: result.rows });
}));

// POST /api/students  (admin only)
router.post('/', requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, cls, gender, dob, guardianName, guardianPhone, address, feeDue } = req.body;
  if (!name || !cls) return res.status(400).json({ error: 'name and cls are required' });

  const s = await query(
    `INSERT INTO students (name, cls, gender, dob, guardian_name, guardian_phone, address)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [name, cls, gender || null, dob || null, guardianName || null, guardianPhone || null, address || null]
  );
  await query(`INSERT INTO fees (student_id, due, paid) VALUES ($1,$2,0)`, [s.rows[0].id, feeDue || 450000]);
  res.status(201).json({ student: s.rows[0] });
}));

// PUT /api/students/:id  (admin only)
router.put('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, cls, gender, dob, guardianName, guardianPhone, address } = req.body;
  const result = await query(
    `UPDATE students SET name=COALESCE($1,name), cls=COALESCE($2,cls), gender=COALESCE($3,gender),
     dob=COALESCE($4,dob), guardian_name=COALESCE($5,guardian_name), guardian_phone=COALESCE($6,guardian_phone),
     address=COALESCE($7,address) WHERE id=$8 RETURNING *`,
    [name, cls, gender, dob, guardianName, guardianPhone, address, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Student not found' });
  res.json({ student: result.rows[0] });
}));

// DELETE /api/students/:id  (admin only)
router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  await query('DELETE FROM students WHERE id=$1', [req.params.id]);
  res.json({ success: true });
}));

module.exports = router;
