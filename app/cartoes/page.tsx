import Link from "next/link";
import { lancamentosPorMes, listarCartoes, somar } from "@/lib/financas";
import { ESCOPOS, LABEL_ESCOPO, formatarMoeda } from "@/lib/formatacao";
import { mes as lerMes } from "@/lib/validacao";
import { siglaMes, somarMeses } from "@/lib/meses";
import { EmptyState } from "@/components/empty-state";
import { Bolinha, SeletorMes, montarHref } from "@/components/seletores";
import { classeBotaoPrimario, classeCard, classeCardHover, classeTabela, classeTituloPagina, classeTituloSecao } from "@/lib/estilos";

export default async function CartoesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const mes = lerMes((await searchParams).mes);
  const meses = Array.from({ length: 6 }, (_, i) => somarMeses(mes, i - 5));
  const [cartoes, porMes] = await Promise.all([listarCartoes(), lancamentosPorMes(meses)]);

  const doMes = porMes[mes];
  const semCartao = doMes.filter((item) => !item.cartaoId);
  const totalNoCartao = somar(doMes.filter((item) => item.cartaoId));
  const totalCartao = (id: string | null, m: string) => somar(porMes[m].filter((item) => (id === null ? !item.cartaoId : item.cartaoId === id)));

  return (
    <div className="max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className={classeTituloPagina}>Cartões de crédito</h1>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorMes base="/cartoes" mes={mes} />
          <Link href="/cartoes/novo" className={classeBotaoPrimario}>
            Novo cartão
          </Link>
        </div>
      </div>

      {cartoes.length === 0 ? (
        <EmptyState
          mensagem="Cadastre cada cartão de crédito para ver quanto foi gasto em cada um e importar a fatura no cartão certo."
          acaoHref="/cartoes/novo"
          acaoLabel="Novo cartão"
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-texto-secundario">
            Gasto no cartão em cada mês, pela data da compra (as parcelas entram no mês em que são cobradas). Os dias de fechamento e vencimento
            são só informativos: o total não segue o ciclo da fatura.
          </p>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cartoes.map((cartao) => {
              const itens = doMes.filter((item) => item.cartaoId === cartao.id);
              return (
                <div key={cartao.id} className={`${classeCardHover} flex flex-col`}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{cartao.nome}</p>
                      <p className="inline-flex items-center gap-1.5 text-xs text-texto-secundario">
                        <Bolinha escopo={cartao.escopo} />
                        {LABEL_ESCOPO[cartao.escopo]}
                        {cartao.diaFechamento ? ` · fecha dia ${cartao.diaFechamento}` : ""}
                        {cartao.diaVencimento ? ` · vence dia ${cartao.diaVencimento}` : ""}
                      </p>
                    </div>
                    <Link href={`/cartoes/${cartao.id}/editar`} className="text-sm text-accent hover:underline" aria-label={`Editar ${cartao.nome}`}>
                      Editar
                    </Link>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight">{formatarMoeda(somar(itens))}</p>
                  <p className="mb-3 text-xs text-texto-secundario">
                    {itens.length} {itens.length === 1 ? "lançamento" : "lançamentos"} no mês
                  </p>
                  <ul className="mb-3 space-y-1 text-sm">
                    {ESCOPOS.map((escopo) => {
                      const valor = somar(itens.filter((item) => item.escopo === escopo));
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
                  <Link href={montarHref("/lancamentos", { mes, cartao: cartao.id })} className="mt-auto text-sm text-accent hover:underline">
                    Ver lançamentos do cartão
                  </Link>
                </div>
              );
            })}

            <div className={`${classeCard} flex flex-col`}>
              <p className="font-semibold">Sem cartão</p>
              <p className="text-xs text-texto-secundario">Débito, Pix, dinheiro e contas fixas</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{formatarMoeda(somar(semCartao))}</p>
              <p className="mb-3 text-xs text-texto-secundario">
                {semCartao.length} {semCartao.length === 1 ? "lançamento" : "lançamentos"} no mês
              </p>
              <Link href={montarHref("/lancamentos", { mes, cartao: "SEM" })} className="mt-auto text-sm text-accent hover:underline">
                Ver lançamentos sem cartão
              </Link>
            </div>
          </div>

          <h2 className={`${classeTituloSecao} mb-3`}>Últimos 6 meses</h2>
          <div className={classeTabela}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 text-left text-xs uppercase tracking-wide text-texto-secundario">
                  <th className="px-4 py-3 font-semibold">Cartão</th>
                  {meses.map((m) => (
                    <th key={m} className="px-4 py-3 text-right font-semibold">
                      {siglaMes(m)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cartoes.map((cartao) => (
                  <tr key={cartao.id} className="border-b border-slate-200/50 hover:bg-white/60">
                    <td className="px-4 py-2.5 font-medium">{cartao.nome}</td>
                    {meses.map((m) => (
                      <td key={m} className={`px-4 py-2.5 text-right tabular-nums ${m === mes ? "font-semibold" : ""}`}>
                        {formatarMoeda(totalCartao(cartao.id, m))}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b border-slate-200/50 hover:bg-white/60">
                  <td className="px-4 py-2.5 text-texto-secundario">Sem cartão</td>
                  {meses.map((m) => (
                    <td key={m} className={`px-4 py-2.5 text-right tabular-nums text-texto-secundario ${m === mes ? "font-semibold" : ""}`}>
                      {formatarMoeda(totalCartao(null, m))}
                    </td>
                  ))}
                </tr>
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="px-4 py-3">Total nos cartões</td>
                  {meses.map((m) => (
                    <td key={m} className="px-4 py-3 text-right tabular-nums">
                      {formatarMoeda(somar(porMes[m].filter((item) => item.cartaoId)))}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-2 text-xs text-texto-secundario">No mês aberto: {formatarMoeda(totalNoCartao)} nos cartões.</p>
        </>
      )}
    </div>
  );
}
