const DEFAULT_MAX_BODY_BYTES = 5 * 1024 * 1024;

export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "too-large" | "invalid" };

export async function readJsonBody(request: Request, maxBytes = DEFAULT_MAX_BODY_BYTES): Promise<JsonBodyResult> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return { ok: false, reason: "too-large" };

  if (!request.body) return { ok: false, reason: "invalid" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, reason: "too-large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "invalid" };
  }

  try {
    const body = new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
    return { ok: true, value: JSON.parse(body) as unknown };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export function bodyError(result: JsonBodyResult, invalidMessage = "Datos inválidos") {
  return !result.ok && result.reason === "too-large"
    ? { error: "El cuerpo supera el límite de 5 MB" }
    : { error: invalidMessage };
}
