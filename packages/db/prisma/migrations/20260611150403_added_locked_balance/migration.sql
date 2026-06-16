/*
  Warnings:

  - You are about to drop the column `avgPrice` on the `Position` table. All the data in the column will be lost.
  - Added the required column `lockedBalance` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Position" DROP COLUMN "avgPrice";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lockedBalance" INTEGER NOT NULL;
