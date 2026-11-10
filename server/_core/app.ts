import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";

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
      openrouterConfigured: Boolean(process.env.OPENROUTER_API_KEY || process.env.Open_Router_Key),
      openrouterEmbeddingModelConfigured: Boolean(process.env.OPENROUTER_EMBEDDING_MODEL || process.env.Open_Router_Key || process.env.OPENROUTER_API_KEY),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      groqConfigured: Boolean(process.env.GROQ_API_KEY),
      managedModelConfigured: Boolean(process.env.MANUS_API_URL && process.env.MANUS_API_KEY),
      persistentDatabaseConfigured: Boolean(process.env.DATABASE_URL),
      authenticationConfigured: Boolean(process.env.DATABASE_URL && process.env.MANUS_PROJECT_ID && process.env.MANUS_JWT_SECRET && process.env.MANUS_OAUTH_API_URL),
      externalMcpConfigured: Boolean(process.env.MCP_SERVER_URL),
    },
  });
});

app.get("/api/platform/config.js", (_req, res) => {
  res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
});

registerOAuthRoutes(app);

const trpcMiddleware = createExpressMiddleware({ router: appRouter, createContext });
app.use("/api/trpc", (req, res, next) => {
  // Vercel's filesystem router can interpret dotted tRPC procedure names as
  // file extensions. The browser moves the procedure path into this query key
  // so every tRPC request reaches this stable, extension-free function route.
  const requestUrl = new URL(req.originalUrl, "http://localhost");
  const procedurePath = requestUrl.searchParams.get("__trpcPath");
  if (procedurePath) {
    requestUrl.searchParams.delete("__trpcPath");
    req.url = `/${procedurePath}${requestUrl.search}`;
  }
  trpcMiddleware(req, res, next);
});

export default app;
