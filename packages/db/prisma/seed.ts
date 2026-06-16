/**
 * prisma/seed.ts
 *
 * A self-consistent snapshot of the prediction-market system.
 * All monetary values are in INTEGER CENTS (matching the schema's Int fields).
 *
 * ── Collateral rules (mirroring the matching engine) ──────────────────────
 *
 *  BUY order placed   → usdBalance   -= price × qty
 *                        lockedBalance += price × qty
 *
 *  SELL order placed  → shares       -= qty
 *                        lockedShares  += qty
 *
 *  On fill (buyer/taker):
 *    lockedBalance    -= price × filledQty    (released)
 *    usdBalance       += refund  (price×filled − actualSpent)
 *    yesShares / noShares += filledQty
 *    totalSpent       += actualSpent
 *
 *  On fill (seller/maker):
 *    lockedShares     -= filledQty
 *    usdBalance       += proceeds
 *    totalSpent       -= proceeds
 *
 *  normalizedPrice = outcome=YES ? price : 100 - price
 *  normalizedSide  = outcome=YES ? side  : flip(side)
 *
 * ── Cast ───────────────────────────────────────────────────────────────────
 *
 *  alice  – active buyer, holds YES on BTCUSD, open BUY NO on BTCUSD
 *  bob    – market-maker, pre-minted YES+NO share pairs, resting SELL orders
 *  carol  – new user, one filled BUY YES and one open BUY YES on ETHFLIP
 *
 * ── Markets ────────────────────────────────────────────────────────────────
 *
 *  BTCUSD_2025  "Will BTC close above $100k on 31 Dec 2025?"
 *  ETHFLIP_2025 "Will ETH flip BTC by market-cap before end of 2025?"
 *
 * ── Trade history ──────────────────────────────────────────────────────────
 *
 *  trade1 (BTCUSD):  alice BUY YES @60 × 50  ←→  bob SELL YES @60 × 50
 *    alice pays 60×50 = 3 000¢, gets 50 YES
 *    bob receives 3 000¢, 50 lockedYes released
 *
 *  trade2 (BTCUSD):  alice BUY YES @65 × 30  ←→  bob SELL YES @62 × 30
 *    actualCost = 62×30 = 1 860¢, refund to alice = (65-62)×30 = 90¢
 *    bob receives 1 860¢, 30 lockedYes released
 *
 *  trade3 (ETHFLIP): carol BUY YES @40 × 20  ←→  bob SELL YES @38 × 20
 *    actualCost = 38×20 = 760¢, refund to carol = (40-38)×20 = 40¢
 *    bob receives 760¢, 20 lockedYes released
 *
 * ── Resting open orders ────────────────────────────────────────────────────
 *
 *  bob_o3   SELL YES BTCUSD  @70 × 40   (40 lockedYes)
 *  bob_o5   SELL YES ETHFLIP @48 × 15   (15 lockedYes)  — above carol's bid of 45, no match
 *  alice_o3 BUY  NO  BTCUSD  @35 × 25   (875¢ lockedBalance)
 *           normalised: SELL YES @65    — below bob's ask of 70, no match
 *  carol_o2 BUY  YES ETHFLIP @45 × 30   (1 350¢ lockedBalance)
 *           — below bob's ask of 48, no match
 *
 * ── Balance derivation (all cents) ────────────────────────────────────────
 *
 *  alice  start 20 000
 *         BUY YES @60×50    place:  -3 000  lock +3 000
 *         BUY YES @65×30    place:  -1 950  lock +1 950
 *         BUY NO  @35×25    place:    -875  lock   +875
 *         trade1 fill:              lock -3 000, refund 0
 *         trade2 fill:              lock -1 950, refund +90
 *         free  = 20000 - 3000 - 1950 - 875 + 90 = 14 265
 *         locked= 875   (alice_o3 still open)
 *
 *  bob    start 20 000
 *         mint 120 YES+NO BTCUSD:  -12 000  (external split, not via engine)
 *         mint  40 YES+NO ETHFLIP:  -4 000
 *         SELL orders place no USD lock (shares locked instead)
 *         trade1 receive  +3 000
 *         trade2 receive  +1 860
 *         trade3 receive    +760
 *         free  = 20000 - 12000 - 4000 + 3000 + 1860 + 760 = 9 620
 *         locked= 0
 *
 *  carol  start 15 000
 *         BUY YES @40×20    place:    -800  lock   +800
 *         BUY YES @45×30    place:  -1 350  lock +1 350
 *         trade3 fill:              lock -800, refund +40
 *         free  = 15000 - 800 - 1350 + 40 = 12 890
 *         locked= 1 350  (carol_o2 still open)
 *
 * ── Position derivation ────────────────────────────────────────────────────
 *
 *  alice / BTCUSD
 *    yesShares=80  noShares=0  lockedYes=0  lockedNo=0
 *    totalSpent = 3000 + 1860 = 4 860¢
 *
 *  bob / BTCUSD
 *    minted 120 YES → sold 80 (trade1+2), locked 40 (bob_o3)  → yesShares=0
 *    minted 120 NO  → untouched                               → noShares=120
 *    lockedYes=40  lockedNo=0
 *    totalSpent = 12000 - 3000 - 1860 = 7 140¢
 *
 *  bob / ETHFLIP
 *    minted 40 YES → sold 20 (trade3), locked 15 (bob_o5), 5 free → yesShares=5
 *    minted 40 NO  → untouched                                    → noShares=40
 *    lockedYes=15  lockedNo=0
 *    totalSpent = 4000 - 760 = 3 240¢
 *
 *  carol / ETHFLIP
 *    yesShares=20  noShares=0  lockedYes=0  lockedNo=0
 *    totalSpent = 760¢
 */

