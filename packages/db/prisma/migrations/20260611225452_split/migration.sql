/*
  Warnings:

  - You are about to drop the column `noQty` on the `Position` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Position" DROP COLUMN "noQty",
ADD COLUMN     "splitQty" INTEGER NOT NULL DEFAULT 0;
