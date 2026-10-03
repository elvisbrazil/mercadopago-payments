import { describe, expect, it } from "vitest";
import { buildManifest, parseSignatureHeader, sign, verifySignature } from "./signature";

const secret = "webhook-secret";
const requestId = "bb56a2f1-6aae-46ac-982e-9dcd3581d08e";
const dataId = "1325012345";
const ts = "1758400000";

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
    expect(verifySignature({ signature: header(), requestId, dataId, secret })).toBe(true);
  });

  it("rejects a signature made with another secret", () => {
    const v1 = sign(buildManifest(dataId, requestId, ts), "other-secret");

    expect(verifySignature({ signature: header({ v1 }), requestId, dataId, secret })).toBe(false);
  });

  it("rejects when the data id was tampered with", () => {
    expect(verifySignature({ signature: header(), requestId, dataId: "999", secret })).toBe(false);
  });

  it("rejects when the request id does not match", () => {
    expect(
      verifySignature({ signature: header(), requestId: "another-request", dataId, secret }),
    ).toBe(false);
  });

  it("rejects when ts was changed after signing", () => {
    const v1 = sign(buildManifest(dataId, requestId, ts), secret);

    expect(
      verifySignature({ signature: `ts=1758400001,v1=${v1}`, requestId, dataId, secret }),
    ).toBe(false);
  });

  it("rejects a header without v1 or ts", () => {
    expect(verifySignature({ signature: `ts=${ts}`, requestId, dataId, secret })).toBe(false);
    expect(
      verifySignature({ signature: `v1=${header().split("v1=")[1]}`, requestId, dataId, secret }),
    ).toBe(false);
  });

  it("rejects when the header, request id or data id is missing", () => {
    expect(verifySignature({ signature: null, requestId, dataId, secret })).toBe(false);
    expect(verifySignature({ signature: header(), requestId: null, dataId, secret })).toBe(false);
    expect(verifySignature({ signature: header(), requestId, dataId: null, secret })).toBe(false);
  });

  it("rejects a v1 that is not valid hex", () => {
    expect(
      verifySignature({ signature: header({ v1: "not-a-hash" }), requestId, dataId, secret }),
    ).toBe(false);
  });
});
