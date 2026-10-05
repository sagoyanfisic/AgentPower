import { randomBytes, randomInt } from "node:crypto";
import { getRedisClient } from "@/lib/redis";
import { isValidQuestionBank, type Question } from "@/lib/questions";

export const ROOM_PREFIX = "exam-gcp:room:";
export const BANK_META_PREFIX = "exam-gcp:bank:meta:";
export const BANK_DATA_PREFIX = "exam-gcp:bank:data:";
export const ROOM_SESSION_PREFIX = "exam-gcp:room-session:";
export const ROOM_TTL_SECONDS = 60 * 60 * 24 * 90;
export const MIN_DURATION_MINUTES = 1;
export const MAX_DURATION_MINUTES = 24 * 60;

export type Room = {
  roomId: string;
  name: string;
  certification: string;
  bankId: string;
  bankVersion: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  timezone: "America/Lima";
  createdAt: string;
};

export type BankMeta = { bankId: string; name: string; certification: string; version: string; questionCount: number; createdAt: string };

export function createOpaqueId(bytes = 9) {
  return randomBytes(bytes).toString("base64url");
}

export function createRoomId() {
  return `ROOM-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export function isRoomId(value: string) {
  return /^ROOM-[A-F0-9]{12}$/.test(value);
}

export function roomStatus(room: Room, now = Date.now()) {
  const start = Date.parse(room.startsAt);
  const end = Date.parse(room.endsAt);
  if (now < start) return "scheduled" as const;
  if (now >= end) return "closed" as const;
  return "active" as const;
}

export function shuffleQuestionIds(questions: Question[]) {
  const ids = questions.map(({ id }) => id);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [ids[index], ids[swap]] = [ids[swap], ids[index]];
  }
  return ids;
}

export function isValidImportedBank(value: unknown): value is Question[] {
  if (!isValidQuestionBank(value)) return false;
  const ids = value.map(({ id }) => id);
  return new Set(ids).size === ids.length && value.length <= 1000;
}

export async function getRoom(redis: Awaited<ReturnType<typeof getRedisClient>>, roomId: string) {
  if (!isRoomId(roomId)) return null;
  const raw = await redis.get(`${ROOM_PREFIX}${roomId}`);
  if (!raw) return null;
  try {
    const room = JSON.parse(raw) as Room;
    return room.roomId === roomId ? room : null;
  } catch {
    return null;
  }
}

export async function getBankMeta(redis: Awaited<ReturnType<typeof getRedisClient>>, bankId: string) {
  const raw = await redis.get(`${BANK_META_PREFIX}${bankId}`);
  if (!raw) return null;
  try { return JSON.parse(raw) as BankMeta; } catch { return null; }
}

export async function getBank(redis: Awaited<ReturnType<typeof getRedisClient>>, bankId: string) {
  const raw = await redis.get(`${BANK_DATA_PREFIX}${bankId}`);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidImportedBank(parsed) ? parsed : null;
  } catch { return null; }
}

export function roomPublicData(room: Room, now = Date.now()) {
  return { roomId: room.roomId, name: room.name, certification: room.certification, startsAt: room.startsAt, endsAt: room.endsAt, durationMinutes: room.durationMinutes, timezone: room.timezone, status: roomStatus(room, now) };
}
