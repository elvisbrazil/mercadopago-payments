import Link from "next/link";
import { products } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Loja</h1>
      <ul className="mt-8 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {products.map((product) => (
          <li key={product.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{product.title}</p>
              <p className="text-sm text-zinc-500">{product.description}</p>
              <p className="mt-1 text-sm font-medium">{formatBRL(product.priceCents)}</p>
            </div>
            <Link
              href={`/pix?product=${product.id}`}
              className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-emerald-700"
            >
              Pix
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
