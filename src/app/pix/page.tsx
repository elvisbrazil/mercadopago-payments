import Link from "next/link";
import { notFound } from "next/navigation";
import { PixCheckout } from "@/features/pix/pix-checkout";
import { findProduct } from "@/lib/catalog";

type Props = {
  searchParams: Promise<{ product?: string }>;
};

export default async function PixPage({ searchParams }: Props) {
  const { product: productId } = await searchParams;
  const product = productId ? findProduct(productId) : undefined;
  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
        Voltar
      </Link>
      <h1 className="mt-4 text-xl font-semibold">Pagar com Pix</h1>
      <p className="mt-1 text-sm text-zinc-500">{product.title}</p>
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6">
        <PixCheckout product={product} />
      </div>
    </main>
  );
}
