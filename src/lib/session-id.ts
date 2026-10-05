import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

export function createSessionToken() {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isSessionToken(value: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
}