import { PrismaClient } from "../generated/prisma/client";
import { OrderSide, Outcome, OrderStatus } from "../generated/prisma/enums";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";


const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── deterministic IDs ────────────────────────────────────────────────────────

const ID = {
  // users
  alice: "00000000-0000-0000-0000-000000000001",
  bob:   "00000000-0000-0000-0000-000000000002",
  carol: "00000000-0000-0000-0000-000000000003",

  // markets
  btc:   "00000000-0000-0000-0001-000000000001",
  eth:   "00000000-0000-0000-0001-000000000002",

  // orders — BTCUSD
  alice_o1: "00000000-0000-0000-0002-000000000001", // BUY YES @60×50  FILLED
  alice_o2: "00000000-0000-0000-0002-000000000002", // BUY YES @65×30  FILLED
  alice_o3: "00000000-0000-0000-0002-000000000003", // BUY NO  @35×25  OPEN
  bob_o1:   "00000000-0000-0000-0002-000000000004", // SELL YES @60×50 FILLED
  bob_o2:   "00000000-0000-0000-0002-000000000005", // SELL YES @62×30 FILLED
  bob_o3:   "00000000-0000-0000-0002-000000000006", // SELL YES @70×40 OPEN

  // orders — ETHFLIP
  carol_o1: "00000000-0000-0000-0002-000000000007", // BUY YES @40×20  FILLED
  carol_o2: "00000000-0000-0000-0002-000000000008", // BUY YES @45×30  OPEN
  bob_o4:   "00000000-0000-0000-0002-000000000009", // SELL YES @38×20 FILLED
  bob_o5:   "00000000-0000-0000-0002-000000000010", // SELL YES @48×15 OPEN

  // trades
  trade1: "00000000-0000-0000-0003-000000000001",
  trade2: "00000000-0000-0000-0003-000000000002",
  trade3: "00000000-0000-0000-0003-000000000003",

  // positions
  pos_alice_btc:  "00000000-0000-0000-0004-000000000001",
  pos_bob_btc:    "00000000-0000-0000-0004-000000000002",
  pos_bob_eth:    "00000000-0000-0000-0004-000000000003",
  pos_carol_eth:  "00000000-0000-0000-0004-000000000004",
};

// ─── timestamps ───────────────────────────────────────────────────────────────

const T = (offsetMs: number) =>
  new Date(new Date("2025-06-01T09:00:00Z").getTime() + offsetMs);

