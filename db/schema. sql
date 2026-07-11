-- J.T. Reffell Memorial French Friendship Primary — SIMS database schema
-- Run once via `npm run migrate`.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','teacher','parent')),
  cls TEXT,                 -- teacher's assigned class, or parent's child's class
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cls TEXT NOT NULL,
  gender TEXT,
  dob DATE,
  guardian_name TEXT,
  guardian_phone TEXT,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fees (
  student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  due NUMERIC(14,2) NOT NULL DEFAULT 450000,
  paid NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  paid_on DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  subject TEXT NOT NULL,
  score NUMERIC(5,2),
  UNIQUE(student_id, term, subject)
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  cls TEXT NOT NULL,
  att_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present','absent','late')),
  UNIQUE(student_id, att_date)
);

CREATE TABLE IF NOT EXISTS timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cls TEXT NOT NULL,
  day TEXT NOT NULL,
  period_index INT NOT NULL,
  subject TEXT NOT NULL,
  UNIQUE(cls, day, period_index)
);

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  subject TEXT,
  phone TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salaries (
  staff_id UUID PRIMARY KEY REFERENCES staff(id) ON DELETE CASCADE,
  basic NUMERIC(14,2) NOT NULL DEFAULT 0,
  housing NUMERIC(14,2) NOT NULL DEFAULT 0,
  transport NUMERIC(14,2) NOT NULL DEFAULT 0,
  other NUMERIC(14,2) NOT NULL DEFAULT 0,
  nassit NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax NUMERIC(14,2) NOT NULL DEFAULT 0,
  other_deduction NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  role TEXT NOT NULL,
  month TEXT NOT NULL,
  year INT NOT NULL,
  basic NUMERIC(14,2) NOT NULL,
  housing NUMERIC(14,2) NOT NULL,
  transport NUMERIC(14,2) NOT NULL,
  other NUMERIC(14,2) NOT NULL,
  nassit NUMERIC(14,2) NOT NULL,
  tax NUMERIC(14,2) NOT NULL,
  other_deduction NUMERIC(14,2) NOT NULL,
  gross NUMERIC(14,2) NOT NULL,
  net NUMERIC(14,2) NOT NULL,
  generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  generated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_label TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'simulated',
  recipient_count INT NOT NULL DEFAULT 1,
  sent_by UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enquiry_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('parent','school')),
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_cls ON students(cls);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(att_date);
CREATE INDEX IF NOT EXISTS idx_payslips_staff ON payslips(staff_id);
