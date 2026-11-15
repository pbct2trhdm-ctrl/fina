import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listarCartoes } from "@/lib/financas";
import { GastoForm } from "@/components/gasto-form";
import { atualizarGasto, excluirGasto } from "@/lib/actions/gastos";
import { classeBotaoPerigo, classeTituloPagina } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarGastoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [gasto, cartoes] = await Promise.all([prisma.gasto.findUnique({ where: { id } }), listarCartoes()]);
  if (!gasto) notFound();

  return (
    <div>
      <LinkVoltar href={`/lancamentos?mes=${gasto.data.toISOString().slice(0, 7)}`} label="Voltar para Lançamentos" />
      <div className="mb-6 flex max-w-xl items-center justify-between">
        <h1 className={classeTituloPagina}>Editar gasto</h1>
        <form action={excluirGasto.bind(null, gasto.id)}>
          <BotaoEnvio textoAguardando="Excluindo…" className={classeBotaoPerigo} confirmacao={`Excluir o gasto "${gasto.descricao}"?`}>
            Excluir
          </BotaoEnvio>
        </form>
      </div>
      <GastoForm gasto={gasto} cartoes={cartoes} action={atualizarGasto.bind(null, gasto.id)} />
    </div>
  );
}
