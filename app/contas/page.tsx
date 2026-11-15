import Link from "next/link";
import { contasDoMes, naVisao, somar } from "@/lib/financas";
import { LABEL_CATEGORIA, LABEL_ESCOPO, formatarMoeda } from "@/lib/formatacao";
import { mes as lerMes, visao as lerVisao } from "@/lib/validacao";
import { alternarPagamento } from "@/lib/actions/contas";
import { BotaoEnvio } from "@/components/botao-envio";
import { EmptyState } from "@/components/empty-state";
import { Bolinha, SeletorMes, SeletorVisao, montarHref } from "@/components/seletores";
import { Selo, SELO_SITUACAO_CONTA } from "@/components/selo";
import { classeBotaoConfirma, classeBotaoPrimario, classeBotaoSecundario, classeCard, classeTituloPagina } from "@/lib/estilos";

export default async function ContasPage({ searchParams }: { searchParams: Promise<{ visao?: string; mes?: string }> }) {
  const parametros = await searchParams;
  const visao = lerVisao(parametros.visao);
  const mes = lerMes(parametros.mes);
  const contas = naVisao(await contasDoMes(mes), visao);
  const pagas = contas.filter((conta) => conta.situacao === "PAGA");
  const abertas = contas.filter((conta) => conta.situacao !== "PAGA");
  const aqui = montarHref("/contas", { visao, mes });

  return (
    <div className="max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className={classeTituloPagina}>Contas fixas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorMes base="/contas" mes={mes} visao={visao} />
          <Link href={`/contas/nova?mes=${mes}`} className={classeBotaoPrimario}>
            Nova conta
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <SeletorVisao base="/contas" visao={visao} mes={mes} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { rotulo: "Total do mês", valor: somar(contas), detalhe: `${contas.length} ${contas.length === 1 ? "conta" : "contas"}` },
          { rotulo: "Já pago", valor: somar(pagas), detalhe: `${pagas.length} ${pagas.length === 1 ? "paga" : "pagas"}` },
          { rotulo: "A pagar", valor: somar(abertas), detalhe: `${abertas.length} em aberto` },
        ].map((item) => (
          <div key={item.rotulo} className={classeCard}>
            <p className="text-sm text-texto-secundario">{item.rotulo}</p>
            <p className="text-2xl font-semibold tracking-tight">{formatarMoeda(item.valor)}</p>
            <p className="text-xs text-texto-secundario">{item.detalhe}</p>
          </div>
        ))}
      </div>

      {contas.length === 0 ? (
        <EmptyState mensagem="Nenhuma conta fixa em vigor nesta visão neste mês." acaoHref={`/contas/nova?mes=${mes}`} acaoLabel="Nova conta" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-superficie shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-texto-secundario">
                <th className="px-4 py-3 font-semibold">Vencimento</th>
                <th className="px-4 py-3 font-semibold">Conta</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">De quem</th>
                <th className="px-4 py-3 font-semibold">Situação</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {contas.map((conta) => {
                const selo = SELO_SITUACAO_CONTA[conta.situacao];
                const paga = conta.situacao === "PAGA";
                return (
                  <tr key={conta.id} className="border-b border-slate-100 last:border-0 hover:bg-fundo">
                    <td className="px-4 py-2.5 tabular-nums text-texto-secundario">
                      {conta.vencimento.slice(8)}/{conta.vencimento.slice(5, 7)}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{conta.descricao}</td>
                    <td className="px-4 py-2.5">{LABEL_CATEGORIA[conta.categoria]}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Bolinha escopo={conta.escopo} />
                        {LABEL_ESCOPO[conta.escopo]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Selo tom={selo.tom}>{selo.texto}</Selo>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatarMoeda(conta.valor)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        <form action={alternarPagamento.bind(null, conta.id, mes, aqui)}>
                          <BotaoEnvio textoAguardando="…" className={`${paga ? classeBotaoSecundario : classeBotaoConfirma} w-28 whitespace-nowrap`}>
                            {paga ? "Desfazer" : "Marcar paga"}
                          </BotaoEnvio>
                        </form>
                        <Link href={`/contas/${conta.id}/editar?mes=${mes}`} className="text-accent hover:underline" aria-label={`Editar ${conta.descricao}`}>
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
