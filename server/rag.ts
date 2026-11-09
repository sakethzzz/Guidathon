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
        outputDimensionality: 768,
      }),
    }
  );
  if (!response.ok) throw new Error(`Embedding request failed (${response.status})`);
  const data = await response.json() as { embedding?: { values?: number[] } };
  return Array.isArray(data.embedding?.values) ? data.embedding.values : null;
}

const stopWords = new Set(["the","and","for","with","that","this","from","what","when","where","which","who","how","why","are","was","were","will","would","could","should","about","into","your","you","our","their","them","have","has","had","can","not","but","does","did","than","then","also","just","make","made"]);

function termsOf(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(term => term.length > 2 && !stopWords.has(term));
}

export function lexicalScore(query: string, content: string) {
  const terms = [...new Set(termsOf(query))];
  const words = termsOf(content);
  if (!terms.length || !words.length) return 0;
  const frequencies = new Map<string, number>();
  words.forEach(word => frequencies.set(word, (frequencies.get(word) ?? 0) + 1));
  const lengthNorm = Math.sqrt(Math.max(1, words.length) / 180);
  let score = 0;
  for (const term of terms) {
    const tf = frequencies.get(term) ?? 0;
    if (!tf) continue;
    score += (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * lengthNorm));
  }
  const coverage = terms.filter(term => frequencies.has(term)).length / terms.length;
  const phraseBoost = content.toLowerCase().includes(query.toLowerCase()) ? 0.12 : 0;
  return Math.min(1, (score / terms.length) * 0.7 + coverage * 0.3 + phraseBoost);
}

export function cosine(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i += 1) { dot += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i]; }
  return aa && bb ? dot / (Math.sqrt(aa) * Math.sqrt(bb)) : 0;
}

export async function persistKnowledge(workspaceId: string, chunks: KnowledgeInput[]) {
  const db = await getDb();
  if (!db) return { persisted: false, count: 0, reason: "DATABASE_URL is not configured" };
  let count = 0;
  let vectorCount = 0;
  for (const chunk of chunks.slice(0, 50)) {
    const vector = await embed(`${chunk.heading}\n${chunk.content}`, "RETRIEVAL_DOCUMENT").catch(() => null);
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
  return { persisted: true, count, vectorized: vectorCount === count, vectorCount };
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
    if (row.embedding) { try { vector = JSON.parse(row.embedding) as number[]; } catch { vector = null; } }
    const score = queryVector && vector ? cosine(queryVector, vector) : lexicalScore(query, `${row.heading}\n${row.content}`);
    return { id: row.id, source: row.sourceName, heading: row.heading, passage: row.content, provenance: row.provenance, score };
  }).filter(row => row.score > (queryVector ? 0.18 : 0.05))
    .sort((a, b) => b.score - a.score).slice(0, limit);
  return ranked;
}


/**
 * Promote only chunks belonging to the authenticated user's workspace after
 * the client has completed its supported text parsing step. This means
 * "verified" = successfully ingested/parsed, not independently fact-checked.
 */
export async function markKnowledgeProcessed(workspaceId: string, ids: string[]) {
  const db = await getDb();
  const uniqueIds = [...new Set(ids)].slice(0, 50);
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
