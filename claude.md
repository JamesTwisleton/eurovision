## project-spec: Eurovision 2026 "Jury" System

### 1. Project Overview
A real-time, web-based scoring application for a private group of friends to act as "National Juries" during Eurovision 2026. Users track contestants, manage draft scores collaboratively, and submit a finalized set of points that strictly adhere to official Eurovision voting rules.

### 2. Detailed User Flows
*   **Flow A: App Entry & The Split-Invite**
    *   User navigates to the root `/` or clicks a shared link (e.g., `/jury/neon-disco-glitter`).
    *   **If no session cookie is present:** The Interstitial Landing Page appears.
    *   *Option 1 (Collaborate):* "Join this Jury". Sets the session cookie for the existing key. Perfect for multiple people on the couch scoring together.
    *   *Option 2 (Independent):* "Create My Own". Calls `POST /api/jury`, generates a random `adjective-noun-noun` slug (using a dictionary library), creates a new DB record, sets the cookie, and redirects to the new `/jury/[new-key]`.
*   **Flow B: Active Scoring (The Scoresheet & Contestant Pages)**
    *   User views the list of contestants in performance order.
    *   User taps a contestant to view their detail page (Image, Flag, Song, Artist).
    *   User taps the horizontal flag-footer to swipe to the next/previous act.
    *   User enters a "Draft Score" (0-12). Multiple 12s are permitted here.
    *   *Collaborative Sync:* If Rebecca updates the UK to 12 points on her phone, the dual MacBook setup open on the other side of the room must immediately reflect that 12 on the screen via WebSockets without a refresh.
*   **Flow C: Finalizing Scores**
    *   User clicks "Finalize Jury Votes".
    *   **Validation Block:** The system checks that exactly one 12, one 10, one 8, 7, 6, 5, 4, 3, 2, and 1 have been assigned. 
    *   If invalid, a toast notification details the missing/duplicate values.
    *   If valid, `isFinalized` is set to true. The Global Scoreboard recalculates.
    *   Users can still edit scores post-finalization (re-triggering validation on save).

### 3. UI/UX & Design Language
*   **Theme:** Flashy, energetic, and colorful. High-saturation gradients (neon pinks, purples, blues), glassmorphism panels (translucent backgrounds with blur), and bold typography.
*   **Animations:** Use Framer Motion for layout transitions.
    *   Number changes on the Global Scoreboard should "tick" or roll over.
    *   Rows on the scoreboard should smoothly animate up/down as rankings change.
*   **Mobile-First:** The app will primarily be used on phones while watching the TV. Large touch targets, bottom-anchored navigation, and native-feeling CSS scroll-snap on the contestant carousel.
*   **Easter Egg:** When a jury successfully finalizes a valid scoresheet, a small animation of a blonde cockapoo named Henry should appear, looking visibly relieved that the high-anxiety voting process is over.

### 4. Technical Stack & Architecture
*   **Core Framework:** Next.js (App Router, React 18+).
*   **Custom Server:** A `server.js` entry point to bind both Next.js and the WebSocket server to the same port.
*   **Database:** Fly.io managed PostgreSQL.
*   **ORM:** Prisma. (Provides excellent type safety for the complex score aggregations).
*   **Real-time:** `Socket.io` (client and server).
*   **Styling:** Tailwind CSS + `clsx`/`tailwind-merge` + Framer Motion.
*   **Forms & Validation:** React Hook Form + Zod (Shared schemas between client forms and API routes).

### 5. WebSocket & Real-time Strategy
*   **Connection:** Clients establish a WS connection on app load.
*   **Rooms:**
    *   `room:global`: All connected clients join this. Receives `scoreboard_updated` events when *any* jury finalizes or edits a finalized score. Triggers a Next.js `router.refresh()` or state invalidation for the leaderboard.
    *   `room:jury_[key]`: Clients join the specific room for their active jury key. Receives `draft_updated` events. 
*   **Conflict Resolution:** For collaborative drafting, "last write wins" based on the server timestamp of the incoming request.

### 6. Database Schema (Prisma Definitions)
```prisma
model Jury {
  id           String   @id @default(uuid())
  key          String   @unique // e.g., "neon-disco-glitter"
  name         String
  location     String
  hasFinalized Boolean  @default(false)
  scores       Score[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Contestant {
  id               String   @id @default(uuid())
  country          String   @unique
  artist           String
  song             String
  performanceOrder Int
  imageUrl         String
  flagEmoji        String
  scores           Score[]
}

model Score {
  id           String     @id @default(uuid())
  points       Int        @default(0) // The current value (draft or final)
  
  juryId       String
  jury         Jury       @relation(fields: [juryId], references: [id], onDelete: Cascade)
  
  contestantId String
  contestant   Contestant @relation(fields: [contestantId], references: [id], onDelete: Cascade)

  @@unique([juryId, contestantId]) // A jury can only have one score record per contestant
}