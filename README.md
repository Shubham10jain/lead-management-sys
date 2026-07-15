# SJ Attorney's — Lead Management System

A two-sided lead intake and case-management app. Prospects create an account, complete a
profile, and track their application status. Attorneys review submissions, move them through
a review pipeline, and reach out.

## Stack

- **Backend:** FastAPI + PostgreSQL + SQLAlchemy + Alembic
- **Frontend:** Next.js 14 (App Router) + shadcn/ui + Tailwind
- **Email:** EmailJS (relayed through a connected Gmail account — no domain verification needed)
- **Infra:** Docker Compose (Postgres only; backend/frontend run locally)

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker Desktop (for PostgreSQL)

## Quick start

### 1. Start PostgreSQL

```bash
cp .env.example .env   # set a real POSTGRES_PASSWORD — docker compose reads this file
docker compose up -d db
```

Runs on host port **5433** (not the Postgres default 5432, so it can run alongside other
Postgres containers without conflicting). This root `.env` only sets the Postgres container's
password — it's separate from `backend/.env` in the next step, which is where that same
password (and everything else) actually gets used by the app.

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in real secrets — see Environment variables below.
                        # DATABASE_URL's password must match the root .env's POSTGRES_PASSWORD.
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

- Health check: http://localhost:8001/api/v1/health
- Interactive API docs: http://localhost:8001/docs

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev -- --port 3001
```

App: http://localhost:3001

**Don't run two `npm run dev` instances against the same `frontend/` folder at once** — they
share the `.next` build cache and will corrupt each other's build, causing pages to 500 after
a successful API call. Stick to one dev server per checkout.

### 4. Create your first attorney account

There's no public attorney sign-up (invite-only by design). Use the CLI:

```bash
cd backend
source .venv/bin/activate
python -m scripts.manage_attorneys add <email> <password> <"Full Name">
```

Other commands:

```bash
python -m scripts.manage_attorneys list
python -m scripts.manage_attorneys passwd <email> <new_password>
python -m scripts.manage_attorneys remove <email>
```

## How it works

### Leads (prospects)

1. **Sign up** (`/`) — name, email, password.
2. **Complete profile** (`/complete-profile`) — name, phone, location, visa status, resume
   upload, optional note on what they're looking for. This is what actually creates their
   application; one profile per account.
3. **Dashboard** (`/dashboard`) — edit profile fields and see live application status.

### Attorneys

1. **Login** (`/attorney/login`) — email/password only, seeded via the CLI above.
2. **Pipeline** (`/attorney/leads`) — stats, search, pagination, one-click status advance.
3. **Lead detail** (`/attorney/leads/[id]`) — full submission, resume download, and a real
   audit-trail timeline (account created → profile submitted → status changes).

### Application status

Three states, monotonic (no going backwards):

```
PENDING → IN_PROGRESS → COMPLETED
   └────────────────────↑ (can also skip straight to COMPLETED)
```

### Auth model

- Plain email/password JWT auth for both roles — no OAuth.
- Sessions live in `sessionStorage` (cleared when the tab closes) + a matching session cookie
  used only by `middleware.ts` for route guarding.
- Auto-logout after 5 minutes of inactivity.
- `middleware.ts` only checks that *some* valid session exists before letting a request through
  to a protected route — it can't tell lead from attorney. The real authorization boundary is
  the backend: lead-only and attorney-only endpoints reject the wrong role with `403`, and the
  frontend catches that and redirects to the right login page.
- Forgot/reset password: single-use, 60-minute-expiry token, works for either role.

## Environment variables

Three separate `.env` files, each copied from its own `.env.example`:

- **`.env`** (root) — only `POSTGRES_PASSWORD`, read by `docker-compose.yml`.
- **`backend/.env`** — everything the API needs.
- **`frontend/.env.local`** — just `NEXT_PUBLIC_API_URL`.

See `backend/.env.example` and `frontend/.env.example` for the full list. Notable ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string — password must match the root `.env`'s `POSTGRES_PASSWORD` |
| `JWT_SECRET` | Signs auth tokens — generate one with `python -c "import secrets; print(secrets.token_urlsafe(32))"`, don't use the example value |
| `EMAILJS_SERVICE_ID` / `EMAILJS_PUBLIC_KEY` / `EMAILJS_PRIVATE_KEY` | EmailJS account credentials |
| `EMAILJS_PROSPECT_TEMPLATE_ID` | Template for the "we received your application" email |
| `EMAILJS_ATTORNEY_TEMPLATE_ID` | Template for the "new lead submitted" notification |
| `EMAILJS_RESET_PASSWORD_TEMPLATE_ID` | Template for password-reset emails |
| `FRONTEND_URL` | Used to build links inside emails (dashboard links, reset links) |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |

If EmailJS isn't configured (any of service ID / public key / a given template ID is blank),
that email just logs to the backend console instead of failing — handy for local dev.

**EmailJS non-browser requests:** since the backend (not a browser) calls the EmailJS API,
you must enable **"Allow non-browser requests"** in your EmailJS account under
Account → Security, or every send will be rejected with a 403.

## Database

Three tables:

- `users` — both roles live here (`role = 'attorney' | 'lead'`), plus password-reset token fields
- `leads` — one row per completed lead profile, FK'd to `users.id`
- `lead_history` — append-only audit log (account created, profile submitted, status changes)

## Repo layout

```
lead-management-sys/
├── backend/
│   ├── app/
│   │   ├── api/v1/        # auth.py, leads.py — route handlers
│   │   ├── core/          # security (JWT/bcrypt/reset tokens), typed exceptions
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic request/response shapes
│   │   └── services/      # business logic: lead_service, email_service, storage_service
│   ├── alembic/           # migrations
│   ├── scripts/           # manage_attorneys.py CLI
│   └── uploads/           # local resume storage (gitignored)
├── frontend/
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.tsx                  # lead sign-up
│   │   ├── sign-in/                  # lead sign-in
│   │   ├── complete-profile/
│   │   ├── dashboard/                # lead's own dashboard
│   │   ├── forgot-password/ reset-password/
│   │   └── attorney/
│   │       ├── login/
│   │       └── leads/[id]/
│   ├── components/
│   └── lib/                          # api.ts (backend client), auth.ts (token storage)
├── Lead/                  # design references for lead-facing screens (not app code)
├── Attorny/               # design references for attorney-facing screens (not app code)
└── docker-compose.yml
```

## Known limitations / not built

- No email verification on signup.
- No self-service email change; password reset only.
- Attorneys can only be created/removed via the CLI — no admin UI.
- No pagination UI polish beyond Prev/Next (no jump-to-page).
- No automated test suite yet.
