import type { Payment } from "@/lib/mercadopago/payments";

export type OrderStatus = "pending" | "paid" | "rejected" | "cancelled" | "expired" | "refunded";

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
