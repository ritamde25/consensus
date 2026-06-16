import { Heap } from "./heap";
import type { EngineOrder } from "../types/types";

export class OrderBook {
  private bids = new Heap<EngineOrder>((a, b) =>
    a.value.normalizedPrice > b.value.normalizedPrice ||
    (a.value.normalizedPrice === b.value.normalizedPrice &&
      a.value.createdAt.getTime() < b.value.createdAt.getTime())
  );

  private asks = new Heap<EngineOrder>((a, b) =>
    a.value.normalizedPrice < b.value.normalizedPrice ||
    (a.value.normalizedPrice === b.value.normalizedPrice &&
      a.value.createdAt.getTime() < b.value.createdAt.getTime())
  );

  insert(order: EngineOrder) {
    const node = {
      key: order.normalizedPrice,
      time: order.createdAt.getTime(),
      value: order,
    };

    order.normalizedSide === "BUY"
      ? this.bids.insert(node)
      : this.asks.insert(node);
  }

  getCandidates(isBuy: boolean, limitPrice: number): EngineOrder[] {
    const heap = isBuy ? this.asks : this.bids;

    return heap
      .toSortedArray()
      .map((n) => n.value)
      .filter((o) =>
        isBuy
          ? o.normalizedPrice <= limitPrice
          : o.normalizedPrice >= limitPrice
      );
  }

  remove(orderId: string, side: "BUY" | "SELL"): void {
    const heap = side === "BUY" ? this.bids : this.asks;
    // Note: This is a simple removal that requires rebuilding the heap
    // In production, you might want a more efficient approach
    const filtered = heap
      .toSortedArray()
      .filter((n) => n.value.id !== orderId);
    
    // Clear and reinsert
    (heap as any).data = [];
    for (const node of filtered) {
      heap.insert(node);
    }
  }
}