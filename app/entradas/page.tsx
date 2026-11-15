import Link from "next/link";
import { entradasFixasDoMes, entradasPorMes, lancamentosPorMes, naVisao, somar } from "@/lib/financas";
import { LABEL_ESCOPO, LABEL_TIPO_ENTRADA, formatarMoeda } from "@/lib/formatacao";
import { mes as lerMes, visao as lerVisao } from "@/lib/validacao";
import { alternarRecebimento } from "@/lib/actions/entradas";
import { BotaoEnvio } from "@/components/botao-envio";
import { EmptyState } from "@/components/empty-state";
import { Bolinha, SeletorMes, SeletorVisao, montarHref } from "@/components/seletores";
import { Selo, SELO_SITUACAO_ENTRADA } from "@/components/selo";
import {
  classeBotaoConfirma,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeCard,
  classeTabela,
  classeTituloPagina,
  classeTituloSecao,
} from "@/lib/estilos";

const cabecalho = "border-b border-slate-200/70 text-left text-xs uppercase tracking-wide text-texto-secundario";
const linhaTabela = "border-b border-slate-200/50 last:border-0 hover:bg-white/60 transition-colors";

export default async function EntradasPage({ searchParams }: { searchParams: Promise<{ visao?: string; mes?: string }> }) {
  const parametros = await searchParams;
  const visao = lerVisao(parametros.visao);
  const mes = lerMes(parametros.mes);

  const [porMes, todasFixas, gastosPorMes] = await Promise.all([entradasPorMes([mes]), entradasFixasDoMes(mes), lancamentosPorMes([mes])]);
  const recebidas = naVisao(porMes[mes], visao);
  const fixas = naVisao(todasFixas, visao);
  const avulsas = recebidas.filter((entrada) => entrada.origem === "AVULSA");
  const aReceber = somar(fixas.filter((fixa) => fixa.situacao !== "RECEBIDA"));
  const totalRecebido = somar(recebidas);
  const gasto = somar(naVisao(gastosPorMes[mes], visao));
  const saldo = totalRecebido - gasto;
  const aqui = montarHref("/entradas", { visao, mes });

  return (
    <div className="max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className={classeTituloPagina}>Entradas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorMes base="/entradas" mes={mes} visao={visao} />
          <Link href={`/entradas/fixas/nova?mes=${mes}`} className={classeBotaoSecundario}>
            Nova entrada fixa
          </Link>
          <Link href="/entradas/nova" className={classeBotaoPrimario}>
            Nova entrada
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <SeletorVisao base="/entradas" visao={visao} mes={mes} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={classeCard}>
          <p className="text-sm text-texto-secundario">Recebido no mês</p>
          <p className="text-2xl font-semibold tracking-tight">{formatarMoeda(totalRecebido)}</p>
          <p className="text-xs text-texto-secundario">
            {recebidas.length} {recebidas.length === 1 ? "entrada" : "entradas"}
          </p>
        </div>
        <div className={classeCard}>
          <p className="text-sm text-texto-secundario">Ainda a receber</p>
          <p className="text-2xl font-semibold tracking-tight">{formatarMoeda(aReceber)}</p>
          <p className="text-xs text-texto-secundario">entradas fixas não confirmadas</p>
        </div>
        <div className={classeCard}>
          <p className="text-sm text-texto-secundario">Saldo do mês</p>
          <p className="text-2xl font-semibold tracking-tight">
            {saldo < 0 ? "−" : ""}
            {formatarMoeda(Math.abs(saldo))}
          </p>
          <p className="text-xs text-texto-secundario">
            recebido menos {formatarMoeda(gasto)} de gastos
            {saldo < 0 && <strong className="text-critico"> · ▲ gastos acima das entradas</strong>}
          </p>
        </div>
      </div>

      <h2 className={`${classeTituloSecao} mb-3`}>Entradas fixas do mês</h2>
      {fixas.length === 0 ? (
        <EmptyState
          mensagem="Nenhuma entrada fixa nesta visão neste mês. Cadastre o salário uma vez e só confirme o recebimento a cada mês."
          acaoHref={`/entradas/fixas/nova?mes=${mes}`}
          acaoLabel="Nova entrada fixa"
        />
      ) : (
        <div className={classeTabela}>
          <table className="w-full text-sm">
            <thead>
              <tr className={cabecalho}>
                <th className="px-4 py-3 font-semibold">Dia previsto</th>
                <th className="px-4 py-3 font-semibold">Entrada</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">De quem</th>
                <th className="px-4 py-3 font-semibold">Situação</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {fixas.map((fixa) => {
                const selo = SELO_SITUACAO_ENTRADA[fixa.situacao];
                const recebida = fixa.situacao === "RECEBIDA";
                return (
                  <tr key={fixa.id} className={linhaTabela}>
                    <td className="px-4 py-2.5 tabular-nums text-texto-secundario">
                      {fixa.dataPrevista.slice(8)}/{fixa.dataPrevista.slice(5, 7)}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{fixa.descricao}</td>
                    <td className="px-4 py-2.5">{LABEL_TIPO_ENTRADA[fixa.tipo]}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Bolinha escopo={fixa.escopo} />
                        {LABEL_ESCOPO[fixa.escopo]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Selo tom={selo.tom}>{selo.texto}</Selo>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatarMoeda(fixa.valor)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        <form action={alternarRecebimento.bind(null, fixa.id, mes, aqui)}>
                          <BotaoEnvio textoAguardando="…" className={`${recebida ? classeBotaoSecundario : classeBotaoConfirma} w-28 whitespace-nowrap`}>
                            {recebida ? "Desfazer" : "Confirmar"}
                          </BotaoEnvio>
                        </form>
                        <Link href={`/entradas/fixas/${fixa.id}/editar?mes=${mes}`} className="text-accent hover:underline" aria-label={`Editar ${fixa.descricao}`}>
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

      <h2 className={`${classeTituloSecao} mb-3 mt-8`}>Entradas avulsas do mês</h2>
      {avulsas.length === 0 ? (
        <EmptyState mensagem="Nenhuma entrada avulsa neste mês (renda extra, reembolso, 13º…)." acaoHref="/entradas/nova" acaoLabel="Nova entrada" />
      ) : (
        <div className={classeTabela}>
          <table className="w-full text-sm">
            <thead>
              <tr className={cabecalho}>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Descrição</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">De quem</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {avulsas.map((entrada) => (
                <tr key={entrada.id} className={linhaTabela}>
                  <td className="px-4 py-2.5 tabular-nums text-texto-secundario">
                    {entrada.data.slice(8)}/{entrada.data.slice(5, 7)}
                  </td>
                  <td className="px-4 py-2.5">{entrada.descricao}</td>
                  <td className="px-4 py-2.5">{LABEL_TIPO_ENTRADA[entrada.tipo]}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Bolinha escopo={entrada.escopo} />
                      {LABEL_ESCOPO[entrada.escopo]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatarMoeda(entrada.valor)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/entradas/${entrada.id}/editar`} className="text-accent hover:underline" aria-label={`Editar ${entrada.descricao}`}>
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200/70 font-semibold">
                <td className="px-4 py-3" colSpan={4}>
                  {avulsas.length} {avulsas.length === 1 ? "entrada avulsa" : "entradas avulsas"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatarMoeda(somar(avulsas))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
