# @packages/db

Database layer for the Consensus prediction market platform. This package provides a Prisma-based PostgreSQL database schema with TypeScript type safety, comprehensive seeding, and migration management.

## Overview

Consensus is a Polymarket-style binary prediction market platform where users can trade YES/NO shares on real-world events. This database package manages:

- **User accounts** with USD balances and locked collateral
- **Prediction markets** with resolution logic
- **Order matching** with normalized price/side mechanics
- **Trade execution** with complete audit trails
- **Position tracking** with P&L calculation
- **Market settlement** with automated payouts

## Features

- 🔒 **Row-level locking** for concurrent order matching
- 📊 **Dual YES/NO representation** preserving user intent
- ⚡ **Price normalization** for efficient order matching
- 🔄 **Comprehensive migrations** with full history
- 🌱 **Realistic seed data** for development/testing
- 🎯 **Type-safe queries** with Prisma Client
- 🔐 **Supabase integration** with SSL support
- 📈 **Optimized indexes** for matching engine performance

## Database Schema

### Core Models

#### User
```prisma
- id (UUID)
- supabaseUid (String, unique)
- usdBalance (Int, cents)
- lockedBalance (Int, cents)
- positions (Relation)
- orders (Relation)
- trades (Relation)
```

#### Market
```prisma
- id (UUID)
- title (String, unique)
- description (String)
- resolutionDeadline (DateTime)
- isResolved (Boolean)
- resolvedOutcome (Outcome?)
- orders (Relation)
- trades (Relation)
- positions (Relation)
```

#### Order
```prisma
- id (UUID)
- userId (UUID)
- marketId (UUID)
- side (OrderSide: BUY/SELL)
- outcome (Outcome: YES/NO)
- price (Int, cents 0-100)
- normalizedSide (OrderSide) // YES-equivalent for matching
- normalizedPrice (Int) // YES-equivalent price
- quantity (Int)
- remaining (Int)
- status (OrderStatus)
- trades (Relation)
```

#### Trade
```prisma
- id (UUID)
- marketId (UUID)
- takerId (UUID)
- makerId (UUID)
- quantity (Int)
- takerPrice (Int)
- makerPrice (Int)
- takerOrderId (UUID)
- makerOrderId (UUID)
- takerOutcome (Outcome)
- makerOutcome (Outcome)
```

#### Position
```prisma
- id (UUID)
- userId (UUID)
- marketId (UUID)
- yesShares (Int)
- noShares (Int)
- lockedYesShares (Int)
- lockedNoShares (Int)
- totalSpent (Int, cents)
```

## Price Normalization

The matching engine uses YES-space normalization for efficient order matching:

| Order Type | Original | Normalized Side | Normalized Price |
|------------|----------|------------------|------------------|
| Buy YES | BUY @ p | BUY @ p | p |
| Sell YES | SELL @ p | SELL @ p | 100-p |
| Buy NO | BUY @ p | SELL @ p | 100-p |
| Sell NO | SELL @ p | BUY @ p | p |

This enables all orders to be matched in a unified YES-space orderbook while preserving original user intent.

## Setup

### Prerequisites

- Node.js 18+
- Bun 1.3.14+
- PostgreSQL database (Supabase recommended)
- Database connection string

### Installation

```bash
# From the project root
bun install

# From packages/db specifically
cd packages/db
bun install
```

### Configuration

Create a `.env` file in `packages/db/`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database
```

For Supabase:
```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
```

### Database Setup

```bash
# Generate Prisma Client
bunx prisma generate

# Run migrations
bunx prisma migrate dev

# Seed database (optional)
bun run seed
```

## Usage

### Import Prisma Client

```typescript
import { prisma, Prisma, OrderSide, Outcome, OrderStatus } from "db";

// Use in your application
const users = await prisma.user.findMany();
const market = await prisma.market.findUnique({
  where: { id: marketId },
  include: { orders: true }
});
```

### Example Queries

#### Create a user
```typescript
const user = await prisma.user.create({
  data: {
    supabaseUid: "supabase-uid-123",
    usdBalance: 10000, // $100.00 in cents
  }
});
```

#### Create a market
```typescript
const market = await prisma.market.create({
  data: {
    title: "Will BTC reach $100k by 2025?",
    description: "Resolves YES if BTC/USD closes above $100,000 on Dec 31, 2025",
    resolutionDeadline: new Date("2025-12-31T23:59:59Z"),
  }
});
```

#### Place an order
```typescript
const order = await prisma.order.create({
  data: {
    userId: userId,
    marketId: marketId,
    side: OrderSide.BUY,
    outcome: Outcome.YES,
    price: 60, // 60 cents
    normalizedSide: OrderSide.BUY,
    normalizedPrice: 60,
    quantity: 100,
    remaining: 100,
    status: OrderStatus.OPEN,
  }
});
```

#### Query orderbook
```typescript
const orderbook = await prisma.order.findMany({
  where: {
    marketId,
    status: { in: [OrderStatus.OPEN, OrderStatus.PARTIAL] },
    remaining: { gt: 0 }
  },
  orderBy: [
    { normalizedSide: 'asc' },
    { normalizedPrice: 'asc' },
    { createdAt: 'asc' }
  ]
});
```

## Seed Data

The package includes comprehensive seed data that creates a realistic trading scenario:

### Seed Scenario
- **3 users**: Alice (active trader), Bob (market maker), Carol (new trader)
- **2 markets**: BTCUSD and ETHFLIP prediction markets
- **9 orders**: Mix of filled and open orders showing various trading patterns
- **3 trades**: Historical trades showing price improvement
- **4 positions**: Realistic position states with locked shares

### Running Seed

```bash
bun run seed
```

### Seed Output
```
🌱  Seeding database …
✅  Seed complete.

  USERS (balances in cents)
    alice  usd=14265  locked=875   (open: BUY NO BTCUSD @35×25)
    bob    usd=9620   locked=0     (market-maker, locks shares not USD)
    carol  usd=12890  locked=1350  (open: BUY YES ETHFLIP @45×30)

  POSITIONS
    alice  / BTCUSD   yes=80  no=0    lockedYes=0   lockedNo=0  spent=4860¢
    bob    / BTCUSD   yes=0   no=120  lockedYes=40  lockedNo=0  spent=7140¢
    bob    / ETHFLIP  yes=5   no=40   lockedYes=15  lockedNo=0  spent=3240¢
    carol  / ETHFLIP  yes=20  no=0    lockedYes=0   lockedNo=0  spent=760¢

  OPEN ORDER BOOK
    BTCUSD  BUY side:  alice  BUY NO  @35 (norm: SELL YES @65) × 25
    BTCUSD  SELL side: bob    SELL YES @70                     × 40  → spread: 5¢
    ETHFLIP BUY side:  carol  BUY YES @45                     × 30
    ETHFLIP SELL side: bob    SELL YES @48                     × 15  → spread: 3¢
