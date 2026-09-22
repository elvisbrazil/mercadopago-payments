import { describe, expect, it } from "vitest";
import { isCheckoutResult, parseReturnParams } from "./return-params";

describe("parseReturnParams", () => {
  it("reads the query params sent on the back url", () => {
    expect(
      parseReturnParams({
        collection_id: "1325012345",
        collection_status: "approved",
        payment_id: "1325012345",
        status: "approved",
        external_reference: "order-7",
        payment_type: "credit_card",
        merchant_order_id: "998877",
        preference_id: "pref-1",
      }),
    ).toEqual({
      paymentId: "1325012345",
      status: "approved",
      externalReference: "order-7",
      merchantOrderId: "998877",
      paymentType: "credit_card",
    });
  });

  it("treats the literal string null as missing", () => {
    const params = parseReturnParams({
      payment_id: "null",
      status: "null",
      external_reference: "order-7",
    });

    expect(params.paymentId).toBeNull();
    expect(params.status).toBeNull();
  });

  it("falls back to collection params", () => {
    const params = parseReturnParams({ collection_id: "55", collection_status: "pending" });

    expect(params).toMatchObject({ paymentId: "55", status: "pending" });
  });
});

describe("isCheckoutResult", () => {
  it("accepts only the three back url results", () => {
    expect(["success", "pending", "failure", "other"].filter(isCheckoutResult)).toEqual([
      "success",
      "pending",
      "failure",
    ]);
  });
});
