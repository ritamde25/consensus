/*
  Warnings:

  - You are about to drop the column `resolvedOutcomeYes` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `splitQty` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `yesQty` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `buyerId` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `sellerId` on the `Trade` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[title]` on the table `Market` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `outcome` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `executedPrice` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `makerId` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `makerOrderId` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `makerOutcome` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `makerPrice` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `takerId` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `takerOrderId` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `takerOutcome` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `takerPrice` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('YES', 'NO');

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_sellerId_fkey";

-- DropIndex
DROP INDEX "Order_marketId_price_idx";

-- DropIndex
DROP INDEX "Order_marketId_side_price_idx";

-- DropIndex
DROP INDEX "Trade_buyerId_idx";

-- DropIndex
DROP INDEX "Trade_sellerId_idx";

-- AlterTable
ALTER TABLE "Market" DROP COLUMN "resolvedOutcomeYes",
ADD COLUMN     "resolvedOutcome" "Outcome";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "outcome" "Outcome" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Position" DROP COLUMN "splitQty",
DROP COLUMN "yesQty",
ADD COLUMN     "lockedNoShares" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedYesShares" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "noShares" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "yesShares" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "buyerId",
DROP COLUMN "price",
DROP COLUMN "sellerId",
ADD COLUMN     "executedPrice" INTEGER NOT NULL,
ADD COLUMN     "makerId" TEXT NOT NULL,
ADD COLUMN     "makerOrderId" TEXT NOT NULL,
ADD COLUMN     "makerOutcome" "Outcome" NOT NULL,
ADD COLUMN     "makerPrice" INTEGER NOT NULL,
ADD COLUMN     "takerId" TEXT NOT NULL,
ADD COLUMN     "takerOrderId" TEXT NOT NULL,
ADD COLUMN     "takerOutcome" "Outcome" NOT NULL,
ADD COLUMN     "takerPrice" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "usdBalance" SET DEFAULT 0,
ALTER COLUMN "lockedBalance" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "Market_isResolved_idx" ON "Market"("isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "Market_title_key" ON "Market"("title");

-- CreateIndex
CREATE INDEX "Order_marketId_idx" ON "Order"("marketId");

-- CreateIndex
CREATE INDEX "Order_marketId_outcome_side_status_price_createdAt_idx" ON "Order"("marketId", "outcome", "side", "status", "price", "createdAt");

-- CreateIndex
CREATE INDEX "Position_marketId_idx" ON "Position"("marketId");

-- CreateIndex
CREATE INDEX "Trade_takerId_idx" ON "Trade"("takerId");

-- CreateIndex
CREATE INDEX "Trade_makerId_idx" ON "Trade"("makerId");

-- CreateIndex
CREATE INDEX "Trade_takerOrderId_idx" ON "Trade"("takerOrderId");

-- CreateIndex
CREATE INDEX "Trade_makerOrderId_idx" ON "Trade"("makerOrderId");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_takerId_fkey" FOREIGN KEY ("takerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_takerOrderId_fkey" FOREIGN KEY ("takerOrderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_makerOrderId_fkey" FOREIGN KEY ("makerOrderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