async function main() {
  console.log("🌱  Seeding database …");

  // ── 1. Users ───────────────────────────────────────────────────────────────
  await prisma.user.createMany({
    data: [
      {
        id:           ID.alice,
        supabaseUid:  "supabase-uid-alice",
        usdBalance:   14_265, // cents
        lockedBalance:   875, // alice_o3: BUY NO @35×25 → 35×25=875¢
      },
      {
        id:           ID.bob,
        supabaseUid:  "supabase-uid-bob",
        usdBalance:    9_620,
        lockedBalance:     0, // sellers lock shares, not USD
      },
      {
        id:           ID.carol,
        supabaseUid:  "supabase-uid-carol",
        usdBalance:   12_890,
        lockedBalance: 1_350, // carol_o2: BUY YES @45×30 → 45×30=1350¢
      },
    ],
    skipDuplicates: true,
  });

  // ── 2. Markets ─────────────────────────────────────────────────────────────
  await prisma.market.createMany({
    data: [
      {
        id:                  ID.btc,
        title:               "Will BTC close above $100k on 31 Dec 2025?",
        description:         "Resolves YES if the BTC/USD spot price on any major exchange closes at or above $100,000 on 31 December 2025. Uses the Coinbase daily close.",
        resolutionDeadline:  new Date("2025-12-31T23:59:00Z"),
        isResolved:          false,
        resolvedOutcome:     null,
      },
      {
        id:                  ID.eth,
        title:               "Will ETH flip BTC by market-cap before end of 2025?",
        description:         "Resolves YES if ETH total market capitalisation exceeds BTC total market capitalisation at any point before 31 December 2025, per CoinGecko data.",
        resolutionDeadline:  new Date("2025-12-31T23:59:00Z"),
        isResolved:          false,
        resolvedOutcome:     null,
      },
    ],
    skipDuplicates: true,
  });

  // ── 3. Orders ──────────────────────────────────────────────────────────────
  //
  // normalizedSide / normalizedPrice:
  //   YES BUY  → normalizedSide=BUY,  normalizedPrice=price
  //   YES SELL → normalizedSide=SELL, normalizedPrice=price
  //   NO  BUY  → normalizedSide=SELL, normalizedPrice=100-price
  //   NO  SELL → normalizedSide=BUY,  normalizedPrice=100-price

  await prisma.order.createMany({
    data: [
      // ── BTCUSD ──────────────────────────────────────────────────────────

      {
        id:              ID.alice_o1,
        userId:          ID.alice,
        marketId:        ID.btc,
        side:            OrderSide.BUY,
        outcome:         Outcome.YES,
        price:           60,
        normalizedSide:  OrderSide.BUY,
        normalizedPrice: 60,
        quantity:        50,
        remaining:       0,
        status:          OrderStatus.FILLED,
        createdAt:       T(0),
      },
      {
        id:              ID.alice_o2,
        userId:          ID.alice,
        marketId:        ID.btc,
        side:            OrderSide.BUY,
        outcome:         Outcome.YES,
        price:           65,
        normalizedSide:  OrderSide.BUY,
        normalizedPrice: 65,
        quantity:        30,
        remaining:       0,
        status:          OrderStatus.FILLED,
        createdAt:       T(60_000),
      },
      {
        // BUY NO @35 → normalised: SELL YES @65
        // resting: no SELL YES order with normalizedPrice ≤ 65 on the book
        // (bob_o3 is SELL YES @70 which is > 65 — no match)
        id:              ID.alice_o3,
        userId:          ID.alice,
        marketId:        ID.btc,
        side:            OrderSide.BUY,
        outcome:         Outcome.NO,
        price:           35,
        normalizedSide:  OrderSide.SELL,
        normalizedPrice: 65,
        quantity:        25,
        remaining:       25,
        status:          OrderStatus.OPEN,
        createdAt:       T(120_000),
      },

      {
        id:              ID.bob_o1,
        userId:          ID.bob,
        marketId:        ID.btc,
        side:            OrderSide.SELL,
        outcome:         Outcome.YES,
        price:           60,
        normalizedSide:  OrderSide.SELL,
        normalizedPrice: 60,
        quantity:        50,
        remaining:       0,
        status:          OrderStatus.FILLED,
        createdAt:       T(-3_600_000),
      },
      {
        id:              ID.bob_o2,
        userId:          ID.bob,
        marketId:        ID.btc,
        side:            OrderSide.SELL,
        outcome:         Outcome.YES,
        price:           62,
        normalizedSide:  OrderSide.SELL,
        normalizedPrice: 62,
        quantity:        30,
        remaining:       0,
        status:          OrderStatus.FILLED,
        createdAt:       T(-3_540_000),
      },
      {
        // resting ask: above alice_o3's normalised price of 65 → no match
        id:              ID.bob_o3,
        userId:          ID.bob,
        marketId:        ID.btc,
        side:            OrderSide.SELL,
        outcome:         Outcome.YES,
        price:           70,
        normalizedSide:  OrderSide.SELL,
        normalizedPrice: 70,
        quantity:        40,
        remaining:       40,
        status:          OrderStatus.OPEN,
        createdAt:       T(-3_480_000),
      },

      // ── ETHFLIP ─────────────────────────────────────────────────────────

      {
        id:              ID.carol_o1,
        userId:          ID.carol,
        marketId:        ID.eth,
        side:            OrderSide.BUY,
        outcome:         Outcome.YES,
        price:           40,
        normalizedSide:  OrderSide.BUY,
        normalizedPrice: 40,
        quantity:        20,
        remaining:       0,
        status:          OrderStatus.FILLED,
        createdAt:       T(180_000),
      },
      {
        // resting bid @45; bob_o5 asks @48 → 48 > 45, no match
        id:              ID.carol_o2,
        userId:          ID.carol,
        marketId:        ID.eth,
        side:            OrderSide.BUY,
        outcome:         Outcome.YES,
        price:           45,
        normalizedSide:  OrderSide.BUY,
        normalizedPrice: 45,
        quantity:        30,
        remaining:       30,
        status:          OrderStatus.OPEN,
        createdAt:       T(240_000),
      },

      {
        id:              ID.bob_o4,
        userId:          ID.bob,
        marketId:        ID.eth,
        side:            OrderSide.SELL,
        outcome:         Outcome.YES,
        price:           38,
        normalizedSide:  OrderSide.SELL,
        normalizedPrice: 38,
        quantity:        20,
        remaining:       0,
        status:          OrderStatus.FILLED,
        createdAt:       T(-1_800_000),
      },
      {
        // resting ask @48; carol_o2 bids @45 → 48 > 45, no match
        id:              ID.bob_o5,
        userId:          ID.bob,
        marketId:        ID.eth,
        side:            OrderSide.SELL,
        outcome:         Outcome.YES,
        price:           48,
        normalizedSide:  OrderSide.SELL,
        normalizedPrice: 48,
        quantity:        15,
        remaining:       15,
        status:          OrderStatus.OPEN,
        createdAt:       T(-1_740_000),
      },
    ],
    skipDuplicates: true,
  });

  // ── 4. Trades ──────────────────────────────────────────────────────────────

  await prisma.trade.createMany({
    data: [
      {
        // alice BUY YES @60 × bob SELL YES @60
        // alice pays 60×50=3000¢, no refund
        // bob receives 3000¢
        id:           ID.trade1,
        marketId:     ID.btc,
        takerId:      ID.alice,
        makerId:      ID.bob,
        takerOrderId: ID.alice_o1,
        makerOrderId: ID.bob_o1,
        takerOutcome: Outcome.YES,
        makerOutcome: Outcome.YES,
        quantity:     50,
        takerPrice:   60,
        makerPrice:   60,
        createdAt:    T(1_000),
      },
      {
        // alice BUY YES @65 × bob SELL YES @62  (price improvement for alice)
        // actualCost = 62×30 = 1860¢, refund to alice = (65-62)×30 = 90¢
        // bob receives 1860¢
        id:           ID.trade2,
        marketId:     ID.btc,
        takerId:      ID.alice,
        makerId:      ID.bob,
        takerOrderId: ID.alice_o2,
        makerOrderId: ID.bob_o2,
        takerOutcome: Outcome.YES,
        makerOutcome: Outcome.YES,
        quantity:     30,
        takerPrice:   65,
        makerPrice:   62,
        createdAt:    T(61_000),
      },
      {
        // carol BUY YES @40 × bob SELL YES @38  (price improvement for carol)
        // actualCost = 38×20 = 760¢, refund to carol = (40-38)×20 = 40¢
        // bob receives 760¢
        id:           ID.trade3,
        marketId:     ID.eth,
        takerId:      ID.carol,
        makerId:      ID.bob,
        takerOrderId: ID.carol_o1,
        makerOrderId: ID.bob_o4,
        takerOutcome: Outcome.YES,
        makerOutcome: Outcome.YES,
        quantity:     20,
        takerPrice:   40,
        makerPrice:   38,
        createdAt:    T(181_000),
      },
    ],
    skipDuplicates: true,
  });

  // ── 5. Positions ───────────────────────────────────────────────────────────

  await prisma.position.createMany({
    data: [
      {
        id:              ID.pos_alice_btc,
        userId:          ID.alice,
        marketId:        ID.btc,
        yesShares:       80,   // 50 (trade1) + 30 (trade2)
        noShares:        0,
        lockedYesShares: 0,
        lockedNoShares:  0,
        totalSpent:      4_860, // 3000 + 1860¢
      },
      {
        // bob pre-minted 120 YES+NO on BTCUSD
        // sold 80 YES (trade1+2), locked 40 YES in bob_o3
        // 120 NO shares untouched
        id:              ID.pos_bob_btc,
        userId:          ID.bob,
        marketId:        ID.btc,
        yesShares:       0,    // 120 minted − 80 sold − 40 locked = 0 free
        noShares:        120,
        lockedYesShares: 40,   // bob_o3: SELL YES @70 × 40
        lockedNoShares:  0,
        totalSpent:      7_140, // 12000 minted − 3000(t1) − 1860(t2) = 7140¢
      },
      {
        // bob pre-minted 40 YES+NO on ETHFLIP
        // sold 20 YES (trade3), locked 15 YES in bob_o5, 5 free
        id:              ID.pos_bob_eth,
        userId:          ID.bob,
        marketId:        ID.eth,
        yesShares:       5,    // 40 minted − 20 sold − 15 locked = 5 free
        noShares:        40,
        lockedYesShares: 15,   // bob_o5: SELL YES @48 × 15
        lockedNoShares:  0,
        totalSpent:      3_240, // 4000 minted − 760(t3) = 3240¢
      },
      {
        id:              ID.pos_carol_eth,
        userId:          ID.carol,
        marketId:        ID.eth,
        yesShares:       20,   // trade3
        noShares:        0,
        lockedYesShares: 0,
        lockedNoShares:  0,
        totalSpent:      760,  // 38×20¢
      },
    ],
    skipDuplicates: true,
  });

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log("✅  Seed complete.\n");
  console.log("  USERS (balances in cents)");
  console.log("    alice  usd=14265  locked=875   (open: BUY NO BTCUSD @35×25)");
  console.log("    bob    usd=9620   locked=0     (market-maker, locks shares not USD)");
  console.log("    carol  usd=12890  locked=1350  (open: BUY YES ETHFLIP @45×30)");
  console.log("");
  console.log("  POSITIONS");
  console.log("    alice  / BTCUSD   yes=80  no=0    lockedYes=0   lockedNo=0  spent=4860¢");
  console.log("    bob    / BTCUSD   yes=0   no=120  lockedYes=40  lockedNo=0  spent=7140¢");
  console.log("    bob    / ETHFLIP  yes=5   no=40   lockedYes=15  lockedNo=0  spent=3240¢");
  console.log("    carol  / ETHFLIP  yes=20  no=0    lockedYes=0   lockedNo=0  spent=760¢");
  console.log("");
  console.log("  OPEN ORDER BOOK");
  console.log("    BTCUSD  BUY side:  alice  BUY NO  @35 (norm: SELL YES @65) × 25");
  console.log("    BTCUSD  SELL side: bob    SELL YES @70                     × 40  → spread: 5¢");
  console.log("    ETHFLIP BUY side:  carol  BUY YES @45                     × 30");
  console.log("    ETHFLIP SELL side: bob    SELL YES @48                     × 15  → spread: 3¢");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());