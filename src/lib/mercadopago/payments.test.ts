import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import { createPixPayment, getPayment, toMercadoPagoDate } from "./payments";
import { MercadoPagoError } from "./client";

const pixResponse = {
  id: 1325012345,
  status: "pending",
  status_detail: "pending_waiting_transfer",
  external_reference: "order-1",
  transaction_amount: 48.9,
  date_of_expiration: "2026-09-03T21:07:00.000-03:00",
  point_of_interaction: {
    transaction_data: {
      qr_code: "00020126580014br.gov.bcb.pix",
      qr_code_base64: "iVBORw0KGgo=",
    },
  },
};

const input = {
  amountCents: 4890,
  description: "Café especial 250g",
  payerEmail: "comprador@example.com",
  externalReference: "order-1",
  idempotencyKey: "4b0e7c1e-5d8a-4f57-9a43-9f1f3c2a7b10",
  expiresAt: new Date("2026-09-04T00:07:00.000Z"),
};

describe("createPixPayment", () => {
  beforeEach(() => {
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
  });

  it("sends the idempotency key and access token", async () => {
    let headers: Headers | undefined;
    server.use(
      http.post("https://api.mercadopago.com/v1/payments", ({ request }) => {
        headers = request.headers;
        return HttpResponse.json(pixResponse, { status: 201 });
      }),
    );

    await createPixPayment(input);

    expect(headers?.get("x-idempotency-key")).toBe(input.idempotencyKey);
    expect(headers?.get("authorization")).toBe("Bearer TEST-token");
  });

  it("sends a pix payment body with the amount in reais", async () => {
    let body: unknown;
    server.use(
      http.post("https://api.mercadopago.com/v1/payments", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(pixResponse, { status: 201 });
      }),
    );

    await createPixPayment(input);

    expect(body).toEqual({
      transaction_amount: 48.9,
      description: "Café especial 250g",
      payment_method_id: "pix",
      payer: { email: "comprador@example.com" },
      external_reference: "order-1",
      date_of_expiration: "2026-09-03T21:07:00.000-03:00",
    });
  });

  it("returns the qr code data", async () => {
    server.use(
      http.post("https://api.mercadopago.com/v1/payments", () =>
        HttpResponse.json(pixResponse, { status: 201 }),
      ),
    );

    await expect(createPixPayment(input)).resolves.toEqual({
      paymentId: 1325012345,
      status: "pending",
      qrCode: "00020126580014br.gov.bcb.pix",
      qrCodeBase64: "iVBORw0KGgo=",
      expiresAt: "2026-09-03T21:07:00.000-03:00",
    });
  });

  it("throws a MercadoPagoError when the API rejects the request", async () => {
    server.use(
      http.post("https://api.mercadopago.com/v1/payments", () =>
        HttpResponse.json({ message: "invalid payer email" }, { status: 400 }),
      ),
    );

    await expect(createPixPayment(input)).rejects.toBeInstanceOf(MercadoPagoError);
  });
});

describe("getPayment", () => {
  it("fetches the payment by id", async () => {
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
    server.use(
      http.get("https://api.mercadopago.com/v1/payments/:id", ({ params }) =>
        HttpResponse.json({ ...pixResponse, id: Number(params.id), status: "approved" }),
      ),
    );

    const payment = await getPayment("42");

    expect(payment).toMatchObject({ id: 42, status: "approved" });
  });
});

describe("toMercadoPagoDate", () => {
  it("formats the date in Brasilia time", () => {
    expect(toMercadoPagoDate(new Date("2026-09-04T00:07:00.000Z"))).toBe(
      "2026-09-03T21:07:00.000-03:00",
    );
  });
});
