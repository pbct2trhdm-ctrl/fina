import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CartaoForm } from "@/components/cartao-form";
import { atualizarCartao, excluirCartao } from "@/lib/actions/cartoes";
import { classeBotaoPerigo, classeTituloPagina } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarCartaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cartao = await prisma.cartao.findUnique({ where: { id }, include: { _count: { select: { gastos: true, compras: true } } } });
  if (!cartao) notFound();
  const vinculados = cartao._count.gastos + cartao._count.compras;

  return (
    <div>
      <LinkVoltar href="/cartoes" label="Voltar para Cartões" />
      <div className="mb-6 flex max-w-xl items-center justify-between">
        <h1 className={classeTituloPagina}>Editar cartão</h1>
        <form action={excluirCartao.bind(null, cartao.id)}>
          <BotaoEnvio
            textoAguardando="Excluindo…"
            className={classeBotaoPerigo}
            confirmacao={`Excluir o cartão "${cartao.nome}"? Os ${vinculados} lançamentos dele continuam no sistema, só ficam sem cartão.`}
          >
            Excluir
          </BotaoEnvio>
        </form>
      </div>
      <CartaoForm cartao={cartao} action={atualizarCartao.bind(null, cartao.id)} />
    </div>
  );
}
