-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('note', 'comment', 'user');

-- DropForeignKey
ALTER TABLE "Mood" DROP CONSTRAINT "Mood_noteId_fkey";

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "TargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterId_targetType_targetId_reason_key" ON "Report"("reporterId", "targetType", "targetId", "reason");

-- AddForeignKey
ALTER TABLE "Mood" ADD CONSTRAINT "Mood_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
