import { Router } from "express";
import requireAuth from "../middlewares/auth.middleware";
import { prisma } from "db";

const adminRouter = Router();

// PATCH updateMarket/:id - Update market details
adminRouter.patch('/updateMarket/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { title, description, resolutionDeadline } = req.body;
    
    const market = await prisma.market.update({
        where: { id },
        data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(resolutionDeadline !== undefined && { resolutionDeadline })
        }
    });
    
    res.json({ market });
});

// DELETE updateMarket/:id - Delete a market
adminRouter.delete('/updateMarket/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    await prisma.market.delete({
        where: { id }
    });
    
    res.json({ message: "Market deleted successfully" });
});

// POST settleMarket/:id - Settle a market with final outcome
adminRouter.post('/settleMarket/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { outcome } = req.body; // "YES" or "NO"
    
    if (!["YES", "NO"].includes(outcome)) {
        return res.status(400).json({ error: "Invalid outcome. Must be 'YES' or 'NO'" });
    }
    
    await prisma.$transaction(async tx => {
        // Update market status
        const market = await tx.market.update({
            where: { id },
            data: {
                isResolved: true,
                resolvedOutcome: outcome
            }
        });
        
        // Get all positions for this market
        const positions = await tx.position.findMany({
            where: { marketId: id }
        });
        
        // Settle each position
        for (const position of positions) {
            const winningShares = outcome === "YES" ? position.yesShares : position.noShares;
            const losingShares = outcome === "YES" ? position.noShares : position.yesShares;
            const payoutPerShare = 100; // Each winning share pays $1 (100 cents)
            
            const totalPayout = Math.round(winningShares * payoutPerShare);
            
            // Update user balance with payout
            await tx.user.update({
                where: { id: position.userId },
                data: {
                    usdBalance: { increment: totalPayout }
                }
            });
        }
        
        // Close all remaining open orders for this market
        await tx.order.updateMany({
            where: {
                marketId: id,
                status: "OPEN"
            },
            data: {
                status: "CANCELLED"
            }
        });
    });
    
    res.json({ message: "Market settled successfully", outcome });
});

// GET settlementDetails/:id - Get settlement details for a market
adminRouter.get('/settlementDetails/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    const market = await prisma.market.findUnique({
        where: { id },
        include: {
            positions: {
                include: {
                    user: {
                        select: {
                            id: true,
                            address: true
                        }
                    }
                }
            }
        }
    });
    
    if (!market) {
        return res.status(404).json({ error: "Market not found" });
    }
    
    const settlementDetails = {
        marketId: market.id,
        title: market.title,
        isResolved: market.isResolved,
        resolvedOutcome: market.resolvedOutcome,
        totalPositions: market.positions.length,
        positions: market.positions.map(pos => ({
            userId: pos.userId,
            userAddress: pos.user.address,
            yesShares: pos.yesShares,
            noShares: pos.noShares,
            totalSpent: pos.totalSpent
        }))
    };
    
    res.json({ settlementDetails });
});

export default adminRouter;