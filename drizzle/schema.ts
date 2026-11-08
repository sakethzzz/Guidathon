import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
});

export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type InsertKnowledgeChunk = typeof knowledgeChunks.$inferInsert;
