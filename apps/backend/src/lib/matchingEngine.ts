import { prisma, OrderSide, Outcome, OrderStatus, Prisma } from "db";
import type { PlaceOrderInput, PlaceOrderResult } from "../types/types";

type TransactionClient = Prisma.TransactionClient;
type PlaceOrderParams = { userId: string } & PlaceOrderInput;

type NormalizedOrder = {
  id: string;
  userId: string;
  side: OrderSide;
  outcome: Outcome;
  originalPrice: number;
  normalizedSide: number;
  normalizedPrice: number;
  remaining: number;
  createdAt: Date;
};

// ─── helpers ────────────────────────────────────────────────────────────────

const getNormalizedPrice = (outcome: Outcome, price: number) =>
  outcome === "YES" ? price : 100 - price;

function calculateOrderStatus(remaining: number, filled: number): OrderStatus {
  return remaining === 0 ? "FILLED" : filled > 0 ? "PARTIAL" : "OPEN";
}

async function loadAndLockCandidateOrders(
  tx: TransactionClient, marketId: string, normalizedside: OrderSide,
  myNormalizedPrice: number, isBuyOrder: boolean,
): Promise<NormalizedOrder[]> {
  const priceCondition = isBuyOrder
    ? Prisma.sql`"normalizedPrice" <= ${myNormalizedPrice}`
    : Prisma.sql`"normalizedPrice" >= ${myNormalizedPrice}`;
  const sortOrder = isBuyOrder ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  return tx.$queryRaw<any[]>`
    SELECT id, "userId", side, outcome, price AS "originalPrice", "normalizedSide", "normalizedPrice", remaining, "createdAt"
    FROM "Order"
    WHERE "marketId" = ${marketId}
      AND "normalizedSide" = ${normalizedside}
      AND status IN ('OPEN', 'PARTIAL')
      AND ${priceCondition}
    ORDER BY "normalizedPrice" ${sortOrder}, "createdAt" ASC
    FOR UPDATE
  `;
}

// ─── entry point ────────────────────────────────────────────────────────────

export async function placeOrder(params: PlaceOrderParams): Promise<PlaceOrderResult> {
  const { userId, marketId, side, outcome, price, quantity } = params;
  const normalizedPrice = getNormalizedPrice(outcome, price);

  if (price < 0 || price > 100) throw new Error("Price must be between 0 and 100 cents");
  if (quantity <= 0) throw new Error("Quantity must be positive");

  return prisma.$transaction(async (tx) => {
    const [user] = await tx.$queryRaw<any[]>`SELECT * FROM "User" WHERE id = ${userId} FOR UPDATE`;
    if (!user) throw new Error("User not found");

    const market = await tx.market.findUnique({ where: { id: marketId } });
    if (!market) throw new Error("Market not found");
    if (market.isResolved) throw new Error("Market already resolved");

    await tx.position.upsert({
      where: { userId_marketId: { userId, marketId } },
      update: {},
      create: { userId, marketId, yesShares: 0, noShares: 0, lockedYesShares: 0, lockedNoShares: 0, totalSpent: 0 },
    });

    const [position] =
      await tx.$queryRaw<any[]>`SELECT * FROM "Position" WHERE "userId" = ${userId} AND "marketId" = ${marketId} FOR UPDATE`;

    if (side === "BUY") {
      const required = price * quantity;
      if (user.usdBalance < required) throw new Error("Insufficient USD balance");
    } else {
      if (outcome === "YES" && position.yesShares < quantity) throw new Error("Insufficient YES shares");
      if (outcome === "NO"  && position.noShares  < quantity) throw new Error("Insufficient NO shares");
    }

    const normalizedSide = (outcome === "YES")? side : ( (side === "BUY")? "SELL" : "BUY" );

    return normalizedSide === "BUY"
      ? executeBuy(tx, params, normalizedPrice)
      : executeSell(tx, params, normalizedPrice);
  });
}

// ─── buy (buy YES + sell NO) ─────────────────────────────────────────────────────────

