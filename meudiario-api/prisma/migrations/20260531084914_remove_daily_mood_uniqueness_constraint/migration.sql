/*
  Warnings:

  - You are about to drop the column `criteria` on the `Badge` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Badge" DROP COLUMN "criteria",
ALTER COLUMN "kind" DROP DEFAULT;
