import { createClient, type RedisClientType } from "redis";

let clientPromise: Promise<RedisClientType> | undefined;
let streamClientPromise: Promise<RedisClientType> | undefined;

export function getRedisClient() {
  if (!clientPromise) {
    const client = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:6379" });
    client.on("error", (error) => console.error("Redis error", error));
    clientPromise = client.connect().then(() => client);
  }
  return clientPromise;
}

export function getRedisStreamClient() {
  if (!streamClientPromise) {
    const client = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:6379" });
    client.on("error", (error) => console.error("Redis stream error", error));
    streamClientPromise = client.connect().then(() => client);
  }
  return streamClientPromise;
}
