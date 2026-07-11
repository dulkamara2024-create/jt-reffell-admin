const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAuth);

// GET /api/fees — fee status for every student, with payment history
router.get('/', asyncHandler(async (req, res) => {
  const fees = await query(
    `SELECT s.id AS student_id, s.name, s.cls, f.due, f.paid, (f.due - f.paid) AS balance
     FROM students s JOIN fees f ON f.student_id = s.id ORDER BY s.cls, s.name`
  );
  res.json({ fees: fees.rows });
}));

// GET /api/fees/:studentId/payments
router.get('/:studentId/payments', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT p.*, u.name AS recorded_by_name FROM payments p LEFT JOIN users u ON u.id = p.recorded_by
     WHERE p.student_id=$1 ORDER BY p.paid_on DESC`,
    [req.params.studentId]
  );
  res.json({ payments: result.rows });
}));

// POST /api/fees/:studentId/payments  (admin only) — record a real payment
router.post('/:studentId/payments', requireRole('admin'), asyncHandler(async (req, res) => {
  const { amount, paidOn } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'A positive amount is required' });

  await query('BEGIN');
  try {
    const p = await query(
      `INSERT INTO payments (student_id, amount, paid_on, recorded_by) VALUES ($1,$2,COALESCE($3,CURRENT_DATE),$4) RETURNING *`,
      [req.params.studentId, amount, paidOn || null, req.user.id]
    );
    await query(`UPDATE fees SET paid = paid + $1 WHERE student_id = $2`, [amount, req.params.studentId]);
    await query('COMMIT');
    res.status(201).json({ payment: p.rows[0] });
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
}));

// PUT /api/fees/:studentId — set/adjust how much a student owes (admin only)
router.put('/:studentId', requireRole('admin'), asyncHandler(async (req, res) => {
  const { due } = req.body;
  if (due === undefined) return res.status(400).json({ error: 'due is required' });
  const result = await query('UPDATE fees SET due=$1 WHERE student_id=$2 RETURNING *', [due, req.params.studentId]);
  if (!result.rows.length) return res.status(404).json({ error: 'Fee record not found' });
  res.json({ fee: result.rows[0] });
}));

module.exports = router;
