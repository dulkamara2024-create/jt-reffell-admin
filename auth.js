const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, cls: user.cls },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
}

// POST /api/auth/login  { email, password }
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const result = await query('SELECT * FROM users WHERE email=$1', [email.toLowerCase().trim()]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, cls: user.cls }
  });
}));

// GET /api/auth/me — verify a token and return the current user
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/register — admin creates a new login (teacher/parent/admin)
router.post('/register', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { name, email, password, role, cls } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, role are required' });
  }
  if (!['admin', 'teacher', 'parent'].includes(role)) {
    return res.status(400).json({ error: 'role must be admin, teacher, or parent' });
  }
  const existing = await query('SELECT id FROM users WHERE email=$1', [email.toLowerCase().trim()]);
  if (existing.rows.length) return res.status(409).json({ error: 'An account with that email already exists' });

  const hash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, cls) VALUES ($1,$2,$3,$4,$5)
     RETURNING id, name, email, role, cls, created_at`,
    [name, email.toLowerCase().trim(), hash, role, cls || null]
  );
  res.status(201).json({ user: result.rows[0] });
}));

// POST /api/auth/change-password — any logged-in user changes their own password
router.post('/change-password', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword required' });
  }
  const result = await query('SELECT * FROM users WHERE id=$1', [req.user.id]);
  const user = result.rows[0];
  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
  res.json({ success: true });
}));

module.exports = router;
