import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContaForm } from "@/components/conta-form";
import { atualizarConta, encerrarConta, excluirConta } from "@/lib/actions/contas";
import { classeBotaoPerigo, classeCard, classeTituloPagina, classeTituloSecao } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { LinkVoltar } from "@/components/link-voltar";
import { mes as lerMes } from "@/lib/validacao";
import { listarCartoes } from "@/lib/financas";
import { nomeMes } from "@/lib/meses";

export default async function EditarContaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { id } = await params;
  const mes = lerMes((await searchParams).mes);
  const [conta, cartoes] = await Promise.all([prisma.contaFixa.findUnique({ where: { id } }), listarCartoes()]);
  if (!conta) notFound();

  return (
    <div>
      <LinkVoltar href={`/contas?mes=${mes}`} label="Voltar para Contas fixas" />
      <h1 className={`${classeTituloPagina} mb-6`}>Editar conta fixa</h1>
      <ContaForm conta={conta} cartoes={cartoes} action={atualizarConta.bind(null, conta.id)} />

      <div className={`${classeCard} mt-8 max-w-xl`}>
        <h2 className={`${classeTituloSecao} mb-1`}>Encerrar conta</h2>
        {conta.fim ? (
          <p className="text-sm text-texto-secundario">Esta conta foi encerrada; o último mês em vigor foi {nomeMes(conta.fim, true)}.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-texto-secundario">
              A conta deixa de aparecer a partir de {nomeMes(mes, true)}. Os pagamentos de meses anteriores continuam no histórico.
            </p>
            <form action={encerrarConta.bind(null, conta.id, mes)}>
              <BotaoEnvio
                textoAguardando="Encerrando…"
                className={classeBotaoPerigo}
                confirmacao={`Encerrar "${conta.descricao}" a partir de ${nomeMes(mes, true)}?`}
              >
                Encerrar a partir de {nomeMes(mes, true)}
              </BotaoEnvio>
            </form>
          </>
        )}

        <h2 className={`${classeTituloSecao} mb-1 mt-6 border-t border-borda-suave pt-4`}>Excluir conta</h2>
        <p className="mb-3 text-sm text-texto-secundario">
          Apaga a conta e todos os pagamentos dela, inclusive os de meses anteriores. Use só para cadastro feito por engano.
        </p>
        <form action={excluirConta.bind(null, conta.id)}>
          <BotaoEnvio
            textoAguardando="Excluindo…"
            className={classeBotaoPerigo}
            confirmacao={`Excluir "${conta.descricao}" e todo o histórico de pagamentos dela?`}
          >
            Excluir conta e histórico
          </BotaoEnvio>
        </form>
      </div>
    </div>
  );
}
