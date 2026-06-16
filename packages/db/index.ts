import { config } from "dotenv";
import { resolve } from "node:path";
import { Pool } from "pg";
import { PrismaClient, Prisma } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: resolve(import.meta.dir, ".env"), quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to packages/db/.env before starting the app.",
  );
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("supabase")
    ? { rejectUnauthorized: false }
    : undefined,
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export { Prisma };

export * from "./generated/prisma/enums.ts";
