const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { streamPayslipPdf } = require('../utils/payslipPdf');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

function netOf(sal) {
  const gross = Number(sal.basic) + Number(sal.housing) + Number(sal.transport) + Number(sal.other);
  const ded = Number(sal.nassit) + Number(sal.tax) + Number(sal.other_deduction);
  return { gross, net: gross - ded };
}

// PUT /api/payroll/salary/:staffId — set/edit a staff member's salary structure
router.put('/salary/:staffId', asyncHandler(async (req, res) => {
  const { basic, housing, transport, other, nassit, tax, otherDeduction } = req.body;
  const result = await query(
    `INSERT INTO salaries (staff_id, basic, housing, transport, other, nassit, tax, other_deduction)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (staff_id) DO UPDATE SET
       basic=EXCLUDED.basic, housing=EXCLUDED.housing, transport=EXCLUDED.transport, other=EXCLUDED.other,
       nassit=EXCLUDED.nassit, tax=EXCLUDED.tax, other_deduction=EXCLUDED.other_deduction
     RETURNING *`,
    [req.params.staffId, basic, housing, transport, other, nassit, tax, otherDeduction]
  );
  res.json({ salary: result.rows[0] });
}));

// POST /api/payroll/payslips — generate a payslip from the staff member's current salary
router.post('/payslips', asyncHandler(async (req, res) => {
  const { staffId, month, year } = req.body;
  if (!staffId || !month || !year) return res.status(400).json({ error: 'staffId, month, year are required' });

  const staffRes = await query(
    `SELECT st.*, sal.basic, sal.housing, sal.transport, sal.other, sal.nassit, sal.tax, sal.other_deduction
     FROM staff st JOIN salaries sal ON sal.staff_id = st.id WHERE st.id=$1`,
    [staffId]
  );
  if (!staffRes.rows.length) return res.status(404).json({ error: 'Staff member (or their salary setup) not found' });
  const st = staffRes.rows[0];
  const { gross, net } = netOf(st);

  const slip = await query(
    `INSERT INTO payslips (staff_id, staff_name, role, month, year, basic, housing, transport, other, nassit, tax, other_deduction, gross, net, generated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [staffId, st.name, st.role, month, year, st.basic, st.housing, st.transport, st.other, st.nassit, st.tax, st.other_deduction, gross, net, req.user.name]
  );
  res.status(201).json({ payslip: slip.rows[0] });
}));

// GET /api/payroll/payslips — history
router.get('/payslips', asyncHandler(async (req, res) => {
  const result = await query(`SELECT * FROM payslips ORDER BY created_at DESC`);
  res.json({ payslips: result.rows });
}));

// GET /api/payroll/payslips/:id/pdf — real downloadable PDF
router.get('/payslips/:id/pdf', asyncHandler(async (req, res) => {
  const result = await query(`SELECT * FROM payslips WHERE id=$1`, [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Pay slip not found' });
  streamPayslipPdf(res, result.rows[0]);
}));

module.exports = router;
