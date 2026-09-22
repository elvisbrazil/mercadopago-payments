import Link from "next/link";
import { notFound } from "next/navigation";
import { isCheckoutResult, parseReturnParams } from "@/features/checkout/return-params";
import { getOrder } from "@/lib/orders/store";
import { formatBRL } from "@/lib/money";

const titles = {
  success: "Pagamento aprovado",
  pending: "Pagamento em processamento",
  failure: "Pagamento não concluído",
};

const descriptions = {
  success: "Recebemos a confirmação do Mercado Pago.",
  pending: "Assim que o Mercado Pago confirmar, o pedido será atualizado.",
  failure: "Nenhuma cobrança foi feita. Você pode tentar novamente.",
};

type Props = {
  params: Promise<{ result: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutReturnPage({ params, searchParams }: Props) {
  const { result } = await params;
  if (!isCheckoutResult(result)) {
    notFound();
  }

  const details = parseReturnParams(await searchParams);
  const order = details.externalReference ? getOrder(details.externalReference) : undefined;

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-xl font-semibold">{titles[result]}</h1>
      <p className="mt-2 text-sm text-zinc-600">{descriptions[result]}</p>

      <dl className="mt-6 grid grid-cols-2 gap-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        {order && (
          <>
            <dt className="text-zinc-500">Produto</dt>
            <dd>{order.description}</dd>
            <dt className="text-zinc-500">Valor</dt>
            <dd>{formatBRL(order.amountCents)}</dd>
          </>
        )}
        <dt className="text-zinc-500">Pedido</dt>
        <dd className="truncate font-mono">{details.externalReference ?? "-"}</dd>
        <dt className="text-zinc-500">Pagamento</dt>
        <dd className="font-mono">{details.paymentId ?? "-"}</dd>
        <dt className="text-zinc-500">Status informado</dt>
        <dd>{details.status ?? "-"}</dd>
      </dl>

      <Link href="/" className="mt-6 inline-block text-sm text-zinc-500 hover:text-zinc-800">
        Voltar para a loja
      </Link>
    </main>
  );
}
