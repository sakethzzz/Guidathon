import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { publicPlatformScript } from "../server/_core/publicConfig";

// Vercel's static frontend calls /api/trpc. This catch-all function hosts the
// same Express/tRPC router used by the managed server so the UI and backend
// share one API contract. Provider credentials remain server-side env vars.
const app = express();

app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ limit: "4mb", extended: true }));

app.get("/api/health", (_req: any, res: any) => res.json({ status: "ok" }));
app.get("/api/platform/config.js", (_req: any, res: any) => {
  res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
});

registerOAuthRoutes(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export default app;
