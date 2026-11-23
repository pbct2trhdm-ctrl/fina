import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { faturasDoCartao, somar } from "@/lib/financas";
import { ESCOPOS, LABEL_CATEGORIA, LABEL_ESCOPO, formatarMoeda } from "@/lib/formatacao";
import { mes as lerMes } from "@/lib/validacao";
import { mesAtual, nomeMes, somarMeses } from "@/lib/meses";
import { hojeIsoLocal } from "@/lib/datas";
import { EmptyState } from "@/components/empty-state";
import { LinkVoltar } from "@/components/link-voltar";
import { Bolinha, SeletorMes } from "@/components/seletores";
import { Selo } from "@/components/selo";
import { classeBadgeNeutro, classeBotaoPrimario, classeBotaoSecundario, classeTabela, classeTituloPagina, classeTituloSecao } from "@/lib/estilos";

const cabecalho = "border-b border-slate-200/70 text-left text-xs uppercase tracking-wide text-texto-secundario";
const linhaTabela = "border-b border-slate-200/50 last:border-0 hover:bg-white/60 transition-colors";
const dm = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

export default async function CartaoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mes?: string }> }) {
  const { id } = await params;
  const mes = lerMes((await searchParams).mes);
  const cartao = await prisma.cartao.findUnique({ where: { id } });
  if (!cartao) notFound();

  const porCiclo = !!cartao.diaFechamento;
  const faturas = await faturasDoCartao(cartao, mes, 6);
  const fatura = faturas.find((f) => f.mes === mes) ?? faturas[faturas.length - 2];
  const hoje = hojeIsoLocal();
  const diasParaFechar = Math.round((Date.parse(fatura.fim) - Date.parse(hoje)) / 86_400_000);
  const editar = (item: (typeof fatura.compras)[number]) =>
    item.tipo === "PARCELA" ? `/parcelados/${item.id}/editar` : item.tipo === "CONTA" ? `/contas/${item.id}/editar` : `/lancamentos/${item.id}/editar`;
  // Recorrências (assinaturas, academia…) cobradas neste cartão e em vigor hoje.
  const mesHoje = mesAtual();
  const recorrencias = await prisma.contaFixa.findMany({
    where: { cartaoId: id, inicio: { lte: mesHoje }, OR: [{ fim: null }, { fim: { gte: mesHoje } }] },
    orderBy: [{ diaVencimento: "asc" }, { descricao: "asc" }],
  });
  const totalRecorrencias = recorrencias.reduce((t, r) => t + r.valor, 0);
  const situacao = fatura.aberta
    ? { tom: "neutro" as const, texto: `Aberta · fecha em ${dm(fatura.fim)}` }
    : fatura.vencimento >= hoje
      ? { tom: "atencao" as const, texto: `Fechada · vence em ${dm(fatura.vencimento)}` }
      : { tom: "tranquilo" as const, texto: `Venceu em ${dm(fatura.vencimento)}` };

  return (
    <div className="max-w-6xl">
      <LinkVoltar href="/cartoes" label="Voltar para Cartões" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={classeTituloPagina}>{cartao.nome}</h1>
          <p className="inline-flex items-center gap-1.5 text-sm text-texto-secundario">
            <Bolinha escopo={cartao.escopo} />
            {LABEL_ESCOPO[cartao.escopo]}
            {cartao.diaFechamento ? ` · fecha dia ${cartao.diaFechamento}` : " · sem dia de fechamento (faturas por mês do calendário)"}
            {cartao.diaVencimento ? ` · vence dia ${cartao.diaVencimento}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorMes base={`/cartoes/${id}`} mes={mes} />
          <Link href={`/cartoes/${id}/editar`} className={classeBotaoSecundario}>
            Editar cartão
          </Link>
          <Link href={`/cartoes/${id}/pagamentos/novo`} className={classeBotaoPrimario}>
            Registrar pagamento
          </Link>
        </div>
      </div>

      {/* Fatura do mês escolhido */}
      <section className="vidro-destaque mb-6 rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm text-texto-secundario">
            Fatura de {nomeMes(fatura.mes, true)}
            {porCiclo && (
              <>
                {" "}
                · compras de {dm(fatura.inicio)} a {dm(fatura.fim)}
              </>
            )}
          </h2>
          <Selo tom={situacao.tom}>{situacao.texto}</Selo>
        </div>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-texto-secundario">Compras da fatura</dt>
            <dd className="text-3xl font-bold tracking-tight">{formatarMoeda(fatura.totalCompras)}</dd>
            <dd className="text-xs text-texto-secundario">
              {fatura.compras.length} {fatura.compras.length === 1 ? "compra" : "compras"}
              {fatura.aberta && diasParaFechar >= 0 && ` · ${diasParaFechar === 0 ? "fecha hoje" : `${diasParaFechar} ${diasParaFechar === 1 ? "dia" : "dias"} até fechar`}`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-texto-secundario">Pago neste ciclo</dt>
            <dd className="text-3xl font-bold tracking-tight">{formatarMoeda(fatura.totalPago)}</dd>
            <dd className="text-xs text-texto-secundario">entra nos gastos do mês do pagamento</dd>
          </div>
          <div>
            <dt className="text-xs text-texto-secundario">Saldo acumulado</dt>
            <dd className={`text-3xl font-bold tracking-tight ${fatura.saldoAcumulado > 0.005 ? "text-critico" : fatura.saldoAcumulado < -0.005 ? "text-tranquilo" : ""}`}>
              {fatura.saldoAcumulado < 0 ? "−" : ""}
              {formatarMoeda(Math.abs(fatura.saldoAcumulado))}
            </dd>
            <dd className="text-xs text-texto-secundario">
              {fatura.saldoAcumulado > 0.005 ? "falta pagar" : fatura.saldoAcumulado < -0.005 ? "pago a mais (crédito)" : "quitado"} · compras − pagamentos das últimas {faturas.length} faturas
            </dd>
          </div>
        </dl>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {ESCOPOS.map((escopo) => {
            const valor = somar(fatura.compras.filter((item) => item.escopo === escopo));
            if (valor <= 0) return null;
            return (
              <li key={escopo} className="inline-flex items-center gap-1.5 text-texto-secundario">
                <Bolinha escopo={escopo} />
                {LABEL_ESCOPO[escopo]} <span className="tabular-nums text-texto-principal">{formatarMoeda(valor)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Recorrências do cartão */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className={classeTituloSecao}>
          Recorrências neste cartão
          {recorrencias.length > 0 && <span className="ml-2 text-sm font-normal text-texto-secundario">{formatarMoeda(totalRecorrencias)} por mês</span>}
        </h2>
        <Link href={`/contas/nova?cartao=${id}`} className="text-sm font-medium text-accent hover:underline">
          + Nova recorrência
        </Link>
      </div>
      {recorrencias.length === 0 ? (
        <p className="mb-8 rounded-2xl border border-dashed border-slate-300 bg-white/50 px-4 py-3 text-sm text-texto-secundario">
          Nenhuma recorrência. Cadastre streaming, academia, aplicativos e outras cobranças mensais deste cartão: elas aparecem sozinhas em cada
          fatura.
        </p>
      ) : (
        <ul className="vidro mb-8 grid grid-cols-1 gap-x-6 rounded-2xl px-4 py-2 sm:grid-cols-2">
          {recorrencias.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 border-b border-slate-200/50 py-2 text-sm last:border-0 sm:[&:nth-last-child(2)]:border-0">
              <Link href={`/contas/${r.id}/editar`} className="min-w-0 hover:underline">
                <span className="font-medium">{r.descricao}</span>
                <span className="block text-xs text-texto-secundario">
                  dia {r.diaVencimento} · {LABEL_CATEGORIA[r.categoria]} · {LABEL_ESCOPO[r.escopo]}
                </span>
              </Link>
              <span className="tabular-nums">{formatarMoeda(r.valor)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Histórico de faturas */}
      <h2 className={`${classeTituloSecao} mb-3`}>Últimas faturas</h2>
      <div className={`${classeTabela} mb-8`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={cabecalho}>
              <th className="px-4 py-3 font-semibold">Fatura</th>
              {porCiclo && <th className="px-4 py-3 font-semibold">Compras de</th>}
              <th className="px-4 py-3 font-semibold">Vencimento</th>
              <th className="px-4 py-3 text-right font-semibold">Compras</th>
              <th className="px-4 py-3 text-right font-semibold">Pago no ciclo</th>
              <th className="px-4 py-3 text-right font-semibold">Saldo acumulado</th>
            </tr>
          </thead>
          <tbody>
            {faturas.map((f) => (
              <tr key={f.mes} className={`${linhaTabela} ${f.mes === fatura.mes ? "font-semibold" : ""}`}>
                <td className="px-4 py-2.5">
                  <Link href={`/cartoes/${id}?mes=${f.mes}`} className="text-accent hover:underline">
                    {nomeMes(f.mes, true)}
                  </Link>
                  {f.aberta && <span className="ml-2 text-xs font-normal text-texto-secundario">aberta</span>}
                </td>
                {porCiclo && (
                  <td className="px-4 py-2.5 tabular-nums text-texto-secundario">
                    {dm(f.inicio)} a {dm(f.fim)}
                  </td>
                )}
                <td className="px-4 py-2.5 tabular-nums text-texto-secundario">{dm(f.vencimento)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatarMoeda(f.totalCompras)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatarMoeda(f.totalPago)}</td>
                <td className={`px-4 py-2.5 text-right tabular-nums ${f.saldoAcumulado > 0.005 ? "text-critico" : ""}`}>
                  {f.saldoAcumulado < 0 ? "−" : ""}
                  {formatarMoeda(Math.abs(f.saldoAcumulado))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="-mt-6 mb-8 text-xs text-texto-secundario">
        O saldo acumulado só é exato se todas as faturas do período foram importadas; faturas anteriores a {nomeMes(faturas[0].mes, true)} não entram
        na conta.
      </p>

      <h2 className={`${classeTituloSecao} mb-3`}>Pagamentos no ciclo</h2>
      {fatura.pagamentos.length === 0 ? (
        <EmptyState mensagem="Nenhum pagamento neste ciclo." acaoHref={`/cartoes/${id}/pagamentos/novo`} acaoLabel="Registrar pagamento" />
      ) : (
        <div className={classeTabela}>
          <table className="w-full text-sm">
            <thead>
              <tr className={cabecalho}>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Observação</th>
                <th className="px-4 py-3 font-semibold">De quem</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {fatura.pagamentos.map((item) => (
                <tr key={item.id} className={linhaTabela}>
                  <td className="px-4 py-2.5 tabular-nums text-texto-secundario">{dm(item.data)}</td>
                  <td className="px-4 py-2.5">{item.descricao.includes("·") ? item.descricao.split("·").slice(1).join("·").trim() : "Pagamento da fatura"}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Bolinha escopo={item.escopo} />
                      {LABEL_ESCOPO[item.escopo]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatarMoeda(item.valor)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/cartoes/${id}/pagamentos/${item.id}/editar`} className="text-accent hover:underline">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className={`${classeTituloSecao} mb-3 mt-8`}>Compras da fatura</h2>
      {fatura.compras.length === 0 ? (
        <EmptyState mensagem="Nenhuma compra nesta fatura. Importe a fatura em Importar extrato, escolhendo este cartão." acaoHref="/importar" acaoLabel="Importar fatura" />
      ) : (
        <div className={classeTabela}>
          <table className="w-full text-sm">
            <thead>
              <tr className={cabecalho}>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Descrição</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">De quem</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {fatura.compras.map((item) => (
                <tr key={`${item.tipo}-${item.id}`} className={linhaTabela}>
                  <td className="px-4 py-2.5 tabular-nums text-texto-secundario">{dm(item.data)}</td>
                  <td className="px-4 py-2.5">
                    {item.descricao}
                    {item.recorrente && <span className={`${classeBadgeNeutro} ml-2`}>recorrente</span>}
                  </td>
                  <td className="px-4 py-2.5">{LABEL_CATEGORIA[item.categoria]}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Bolinha escopo={item.escopo} />
                      {LABEL_ESCOPO[item.escopo]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatarMoeda(item.valor)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={editar(item)} className="text-accent hover:underline" aria-label={`Editar ${item.descricao}`}>
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200/70 font-semibold">
                <td className="px-4 py-3" colSpan={4}>
                  {fatura.compras.length} {fatura.compras.length === 1 ? "compra" : "compras"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatarMoeda(fatura.totalCompras)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-texto-secundario">
        Hoje é {dm(hoje)}; a fatura em aberto é a de {nomeMes(faturas.find((f) => f.aberta)?.mes ?? somarMeses(mesAtual(), 1), true)}.
      </p>
    </div>
  );
}
