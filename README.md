# J.T. Reffell Memorial French Friendship Primary — SIMS Backend

A real, standalone backend for the school system: Node.js + Express API on top
of a real PostgreSQL database. Runs completely independently of Claude.ai —
deploy it anywhere that runs Node and Postgres.

## What's real here
- **Real accounts**: passwords are hashed with bcrypt, never stored in plain text
- **Real sessions**: JWT tokens, expire automatically, role-checked on every request (admin / teacher / parent)
- **Real database**: PostgreSQL — students, fees, payments, grades, attendance, timetable, staff, salaries, payslips, SMS log, enquiries all persist for real, independent of any browser
- **Real PDFs**: `/api/payroll/payslips/:id/pdf` streams an actual generated PDF file
- **SMS**: safe by default (simulated + logged), becomes real the moment you add a provider API key — see below

## 1. Local setup (fastest way to try it)

Requires Docker.

```bash
cp .env.example .env
docker compose up --build
```

This starts Postgres and the API together. Then, in a second terminal, create the tables and seed a working admin login:

```bash
docker compose exec api npm run migrate
docker compose exec api npm run seed
```

The seed step prints a real admin email + password to the terminal — use it to log in. **Change that password immediately** (via `POST /api/auth/change-password`) in any deployment a real school will use.

API is now live at `http://localhost:4000`. Test it:

```bash
curl http://localhost:4000/api/health
```

## 2. Setup without Docker (if you already have Postgres)

```bash
npm install
cp .env.example .env   # fill in your real DATABASE_URL and JWT_SECRET
npm run migrate
npm run seed
npm start
```

## 3. Deploying somewhere real

Any host that runs Node + Postgres works. Two easy options:

**Railway / Render (recommended for a school with no dedicated IT team)**
1. Push this folder to a GitHub repo
2. Create a new Postgres database on Railway/Render — copy the connection string it gives you into `DATABASE_URL`
3. Create a new Web Service pointing at the repo, set the same environment variables from `.env.example`
4. Run `npm run migrate` and `npm run seed` once (Railway/Render both let you run one-off commands against the deployed service)
5. Your API is now live at a public URL like `https://jt-reffell-api.up.railway.app`

**Your own server (VPS)**
1. Install Node 20+ and Postgres, or just run `docker compose up -d --build` on the server itself
2. Put a reverse proxy (nginx/Caddy) in front with HTTPS (Let's Encrypt)
3. Run migrate + seed as above

## 4. Turning on real SMS

Right now every SMS is logged to the real `sms_log` table but not actually sent — `status` is `"simulated"`. To send real texts to parents:

1. Create an account at [Africa's Talking](https://africastalking.com) (works well for Sierra Leone numbers) and get an API key
2. `npm install africastalking`
3. In `.env`, set:
   ```
   SMS_PROVIDER=africastalking
   AFRICASTALKING_API_KEY=your-real-key
   AFRICASTALKING_USERNAME=your-real-username
   ```
4. Restart the server — from this point, `POST /api/sms` sends real texts and logs `status: "sent"`

No code changes needed — `src/utils/smsProvider.js` is written to switch providers this way. Twilio or another gateway would follow the same pattern; ask if you want that written in instead.

## 5. API overview

All endpoints except `/api/health` and `/api/auth/login` require `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/register` (admin), `POST /api/auth/change-password` |
| Students | `GET/POST /api/students`, `PUT/DELETE /api/students/:id` |
| Fees | `GET /api/fees`, `GET/POST /api/fees/:studentId/payments`, `PUT /api/fees/:studentId` |
| Grades | `GET/POST /api/grades` |
| Attendance | `GET/POST /api/attendance`, `POST /api/attendance/bulk` |
| Timetable | `GET/PUT /api/timetable` |
| Staff | `GET/POST/DELETE /api/staff` (admin) |
| Payroll | `PUT /api/payroll/salary/:staffId`, `POST/GET /api/payroll/payslips`, `GET /api/payroll/payslips/:id/pdf` |
| SMS | `GET/POST /api/sms` |
| Enquiries | `GET/POST /api/enquiries`, `GET/POST /api/enquiries/:id/messages` |

## 6. Connecting the existing frontend

The single-file HTML system (`JT_Reffell_SIMS.html`) currently saves data through Claude's built-in artifact storage, which only works inside Claude.ai. To point that same interface at this real backend instead, its `window.storage.get/set` calls need to be replaced with `fetch()` calls to these API routes, and its login screen needs to actually call `POST /api/auth/login`. That's a distinct, sizeable rewrite of the frontend's data layer — say the word and I'll do that next so the two connect end to end.
