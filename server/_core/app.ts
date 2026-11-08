import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleMcpRequest } from "../mcpServer";

const app = express();

// Keep request parsing and API setup shared by local Express and Vercel Functions.
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/api/health", (_req, res) => {
  res.set("Cache-Control", "no-store").json({
    status: "ok",
    service: "guidathon-api",
    capabilities: {
      localAgentFallback: true,
      builtInMcpServer: true,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      groqConfigured: Boolean(process.env.GROQ_API_KEY),
      managedModelConfigured: Boolean(process.env.MANUS_API_URL && process.env.MANUS_API_KEY),
      persistentDatabaseConfigured: Boolean(process.env.DATABASE_URL),
      externalMcpConfigured: Boolean(process.env.MCP_SERVER_URL),
    },
  });
});

app.post("/api/mcp", (req, res) => {
  const response = handleMcpRequest(req.body);
  res.set("Cache-Control", "no-store");
  if (response === null) return res.status(202).end();
  return res.type("application/json").json(response);
});

app.get("/api/platform/config.js", (_req, res) => {
  res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
});

registerOAuthRoutes(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
