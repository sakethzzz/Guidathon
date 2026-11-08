import { and, eq, sql } from "drizzle-orm";
import { agentConversations, workspaceSnapshots } from "../drizzle/schema";
import { getDb } from "./db";

export const WORKSPACE_ID = "main" as const;
const agentIds = ["hermes", "zeus", "athena", "hephaestus", "chronos"] as const;
export type WorkspaceAgentId = (typeof agentIds)[number];
export type AgentMessage = { role: "user" | "agent"; text: string; createdAt: string };

function workspaceKey(ownerOpenId: string) {
  return `${ownerOpenId}:main`;
}

function conversationKey(ownerOpenId: string, agentId: WorkspaceAgentId) {
  return `${ownerOpenId}:${agentId}`;
}

export async function loadWorkspace(ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ snapshot: workspaceSnapshots.snapshot, revision: workspaceSnapshots.revision, updatedAt: workspaceSnapshots.updatedAt })
    .from(workspaceSnapshots)
    .where(and(eq(workspaceSnapshots.ownerOpenId, ownerOpenId), eq(workspaceSnapshots.workspaceId, WORKSPACE_ID)))
    .limit(1);
  if (!rows.length) return { snapshot: null, revision: 0, updatedAt: null };
  try {
    return { snapshot: JSON.parse(rows[0].snapshot) as Record<string, unknown>, revision: rows[0].revision, updatedAt: rows[0].updatedAt.toISOString() };
  } catch {
    throw new Error("Saved workspace data is invalid JSON; no changes were made.");
  }
}

export async function saveWorkspace(ownerOpenId: string, snapshot: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const serialized = JSON.stringify(snapshot);
  if (Buffer.byteLength(serialized, "utf8") > 100_000) throw new Error("Workspace snapshot exceeds the 100 KB safety limit.");
  const key = workspaceKey(ownerOpenId);
  await db.insert(workspaceSnapshots).values({
    storageKey: key, ownerOpenId, workspaceId: WORKSPACE_ID, snapshot: serialized, revision: 1,
  }).onDuplicateKeyUpdate({
    set: { snapshot: serialized, revision: sql`${workspaceSnapshots.revision} + 1`, updatedAt: new Date() },
  });
  const rows = await db.select({ revision: workspaceSnapshots.revision, updatedAt: workspaceSnapshots.updatedAt })
    .from(workspaceSnapshots).where(eq(workspaceSnapshots.storageKey, key)).limit(1);
  return { saved: true as const, revision: rows[0]?.revision ?? 1, updatedAt: rows[0]?.updatedAt.toISOString() ?? new Date().toISOString() };
}

export async function loadAgentConversation(ownerOpenId: string, agentId: WorkspaceAgentId): Promise<AgentMessage[]> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ messages: agentConversations.messages }).from(agentConversations)
    .where(and(eq(agentConversations.ownerOpenId, ownerOpenId), eq(agentConversations.agentId, agentId))).limit(1);
  if (!rows.length) return [];
  try {
    const parsed = JSON.parse(rows[0].messages);
    return Array.isArray(parsed) ? parsed.slice(-100) as AgentMessage[] : [];
  } catch {
    throw new Error("Saved agent conversation is invalid JSON.");
  }
}

export async function saveAgentConversation(ownerOpenId: string, agentId: WorkspaceAgentId, messages: AgentMessage[]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const serialized = JSON.stringify(messages.slice(-100));
  if (Buffer.byteLength(serialized, "utf8") > 80_000) throw new Error("Conversation exceeds the 80 KB safety limit.");
  const key = conversationKey(ownerOpenId, agentId);
  await db.insert(agentConversations).values({ storageKey: key, ownerOpenId, agentId, messages: serialized })
    .onDuplicateKeyUpdate({ set: { messages: serialized, updatedAt: new Date() } });
  return { saved: true as const, count: messages.slice(-100).length };
}
