-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "minimumPoints" INTEGER NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "rewardPoints" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "target" INTEGER NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Level_level_key" ON "Level"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_code_key" ON "Challenge"("code");

-- AlterTable
ALTER TABLE "Mood" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastActivity" TIMESTAMP(3),
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Badge" ADD COLUMN     "code" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'notes-count',
ADD COLUMN     "threshold" INTEGER NOT NULL DEFAULT 0;

UPDATE "Badge" SET "code" = lower(replace("name", ' ', '-')) WHERE "code" IS NULL;

ALTER TABLE "Badge" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");
