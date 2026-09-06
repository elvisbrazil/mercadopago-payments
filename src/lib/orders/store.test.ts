import { beforeEach, describe, expect, it } from "vitest";
import { applyPayment, clearOrders, createOrder, getOrder, toOrderStatus } from "./store";

function newOrder() {
  return createOrder({
    productId: "cafe-especial",
    description: "Café especial 250g",
    amountCents: 4890,
    method: "pix",
  });
}

describe("order store", () => {
  beforeEach(() => clearOrders());

  it("creates pending orders with their own idempotency key", () => {
    const first = newOrder();
    const second = newOrder();

    expect(first.status).toBe("pending");
    expect(first.idempotencyKey).not.toBe(second.idempotencyKey);
    expect(getOrder(first.id)).toEqual(first);
  });

  it("marks the order as paid when the payment is approved", () => {
    const order = newOrder();

    const result = applyPayment(order.id, {
      id: 10,
      status: "approved",
      status_detail: "accredited",
    });

    expect(result.changed).toBe(true);
    expect(getOrder(order.id)).toMatchObject({ status: "paid", paymentId: 10 });
  });

  it("ignores the same update delivered twice", () => {
    const order = newOrder();
    const payment = { id: 10, status: "approved", status_detail: "accredited" } as const;

    applyPayment(order.id, payment);
    const updatedAt = getOrder(order.id)?.updatedAt;
    const second = applyPayment(order.id, payment);

    expect(second.changed).toBe(false);
    expect(getOrder(order.id)?.updatedAt).toBe(updatedAt);
  });

  it("does not move a paid order back to pending", () => {
    const order = newOrder();

    applyPayment(order.id, { id: 10, status: "approved", status_detail: "accredited" });
    const result = applyPayment(order.id, { id: 10, status: "pending", status_detail: "" });

    expect(result.changed).toBe(false);
    expect(getOrder(order.id)?.status).toBe("paid");
  });

  it("returns no order for an unknown reference", () => {
    expect(applyPayment("missing", { id: 1, status: "approved", status_detail: "" })).toEqual({
      order: undefined,
      changed: false,
    });
  });
});

describe("toOrderStatus", () => {
  it.each([
    ["approved", "accredited", "paid"],
    ["pending", "pending_waiting_transfer", "pending"],
    ["in_process", "pending_review_manual", "pending"],
    ["rejected", "cc_rejected_other_reason", "rejected"],
    ["cancelled", "expired", "expired"],
    ["cancelled", "by_collector", "cancelled"],
    ["charged_back", "settled", "refunded"],
  ] as const)("maps %s/%s to %s", (status, statusDetail, expected) => {
    expect(toOrderStatus({ status, status_detail: statusDetail })).toBe(expected);
  });
});
