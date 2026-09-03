import { centsToAmount } from "@/lib/money";
import { mpRequest } from "./client";

export type PaymentStatus =
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

export type Payment = {
  id: number;
  status: PaymentStatus;
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  date_of_expiration: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
    };
  };
};

export type PixPaymentInput = {
  amountCents: number;
  description: string;
  payerEmail: string;
  externalReference: string;
  idempotencyKey: string;
  expiresAt: Date;
  notificationUrl?: string;
};

export type PixCharge = {
  paymentId: number;
  status: PaymentStatus;
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
};

const SAO_PAULO_OFFSET_MS = 3 * 60 * 60 * 1000;

export function toMercadoPagoDate(date: Date): string {
  return new Date(date.getTime() - SAO_PAULO_OFFSET_MS).toISOString().replace("Z", "-03:00");
}

export async function createPixPayment(input: PixPaymentInput): Promise<PixCharge> {
  const payment = await mpRequest<Payment>("/v1/payments", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: {
      transaction_amount: centsToAmount(input.amountCents),
      description: input.description,
      payment_method_id: "pix",
      payer: { email: input.payerEmail },
      external_reference: input.externalReference,
      date_of_expiration: toMercadoPagoDate(input.expiresAt),
      notification_url: input.notificationUrl,
    },
  });

  const transaction = payment.point_of_interaction?.transaction_data;
  if (!transaction?.qr_code || !transaction.qr_code_base64) {
    throw new Error(`Pix payment ${payment.id} came back without a QR code`);
  }

  return {
    paymentId: payment.id,
    status: payment.status,
    qrCode: transaction.qr_code,
    qrCodeBase64: transaction.qr_code_base64,
    expiresAt: payment.date_of_expiration ?? input.expiresAt.toISOString(),
  };
}

export function getPayment(id: string | number): Promise<Payment> {
  return mpRequest<Payment>(`/v1/payments/${encodeURIComponent(String(id))}`);
}
