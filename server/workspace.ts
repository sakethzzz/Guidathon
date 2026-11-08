import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { agentConversations, judgeEvaluations, workspaceSnapshots } from "../drizzle/schema";
import { getDb } from "./db";

export const WORKSPACE_ID = "main" as const;
const agentIds = ["hermes", "zeus", "athena", "hephaestus", "chronos"] as const;
export type WorkspaceAgentId = (typeof agentIds)[number];
export type AgentMessage = { role: "user" | "agent"; text: string; createdAt: string };

export function serializeBoundedJson(value: unknown, maxBytes: number, label: string) {
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, "utf8") > maxBytes) throw new Error(label + " exceeds the " + maxBytes + " byte safety limit.");
  return serialized;
}

export function normalizeAgentMessages(value: unknown): AgentMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((message): message is AgentMessage =>
    Boolean(message) &&
    (message.role === "user" || message.role === "agent") &&
    typeof message.text === "string" && message.text.length <= 4000 &&
    typeof message.createdAt === "string" && message.createdAt.length <= 40
  ).slice(-100);
}

export function workspaceStorageKey(ownerOpenId: string) {
  return `${ownerOpenId}:main`;
}

export function agentConversationStorageKey(ownerOpenId: string, agentId: WorkspaceAgentId) {
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
  const serialized = serializeBoundedJson(snapshot, 100_000, "Workspace snapshot");
  const key = workspaceStorageKey(ownerOpenId);
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
    return normalizeAgentMessages(parsed);
  } catch {
    throw new Error("Saved agent conversation is invalid JSON.");
  }
}

export async function saveAgentConversation(ownerOpenId: string, agentId: WorkspaceAgentId, messages: AgentMessage[]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const serialized = serializeBoundedJson(messages.slice(-100), 80_000, "Conversation");
  const key = agentConversationStorageKey(ownerOpenId, agentId);
  await db.insert(agentConversations).values({ storageKey: key, ownerOpenId, agentId, messages: serialized })
    .onDuplicateKeyUpdate({ set: { messages: serialized, updatedAt: new Date() } });
  return { saved: true as const, count: messages.slice(-100).length };
}

export async function saveJudgeEvaluation(ownerOpenId: string, payload: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const serialized = serializeBoundedJson(payload, 30_000, "Judge result");
  const id = randomUUID();
  const score = Number(payload.score);
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error("Judge score is invalid.");
  await db.insert(judgeEvaluations).values({ id, ownerOpenId, score: Math.round(score), payload: serialized });
  return { id, saved: true as const };
}

export async function loadJudgeEvaluations(ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select({ id: judgeEvaluations.id, score: judgeEvaluations.score, payload: judgeEvaluations.payload, createdAt: judgeEvaluations.createdAt })
    .from(judgeEvaluations).where(eq(judgeEvaluations.ownerOpenId, ownerOpenId))
    .orderBy(desc(judgeEvaluations.createdAt)).limit(10);
  return rows.map(row => {
    try {
      return { id: row.id, score: row.score, result: JSON.parse(row.payload) as Record<string, unknown>, createdAt: row.createdAt.toISOString() };
    } catch {
      return { id: row.id, score: row.score, result: {}, createdAt: row.createdAt.toISOString() };
    }
  });
}
