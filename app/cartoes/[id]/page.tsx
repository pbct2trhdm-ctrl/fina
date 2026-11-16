import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { lancamentosPorMes, somar } from "@/lib/financas";
import { ESCOPOS, LABEL_CATEGORIA, LABEL_ESCOPO, formatarMoeda } from "@/lib/formatacao";
import { mes as lerMes } from "@/lib/validacao";
import { EmptyState } from "@/components/empty-state";
import { LinkVoltar } from "@/components/link-voltar";
import { Bolinha, SeletorMes } from "@/components/seletores";
import { classeBotaoPrimario, classeBotaoSecundario, classeCard, classeTabela, classeTituloPagina, classeTituloSecao } from "@/lib/estilos";

const cabecalho = "border-b border-slate-200/70 text-left text-xs uppercase tracking-wide text-texto-secundario";
const linhaTabela = "border-b border-slate-200/50 last:border-0 hover:bg-white/60 transition-colors";

export default async function CartaoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mes?: string }> }) {
  const { id } = await params;
  const mes = lerMes((await searchParams).mes);
  const cartao = await prisma.cartao.findUnique({ where: { id } });
  if (!cartao) notFound();

  const doCartao = (await lancamentosPorMes([mes], { comprasNoCartao: true }))[mes].filter((item) => item.cartaoId === id);
  const compras = doCartao.filter((item) => item.noCartao);
  const pagamentos = doCartao.filter((item) => item.tipo === "FATURA");
  const editar = (item: (typeof compras)[number]) => (item.tipo === "PARCELA" ? `/parcelados/${item.id}/editar` : `/lancamentos/${item.id}/editar`);

  return (
    <div className="max-w-6xl">
      <LinkVoltar href="/cartoes" label="Voltar para Cartões" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={classeTituloPagina}>{cartao.nome}</h1>
          <p className="inline-flex items-center gap-1.5 text-sm text-texto-secundario">
            <Bolinha escopo={cartao.escopo} />
            {LABEL_ESCOPO[cartao.escopo]}
            {cartao.diaFechamento ? ` · fecha dia ${cartao.diaFechamento}` : ""}
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={classeCard}>
          <p className="text-sm text-texto-secundario">Compras no mês</p>
          <p className="text-3xl font-semibold tracking-tight">{formatarMoeda(somar(compras))}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {ESCOPOS.map((escopo) => {
              const valor = somar(compras.filter((item) => item.escopo === escopo));
              if (valor <= 0) return null;
              return (
                <li key={escopo} className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-texto-secundario">
                    <Bolinha escopo={escopo} />
                    {LABEL_ESCOPO[escopo]}
                  </span>
                  <span className="tabular-nums">{formatarMoeda(valor)}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-texto-secundario">Não entram nos gastos do mês: só o pagamento da fatura entra.</p>
        </div>
        <div className={classeCard}>
          <p className="text-sm text-texto-secundario">Pago da fatura no mês</p>
          <p className="text-3xl font-semibold tracking-tight">{formatarMoeda(somar(pagamentos))}</p>
          <p className="mt-2 text-xs text-texto-secundario">
            {pagamentos.length === 0
              ? "Nenhum pagamento registrado. Registre o valor pago (total ou parcial) para ele entrar nos gastos."
              : "Entra nos gastos do mês, na data de cada pagamento."}
          </p>
        </div>
      </div>

      <h2 className={`${classeTituloSecao} mb-3`}>Pagamentos da fatura</h2>
      {pagamentos.length === 0 ? (
        <EmptyState mensagem="Nenhum pagamento neste mês." acaoHref={`/cartoes/${id}/pagamentos/novo`} acaoLabel="Registrar pagamento" />
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
              {pagamentos.map((item) => (
                <tr key={item.id} className={linhaTabela}>
                  <td className="px-4 py-2.5 tabular-nums text-texto-secundario">
                    {item.data.slice(8)}/{item.data.slice(5, 7)}
                  </td>
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

      <h2 className={`${classeTituloSecao} mb-3 mt-8`}>Compras no cartão</h2>
      {compras.length === 0 ? (
        <EmptyState mensagem="Nenhuma compra neste mês. Importe a fatura em Importar extrato, escolhendo este cartão." acaoHref="/importar" acaoLabel="Importar fatura" />
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
              {compras.map((item) => (
                <tr key={`${item.tipo}-${item.id}`} className={linhaTabela}>
                  <td className="px-4 py-2.5 tabular-nums text-texto-secundario">
                    {item.data.slice(8)}/{item.data.slice(5, 7)}
                  </td>
                  <td className="px-4 py-2.5">{item.descricao}</td>
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
                  {compras.length} {compras.length === 1 ? "compra" : "compras"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatarMoeda(somar(compras))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
