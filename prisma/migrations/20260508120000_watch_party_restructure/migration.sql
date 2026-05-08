-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('HOST', 'GUEST');

-- DropForeignKey
ALTER TABLE "Score" DROP CONSTRAINT "Score_juryId_fkey";

-- DropIndex
DROP INDEX "Score_juryId_contestantId_key";

-- Drop old columns
ALTER TABLE "Score" DROP COLUMN "juryId";

-- DropTable
DROP TABLE "Jury";

-- CreateTable
CREATE TABLE "WatchParty" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'GUEST',
    "hasFinalized" BOOLEAN NOT NULL DEFAULT false,
    "watchPartyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- Add memberId column to Score
ALTER TABLE "Score" ADD COLUMN "memberId" TEXT;

-- Delete orphaned scores (no member to link to)
DELETE FROM "Score";

-- Make memberId required
ALTER TABLE "Score" ALTER COLUMN "memberId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WatchParty_key_key" ON "WatchParty"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Score_memberId_contestantId_key" ON "Score"("memberId", "contestantId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_watchPartyId_fkey" FOREIGN KEY ("watchPartyId") REFERENCES "WatchParty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
