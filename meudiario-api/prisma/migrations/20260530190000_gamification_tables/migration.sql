-- CreateTable
CREATE TABLE IF NOT EXISTS "Level" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "minimumPoints" INTEGER NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Challenge" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "rewardPoints" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "target" INTEGER NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Level_level_key" ON "Level"("level");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Challenge_code_key" ON "Challenge"("code");

-- AlterTable
ALTER TABLE "Mood" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActivity" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "streak" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Badge" ADD COLUMN IF NOT EXISTS "code" TEXT,
ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'notes-count',
ADD COLUMN IF NOT EXISTS "threshold" INTEGER NOT NULL DEFAULT 0;

UPDATE "Badge" SET "code" = lower(replace("name", ' ', '-')) WHERE "code" IS NULL;

UPDATE "Badge" SET "code" = lower(replace("name", ' ', '-')) WHERE "code" IS NULL;

ALTER TABLE "Badge" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Badge_code_key" ON "Badge"("code");
