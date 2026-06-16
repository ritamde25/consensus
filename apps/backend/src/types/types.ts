import type { OrderStatus, prisma } from "db";
import { z, ZodLazy } from "zod";

export const NewMarketSchema = z.object({
    title: z.string(),
    description: z.string(),
    resolutionDeadline: z.coerce.date().transform((d) => d.toISOString())
})

export const PlaceOrderSchema = z.object({
    marketId: z.string(),
    side: z.enum(["BUY", "SELL"]),
    outcome: z.enum(["YES", "NO"]),
    price: z.number().int().min(1).max(99), // Price in cents (1-99 cents = $0.01-$0.99)
    quantity: z.number().int().positive(),
});

export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;

export type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export const SplitSchema = z.object({
    marketId: z.string(),
    amount: z.number() // Amount in cents (frontend converts from USD)
})

export const depositSchema = z.object({
    amount: z.number() // Amount in cents (frontend converts from USD)
})

export const withdrawSchema = z.object({
    amount: z.number() // Amount in cents (frontend converts from USD)
})

export type PlaceOrderResult = {
    orderId: string;
    filledQuantity: number;
    remainingQuantity: number;
    status: OrderStatus;
    trades: number;
}

export type TOrderBook = Record<"BUY" | "SELL", Record<string, number>>;

export type EngineOrder = {
    id: string;
    userId: string;
    marketId: string;
  
    side: "BUY" | "SELL";
    outcome: "YES" | "NO";
    price: number;

    normalizedSide: "BUY" | "SELL";
    normalizedPrice: number;
  
    remaining: number;
    createdAt: Date;
  
    version: number;
  };
