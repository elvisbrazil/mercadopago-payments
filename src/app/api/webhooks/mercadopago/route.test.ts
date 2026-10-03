import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildManifest, sign } from "@/lib/mercadopago/signature";
import { clearOrders, createOrder, getOrder } from "@/lib/orders/store";
import { server } from "@/test/server";
import { POST } from "./route";

const secret = "webhook-secret";
const paymentUrl = "https://api.mercadopago.com/v1/payments/:id";

function notification(dataId: string, options: { secret?: string; type?: string } = {}) {
  const requestId = crypto.randomUUID();
  const ts = String(Math.floor(Date.now() / 1000));
  const v1 = sign(buildManifest(dataId, requestId, ts), options.secret ?? secret);
  const type = options.type ?? "payment";

  return new Request(
    `http://localhost:3000/api/webhooks/mercadopago?data.id=${dataId}&type=${type}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-signature": `ts=${ts},v1=${v1}`,
        "x-request-id": requestId,
      },
      body: JSON.stringify({
        action: "payment.updated",
        type,
        data: { id: dataId, status: "approved" },
      }),
    },
  );
}

function mockPayment(payment: {
  status: string;
  status_detail?: string;
  external_reference: string | null;
}) {
  const calls: string[] = [];
  server.use(
    http.get(paymentUrl, ({ params }) => {
      calls.push(String(params.id));
      return HttpResponse.json({
        id: Number(params.id),
        status_detail: "",
        transaction_amount: 48.9,
        date_of_expiration: null,
        ...payment,
      });
    }),
  );
  return calls;
}

function newOrder() {
  return createOrder({
    productId: "cafe-especial",
    description: "Café especial 250g",
    amountCents: 4890,
    method: "pix",
  });
}

describe("POST /api/webhooks/mercadopago", () => {
  beforeEach(() => {
    clearOrders();
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
    vi.stubEnv("MP_WEBHOOK_SECRET", secret);
  });

  it("rejects notifications with an invalid signature without calling the API", async () => {
    const calls = mockPayment({ status: "approved", external_reference: "x" });

    const response = await POST(notification("1325012345", { secret: "wrong" }));

    expect(response.status).toBe(401);
    expect(calls).toEqual([]);
  });

  it("rejects notifications without signature headers", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/webhooks/mercadopago?data.id=1&type=payment", {
        method: "POST",
        body: JSON.stringify({ type: "payment", data: { id: "1" } }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("fetches the payment and marks the order as paid", async () => {
    const order = newOrder();
    const calls = mockPayment({ status: "approved", external_reference: order.id });

    const response = await POST(notification("1325012345"));

    expect(response.status).toBe(200);
    expect(calls).toEqual(["1325012345"]);
    expect(getOrder(order.id)).toMatchObject({ status: "paid", paymentId: 1325012345 });
  });

  it("uses the status from the API instead of the notification body", async () => {
    const order = newOrder();
    mockPayment({ status: "pending", external_reference: order.id });

    await POST(notification("1325012345"));

    expect(getOrder(order.id)?.status).toBe("pending");
  });

  it("handles the same notification twice without changing the order again", async () => {
    const order = newOrder();
    mockPayment({ status: "approved", external_reference: order.id });

    const first = await POST(notification("1325012345"));
    const second = await POST(notification("1325012345"));

    expect(await first.json()).toMatchObject({ changed: true, status: "paid" });
    expect(await second.json()).toMatchObject({ changed: false, status: "paid" });
  });

  it("marks expired pix payments", async () => {
    const order = newOrder();
    mockPayment({ status: "cancelled", status_detail: "expired", external_reference: order.id });

    await POST(notification("1325012345"));

    expect(getOrder(order.id)?.status).toBe("expired");
  });

  it("acknowledges payments for unknown orders", async () => {
    mockPayment({ status: "approved", external_reference: "unknown-order" });

    const response = await POST(notification("1325012345"));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ orderId: null });
  });

  it("ignores topics other than payment", async () => {
    const calls = mockPayment({ status: "approved", external_reference: "x" });

    const response = await POST(notification("998877", { type: "merchant_order" }));

    expect(response.status).toBe(200);
    expect(calls).toEqual([]);
  });

  it("returns 502 so Mercado Pago retries when the payment lookup fails", async () => {
    server.use(http.get(paymentUrl, () => HttpResponse.json({}, { status: 500 })));

    const response = await POST(notification("1325012345"));

    expect(response.status).toBe(502);
  });
});
