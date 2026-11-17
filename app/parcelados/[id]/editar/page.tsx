import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listarCartoes } from "@/lib/financas";
import { CompraForm } from "@/components/compra-form";
import { atualizarCompra, excluirCompra } from "@/lib/actions/parcelados";
import { classeBotaoPerigo, classeTituloPagina } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarCompraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [compra, cartoes] = await Promise.all([prisma.compraParcelada.findUnique({ where: { id } }), listarCartoes()]);
  if (!compra || compra.tipo !== "COMPRA") notFound();

  return (
    <div>
      <LinkVoltar href="/parcelados" label="Voltar para Parcelados" />
      <div className="mb-6 flex max-w-xl items-center justify-between">
        <h1 className={classeTituloPagina}>Editar compra parcelada</h1>
        <form action={excluirCompra.bind(null, compra.id)}>
          <BotaoEnvio
            textoAguardando="Excluindo…"
            className={classeBotaoPerigo}
            confirmacao={`Excluir "${compra.descricao}"? Todas as parcelas, inclusive as de meses anteriores, saem do histórico.`}
          >
            Excluir
          </BotaoEnvio>
        </form>
      </div>
      <CompraForm compra={compra} cartoes={cartoes} action={atualizarCompra.bind(null, compra.id)} />
    </div>
  );
}
