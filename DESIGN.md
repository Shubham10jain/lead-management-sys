# Design Document — SJ Attorney's Lead Management System

This documents what was built, the decisions behind it, and why — including the places where
the requested design mockups conflicted with each other or with the stated requirements, and
how those conflicts were resolved.

---

## 1. Origin

This project is a two-sided lead intake and case-management app, built from scratch around a
proven pattern for the boring-but-easy-to-get-wrong parts — JWT auth, file upload validation,
Alembic wiring, CORS, background email dispatch — so the actual design effort could go
entirely into the real requirements (accounts, richer profiles, review pipeline) instead of
re-solving solved problems. Driven by two sets of design mockups (`Lead/` and `Attorny/`)
provided for this build.

---

## 2. What's being built

Two portals sharing one backend and one database:

- **Lead portal** — a prospect creates an account, fills out a profile (not just a bare form),
  and can return later to check status or edit details.
- **Attorney portal** — reviews submissions, moves them through a pipeline, downloads resumes,
  sees a real history of what happened to each case.

This is a meaningful step up from "anonymous form → email → dashboard": leads now have
persistent accounts and an ongoing relationship with their application, not a one-shot
submission.

---

## 3. Where the mockups disagreed, and what was chosen

The provided mockups were internally inconsistent in a few places. Rather than silently pick
one interpretation, each conflict was surfaced and a decision locked in before building:

| Conflict | Resolution | Why |
|---|---|---|
| Text spec said "just name + email"; the `complete_your_profile` mockup asked for location, visa status, resume; the attorney's `lead_details_view` mockup showed phone, source, and an interest note that appear nowhere in the lead's own form | Built the **full field set** — phone and interest note added to the lead's Complete Profile form even though the mockup HTML omitted them, since the attorney view assumes they exist | An attorney-visible field with no way for the lead to ever supply it is a broken form, not a design choice |
| Candidate dashboard mockup showed a 3-stage legend (Yet to be reviewed / In Process / Completed); the attorney pipeline table and lead-detail mockup's actual `<script>` only implement a 2-state PENDING/REACHED_OUT toggle | Built **3 real states** (`PENDING` → `IN_PROGRESS` → `COMPLETED`), and gave the attorney a proper status control (not one button) that can advance through them, including skipping straight to Completed | The lead-facing legend was the more specific, more recently stated requirement; a cosmetic-only 3-stage display over a 2-state backend would be lying to the user about what state their application is actually in |
| Mockups used two different product names ("LeadSync Pro" for leads, "LexLead Portal" for attorneys) | Used a single name, **SJ Attorney's**, everywhere | Inconsistent branding across a two-sided app looks like two different products, not one system with two logins |
| "Automated Scoring" and a fabricated "Qualified as High-Intent (Score: 94/100)" activity-log entry in the attorney mockup | **Not built.** The Internal Lead History timeline shows only real events (account created, profile submitted, status changes) | Faking a score with no scoring model behind it is worse than not having the feature — it looks authoritative and is meaningless |
| "Source" field shown as "LinkedIn Inbound" in the mockup, with no actual multi-channel tracking anywhere in the system | Defaults to `"Direct Application"` for every submission | There's exactly one channel (the app itself); inventing a picker for sources that don't exist would be decorative complexity |

---

## 4. Locked technical decisions

### 4.1 Auth: plain email/password JWT, no OAuth — for now

Both mockups showed a "Sign in with Google" button. This was scoped out deliberately: Google
OAuth requires a real Cloud Console project, consent screen, and Client ID/Secret — a
meaningful side-quest not worth taking on for this pass. Email/password covers both roles
identically, which also keeps the login form and backend logic uniform instead of branching
by provider.

**What was added instead:** a full forgot/reset-password flow, since without OAuth,
password recovery is the only way back into an account. Single-use, hashed, 60-minute-expiry
tokens — the raw token only ever exists in the emailed link, never stored.

### 4.2 One `users` table, not two

Leads and attorneys are both rows in `users` with a `role` column, rather than separate
tables. This mirrors how the login form actually works (one email/password endpoint for
everyone) and means adding a role — e.g. a paralegal role later — is a column value, not a
schema migration plus a second auth code path.

**The trade-off this creates:** a lead's JWT is structurally valid on attorney-only endpoints —
nothing about the token itself says "this is a lead token." Authorization is therefore enforced
per-request, not per-token: `require_attorney` / `require_lead` dependencies check `role` on
every protected route and return `403` on mismatch. This was verified directly (a lead account
hitting `GET /leads` gets `403`, not `200` with empty data or a silent bypass).

