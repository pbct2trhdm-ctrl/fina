import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PagamentoForm } from "@/components/pagamento-form";
import { criarPagamento } from "@/lib/actions/cartoes";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function NovoPagamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cartao = await prisma.cartao.findUnique({ where: { id } });
  if (!cartao) notFound();

  return (
    <div>
      <LinkVoltar href={`/cartoes/${cartao.id}`} label={`Voltar para ${cartao.nome}`} />
      <h1 className={`${classeTituloPagina} mb-6`}>Pagamento da fatura · {cartao.nome}</h1>
      <PagamentoForm escopoPadrao={cartao.escopo} action={criarPagamento.bind(null, cartao.id)} />
    </div>
  );
}
