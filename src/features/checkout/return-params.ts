export type CheckoutResult = "success" | "pending" | "failure";

export type ReturnParams = {
  paymentId: string | null;
  status: string | null;
  externalReference: string | null;
  merchantOrderId: string | null;
  paymentType: string | null;
};

type SearchParams = Record<string, string | string[] | undefined>;

function read(params: SearchParams, key: string): string | null {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || value === "null") {
    return null;
  }
  return value;
}

export function isCheckoutResult(value: string): value is CheckoutResult {
  return value === "success" || value === "pending" || value === "failure";
}

export function parseReturnParams(params: SearchParams): ReturnParams {
  return {
    paymentId: read(params, "payment_id") ?? read(params, "collection_id"),
    status: read(params, "status") ?? read(params, "collection_status"),
    externalReference: read(params, "external_reference"),
    merchantOrderId: read(params, "merchant_order_id"),
    paymentType: read(params, "payment_type"),
  };
}
