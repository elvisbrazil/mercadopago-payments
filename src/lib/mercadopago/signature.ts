import { createHmac, timingSafeEqual } from "node:crypto";

export type SignatureInput = {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string;
  now?: number;
  toleranceSeconds?: number;
};

export function parseSignatureHeader(header: string): { ts?: string; v1?: string } {
  const parts = new Map<string, string>();
  for (const part of header.split(",")) {
    const [key, ...value] = part.split("=");
    if (key && value.length > 0) {
      parts.set(key.trim(), value.join("=").trim());
    }
  }
  return { ts: parts.get("ts"), v1: parts.get("v1") };
}

export function buildManifest(dataId: string, requestId: string, ts: string): string {
  return `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
}

export function sign(manifest: string, secret: string): string {
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

function toMillis(ts: string): number {
  const value = Number(ts);
  // Mercado Pago has sent ts both in seconds and in milliseconds.
  return value > 1e12 ? value : value * 1000;
}

export function verifySignature({
  signature,
  requestId,
  dataId,
  secret,
  now = Date.now(),
  toleranceSeconds = 300,
}: SignatureInput): boolean {
  if (!signature || !requestId || !dataId) {
    return false;
  }

  const { ts, v1 } = parseSignatureHeader(signature);
  if (!ts || !v1 || !/^\d+$/.test(ts)) {
    return false;
  }
  if (Math.abs(now - toMillis(ts)) > toleranceSeconds * 1000) {
    return false;
  }

  const expected = Buffer.from(sign(buildManifest(dataId, requestId, ts), secret), "hex");
  const received = Buffer.from(v1, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
