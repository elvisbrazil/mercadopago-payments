import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import { POST } from "./route";

function submit(productId: string) {
  const form = new FormData();
  form.set("productId", productId);
  return POST(new Request("http://localhost:3000/api/checkout", { method: "POST", body: form }));
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
  });

  it("redirects to the preference init point", async () => {
    server.use(
      http.post("https://api.mercadopago.com/checkout/preferences", () =>
        HttpResponse.json({
          id: "pref-1",
          init_point: "https://mp.example/checkout?pref_id=pref-1",
        }),
      ),
    );

    const response = await submit("cafe-especial");

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://mp.example/checkout?pref_id=pref-1");
  });

  it("returns 404 for an unknown product", async () => {
    const response = await submit("nope");

    expect(response.status).toBe(404);
  });

  it("sends the buyer to the failure page when the preference cannot be created", async () => {
    server.use(
      http.post("https://api.mercadopago.com/checkout/preferences", () =>
        HttpResponse.json({ message: "unauthorized" }, { status: 401 }),
      ),
    );

    const response = await submit("cafe-especial");

    expect(response.headers.get("location")).toBe("http://localhost:3000/checkout/failure");
  });
});
