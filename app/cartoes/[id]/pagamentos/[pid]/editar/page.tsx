import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PagamentoForm } from "@/components/pagamento-form";
import { atualizarPagamento, excluirPagamento } from "@/lib/actions/cartoes";
import { classeBotaoPerigo, classeTituloPagina } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarPagamentoPage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  const pagamento = await prisma.pagamentoCartao.findUnique({ where: { id: pid }, include: { cartao: true } });
  if (!pagamento || pagamento.cartaoId !== id) notFound();

  return (
    <div>
      <LinkVoltar href={`/cartoes/${id}?mes=${pagamento.data.toISOString().slice(0, 7)}`} label={`Voltar para ${pagamento.cartao.nome}`} />
      <div className="mb-6 flex max-w-xl items-center justify-between">
        <h1 className={classeTituloPagina}>Editar pagamento · {pagamento.cartao.nome}</h1>
        <form action={excluirPagamento.bind(null, id, pid)}>
          <BotaoEnvio textoAguardando="Excluindo…" className={classeBotaoPerigo} confirmacao="Excluir este pagamento da fatura?">
            Excluir
          </BotaoEnvio>
        </form>
      </div>
      <PagamentoForm pagamento={pagamento} escopoPadrao={pagamento.cartao.escopo} action={atualizarPagamento.bind(null, id, pid)} />
    </div>
  );
}
