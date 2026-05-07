# Eurovision 2026 Jury System - Implementation Plan

## Context
Greenfield build of a real-time Eurovision scoring web app. A group of friends act as "National Juries", draft scores collaboratively via WebSockets, and submit finalized points following official Eurovision voting rules (1-8, 10, 12 — each assigned to exactly one contestant). Deployed to Fly.io with managed PostgreSQL.

## Architecture Overview

```
Next.js App (custom server.js)
├── Socket.io server (same port)
├── Prisma ORM → Fly.io Postgres
├── App Router pages
│   ├── / (landing/interstitial)
│   ├── /jury/[key] (scoresheet)
│   ├── /jury/[key]/contestant/[id] (detail + scoring)
│   ├── /scoreboard (global leaderboard)
│   └── /admin (contestant management)
└── API routes
    ├── POST /api/jury (create new jury)
    ├── PUT /api/jury/[key]/score (update draft score)
    ├── POST /api/jury/[key]/finalize (validate & finalize)
    ├── GET/POST/PUT/DELETE /api/contestants (admin CRUD)
    └── POST /api/jury/join (join existing jury)
```

## Implementation Phases

### Phase 1: Project Scaffolding
- `npx create-next-app@latest` with App Router, TypeScript, Tailwind CSS
- Install deps: `prisma`, `@prisma/client`, `socket.io`, `socket.io-client`, `framer-motion`, `zod`, `react-hook-form`, `clsx`, `tailwind-merge`, `unique-names-generator`
- Configure Tailwind with Eurovision neon theme (neon pinks, purples, blues, high-saturation gradients)
- Create `server.js` custom entry point binding Next.js + Socket.io on same port

**Files to create:**
- `server.js` — custom server entry
- `tailwind.config.ts` — extended theme with Eurovision colors
- `src/lib/socket.ts` — shared Socket.io client instance
- `src/lib/prisma.ts` — shared Prisma client singleton

### Phase 2: Database & ORM
- Define Prisma schema per spec (Jury, Contestant, Score models)
- No seed script needed — contestants managed via admin UI
- Generate Prisma client, create initial migration

**Files to create/modify:**
- `prisma/schema.prisma` — Jury, Contestant, Score models as per spec

### Phase 3: API Routes
- `POST /api/jury` — generate adjective-noun-noun slug via `unique-names-generator`, collect name + location, create jury
- `POST /api/jury/join` — set session cookie for existing jury key, collect name/location if joining
- `PUT /api/jury/[key]/score` — update draft score, emit `draft_updated` to jury room via Socket.io
- `POST /api/jury/[key]/finalize` — validate Eurovision points distribution (exactly one each of 12, 10, 8, 7, 6, 5, 4, 3, 2, 1), set `hasFinalized`, emit `scoreboard_updated` to global room
- `GET/POST/PUT/DELETE /api/contestants` — admin CRUD for contestant management
- Zod schemas shared between API validation and client forms

**Files to create:**
- `src/app/api/jury/route.ts`
- `src/app/api/jury/join/route.ts`
- `src/app/api/jury/[key]/score/route.ts`
- `src/app/api/jury/[key]/finalize/route.ts`
- `src/app/api/contestants/route.ts`
- `src/app/api/contestants/[id]/route.ts`
- `src/lib/validation.ts` — shared Zod schemas

### Phase 4: WebSocket Layer
- `server.js`: Socket.io server with rooms `room:global` and `room:jury_[key]`
- Client hook `useSocket()` — connects on mount, joins appropriate rooms based on jury key
- `draft_updated` event: when any jury member updates a score, all clients in that jury room see it instantly
- `scoreboard_updated` event: when any jury finalizes/edits finalized scores, all clients refresh leaderboard

**Files to create:**
- `src/hooks/useSocket.ts` — React hook for Socket.io connection + room management
- Socket.io server logic in `server.js`

### Phase 5: UI Pages

#### 5a: Landing & Jury Flow
- **`/` (landing)**: Glassmorphism card with Eurovision branding. Two CTAs: "Create a Jury" and "Enter Jury Code"
- **`/jury/[key]` (interstitial + scoresheet)**: If no session cookie → show join/create split (collecting name + location). If session → show scoresheet with contestants in performance order
- **Jury creation form**: Name, location fields → generates slug → redirects to `/jury/[slug]`
- **Jury join**: Collects name + location → sets cookie → shows scoresheet

