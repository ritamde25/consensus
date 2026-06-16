/*
  Warnings:

  - You are about to drop the column `collateralLocked` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `matchType` on the `Trade` table. All the data in the column will be lost.
  - Added the required column `normalizedSide` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Market" DROP COLUMN "collateralLocked";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "normalizedSide" "OrderSide" NOT NULL;

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "matchType";

-- DropEnum
DROP TYPE "MatchType";
