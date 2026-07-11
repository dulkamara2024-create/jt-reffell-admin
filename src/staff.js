const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

// GET /api/staff — includes each staff member's current salary structure
router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT st.*, sal.basic, sal.housing, sal.transport, sal.other, sal.nassit, sal.tax, sal.other_deduction
     FROM staff st LEFT JOIN salaries sal ON sal.staff_id = st.id ORDER BY st.name`
  );
  res.json({ staff: result.rows });
}));

// POST /api/staff — add a staff member with a starting salary
router.post('/', asyncHandler(async (req, res) => {
  const { name, role, subject, phone, basic } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'name and role are required' });

  const st = await query(
    `INSERT INTO staff (name, role, subject, phone) VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, role, subject || null, phone || null]
  );
  const basicSalary = basic || 2500000;
  const nassit = Math.round(basicSalary * 0.05);
  await query(
    `INSERT INTO salaries (staff_id, basic, housing, transport, other, nassit, tax, other_deduction)
     VALUES ($1,$2,500000,300000,0,$3,0,0)`,
    [st.rows[0].id, basicSalary, nassit]
  );
  res.status(201).json({ staff: st.rows[0] });
}));

// DELETE /api/staff/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await query('DELETE FROM staff WHERE id=$1', [req.params.id]);
  res.json({ success: true });
}));

module.exports = router;
