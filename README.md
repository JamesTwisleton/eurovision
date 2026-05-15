# Eurovision 2026 Jury

A real-time web app for groups of friends to act as their own "National Juries" during Eurovision 2026. Create a name for your watch party, score each act as you watch, then submit your final votes to see how your picks compare across all juries on a live scoreboard.  You can also see how all other watch parties using the App are voting.

## Features

### Watch Party Creation & Joining
- Create a new Watch Party - you get a unique shareable code (e.g. `neon-disco-glitter`)
- Join an existing Watch Party by entering the code someone shared with you
- Everyone on the same code can see the scoreboard for their Watch Party

### Live Scoring
- Score each contestant 0-12 as you watch the show
- Scores sync in real time via WebSockets -if someone updates a score on their phone, it instantly appears on every other device viewing the same jury
- Progress bar tracks how many countries you've scored and which point values you still need to assign

### finalisation & Eurovision Rules
- When you're ready, hit "Finalise Votes"
- The app enforces official Eurovision voting rules: exactly one 12, one 10, one 8, 7, 6, 5, 4, 3, 2, and 1 -- all other countries get 0
- If your scores don't match the rules, you get a toast notification explaining what's wrong
- You can still edit scores after finalising (re-triggers validation on save)
- Successfully finalising triggers a Henry the Cockapoo easter egg

### Global Scoreboard
- Aggregates finalised scores from all users
- Animated rank changes (Framer Motion layout animations) and rolling number transitions
- Shows score breakdowns with colour-coded badges (gold for 12, silver for 10)

### Admin Panel (`/admin`)
- Protected by Google OAuth - only whitelisted Gmail accounts can access
- No links to admin appear anywhere on the public site; you must navigate to `/admin` directly
- **Acts tab**: Add, edit, and delete contestants (country, artist, song, performance order, flag emoji, image)
- **Watch Parties tab**: View all registered juries, edit names/locations, toggle finalised status, delete juries

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io (custom `server.js` binds Next.js and WebSockets to the same port)
- **Auth**: NextAuth v4 with Google OAuth provider
- **Styling**: Tailwind CSS 4, Framer Motion, glassmorphism design with neon colour theme
- **Deployment**: Fly.io with Docker multi-stage builds

## Running Locally

### Prerequisites

- Node.js 20+
- Docker (for the local PostgreSQL database)

### 1. Clone and install dependencies

```bash
git clone https://github.com/JamesTwisleton/eurovision.git
cd eurovision
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
DATABASE_URL="postgresql://eurovision:eurovision@localhost:5432/eurovision?schema=public"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAILS="you@gmail.com,friend@gmail.com"
```

To generate `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

For `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, create OAuth 2.0 credentials in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.

### 3. Start the database

```bash
docker-compose up -d
```

This starts a PostgreSQL 16 instance on port 5432 with default credentials matching the `.env.example`.

### 4. Run database migrations and seed data

```bash
npx prisma migrate dev
npx prisma db seed
```

This creates the tables and seeds all 37 Eurovision 2026 contestants.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The custom server starts both Next.js and the Socket.io WebSocket server on the same port.

### Admin access

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin). You'll be redirected to sign in with Google. Only email addresses listed in `ADMIN_EMAILS` will be granted access.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Next.js + Socket.io) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run E2E tests (Playwright) |

## Deploying to Fly.io

The app is configured for Fly.io deployment. Set your secrets:

```bash
fly secrets set \
  DATABASE_URL="your-production-db-url" \
  GOOGLE_CLIENT_ID="your-client-id" \
  GOOGLE_CLIENT_SECRET="your-client-secret" \
  NEXTAUTH_SECRET="your-secret" \
  NEXTAUTH_URL="https://your-app.fly.dev" \
  ADMIN_EMAILS="admin1@gmail.com,admin2@gmail.com"
```

Then deploy:

```bash
fly deploy
```

Remember to add `https://your-app.fly.dev/api/auth/callback/google` as an authorized redirect URI in the Google Cloud Console.
