import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerSeoRoutes } from "./seo";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use("/api", (req, res, next) => {
    // Public content queries may be reused briefly by the browser/CDN. Admin
    // writes and all authenticated/private API responses remain uncached.
    const isPublicContentQuery = req.method === "GET" && req.path.startsWith("/trpc/content.");
    if (isPublicContentQuery) {
      res.setHeader("Cache-Control", "public, max-age=30, s-maxage=30, stale-while-revalidate=60");
    } else {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerSeoRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  return app;
}

export default createApp();
