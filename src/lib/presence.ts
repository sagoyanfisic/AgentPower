import type { getRedisClient } from "@/lib/redis";

export const PRESENCE_PREFIX = "presence-session:";
export const PRESENCE_STREAM = "presence-events";
export const PRESENCE_TTL_SECONDS = 45;

export type PresenceConnection = Record<string, unknown> & { id: string; lastSeen: string; score?: number; answered?: number };
export type PresenceEvent = { type: "upsert" | "delete"; id: string; connection?: Record<string, unknown> };
type RedisClient = Awaited<ReturnType<typeof getRedisClient>>;

export function sortConnections(connections: PresenceConnection[]) {
  connections.sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0) || Number(b.answered ?? 0) - Number(a.answered ?? 0) || String(b.lastSeen).localeCompare(String(a.lastSeen)));
  return connections.map((connection, index) => ({ rank: index + 1, ...connection }));
}

export async function readPresenceConnections(redis: RedisClient) {
  const connections: PresenceConnection[] = [];
  for await (const keys of redis.scanIterator({ MATCH: `${PRESENCE_PREFIX}*`, COUNT: 100 })) {
    for (const key of keys) {
      const value = await redis.get(key);
      if (!value) continue;
      try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        connections.push({ id: key.slice(PRESENCE_PREFIX.length, PRESENCE_PREFIX.length + 8), ...parsed, lastSeen: String(parsed.lastSeen ?? "") });
      } catch {
        await redis.del(key);
      }
    }
  }
  return sortConnections(connections);
}

export async function publishPresenceEvent(redis: RedisClient, event: PresenceEvent) {
  await redis.xAdd(PRESENCE_STREAM, "*", { payload: JSON.stringify(event) }, { TRIM: { strategy: "MAXLEN", strategyModifier: "~", threshold: 1000 } });
}
