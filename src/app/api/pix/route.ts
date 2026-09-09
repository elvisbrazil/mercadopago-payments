import { NextResponse } from "next/server";
import { findProduct } from "@/lib/catalog";
import { webhookUrl } from "@/lib/env";
import { MercadoPagoError } from "@/lib/mercadopago/client";
import { createPixPayment } from "@/lib/mercadopago/payments";
import { applyPayment, createOrder } from "@/lib/orders/store";

const PIX_TTL_MS = 30 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    productId?: unknown;
    email?: unknown;
  } | null;
  const product = typeof body?.productId === "string" ? findProduct(body.productId) : undefined;
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 422 });
  }

  const order = createOrder({
    productId: product.id,
    description: product.title,
    amountCents: product.priceCents,
    method: "pix",
  });

  try {
    const charge = await createPixPayment({
      amountCents: order.amountCents,
      description: order.description,
      payerEmail: email,
      externalReference: order.id,
      idempotencyKey: order.idempotencyKey,
      expiresAt: new Date(Date.now() + PIX_TTL_MS),
      notificationUrl: webhookUrl(),
    });
    applyPayment(order.id, { id: charge.paymentId, status: charge.status, status_detail: "" });

    return NextResponse.json(
      {
        orderId: order.id,
        paymentId: charge.paymentId,
        amountCents: order.amountCents,
        qrCode: charge.qrCode,
        qrCodeBase64: charge.qrCodeBase64,
        expiresAt: charge.expiresAt,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof MercadoPagoError) {
      return NextResponse.json({ error: "Não foi possível gerar o Pix" }, { status: 502 });
    }
    throw error;
  }
}
