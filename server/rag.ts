import { and, eq, inArray } from "drizzle-orm";
import { knowledgeChunks } from "../drizzle/schema";
import { getDb } from "./db";

export type KnowledgeInput = {
  id: string;
  sourceName: string;
  heading: string;
  content: string;
  provenance: string;
};

type StoredChunk = typeof knowledgeChunks.$inferSelect;
const EMBEDDING_DIMENSIONS = 768;
const MAX_INGEST_CHUNKS = 50;
const STOP_WORDS = new Set(["the", "and", "for", "with", "from", "that", "this", "what", "when", "where", "which", "who", "how", "why", "are", "was", "were", "will", "can", "could", "should", "would", "have", "has", "had", "does", "did", "not", "but", "into", "about", "your", "their", "there", "then", "than"]);

async function embed(text: string, taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"): Promise<number[] | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent",
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text: text.slice(0, 8000) }] },
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    }
  );
  if (!response.ok) throw new Error(`Embedding request failed (${response.status})`);
  const data = await response.json() as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS || values.some(value => !Number.isFinite(value))) {
    throw new Error("Embedding provider returned an invalid vector");
  }
  return values;
}

function tokenize(value: string) {
  return value.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(term => term.length > 2 && !STOP_WORDS.has(term));
}

export function lexicalScore(query: string, content: string) {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return 0;
  const words = new Set(tokenize(content));
  const matches = terms.filter(term => words.has(term)).length;
  return matches / terms.length;
}

export function cosine(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i += 1) { dot += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i]; }
  return aa && bb ? dot / (Math.sqrt(aa) * Math.sqrt(bb)) : 0;
}

export async function persistKnowledge(workspaceId: string, chunks: KnowledgeInput[]) {
  const db = await getDb();
  if (!db) return { persisted: false, count: 0, vectorized: false, vectorCount: 0, reason: "DATABASE_URL is not configured" };
  if (chunks.length > MAX_INGEST_CHUNKS) {
    throw new Error(`A single ingestion batch may contain at most ${MAX_INGEST_CHUNKS} chunks; split the document into smaller batches.`);
  }

  const embeddings: Array<number[] | null> = [];
  for (let index = 0; index < chunks.length; index += 4) {
    const batch = chunks.slice(index, index + 4);
    const vectors = await Promise.all(batch.map(chunk =>
      embed(`${chunk.heading}\n${chunk.content}`, "RETRIEVAL_DOCUMENT").catch(() => null)
    ));
    embeddings.push(...vectors);
  }

  let count = 0;
  let vectorCount = 0;
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const vector = embeddings[index];
    if (vector) vectorCount += 1;
    await db.insert(knowledgeChunks).values({
      storageKey: `${workspaceId.slice(0, 48)}:${chunk.id.slice(0, 140)}`,
      id: chunk.id,
      workspaceId,
      sourceName: chunk.sourceName.slice(0, 255),
      heading: chunk.heading.slice(0, 255),
      content: chunk.content.slice(0, 12000),
      provenance: chunk.provenance.slice(0, 500),
      embedding: vector ? JSON.stringify(vector) : null,
      status: "unverified",
    }).onDuplicateKeyUpdate({
      set: {
        sourceName: chunk.sourceName.slice(0, 255),
        heading: chunk.heading.slice(0, 255),
        content: chunk.content.slice(0, 12000),
        provenance: chunk.provenance.slice(0, 500),
        embedding: vector ? JSON.stringify(vector) : null,
        status: "unverified",
      },
    });
    count += 1;
  }
  return {
    persisted: true,
    count,
    vectorized: vectorCount === count,
    vectorCount,
    embeddingDimensions: EMBEDDING_DIMENSIONS,
    retrievalMode: vectorCount === count ? "vector" : vectorCount > 0 ? "hybrid" : "lexical",
  };
}

export async function retrieveKnowledge(workspaceId: string, query: string, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(knowledgeChunks)
    .where(and(eq(knowledgeChunks.workspaceId, workspaceId), eq(knowledgeChunks.status, "verified")))
    .limit(300) as StoredChunk[];
  if (!rows.length) return [];
  const queryVector = await embed(query, "RETRIEVAL_QUERY").catch(() => null);
  const ranked = rows.map(row => {
    let vector: number[] | null = null;
    if (row.embedding) {
      try {
        const parsed = JSON.parse(row.embedding) as unknown;
        if (Array.isArray(parsed) && parsed.length === EMBEDDING_DIMENSIONS && parsed.every(Number.isFinite)) vector = parsed as number[];
      } catch { vector = null; }
    }
    const lexical = lexicalScore(query, `${row.heading}\n${row.content}`);
    const vectorScore = queryVector && vector ? cosine(queryVector, vector) : null;
    const score = vectorScore === null ? lexical : Math.max(0, vectorScore * 0.82 + lexical * 0.18);
    return { id: row.id, source: row.sourceName, heading: row.heading, passage: row.content, provenance: row.provenance, score };
  }).filter(row => row.score > 0.12)
    .sort((a, b) => b.score - a.score).slice(0, Math.max(1, Math.min(limit, 10)));
  return ranked;
}

/**
 * Promote only chunks belonging to the authenticated user's workspace after
 * the client has completed its supported text parsing step. "Verified" means
 * parsed and ingested, not independently fact-checked.
 */
export async function markKnowledgeProcessed(workspaceId: string, ids: string[]) {
  const db = await getDb();
  const uniqueIds = [...new Set(ids)].slice(0, MAX_INGEST_CHUNKS);
  if (!db) return { processed: false, count: 0, reason: "DATABASE_URL is not configured" };
  if (!uniqueIds.length) return { processed: false, count: 0, reason: "No chunk IDs supplied" };
  await db.update(knowledgeChunks)
    .set({ status: "verified" })
    .where(and(
      eq(knowledgeChunks.workspaceId, workspaceId),
      inArray(knowledgeChunks.id, uniqueIds),
      eq(knowledgeChunks.status, "unverified"),
    ));
  return { processed: true, count: uniqueIds.length, scope: "authenticated-user-workspace" };
}