async function executeBuy(
  tx: TransactionClient, params: PlaceOrderParams, normalizedPrice: number,
): Promise<PlaceOrderResult> {
  const { userId, marketId, side, outcome, price, quantity } = params;
  const isBuyYes = outcome === "YES";
  const required = price * quantity;

  isBuyYes?
  await tx.user.update({
    where: { id: userId },
    data: { usdBalance: { decrement: required }, lockedBalance: { increment: required } },
  }) :
  await tx.position.update({
    where: { userId_marketId: { userId, marketId } },
    data: { noShares: { decrement: quantity }, lockedNoShares: { increment: quantity } },
  });

  const order = await tx.order.create({
    data: { userId, marketId, side, outcome, price, normalizedSide: "BUY", normalizedPrice, quantity, remaining: quantity, status: "OPEN" },
  });

  const matchingOrders = await loadAndLockCandidateOrders(tx, marketId, "SELL", normalizedPrice, true);

  let filledQty = 0;
  let totalAmount = 0;

  const trades: Prisma.TradeCreateManyInput[] = [];
  const makerOrderUpdates: { id: string; remaining: number; status: OrderStatus }[] = [];
  const makerBalanceUpdates: { userId: string; amount: number; isMakerSellYes: boolean }[] = [];
  const makerPositionUpdates: { userId: string; quantity: number; proceeds: number; isMakerSellYes: boolean }[] = [];

  for (const maker of matchingOrders) {
    if (filledQty >= quantity) break;
    const matchQty = Math.min(maker.remaining, quantity - filledQty);
    if (matchQty <= 0) continue;

    const makerProceeds = maker.originalPrice * matchQty;
    const newRemaining = maker.remaining - matchQty;

    const isMakerSellYes = maker.outcome === "YES";

    filledQty += matchQty;
    totalAmount += isBuyYes ? makerProceeds : 100 - makerProceeds;

    makerOrderUpdates.push({ id: maker.id, remaining: newRemaining, status: newRemaining === 0 ? "FILLED" : "PARTIAL" });
    makerBalanceUpdates.push({ userId: maker.userId, amount: makerProceeds, isMakerSellYes });
    makerPositionUpdates.push({ userId: maker.userId, quantity: matchQty, proceeds: makerProceeds, isMakerSellYes });
    trades.push({
      marketId, takerId: userId, makerId: maker.userId,
      quantity: matchQty, takerPrice: price, makerPrice: maker.originalPrice,
      takerOrderId: order.id, makerOrderId: maker.id,
      takerOutcome: outcome, makerOutcome: maker.outcome,
    });
  }

  if (trades.length > 0) await tx.trade.createMany({ data: trades });

  for (const u of makerBalanceUpdates){
    u.isMakerSellYes
    ? await tx.user.update({ where: { id: u.userId }, data: { usdBalance: { increment: u.amount } } })
    : await tx.user.update({ where: { id: u.userId }, data: { lockedBalance: { decrement: u.amount } } })
  }


  for (const u of makerPositionUpdates)
    await tx.position.update({
      where: { userId_marketId: { userId: u.userId, marketId } },
      data: u.isMakerSellYes
        ? { lockedYesShares: { decrement: u.quantity }, totalSpent: { decrement: u.proceeds } }
        : { noShares: { increment: u.quantity }, totalSpent: { increment: u.proceeds } },
    });

  for (const u of makerOrderUpdates)
    await tx.order.update({ where: { id: u.id }, data: { remaining: u.remaining, status: u.status } });

  const buyRefund = price * filledQty - totalAmount;
  const remaining = quantity - filledQty;
  const status = calculateOrderStatus(remaining, filledQty);

  isBuyYes
    ? await tx.user.update({
      where: { id: userId },
      data: { lockedBalance: { decrement: price * filledQty }, usdBalance: { increment: buyRefund } },
    })
    : await tx.user.update({
      where: { id: userId },
      data: { usdBalance: { increment: totalAmount } },
    });

  await tx.order.update({ where: { id: order.id }, data: { remaining, status } });

  await tx.position.update({
    where: { userId_marketId: { userId, marketId } },
    data: isBuyYes
      ? { yesShares: { increment: filledQty }, totalSpent: { increment: totalAmount } }
      : { lockedNoShares:  { decrement: filledQty }, totalSpent: { decrement: totalAmount } },
  });

  return { orderId: order.id, filledQuantity: filledQty, remainingQuantity: remaining, status, trades: trades.length };
}

// ─── sell (sell YES + buy NO) ────────────────────────────────────────────────────────

