import { NextResponse } from "next/server";
import { requiredEnv } from "@/lib/env";
import { MercadoPagoError } from "@/lib/mercadopago/client";
import { getPayment } from "@/lib/mercadopago/payments";
import { verifySignature } from "@/lib/mercadopago/signature";
import { applyPayment } from "@/lib/orders/store";

type Notification = {
  type?: string;
  data?: { id?: string | number };
};

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json().catch(() => null)) as Notification | null;
  const bodyId = body?.data?.id;
  const dataId = url.searchParams.get("data.id") ?? (bodyId == null ? null : String(bodyId));
  const type = url.searchParams.get("type") ?? body?.type;

  const valid = verifySignature({
    signature: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
    secret: requiredEnv("MP_WEBHOOK_SECRET"),
  });
  if (!valid || !dataId) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (type !== "payment") {
    return NextResponse.json({ ignored: true });
  }

  try {
    const payment = await getPayment(dataId);
    if (!payment.external_reference) {
      return NextResponse.json({ ignored: true });
    }

    const { order, changed } = applyPayment(payment.external_reference, payment);
    return NextResponse.json({
      orderId: order?.id ?? null,
      status: order?.status ?? null,
      changed,
    });
  } catch (error) {
    if (error instanceof MercadoPagoError) {
      return NextResponse.json({ error: "Could not fetch payment" }, { status: 502 });
    }
    throw error;
  }
}
