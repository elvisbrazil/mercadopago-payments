"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  qrCode: string;
  qrCodeBase64: string;
};

export function PixQrCode({ qrCode, qrCodeBase64 }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(qrCode);
    setCopied(true);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Image
        src={`data:image/png;base64,${qrCodeBase64}`}
        alt="QR Code Pix"
        width={224}
        height={224}
        unoptimized
        className="rounded border border-zinc-200"
      />
      <label className="w-full text-sm text-zinc-600">
        Pix copia e cola
        <textarea
          readOnly
          value={qrCode}
          rows={3}
          className="mt-1 w-full resize-none rounded border border-zinc-300 bg-zinc-50 p-2 font-mono text-xs break-all text-zinc-800"
        />
      </label>
      <button
        type="button"
        onClick={copy}
        className="w-full rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        {copied ? "Código copiado" : "Copiar código"}
      </button>
    </div>
  );
}
