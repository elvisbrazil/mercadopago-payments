import { NextResponse } from "next/server";
import { MercadoPagoError } from "@/lib/mercadopago/client";
import { getPayment } from "@/lib/mercadopago/payments";
import { applyPayment, getOrder } from "@/lib/orders/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  if (order.status !== "pending" || !order.paymentId) {
    return NextResponse.json({ id: order.id, status: order.status });
  }

  try {
    const payment = await getPayment(order.paymentId);
    const { order: synced } = applyPayment(order.id, payment);
    return NextResponse.json({ id: order.id, status: synced?.status ?? order.status });
  } catch (error) {
    if (error instanceof MercadoPagoError) {
      return NextResponse.json({ id: order.id, status: order.status });
    }
    throw error;
  }
}
