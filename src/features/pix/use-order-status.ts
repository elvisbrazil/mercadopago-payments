"use client";

import { useEffect, useState } from "react";
import type { OrderStatus } from "@/lib/orders/store";

async function fetchStatus(orderId: string): Promise<OrderStatus | null> {
  const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" }).catch(() => null);
  if (!response?.ok) {
    return null;
  }
  const data = (await response.json()) as { status: OrderStatus };
  return data.status;
}

export function useOrderStatus(orderId: string, expiresAt: string, intervalMs = 3000) {
  const [status, setStatus] = useState<OrderStatus>("pending");

  useEffect(() => {
    const deadline = new Date(expiresAt).getTime();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const current = await fetchStatus(orderId);
      if (cancelled) {
        return;
      }
      if (current && current !== "pending") {
        setStatus(current);
        return;
      }
      if (Date.now() >= deadline) {
        setStatus("expired");
        return;
      }
      timer = setTimeout(poll, intervalMs);
    }

    timer = setTimeout(poll, intervalMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, expiresAt, intervalMs]);

  return status;
}
