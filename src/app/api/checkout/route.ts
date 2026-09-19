import { NextResponse } from "next/server";
import { findProduct } from "@/lib/catalog";
import { appUrl, webhookUrl } from "@/lib/env";
import { MercadoPagoError } from "@/lib/mercadopago/client";
import { createPreference } from "@/lib/mercadopago/preferences";
import { createOrder } from "@/lib/orders/store";

export async function POST(request: Request) {
  const form = await request.formData();
  const productId = form.get("productId");
  const product = typeof productId === "string" ? findProduct(productId) : undefined;
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const order = createOrder({
    productId: product.id,
    description: product.title,
    amountCents: product.priceCents,
    method: "checkout_pro",
  });

  try {
    const preference = await createPreference({
      items: [
        { id: product.id, title: product.title, quantity: 1, unitPriceCents: product.priceCents },
      ],
      externalReference: order.id,
      baseUrl: appUrl(),
      notificationUrl: webhookUrl(),
    });
    return NextResponse.redirect(preference.initPoint, 303);
  } catch (error) {
    if (error instanceof MercadoPagoError) {
      return NextResponse.redirect(new URL("/checkout/failure", request.url), 303);
    }
    throw error;
  }
}
