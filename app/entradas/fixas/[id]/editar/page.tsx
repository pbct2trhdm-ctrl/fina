import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EntradaFixaForm } from "@/components/entrada-form";
import { atualizarEntradaFixa, encerrarEntradaFixa, excluirEntradaFixa } from "@/lib/actions/entradas";
import { classeBotaoPerigo, classeCard, classeTituloPagina, classeTituloSecao } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { LinkVoltar } from "@/components/link-voltar";
import { mes as lerMes } from "@/lib/validacao";
import { nomeMes } from "@/lib/meses";

export default async function EditarEntradaFixaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { id } = await params;
  const mes = lerMes((await searchParams).mes);
  const fixa = await prisma.entradaFixa.findUnique({ where: { id } });
  if (!fixa) notFound();

  return (
    <div>
      <LinkVoltar href={`/entradas?mes=${mes}`} label="Voltar para Entradas" />
      <h1 className={`${classeTituloPagina} mb-6`}>Editar entrada fixa</h1>
      <EntradaFixaForm fixa={fixa} action={atualizarEntradaFixa.bind(null, fixa.id)} />

      <div className={`${classeCard} mt-8 max-w-xl`}>
        <h2 className={`${classeTituloSecao} mb-1`}>Encerrar entrada</h2>
        {fixa.fim ? (
          <p className="text-sm text-texto-secundario">Esta entrada foi encerrada; o último mês em vigor foi {nomeMes(fixa.fim, true)}.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-texto-secundario">
              A entrada deixa de aparecer a partir de {nomeMes(mes, true)}. Os recebimentos de meses anteriores continuam no histórico.
            </p>
            <form action={encerrarEntradaFixa.bind(null, fixa.id, mes)}>
              <BotaoEnvio
                textoAguardando="Encerrando…"
                className={classeBotaoPerigo}
                confirmacao={`Encerrar "${fixa.descricao}" a partir de ${nomeMes(mes, true)}?`}
              >
                Encerrar a partir de {nomeMes(mes, true)}
              </BotaoEnvio>
            </form>
          </>
        )}

        <h2 className={`${classeTituloSecao} mb-1 mt-6 border-t border-borda-suave pt-4`}>Excluir entrada</h2>
        <p className="mb-3 text-sm text-texto-secundario">
          Apaga a entrada e todos os recebimentos dela, inclusive os de meses anteriores. Use só para cadastro feito por engano.
        </p>
        <form action={excluirEntradaFixa.bind(null, fixa.id)}>
          <BotaoEnvio
            textoAguardando="Excluindo…"
            className={classeBotaoPerigo}
            confirmacao={`Excluir "${fixa.descricao}" e todo o histórico de recebimentos dela?`}
          >
            Excluir entrada e histórico
          </BotaoEnvio>
        </form>
      </div>
    </div>
  );
}