async function executeSell(
  tx: TransactionClient, params: PlaceOrderParams, normalizedPrice: number,
): Promise<PlaceOrderResult> {
  const { userId, marketId, side, outcome, price, quantity } = params;
  const isSellYes = outcome === "YES";
  const required = price * quantity;

  // Lock the shares being sold
  isSellYes?
  await tx.position.update({
    where: { userId_marketId: { userId, marketId } },
    data: { yesShares: { decrement: quantity }, lockedYesShares: { increment: quantity } },
  }) :
  await tx.user.update({
    where: { id: userId },
    data: { usdBalance: { decrement: required }, lockedBalance: { increment: required } },
  });

  const order = await tx.order.create({
    data: { userId, marketId, side, outcome, price, normalizedSide: "SELL", normalizedPrice, quantity, remaining: quantity, status: "OPEN" },
  });

  const matchingOrders = await loadAndLockCandidateOrders(tx, marketId, "BUY", normalizedPrice, false);

  let filledQty = 0;
  let totalAmount = 0;

  const trades: Prisma.TradeCreateManyInput[] = [];
  const makerOrderUpdates: { id: string; remaining: number; status: OrderStatus }[] = [];
  const makerBalanceUpdates: { userId: string; amount: number; isMakerBuyYes: boolean }[] = [];
  const makerPositionUpdates: { userId: string; quantity: number; proceeds: number; isMakerBuyYes: boolean }[] = [];

  for (const maker of matchingOrders) {
    if (filledQty >= quantity) break;
    const matchQty = Math.min(maker.remaining, quantity - filledQty);
    if (matchQty <= 0) continue;

    const makerProceeds = maker.originalPrice * matchQty;
    const newRemaining = maker.remaining - matchQty;

    const isMakerBuyYes = maker.outcome === "YES"; 

    filledQty += matchQty;
    totalAmount += isSellYes? makerProceeds : 100 - makerProceeds;

    makerOrderUpdates.push({ id: maker.id, remaining: newRemaining, status: newRemaining === 0 ? "FILLED" : "PARTIAL" });
    makerBalanceUpdates.push({ userId: maker.userId, amount: makerProceeds, isMakerBuyYes });
    makerPositionUpdates.push({ userId: maker.userId, quantity: matchQty, proceeds: makerProceeds, isMakerBuyYes });
    trades.push({
      marketId, takerId: userId, makerId: maker.userId,
      quantity: matchQty, takerPrice: price, makerPrice: maker.originalPrice,
      takerOrderId: order.id, makerOrderId: maker.id,
      takerOutcome: outcome, makerOutcome: maker.outcome,
    });
  }

  if (trades.length > 0) await tx.trade.createMany({ data: trades });

  for (const u of makerBalanceUpdates){
    u.isMakerBuyYes
    ? await tx.user.update({ where: { id: u.userId }, data: { lockedBalance: { decrement: u.amount } } })
    : await tx.user.update({ where: { id: u.userId }, data: { usdBalance: { increment: u.amount } } });
  }
    

  for (const u of makerPositionUpdates) {
    await tx.position.update({
      where: { userId_marketId: { userId: u.userId, marketId } },
      data: u.isMakerBuyYes
        ? { yesShares: { increment: u.quantity }, totalSpent: { increment: u.proceeds } }
        : { lockedNoShares:  { decrement: u.quantity }, totalSpent: { decrement: u.proceeds } },
    });
  }

  for (const u of makerOrderUpdates)
    await tx.order.update({ where: { id: u.id }, data: { remaining: u.remaining, status: u.status } });

  const buyRefund = price * filledQty - totalAmount;
  const remaining = quantity - filledQty;
  const status = calculateOrderStatus(remaining, filledQty);

  isSellYes
    ? await tx.user.update({
      where: { id: userId },
      data: { usdBalance: { increment: totalAmount }},
    })
    : await tx.user.update({
      where: { id: userId },
      data: { lockedBalance: { decrement: price * filledQty }, usdBalance: { increment: buyRefund } },
    });

  await tx.order.update({ where: { id: order.id }, data: { remaining, status } });

  await tx.position.update({
    where: { userId_marketId: { userId, marketId } },
    data: isSellYes
      ? { lockedYesShares: { decrement: filledQty }, totalSpent: { decrement: totalAmount } }
      : { noShares:  { increment: filledQty }, totalSpent: { increment: totalAmount } },
  });

  return { orderId: order.id, filledQuantity: filledQty, remainingQuantity: remaining, status, trades: trades.length };
}