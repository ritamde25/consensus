/*
  Warnings:

  - You are about to drop the column `noOrderbook` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `resolution` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `resolutionDescription` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `totalQty` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `yesOrderbook` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `orderType` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `positionType` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the `OpenOrder` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,marketId]` on the table `Position` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `avgPrice` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yesQty` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Made the column `sellerId` on table `Trade` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'PARTIAL', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- DropForeignKey
ALTER TABLE "OpenOrder" DROP CONSTRAINT "OpenOrder_marketId_fkey";

-- DropForeignKey
ALTER TABLE "OpenOrder" DROP CONSTRAINT "OpenOrder_userId_fkey";

-- DropIndex
DROP INDEX "Position_marketId_idx";

-- DropIndex
DROP INDEX "Position_userId_idx";

-- DropIndex
DROP INDEX "Position_userId_marketId_type_key";

-- AlterTable
ALTER TABLE "Market" DROP COLUMN "noOrderbook",
DROP COLUMN "resolution",
DROP COLUMN "resolutionDescription",
DROP COLUMN "totalQty",
DROP COLUMN "yesOrderbook",
ADD COLUMN     "resolvedOutcomeYes" BOOLEAN;

-- AlterTable
ALTER TABLE "Position" DROP COLUMN "qty",
DROP COLUMN "type",
ADD COLUMN     "avgPrice" INTEGER NOT NULL,
ADD COLUMN     "yesQty" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "orderType",
DROP COLUMN "positionType",
ALTER COLUMN "sellerId" SET NOT NULL;

-- DropTable
DROP TABLE "OpenOrder";

-- DropEnum
DROP TYPE "OrderType";

-- DropEnum
DROP TYPE "PositionType";

-- DropEnum
DROP TYPE "Side";

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_marketId_price_idx" ON "Order"("marketId", "price");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_marketId_side_price_idx" ON "Order"("marketId", "side", "price");

-- CreateIndex
CREATE UNIQUE INDEX "Position_userId_marketId_key" ON "Position"("userId", "marketId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
