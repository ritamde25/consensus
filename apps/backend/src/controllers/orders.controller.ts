import { Router } from "express"
import requireAuth from "../middlewares/auth.middleware";
import { SplitSchema, PlaceOrderSchema, type Tx } from "../types/types";
import { prisma } from "db";
import { placeOrder } from "../lib/heapMatchingEngine";

const orderRoutes = Router();

orderRoutes.post('/order', requireAuth, async (req, res) => {
    try {
        const parsed = PlaceOrderSchema.safeParse(req.body);
        if (!parsed.success) throw new Error("Invalid order");

        const { marketId, side, outcome, price, quantity } = parsed.data;
        const userId = req.userId as string;

        const result = await placeOrder({ userId, marketId, side, outcome, price, quantity });
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to place order" });
    }
})

orderRoutes.post('/split', requireAuth, async (req, res) => {
    try {
        const parsed = SplitSchema.safeParse(req.body);
        if (!parsed.success) throw new Error("Invalid order");
        
        const order = parsed.data;

        const marketId = order.marketId;
        const quantityShares = Math.round(order.amount / 100);
        const userId = req.userId;
        
        await prisma.$transaction(async tx => {
            const [user] = await tx.$queryRaw<{id: string, address: string, usdBalance: number}[]>`SELECT * FROM "User" WHERE id=${userId} FOR UPDATE;`;
            if (!user) throw new Error("User not found");
            if(user.usdBalance < order.amount) throw new Error("Insufficient Funds");

            await tx.user.update({
                where: {
                    id: userId
                },
                data: {
                    usdBalance: { decrement: order.amount }
                }
            })

            await tx.position.upsert({
                where: {
                    userId_marketId: {
                        userId,
                        marketId
                    }
                },
                create: {
                    marketId,
                    userId,
                    yesShares: quantityShares,
                    noShares: quantityShares,
                    totalSpent: order.amount,
                },
                update: {
                    yesShares: { increment:  quantityShares },
                    noShares: { increment:  quantityShares },
                    totalSpent: { increment:  order.amount },
                }
            })
        })

        // Fetch and return the updated position
        const position = await prisma.position.findUnique({
            where: {
                userId_marketId: {
                    userId,
                    marketId
                }
            }
        })

        res.json({
            success: true,
            position: {
                yesShares: position?.yesShares || 0,
                noShares: position?.noShares || 0,
                lockedYesShares: position?.lockedYesShares || 0,
                lockedNoShares: position?.lockedNoShares || 0
            }
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to split position" });
    }
})

orderRoutes.post('/merge', requireAuth, async (req, res) => {
    try {
        const parsed = SplitSchema.safeParse(req.body);
        if (!parsed.success) throw new Error("Invalid order");
        
        const order = parsed.data;

        const marketId = order.marketId;
        const quantityShares = Math.round(order.amount / 100);
        const userId = req.userId;
        
        await prisma.$transaction(async tx => {
            const [user] = await tx.$queryRaw<{id: string, address: string, usdBalance: number}[]>`SELECT * FROM "User" WHERE id=${userId} FOR UPDATE;`;
            if (!user) throw new Error("User not found");

            const updated = await tx.position.updateMany({
                where: {
                    userId,
                    marketId,
                    yesShares: { gte: quantityShares },
                    noShares: { gte: quantityShares },
                },
                data: {
                    yesShares: { decrement: quantityShares },
                    noShares: { decrement: quantityShares },
                    totalSpent: { decrement: order.amount },
                },
                });

            if (updated.count === 0) {
                throw new Error("Insufficient shares");
            }

            await tx.user.update({
                where: { id: userId },
                data: {
                  usdBalance: { increment: order.amount },
                },
              });
        })

        // Fetch and return the updated position
        const position = await prisma.position.findUnique({
            where: {
                userId_marketId: {
                    userId,
                    marketId
                }
            }
        })

        res.json({
            success: true,
            position: {
                yesShares: position?.yesShares || 0,
                noShares: position?.noShares || 0,
                lockedYesShares: position?.lockedYesShares || 0,
                lockedNoShares: position?.lockedNoShares || 0
            }
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to merge position" });
    }
})

export default orderRoutes;