-- DropIndex
DROP INDEX "Order_marketId_side_status_price_createdAt_idx";

-- CreateTable
CREATE TABLE "MarketAnalysis" (
    "marketId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketAnalysis_pkey" PRIMARY KEY ("marketId")
);

-- CreateIndex
CREATE INDEX "Order_marketId_normalizedSide_status_normalizedPrice_create_idx" ON "Order"("marketId", "normalizedSide", "status", "normalizedPrice", "createdAt");
