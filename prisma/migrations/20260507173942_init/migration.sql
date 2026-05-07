-- CreateTable
CREATE TABLE "Jury" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "hasFinalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contestant" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "song" TEXT NOT NULL,
    "performanceOrder" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "flagEmoji" TEXT NOT NULL,

    CONSTRAINT "Contestant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "juryId" TEXT NOT NULL,
    "contestantId" TEXT NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jury_key_key" ON "Jury"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Contestant_country_key" ON "Contestant"("country");

-- CreateIndex
CREATE UNIQUE INDEX "Score_juryId_contestantId_key" ON "Score"("juryId", "contestantId");

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_juryId_fkey" FOREIGN KEY ("juryId") REFERENCES "Jury"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "Contestant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
