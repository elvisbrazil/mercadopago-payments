import { requiredEnv } from "@/lib/env";

export const MP_API_URL = "https://api.mercadopago.com";

export class MercadoPagoError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Mercado Pago request failed with status ${status}`);
    this.name = "MercadoPagoError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  idempotencyKey?: string;
};

export async function mpRequest<T>(
  path: string,
  { method = "GET", body, idempotencyKey }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${requiredEnv("MP_ACCESS_TOKEN")}`,
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (idempotencyKey) {
    headers["X-Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(`${MP_API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new MercadoPagoError(response.status, data);
  }
  return data as T;
}
