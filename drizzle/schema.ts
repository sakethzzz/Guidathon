import { index, int, mysqlEnum, mysqlTable, mediumtext, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;


/** Server-side knowledge chunks. Embeddings are JSON vectors so MySQL can store
 * them without a vendor-specific vector extension; cosine ranking is performed
 * by the retrieval adapter. Workspace scoping prevents cross-team leakage. */
export const knowledgeChunks = mysqlTable("knowledge_chunks", {
  storageKey: varchar("storage_key", { length: 191 }).primaryKey(),
  id: varchar("id", { length: 191 }).notNull(),
  workspaceId: varchar("workspace_id", { length: 96 }).notNull(),
  sourceName: varchar("source_name", { length: 255 }).notNull(),
  heading: varchar("heading", { length: 255 }).notNull(),
  content: text("content").notNull(),
  provenance: varchar("provenance", { length: 500 }).notNull(),
  embedding: text("embedding"),
  status: mysqlEnum("status", ["verified", "unverified"]).default("unverified").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({
  workspaceStatusIdx: index("knowledge_chunks_workspace_status_idx").on(table.workspaceId, table.status),
}));

export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type InsertKnowledgeChunk = typeof knowledgeChunks.$inferInsert;


/** One durable project workspace per owner for the current single-workspace UX.
 * The payload is versioned JSON so new project artifacts can be added compatibly. */
export const workspaceSnapshots = mysqlTable("workspace_snapshots", {
  storageKey: varchar("storage_key", { length: 160 }).primaryKey(),
  ownerOpenId: varchar("owner_open_id", { length: 64 }).notNull(),
  workspaceId: varchar("workspace_id", { length: 96 }).notNull().default("main"),
  snapshot: mediumtext("snapshot").notNull(),
  revision: int("revision").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerWorkspaceIdx: index("workspace_snapshots_owner_workspace_idx").on(table.ownerOpenId, table.workspaceId),
}));

/** Per-agent private transcripts; each row is scoped to one authenticated owner. */
export const agentConversations = mysqlTable("agent_conversations", {
  storageKey: varchar("storage_key", { length: 160 }).primaryKey(),
  ownerOpenId: varchar("owner_open_id", { length: 64 }).notNull(),
  agentId: varchar("agent_id", { length: 24 }).notNull(),
  messages: mediumtext("messages").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, table => ({
  ownerAgentIdx: index("agent_conversations_owner_agent_idx").on(table.ownerOpenId, table.agentId),
}));
