"use client";

import { formatBRL } from "@/lib/money";
import { Countdown } from "./countdown";
import { PixQrCode } from "./pix-qr-code";
import { useOrderStatus } from "./use-order-status";

export type Charge = {
  orderId: string;
  paymentId: number;
  amountCents: number;
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
};

type Props = {
  charge: Charge;
  onRetry: () => void;
};

export function PixCharge({ charge, onRetry }: Props) {
  const status = useOrderStatus(charge.orderId, charge.expiresAt);

  if (status === "paid") {
    return (
      <div className="space-y-2 text-center">
        <p className="text-lg font-medium text-emerald-700">Pagamento aprovado</p>
        <p className="text-sm text-zinc-500">Pedido {charge.orderId.slice(0, 8)}</p>
      </div>
    );
  }

  if (status !== "pending") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg font-medium text-red-600">
          {status === "expired" ? "O Pix expirou" : "Pagamento não concluído"}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="w-full rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
        >
          Gerar novo código
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-lg font-medium">{formatBRL(charge.amountCents)}</p>
      <PixQrCode qrCode={charge.qrCode} qrCodeBase64={charge.qrCodeBase64} />
      <div className="text-center">
        <Countdown expiresAt={charge.expiresAt} />
        <p className="mt-1 text-xs text-zinc-400">Aguardando pagamento...</p>
      </div>
    </div>
  );
}
