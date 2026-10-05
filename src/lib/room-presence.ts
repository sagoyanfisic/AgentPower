import type { getRedisClient } from "@/lib/redis";

export const ROOM_PRESENCE_PREFIX = "presence-room:";
export const ROOM_PRESENCE_TTL_SECONDS = 45;
type RedisClient = Awaited<ReturnType<typeof getRedisClient>>;
export type RoomPresence = { id: string; name: string; avatar: string; visible: boolean; focused: boolean; score: number; answered: number; total: number; finished: boolean; lastSeen: string };

export async function readRoomPresence(redis: RedisClient, roomId: string) {
  const items: RoomPresence[] = [];
  for await (const keys of redis.scanIterator({ MATCH: `${ROOM_PRESENCE_PREFIX}${roomId}:*`, COUNT: 100 })) {
    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      try {
        const value = JSON.parse(raw) as Omit<RoomPresence, "id">;
        items.push({ id: key.split(":").at(-1) ?? "", ...value });
      } catch { await redis.del(key); }
    }
  }
  return items.sort((a, b) => b.score - a.score || b.answered - a.answered || b.lastSeen.localeCompare(a.lastSeen)).map((item, index) => ({ ...item, rank: index + 1 }));
}
