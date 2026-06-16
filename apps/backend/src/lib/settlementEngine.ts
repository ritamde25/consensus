import { prisma, OrderSide, OrderStatus, Outcome, Prisma } from "db";

type TransactionClient = Prisma.TransactionClient;

type SettlementResult = {
  settledUsers: number;
  cancelledOrders: number;
  totalPayout: number;
};

// ─── entry point ────────────────────────────────────────────────────────────

export async function settleMarket(marketId: string, outcome: Outcome): Promise<SettlementResult> {
  return prisma.$transaction(async (tx) => {
    // Verify market exists and is not already resolved
    const market = await tx.market.findUnique({ where: { id: marketId } });
    if (!market) throw new Error("Market not found");
    if (market.isResolved) throw new Error("Market already resolved");

    // Get all OPEN and PARTIAL orders for the market
    const ordersToCancel = await tx.order.findMany({
      where: {
        marketId,
        status: { in: ["OPEN", "PARTIAL"] },
      },
      include: {
        user: true,
      },
    });

    // Cancel all orders and unlock locked resources
    for (const order of ordersToCancel) {
      await cancelOrder(tx, order);
    }

    // Get all positions for the market
    const positions = await tx.position.findMany({
      where: { marketId },
      include: {
        user: true,
      },
    });

    let totalPayout = 0;
    let settledUsers = 0;

    // Calculate and distribute payouts
    for (const position of positions) {
      const payout = calculatePayout(position, outcome);
      
      if (payout > 0) {
        await tx.user.update({
          where: { id: position.userId },
          data: { usdBalance: { increment: payout } },
        });
        totalPayout += payout;
        settledUsers++;
      }
    }

    // Mark market as resolved
    await tx.market.update({
      where: { id: marketId },
      data: { isResolved: true, resolvedOutcome: outcome },
    });

    return {
      settledUsers,
      cancelledOrders: ordersToCancel.length,
      totalPayout,
    };
  });
}

// ─── order cancellation ─────────────────────────────────────────────────────

async function cancelOrder(tx: TransactionClient, order: any): Promise<void> {
  const { userId, marketId, side, outcome, remaining } = order;

  if (side === "SELL") {
    // For SELL orders: unlock locked shares
    if (outcome === "YES") {
      await tx.position.update({
        where: { userId_marketId: { userId, marketId } },
        data: {
          lockedYesShares: { decrement: remaining },
          yesShares: { increment: remaining },
        },
      });
    } else {
      await tx.position.update({
        where: { userId_marketId: { userId, marketId } },
        data: {
          lockedNoShares: { decrement: remaining },
          noShares: { increment: remaining },
        },
      });
    }
  } else {
    // For BUY orders: refund remaining reserved collateral
    const refundAmount = order.price * remaining;
    await tx.user.update({
      where: { id: userId },
      data: {
        lockedBalance: { decrement: refundAmount },
        usdBalance: { increment: refundAmount },
      },
    });
  }

  // Update order status
  await tx.order.update({
    where: { id: order.id },
    data: {
      remaining: 0,
      status: "CANCELLED",
    },
  });
}

// ─── payout calculation ─────────────────────────────────────────────────────

function calculatePayout(position: any, outcome: Outcome): number {
  if (outcome === "YES") {
    return position.yesShares * 100;
  } else {
    return position.noShares * 100;
  }
}