#### 5b: Scoring
- **Scoresheet**: List of contestants in performance order with current draft scores. Tap to open detail.
- **`/jury/[key]/contestant/[id]`**: Full-screen contestant card (image, flag emoji, song, artist). Score input (0-12). Horizontal flag-footer for swiping between acts (CSS scroll-snap).
- **Finalize button**: Validates Eurovision rules, shows toast on errors, triggers Henry easter egg on success

#### 5c: Admin
- **`/admin`**: Simple CRUD page to add/edit/delete/reorder contestants (country, artist, song, performance order, image URL, flag emoji). No auth needed (small friend group).

#### 5d: Global Scoreboard
- **`/scoreboard`**: Aggregated scores from all finalized juries. Animated rank changes via Framer Motion `layoutId`. Rolling number transitions for score updates.

**Files to create:**
- `src/app/page.tsx` — landing
- `src/app/jury/[key]/page.tsx` — interstitial + scoresheet
- `src/app/jury/[key]/contestant/[id]/page.tsx` — contestant detail + scoring
- `src/app/scoreboard/page.tsx` — global leaderboard
- `src/app/admin/page.tsx` — contestant management
- `src/components/` — shared UI components (GlassCard, ScoreInput, FlagFooter, Toast, HenryAnimation, AnimatedNumber, etc.)

### Phase 6: Styling & Polish
- Neon gradient backgrounds (pink → purple → blue)
- Glassmorphism panels: `backdrop-blur-xl bg-white/10 border border-white/20`
- Mobile-first: large touch targets (min 44px), bottom-anchored nav
- CSS scroll-snap on flag-footer contestant carousel
- Framer Motion: `layout` prop on scoreboard rows for smooth reordering, `AnimatePresence` for page transitions
- Henry easter egg: user-provided cockapoo image with a relieved expression animation on finalization success

### Phase 7: CI/CD & Deployment

Following the `ai-persona-app` Fly.io pattern:

#### Dockerfile (multi-stage)
```
Stage 1 (deps): node:20-alpine, npm ci
Stage 2 (build): npm run build, generate Prisma client
Stage 3 (prod): Copy .next, node_modules, server.js, prisma/
  CMD: npx prisma migrate deploy && node server.js
```

#### fly.toml
- App name: TBD (user to choose during `fly launch`)
- Internal port: 3000
- Health check: HTTP GET /api/health
- Auto-stop/start machines

#### GitHub Actions (`fly-production.yml`)
- Trigger: push to `main`
- Steps: checkout → setup flyctl → `flyctl deploy --remote-only`
- GitHub Secrets: `FLY_API_TOKEN`

#### Fly.io Setup Instructions (for user)
1. `fly launch` — creates app
2. `fly postgres create` — creates managed Postgres
3. `fly postgres attach` — attaches DB, sets `DATABASE_URL` automatically
4. `fly secrets set` — any additional secrets if needed
5. Add `FLY_API_TOKEN` to GitHub repo secrets

### Phase 8: Pre-seed Known Juries
- Since the friend group is known, pre-seed a few juries in a Prisma seed script with known names/locations
- Users can still create new juries dynamically
- Jury join flow still asks for name/location (for new joiners)

### Phase 9: Verification
- **Local dev**: `npm run dev` with local Postgres (Docker Compose or local install)
- **Create jury**: Verify slug generation, cookie setting, redirect
- **Score contestants**: Enter draft scores, verify real-time sync across two browser tabs
- **Admin**: Add/edit/remove contestants, verify scoresheet updates
- **Finalize**: Submit valid scoresheet → Henry animation. Submit invalid → toast errors.
- **Scoreboard**: Verify aggregated scores, animated rank changes
- **Deploy**: Push to main, verify GitHub Action deploys to Fly.io successfully

## Key Technical Decisions
- **Custom server.js**: Required to co-locate Socket.io with Next.js on a single Fly.io port
- **Session via cookie**: Simple jury key stored in cookie — no auth system needed for a private friend group
- **Last-write-wins**: Server timestamp for conflict resolution on collaborative drafts
- **Slug generation**: `unique-names-generator` library for adjective-noun-noun patterns
- **No admin auth**: Small trusted friend group, admin page is just unlinked (security by obscurity is fine here)
- **Pre-seeded juries + dynamic creation**: Best of both worlds for the friend group use case
