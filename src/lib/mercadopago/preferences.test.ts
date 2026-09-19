import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import { createPreference } from "./preferences";

const preferenceUrl = "https://api.mercadopago.com/checkout/preferences";

describe("createPreference", () => {
  beforeEach(() => {
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
  });

  it("sends items, back urls, external reference and notification url", async () => {
    let body: unknown;
    server.use(
      http.post(preferenceUrl, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          {
            id: "pref-1",
            init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1",
          },
          { status: 201 },
        );
      }),
    );

    await createPreference({
      items: [{ id: "kit-coado", title: "Kit coado", quantity: 2, unitPriceCents: 18950 }],
      externalReference: "order-7",
      baseUrl: "https://loja.example.com",
      notificationUrl: "https://loja.example.com/api/webhooks/mercadopago",
    });

    expect(body).toEqual({
      items: [
        { id: "kit-coado", title: "Kit coado", quantity: 2, unit_price: 189.5, currency_id: "BRL" },
      ],
      back_urls: {
        success: "https://loja.example.com/checkout/success",
        pending: "https://loja.example.com/checkout/pending",
        failure: "https://loja.example.com/checkout/failure",
      },
      auto_return: "approved",
      external_reference: "order-7",
      notification_url: "https://loja.example.com/api/webhooks/mercadopago",
    });
  });

  it("returns the preference id and init point", async () => {
    server.use(
      http.post(preferenceUrl, () =>
        HttpResponse.json(
          {
            id: "pref-1",
            init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1",
          },
          { status: 201 },
        ),
      ),
    );

    const preference = await createPreference({
      items: [{ id: "kit-coado", title: "Kit coado", quantity: 1, unitPriceCents: 18950 }],
      externalReference: "order-7",
      baseUrl: "http://localhost:3000",
    });

    expect(preference).toEqual({
      id: "pref-1",
      initPoint: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1",
    });
  });
});
