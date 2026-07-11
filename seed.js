require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const CLASSES = ["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6"];
const SUBJECTS = ["English","French","Mathematics","Science","Social Studies"];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@jtreffell.edu.sl';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const hash = await bcrypt.hash(adminPassword, 10);

  const existing = await pool.query('SELECT id FROM users WHERE email=$1', [adminEmail]);
  if (existing.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,'admin')`,
      ['Head Administrator', adminEmail, hash]
    );
    console.log(`Created admin account: ${adminEmail} / ${adminPassword}`);
    console.log('IMPORTANT: log in and change this password immediately in a real deployment.');
  } else {
    console.log('Admin account already exists, skipping.');
  }

  // Sample staff + salaries, only if staff table is empty
  const staffCount = await pool.query('SELECT count(*) FROM staff');
  if (Number(staffCount.rows[0].count) === 0) {
    const staffSeed = [
      ['Mr. Alusine Turay', 'Head Teacher', 'Administration', '+232 76 200 100', 4500000],
      ['Mrs. Isatu Kamara', 'Teacher', 'Class 1', '+232 77 341 220', 2800000],
      ['Mr. Sorie Bangura', 'Teacher', 'Class 3', '+232 78 552 981', 2800000],
      ['Mme. Marie Conteh', 'Teacher', 'French Coordinator', '+232 79 664 512', 3000000],
      ['Mrs. Fatmata Sesay', 'Bursar', 'Finance Office', '+232 76 887 333', 3200000],
    ];
    for (const [name, role, subject, phone, basic] of staffSeed) {
      const r = await pool.query(
        `INSERT INTO staff (name, role, subject, phone) VALUES ($1,$2,$3,$4) RETURNING id`,
        [name, role, subject, phone]
      );
      const staffId = r.rows[0].id;
      const nassit = Math.round(basic * 0.05);
      await pool.query(
        `INSERT INTO salaries (staff_id, basic, housing, transport, other, nassit, tax, other_deduction)
         VALUES ($1,$2,500000,300000,0,$3,0,0)`,
        [staffId, basic, nassit]
      );
    }
    console.log('Seeded 5 sample staff records with salaries.');
  }

  // Sample timetable slots (blank/default) for each class, only if empty
  const ttCount = await pool.query('SELECT count(*) FROM timetable');
  if (Number(ttCount.rows[0].count) === 0) {
    const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
    for (const cls of CLASSES) {
      for (const day of DAYS) {
        for (let i = 0; i < 8; i++) {
          const subject = i === 3 ? 'Break' : SUBJECTS[i % SUBJECTS.length];
          await pool.query(
            `INSERT INTO timetable (cls, day, period_index, subject) VALUES ($1,$2,$3,$4)
             ON CONFLICT (cls, day, period_index) DO NOTHING`,
            [cls, day, i, subject]
          );
        }
      }
    }
    console.log('Seeded default timetable for all classes.');
  }

  await pool.end();
  console.log('Seed complete.');
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