### 4.3 Middleware is a UX convenience, not the security boundary

`middleware.ts` only checks "is there a session cookie at all" before letting a request through
to `/dashboard`, `/complete-profile`, or `/attorney/leads/*`. It can't distinguish lead sessions
from attorney sessions — that information isn't in the cookie, only in the JWT the backend
decodes. So a lead with a valid cookie can *reach* `/attorney/leads` at the routing layer; the
page's own `useEffect` then calls the API, gets `403`, and redirects to `/attorney/login`.

This two-layer design (coarse client gate + real backend enforcement) was a deliberate choice
over trying to make middleware role-aware (which would mean either shipping the role in a
readable cookie — a minor info leak and one more thing to keep in sync — or making middleware
call the backend on every request, adding latency to every navigation for a check that has to
happen server-side on mutation anyway).

### 4.4 Status model: monotonic, three states

```
PENDING → IN_PROGRESS → COMPLETED
   └────────────────────↑ (direct skip allowed)
```

Backwards transitions and no-ops are rejected with `409` — status changes are one-directional
so the history log stays meaningful; "un-completing" a case doesn't correspond to anything a
law firm actually does.

### 4.5 Real audit trail instead of decorative activity data

`lead_history` is a genuine table, populated at the moments things actually happen
(`ACCOUNT_CREATED`, `PROFILE_SUBMITTED`, `STATUS_CHANGED`), not a hardcoded set of mock rows.
This was the direct alternative to building the mockup's fake "Automated Scoring" entry — same
visual slot in the UI, but backed by something true.

### 4.6 Isolated infrastructure

Dedicated Postgres container on host port `5433`, its own Docker volume, freshly generated
`JWT_SECRET` and DB password, and dedicated backend/frontend ports (`8001`/`3001`). This keeps
the app self-contained and avoids any port or data collision with other local projects.

### 4.7 Session lifetime

Token lives in `sessionStorage` (dies with the tab) plus a mirrored session cookie with no
`max-age` (dies with the browser) for middleware's use. A 5-minute inactivity timer
(mouse/keyboard/scroll/touch) triggers auto-logout on top of that. No "remember me" — every
session is short-lived by default, which fits an app handling resumes and personal case data
more than a long-lived "stay logged in for 30 days" pattern would.

### 4.8 Email delivery: EmailJS

EmailJS, relaying through a connected Gmail account, was chosen over provider APIs like Resend
because it has no free-tier "only send to your own verified address" restriction — it can
deliver to any recipient without a verified domain, which matters here since applicants and
attorneys are arbitrary email addresses, not a pre-verified list. Three templates: prospect
confirmation, attorney notification, and password-reset.

---

## 5. Data model

```
users
  id, email (unique, lowercased), full_name, hashed_password,
  role ('attorney' | 'lead'), reset_token_hash, reset_token_expires_at, created_at

leads
  id, user_id (FK → users.id, unique — one profile per account),
  first_name, last_name, email, phone, location, visa_status, source, interest_note,
  resume_path, resume_filename, resume_mime_type, resume_size_bytes,
  status ('PENDING' | 'IN_PROGRESS' | 'COMPLETED'),
  created_at, updated_at

lead_history
  id, lead_id (FK → leads.id), event, description, created_at
```

`leads.user_id` is nullable-safe unique (one active profile per lead account, enforced at the
service layer with a `409` on a second submission attempt, not just a UI affordance).

---

## 6. What was intentionally left out

- Google/OAuth sign-in (see §4.1) — UI-ready extension point if revisited later.
- Multi-role beyond attorney/lead (e.g. admin, paralegal) — the `role` column supports it, no
  code assumes exactly two roles, but nothing beyond the two was built.
- Attorney self-registration — invite-only via CLI (`manage_attorneys.py`) is intentional, not
  a placeholder; this is an internal tool, not a public product.
- Automated lead scoring — see §3, not faked.
- Pagination beyond Prev/Next — no jump-to-page control.
- Automated test suite.

## 7. Bugs found and fixed during the build

- **Email case-sensitivity**: signup/login weren't lowercasing email before storage or lookup,
  so `Foo@Bar.com` and `foo@bar.com` could register as two separate accounts. Fixed with a
  `field_validator` on every auth schema, plus the CLI script.
- **Shared `.next` cache corruption**: running a production `next build` in the same folder as
  a live `next dev` process (or running two `next dev` instances against the same folder)
  corrupts the dev server's incremental build cache, causing specific routes to fail after
  working API calls. Documented in the README as a "don't do this" rather than just fixed once.
