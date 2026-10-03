import { describe, expect, it } from "vitest";
import { buildManifest, parseSignatureHeader, sign, verifySignature } from "./signature";

const secret = "webhook-secret";
const requestId = "bb56a2f1-6aae-46ac-982e-9dcd3581d08e";
const dataId = "1325012345";
const ts = "1758400000";
const now = 1758400000 * 1000 + 30_000;

function header(overrides: { ts?: string; v1?: string } = {}) {
  const timestamp = overrides.ts ?? ts;
  const v1 = overrides.v1 ?? sign(buildManifest(dataId, requestId, timestamp), secret);
  return `ts=${timestamp},v1=${v1}`;
}

describe("buildManifest", () => {
  it("follows the id;request-id;ts template", () => {
    expect(buildManifest("123", "abc", "1700000000")).toBe("id:123;request-id:abc;ts:1700000000;");
  });

  it("lowercases alphanumeric ids", () => {
    expect(buildManifest("ABC123", "req", "1")).toBe("id:abc123;request-id:req;ts:1;");
  });
});

describe("parseSignatureHeader", () => {
  it("reads ts and v1 regardless of order and spacing", () => {
    expect(parseSignatureHeader("v1=deadbeef, ts=1700000000")).toEqual({
      ts: "1700000000",
      v1: "deadbeef",
    });
  });
});

describe("verifySignature", () => {
  it("accepts a signature produced with the secret", () => {
    expect(verifySignature({ now, signature: header(), requestId, dataId, secret })).toBe(true);
  });

  it("rejects a signature made with another secret", () => {
    const v1 = sign(buildManifest(dataId, requestId, ts), "other-secret");

    expect(verifySignature({ now, signature: header({ v1 }), requestId, dataId, secret })).toBe(
      false,
    );
  });

  it("rejects when the data id was tampered with", () => {
    expect(verifySignature({ now, signature: header(), requestId, dataId: "999", secret })).toBe(
      false,
    );
  });

  it("rejects when the request id does not match", () => {
    expect(
      verifySignature({ now, signature: header(), requestId: "another-request", dataId, secret }),
    ).toBe(false);
  });

  it("rejects when ts was changed after signing", () => {
    const v1 = sign(buildManifest(dataId, requestId, ts), secret);

    expect(
      verifySignature({ now, signature: `ts=1758400001,v1=${v1}`, requestId, dataId, secret }),
    ).toBe(false);
  });

  it("rejects a header without v1 or ts", () => {
    expect(verifySignature({ now, signature: `ts=${ts}`, requestId, dataId, secret })).toBe(false);
    expect(
      verifySignature({
        now,
        signature: `v1=${header().split("v1=")[1]}`,
        requestId,
        dataId,
        secret,
      }),
    ).toBe(false);
  });

  it("rejects when the header, request id or data id is missing", () => {
    expect(verifySignature({ now, signature: null, requestId, dataId, secret })).toBe(false);
    expect(verifySignature({ now, signature: header(), requestId: null, dataId, secret })).toBe(
      false,
    );
    expect(verifySignature({ now, signature: header(), requestId, dataId: null, secret })).toBe(
      false,
    );
  });

  it("rejects notifications older than the tolerance", () => {
    expect(
      verifySignature({ signature: header(), requestId, dataId, secret, now: now + 300_000 }),
    ).toBe(false);
  });

  it("rejects timestamps too far in the future", () => {
    const future = "1758401000";

    expect(
      verifySignature({ now, signature: header({ ts: future }), requestId, dataId, secret }),
    ).toBe(false);
  });

  it("accepts ts sent in milliseconds", () => {
    const millis = "1758400010000";

    expect(
      verifySignature({ now, signature: header({ ts: millis }), requestId, dataId, secret }),
    ).toBe(true);
  });

  it("rejects a v1 that is not valid hex", () => {
    expect(
      verifySignature({ now, signature: header({ v1: "not-a-hash" }), requestId, dataId, secret }),
    ).toBe(false);
  });
});
