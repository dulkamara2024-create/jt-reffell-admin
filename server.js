require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const feeRoutes = require('./routes/fees');
const gradeRoutes = require('./routes/grades');
const attendanceRoutes = require('./routes/attendance');
const timetableRoutes = require('./routes/timetable');
const staffRoutes = require('./routes/staff');
const payrollRoutes = require('./routes/payroll');
const smsRoutes = require('./routes/sms');
const enquiryRoutes = require('./routes/enquiries');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/enquiries', enquiryRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Centralized error handler — keeps stack traces out of API responses.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`JT Reffell SIMS API listening on port ${PORT}`);
});
