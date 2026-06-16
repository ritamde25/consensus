import express from "express";
import cors from "cors";
import path from "path";

import marketRouter from "./controllers/market.controller";
import orderRoutes from "./controllers/orders.controller";
import portfolioRoutes from "./controllers/portfolio.controller";
import adminRouter from "./controllers/admin.controller";
import { hydrateAllBooks } from "./lib/heapMatchingEngine";

const PORT = process.env.PORT || 3000;

const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(cors());
}

app.use(express.json());

app.use("/markets", marketRouter);
app.use("/orders", orderRoutes);
app.use("/portfolio", portfolioRoutes);
app.use("/admin", adminRouter);

if (process.env.NODE_ENV === "production") {
  const frontendBuildPath = path.resolve(
    process.cwd(),
    "apps/frontend/dist"
  );

  app.use(express.static(frontendBuildPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
}

await hydrateAllBooks();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});