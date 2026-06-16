/*
  Warnings:

  - You are about to drop the column `splitQty` on the `Position` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Position" DROP COLUMN "splitQty",
ADD COLUMN     "noQty" INTEGER NOT NULL DEFAULT 0;
