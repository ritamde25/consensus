/*
  Warnings:

  - You are about to drop the column `collatrelLocked` on the `Market` table. All the data in the column will be lost.
  - Added the required column `matchType` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('TRANSFER', 'MINT', 'REDEEM');

-- AlterTable
ALTER TABLE "Market" DROP COLUMN "collatrelLocked",
ADD COLUMN     "collateralLocked" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "matchType" "MatchType" NOT NULL;
