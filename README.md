# SafeShift — Multi-Tenant HSE Training & Compliance

One codebase, three brands — **SafeShift Shell · SafeShift ExxonMobil · SafeShift Chevron** — for US oil & gas Health, Safety & Environment (HSE) training and compliance.

> **Live demo** (self-contained demo mode, no signup):
> **[Landing site](https://safeshift-site.vercel.app)** · **[Web console](https://safeshift-web.vercel.app)** · **[Worker app](https://safeshift-mobile-web.vercel.app)** — password for all demo logins: `Passw0rd!`

This is the **Phase 0 + Phase 1** build from the blueprint: the multi-tenant foundation (tenant layer, brand theming, the 3-way brand toggle, feature flags, US terminology) plus the flagship **Certification & Expiry Tracker** module.

> ⚠️ Shell, ExxonMobil, Chevron and their safety-program names are trademarks of their owners. This is a white-label **concept/demo**, not an attempt to impersonate.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite · React 18 · TypeScript · **Tailwind CSS v4** · **React Aria Components** |
| Backend | Express · Sequelize · **PostgreSQL** · JWT · Zod · Nodemailer · node-cron |
| Tenancy | Shared DB + `tenantId` on every row, auto-scoped via `AsyncLocalStorage` + Sequelize hooks |
| Dev infra | Docker Compose (Postgres), npm workspaces monorepo |

---

## Architecture highlights

- **Tenant isolation (defense in depth, §5.2):** a `resolveTenant` middleware sets a request-scoped context; Sequelize `beforeFind`/`beforeCreate` hooks auto-inject `tenantId` so application code can't leak across tenants. Platform admins run with an explicit bypass for cross-tenant views.
- **Brand theming (§5.3):** `Tenant.theme` drives `--brand-*` CSS variables on `:root`; Tailwind utilities (`bg-brand`, `text-brand`) resolve to them, so the **3-way brand toggle** reskins the whole app live with zero component changes.
- **Feature flags (§5.4):** `Tenant.features` gates modules both in the UI (`<Feature flag="…">`) and on the API (`requireFeature('…')` middleware — never trust the client).
- **Per-brand safety vocabulary (§5.5):** `Tenant.safetyProgramLabels` maps generic concepts to each major's wording (Life-Saving Rules / OIMS / OE Tenets).
- **Cert tracker (§8.1):** denormalized status (`active`/`expiring`/`expired`) refreshed by a nightly `node-cron` scan that emails at-risk workers (logs to console when SMTP is unset).

---

## Prerequisites

- Node.js ≥ 20
- A Postgres database — pick one:
  - **Docker** (default) — `npm run db:up` spins up local Postgres on :5544.
  - **Supabase Cloud** (no Docker) — create a free project, then set `DATABASE_URL`
    in `server/.env` to the **Session pooler** or **Direct** connection URI (avoid the
    transaction pooler on `:6543`). TLS auto-enables for remote hosts.
  - **Supabase local CLI** — `supabase start`, then set
    `DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres` and
    `DB_SSL=false`. (Note: the local CLI still runs Postgres in Docker.)

See [.env.example](.env.example) for all three options.

---

## Quick start

```bash
# 1. Install all workspace deps (run from repo root)
npm install

# 2. Start Postgres — Docker (skip if using Supabase; set DATABASE_URL instead)
npm run db:up

# 3. Seed 3 brands, demo users, courses, trainings, and certs
npm run seed

# 4. Run API + web together
npm run dev
```

- Web → http://localhost:5173
- API → http://localhost:4000/api/health

The Vite dev server proxies `/api` to the backend, so no CORS setup is needed in dev.

## Mobile app (Expo SDK 54)

A worker-focused Expo app is included at `mobile/` (TypeScript, Expo SDK 54). It
lets general crew **log in and confirm completion** of their tasks — toolbox
sign-ins, training attendance, and safety acknowledgements — plus view their
certification status. Brand-themed per tenant, with a Home / Tasks / Certs /
Profile tab layout.

```bash
# from repo root
npm run mobile:start
```

Then launch with Expo Go or simulator:

- `npm run mobile:ios`
- `npm run mobile:android`

**Runs offline by default (demo mode):** with no backend configured it uses
seeded data and stores confirmations locally on the device, so it works in Expo
Go on any phone and as a web export with zero setup.

To point it at the real SafeShift API, set `EXPO_PUBLIC_API_URL` before starting:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4100/api npm run mobile:start
```

---

## Demo logins

All accounts share the password: **`Passw0rd!`**

| Role | Email |
|---|---|
| Platform admin (all brands + toggle) | `admin@safeshift.app` |
| Shell — HSE manager | `hse@shell.safeshift.app` |
| Shell — Supervisor / Worker / Contractor | `supervisor@` / `worker@` / `contractor@shell.safeshift.app` |
| ExxonMobil | `…@exxon.safeshift.app` |
| Chevron | `…@chevron.safeshift.app` |

Sign in as the **platform admin** to use the **3-way brand toggle** in the top bar and watch the theme + safety vocabulary swap live. Sign in as a brand user to see that tenant's pinned theme and only the modules enabled for them.

---

## Per-tenant feature matrix (seeded defaults)

| Module | Shell | ExxonMobil | Chevron |
|---|:--:|:--:|:--:|
| Certification & expiry tracker | ✅ | ✅ | ✅ |
| Toolbox talks | ✅ | ✅ | ✅ |
| Incident reporting | ✅ | ✅ | ✅ |
| Stop Work Authority | ✅ | ⬜ | ✅ |
| Safety observations (BBS) | ⬜ | ✅ | ✅ |
| Permit to Work | ✅ | ✅ | ⬜ |
| Contractor compliance | ✅ | ✅ | ✅ |
| SDS library | ✅ | ✅ | ⬜ |
| Audits & inspections | ⬜ | ✅ | ✅ |
| Fleet & garage safety | ⬜ | ⬜ | ✅ |
| Emergency drills | ✅ | ⬜ | ⬜ |

Edit these in [server/src/db/seed.ts](server/src/db/seed.ts).

---

## Project layout

```
SafeShift/
├─ docker-compose.yml        # local Postgres
├─ package.json              # npm workspaces + root scripts
├─ server/                   # Express + Sequelize API
│  └─ src/
│     ├─ config/             # env + database
│     ├─ context/            # AsyncLocalStorage tenant context
│     ├─ middleware/         # resolveTenant, auth, requireFeature, errors
│     ├─ models/             # Tenant, User, Site, Training, Attendance,
│     │                      #   Declaration, Certification (+ tenant scoping)
│     ├─ routes/             # auth, tenants, trainings, certifications, dashboard
│     ├─ services/           # mailer, certScanner
│     ├─ jobs/               # nightly cert-expiry cron
│     └─ db/seed.ts          # 3 brands + demo data
└─ client/                   # Vite + React + TS + Tailwind v4 + React Aria
   └─ src/
      ├─ api/                # axios client + endpoints
      ├─ context/            # AuthContext, TenantContext (theming + toggle)
      ├─ components/         # Button, Card, Feature, BrandToggle, AppLayout…
      └─ pages/              # Login, Dashboard, Trainings, Certifications
```

---

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run API + web concurrently |
| `npm run dev:api` / `npm run dev:web` | Run one side |
| `npm run db:up` / `npm run db:down` | Start / stop Postgres |
| `npm run seed` | Reset schema + seed demo data |
| `npm --workspace server run typecheck` | Type-check API |
| `npm --workspace client run typecheck` | Type-check web |

---

## Notes & next steps

- **Production hardening (§16):** swap `sequelize.sync` for migrations, add Postgres Row-Level Security as a DB-layer isolation backstop, move file storage to S3/R2 with signed URLs, and add rate limiting.
- **Next modules (per the blueprint roadmap):** Toolbox Talks sign-in, Incident/Near-Miss + OSHA 300/300A, Contractor/ISN gating, Permit to Work, Fleet & Garage. The tenant + flag + theming primitives are already in place to drop these in.
