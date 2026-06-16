import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

config({ path: resolve(import.meta.dir, ".env"), quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun prisma/seed.ts"
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
