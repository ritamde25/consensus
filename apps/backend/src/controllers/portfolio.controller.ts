import { Router } from "express"
import requireAuth from "../middlewares/auth.middleware";
import { prisma } from "db";
import { depositSchema } from "../types/types";

const portfolioRoutes = Router();

portfolioRoutes.post('/withdraw', requireAuth, async (req, res) => {
    try {
        const amountInCents = depositSchema.safeParse(req.body).data?.amount;
        if(!amountInCents) throw new Error("Specify amount!");

        const userId = req.userId as string;

        await prisma.$transaction(async tx => {
            const userResponse = await tx.$queryRaw<{id: string, address: string, usdBalance: number}[]>`SELECT * FROM "User" WHERE id=${userId} FOR UPDATE;`;
            const user = userResponse[0];
            if (!user) throw new Error("User not found");

            if (user.usdBalance < amountInCents) {
                throw new Error("Insufficient USD balance");
            }

            await tx.user.update({
                where: {
                    id: userId
                },
                data: {
                    usdBalance: {
                        decrement: amountInCents
                    }
                }
            });

        });

        res.json({
            message: "Withdraw successful",
            amount: amountInCents
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to withdraw" });
    }
})

portfolioRoutes.post('/deposit', requireAuth, async (req, res) => {
    try {
        const amountInCents = depositSchema.safeParse(req.body).data?.amount;
        if(!amountInCents) throw new Error("Specify amount!");

        const userId = req.userId as string;
        console.log(userId);

        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                usdBalance: {
                    increment: amountInCents
                }
            }
        })

        res.json({
            message: "Deposit successfull",
            amount: amountInCents
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to deposit" });
    }
})

portfolioRoutes.get('/balance', requireAuth, async (req, res) => {
    try {
        const userId: string = req.userId as string;

        const user = await prisma.user.findFirst({
            where: {
                id: userId
            }
        })

        res.json({balance: user?.usdBalance, lockedBalance: user?.lockedBalance})
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch balance" });
    }
})

portfolioRoutes.get('/positions', requireAuth, async (req, res) => {
    try {
        const userId: string = req.userId as string;

        const positions = await prisma.position.findMany({
            where: {
                userId
            },
            include: {
                market: {
                    select: {
                        title: true
                    }
                }
            }
        })

        const positionsWithMarketTitle = positions.map(position => ({
            ...position,
            marketTitle: position.market.title
        }))

        res.json({positions: positionsWithMarketTitle})
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch positions" });
    }
})

portfolioRoutes.get('/history', requireAuth, async (req, res) => {
    try {
        const userId: string = req.userId as string;

        const trades = await prisma.trade.findMany({
            where: {
                OR: [
                    { takerId: userId },
                    { makerId: userId },
                ],
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                market: {
                    select: {
                        title: true
                    }
                }
            }
        })

        const tradesWithMarketTitle = trades.map(trade => ({
            ...trade,
            marketTitle: trade.market.title
        }))

        res.json({trades: tradesWithMarketTitle})
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch trade history" });
    }
})

export default portfolioRoutes;