```

## Migrations

### Migration History

The package maintains a complete migration history:

- `init` - Initial schema setup
- `added_openorder_and_trade` - Order and trade models
- `trade_replaces_order_history` - Trade model optimization
- `one_orderbook_to_rule_them_all` - Unified orderbook
- `added_locked_balance` - Balance locking mechanism
- `support_split` - Split/merge functionality
- `binary_db` - Binary market specific changes
- `parity_changes` - Schema parity updates
- `index_fixes` - Performance optimizations
- `finishing_up` - Final schema refinements
- `economy_correctness` - Economic calculation fixes
- `normalised_side` - Normalized side for matching

### Creating Migrations

```bash
# Create a new migration
bunx prisma migrate dev --name migration_name

# Reset database (development only)
bunx prisma migrate reset

# Resolve migration issues
bunx prisma migrate resolve
```

### Production Migrations

```bash
# Deploy migrations to production
bunx prisma migrate deploy

# Check migration status
bunx prisma migrate status
```

## Development

### Prisma Studio

```bash
# Open Prisma Studio for database inspection
bunx prisma studio
```

### Type Generation

After schema changes, regenerate types:

```bash
bunx prisma generate
```

### Format Schema

```bash
bunx prisma format
```

## Architecture

### Connection Pooling

The package uses connection pooling via `pg` for performance:

```typescript
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
```

### SSL Support

Automatic SSL configuration for Supabase:

```typescript
const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("supabase")
    ? { rejectUnauthorized: false }
    : undefined,
});
```

### Transaction Safety

All database operations in the matching engine use transactions with row-level locks:

```typescript
await prisma.$transaction(async (tx) => {
  const [user] = await tx.$queryRaw<any[]>`
    SELECT * FROM "User" WHERE id = ${userId} FOR UPDATE
  `;
  // ... transaction logic
});
```

## Performance

### Indexes

Optimized indexes for matching engine performance:

```prisma
@@index([marketId, normalizedSide, status, normalizedPrice, createdAt])
@@index([marketId, status])
@@index([userId])
@@index([takerOrderId])
@@index([makerOrderId])
```

### Query Optimization

- Use indexed columns in WHERE clauses
- Batch operations with `createMany`
- Select only required fields
- Use connection pooling

## Testing

### Unit Testing

```typescript
import { prisma } from "db";

describe('Database Operations', () => {
  beforeEach(async () => {
    await prisma.order.deleteMany();
  });

  it('should create an order', async () => {
    const order = await prisma.order.create({
      data: { /* ... */ }
    });
    expect(order).toBeDefined();
  });
});
```

### Integration Testing

Use transactions for test isolation:

```typescript
await prisma.$transaction(async (tx) => {
  // Test logic here
  // Changes will be rolled back
});
```

## Troubleshooting

### Connection Issues

```bash
# Check database connection
bunx prisma db push

# Verify connection string
echo $DATABASE_URL
```

### Migration Conflicts

```bash
# Resolve migration conflicts
bunx prisma migrate resolve --applied "migration_name"
```

### Type Errors

```bash
# Regenerate Prisma Client
bunx prisma generate

# Clean slate (development)
rm -rf prisma/migrations
bunx prisma migrate dev --name init
```

## Contributing

### Schema Changes

1. Modify `prisma/schema.prisma`
2. Generate migration: `bunx prisma migrate dev --name description`
3. Update seed data if needed
4. Regenerate types: `bunx prisma generate`
5. Test migration: `bunx prisma migrate reset`

### Code Style

- Use TypeScript strict mode
- Follow Prisma best practices
- Add indexes for frequently queried fields
- Use descriptive field names
- Maintain migration history

## Related Documentation

- [Consensus Whitepaper](../apps/backend/src/lib/consensus-whitepaper.txt)
- [Matching Engine Documentation](../apps/backend/src/lib/matchingEngine.ts)
- [Settlement Engine Documentation](../apps/backend/src/lib/settlementEngine.ts)
- [Supabase Setup](../SUPABASE_SETUP.md)

## License

This package is part of the Consensus project. See main project LICENSE for details.