"use client";

import { useEffect, useState } from "react";

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function Countdown({ expiresAt }: { expiresAt: string }) {
  const deadline = new Date(expiresAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = deadline - now;
  if (remaining <= 0) {
    return <p className="text-sm text-red-600">Código expirado</p>;
  }

  return (
    <p className="text-sm text-zinc-600">
      Expira em <span className="font-mono tabular-nums">{formatRemaining(remaining)}</span>
    </p>
  );
}
