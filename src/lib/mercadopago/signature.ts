import { createHmac, timingSafeEqual } from "node:crypto";

export type SignatureInput = {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string;
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
  return `id:${dataId};request-id:${requestId};ts:${ts};`;
}

export function sign(manifest: string, secret: string): string {
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

export function verifySignature({ signature, requestId, dataId, secret }: SignatureInput): boolean {
  if (!signature || !requestId || !dataId) {
    return false;
  }

  const { ts, v1 } = parseSignatureHeader(signature);
  if (!ts || !v1) {
    return false;
  }

  const expected = Buffer.from(sign(buildManifest(dataId, requestId, ts), secret), "hex");
  const received = Buffer.from(v1, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
