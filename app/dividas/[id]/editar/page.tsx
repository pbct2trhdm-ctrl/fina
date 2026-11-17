import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listarCartoes } from "@/lib/financas";
import { CompraForm } from "@/components/compra-form";
import { atualizarCompra, excluirCompra } from "@/lib/actions/parcelados";
import { classeBotaoPerigo, classeTituloPagina } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarDividaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [divida, cartoes] = await Promise.all([prisma.compraParcelada.findUnique({ where: { id } }), listarCartoes()]);
  if (!divida || divida.tipo !== "DIVIDA") notFound();

  return (
    <div>
      <LinkVoltar href="/dividas" label="Voltar para Dívidas e acordos" />
      <div className="mb-6 flex max-w-xl items-center justify-between">
        <h1 className={classeTituloPagina}>Editar dívida ou acordo</h1>
        <form action={excluirCompra.bind(null, divida.id)}>
          <BotaoEnvio textoAguardando="Excluindo…" className={classeBotaoPerigo} confirmacao={`Excluir "${divida.descricao}"? Todas as parcelas, inclusive as de meses anteriores, saem do histórico.`}>
            Excluir
          </BotaoEnvio>
        </form>
      </div>
      <CompraForm compra={divida} tipo="DIVIDA" cartoes={cartoes} action={atualizarCompra.bind(null, divida.id)} />
    </div>
  );
}
