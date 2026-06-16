import { Router } from "express";
import requireAuth from "../middlewares/auth.middleware";
import { prisma } from "db";
import { NewMarketSchema, type TOrderBook } from "../types/types";
import type { OrderBook } from "../orderbook/orderbook";
import { generateMarketAnalysis } from "../utils/marketAnalysis";

const marketRouter = Router();

marketRouter.get('/', requireAuth, async (req, res) => {
    try {
        const markets = await prisma.market.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({ markets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch markets" });
    }
})

marketRouter.get('/:id', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.userId;

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ error: "Invalid market id" });
        }

        const market = await prisma.market.findUnique({
            where: { id }
        });

        const orders = await prisma.order.findMany({
            where: {
              marketId: id,
              status: { in: ["OPEN", "PARTIAL"] },
            },
            select: {
              normalizedSide: true,
              normalizedPrice: true,
              remaining: true,
            },
        });
        
        const orderbook: TOrderBook = {
            BUY: {},
            SELL: {},
        };
        
        for (const o of orders) {
            const side = o.normalizedSide;
            const price = o.normalizedPrice.toString();
            
            if (!orderbook[side][price]) {
                orderbook[side][price] = 0;
            }
            
            orderbook[side][price] += o.remaining;
        }

        const userPositions = await prisma.position.findMany({
            where: { marketId: id, userId }
        })
        
        if (!market) res.status(404).json({ error: "Market not found" });
        
        res.json({ market, orderbook, userPositions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch market details" });
    }
})

marketRouter.post('/create', requireAuth, async (req, res) => {
    try {
        const newMarket = NewMarketSchema.safeParse(req.body);
        if(!newMarket.success) throw new Error("Market needs a title, desc and a resolution deadline");
        
        const { title, description, resolutionDeadline } = newMarket.data;

        await prisma.market.create({
            data: { title, description, resolutionDeadline }
        });

        return res.status(200).json({message: "Market created succesfully"});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create market" });
    }
})

marketRouter.get("/:id/analysis", requireAuth, async (req, res) => {
    try {
      const marketId = req.params.id;
  
      if (!marketId || Array.isArray(marketId)) {
        return res.status(400).json({ error: "Invalid market id" });
      }
  
      const existing = await prisma.marketAnalysis.findUnique({
        where: { marketId },
      });
  
      const STALE_MS = 1000 * 60 * 60; // 1 hour
  
      const isStale = !existing || Date.now() - existing.generatedAt.getTime() > STALE_MS;
      if (!isStale) return res.status(200).json(existing);
  
      const content = await generateMarketAnalysis(marketId);
  
      const analysis = await prisma.marketAnalysis.upsert({
        where: { marketId },
        update: { content, generatedAt: new Date() },
        create: { marketId, content },
      });
  
      return res.status(200).json(analysis);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Failed to generate analysis",
      });
    }
});


export default marketRouter;