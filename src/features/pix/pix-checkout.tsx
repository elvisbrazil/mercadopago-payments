"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";
import { Countdown } from "./countdown";
import { PixQrCode } from "./pix-qr-code";

type Charge = {
  orderId: string;
  paymentId: number;
  amountCents: number;
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
};

export function PixCheckout({ product }: { product: Product }) {
  const [email, setEmail] = useState("");
  const [charge, setCharge] = useState<Charge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, email }),
    });
    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Não foi possível gerar o Pix");
      return;
    }
    setCharge(data);
  }

  if (charge) {
    return (
      <div className="space-y-4">
        <p className="text-center text-lg font-medium">{formatBRL(charge.amountCents)}</p>
        <PixQrCode qrCode={charge.qrCode} qrCodeBase64={charge.qrCodeBase64} />
        <div className="text-center">
          <Countdown expiresAt={charge.expiresAt} />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm text-zinc-600">
        E-mail
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {submitting ? "Gerando..." : `Gerar Pix de ${formatBRL(product.priceCents)}`}
      </button>
    </form>
  );
}
