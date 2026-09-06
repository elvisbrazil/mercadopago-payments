import { randomUUID } from "node:crypto";
import type { Payment } from "@/lib/mercadopago/payments";

export type OrderStatus = "pending" | "paid" | "rejected" | "cancelled" | "expired" | "refunded";

export type PaymentMethod = "pix" | "checkout_pro";

export type Order = {
  id: string;
  productId: string;
  description: string;
  amountCents: number;
  method: PaymentMethod;
  status: OrderStatus;
  idempotencyKey: string;
  paymentId?: number;
  createdAt: string;
  updatedAt: string;
};

type NewOrder = Pick<Order, "productId" | "description" | "amountCents" | "method">;

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "rejected", "cancelled", "expired", "refunded"],
  paid: ["refunded"],
  rejected: [],
  cancelled: [],
  expired: [],
  refunded: [],
};

const globalForOrders = globalThis as unknown as { orders?: Map<string, Order> };
const orders = (globalForOrders.orders ??= new Map<string, Order>());

export function createOrder(input: NewOrder): Order {
  const now = new Date().toISOString();
  const order: Order = {
    ...input,
    id: randomUUID(),
    status: "pending",
    idempotencyKey: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  orders.set(order.id, order);
  return order;
}

export function getOrder(id: string): Order | undefined {
  return orders.get(id);
}

export function toOrderStatus(payment: Pick<Payment, "status" | "status_detail">): OrderStatus {
  switch (payment.status) {
    case "approved":
      return "paid";
    case "rejected":
      return "rejected";
    case "cancelled":
      return payment.status_detail === "expired" ? "expired" : "cancelled";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending";
  }
}

export function applyPayment(
  orderId: string,
  payment: Pick<Payment, "id" | "status" | "status_detail">,
): { order: Order | undefined; changed: boolean } {
  const order = orders.get(orderId);
  if (!order) {
    return { order: undefined, changed: false };
  }

  const status = toOrderStatus(payment);
  const sameState = status === order.status && payment.id === order.paymentId;
  const canMove = status === order.status || allowedTransitions[order.status].includes(status);
  if (sameState || !canMove) {
    return { order, changed: false };
  }

  const updated: Order = {
    ...order,
    status,
    paymentId: payment.id,
    updatedAt: new Date().toISOString(),
  };
  orders.set(orderId, updated);
  return { order: updated, changed: true };
}

export function clearOrders() {
  orders.clear();
}
