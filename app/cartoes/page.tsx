import Link from "next/link";
import { lancamentosPorMes, listarCartoes, somar } from "@/lib/financas";
import { ESCOPOS, LABEL_ESCOPO, formatarMoeda } from "@/lib/formatacao";
import { mes as lerMes } from "@/lib/validacao";
import { siglaMes, somarMeses } from "@/lib/meses";
import { EmptyState } from "@/components/empty-state";
import { Bolinha, SeletorMes } from "@/components/seletores";
import { classeBotaoPrimario, classeCardHover, classeTabela, classeTituloPagina, classeTituloSecao } from "@/lib/estilos";

export default async function CartoesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const mes = lerMes((await searchParams).mes);
  const meses = Array.from({ length: 6 }, (_, i) => somarMeses(mes, i - 5));
  const [cartoes, porMes] = await Promise.all([listarCartoes(), lancamentosPorMes(meses, { comprasNoCartao: true })]);

  const doMes = porMes[mes];
  const compraDe = (id: string, m: string) => somar(porMes[m].filter((item) => item.cartaoId === id && item.noCartao));
  const pagoDe = (id: string, m: string) => somar(porMes[m].filter((item) => item.cartaoId === id && item.tipo === "FATURA"));

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
          mensagem="Cadastre cada cartão de crédito. As compras ficam na tela do cartão e só o pagamento da fatura entra nos gastos do mês."
          acaoHref="/cartoes/novo"
          acaoLabel="Novo cartão"
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-texto-secundario">
            As compras do cartão ficam aqui, pela data da compra, e <strong>não</strong> entram nos gastos do mês. O que entra é o{" "}
            <strong>pagamento da fatura</strong> (total ou parcial), na data em que foi pago.
          </p>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cartoes.map((cartao) => {
              const compras = doMes.filter((item) => item.cartaoId === cartao.id && item.noCartao);
              return (
                <Link key={cartao.id} href={`/cartoes/${cartao.id}?mes=${mes}`} className={`${classeCardHover} flex flex-col`}>
                  <div className="mb-3">
                    <p className="font-semibold">{cartao.nome}</p>
                    <p className="inline-flex items-center gap-1.5 text-xs text-texto-secundario">
                      <Bolinha escopo={cartao.escopo} />
                      {LABEL_ESCOPO[cartao.escopo]}
                      {cartao.diaFechamento ? ` · fecha dia ${cartao.diaFechamento}` : ""}
                      {cartao.diaVencimento ? ` · vence dia ${cartao.diaVencimento}` : ""}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-xs text-texto-secundario">Compras no mês</dt>
                      <dd className="text-xl font-semibold tracking-tight">{formatarMoeda(somar(compras))}</dd>
                      <dd className="text-xs text-texto-secundario">
                        {compras.length} {compras.length === 1 ? "compra" : "compras"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-texto-secundario">Pago da fatura</dt>
                      <dd className="text-xl font-semibold tracking-tight">{formatarMoeda(pagoDe(cartao.id, mes))}</dd>
                      <dd className="text-xs text-texto-secundario">entra nos gastos</dd>
                    </div>
                  </dl>
                  <ul className="mt-3 space-y-1 text-sm">
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
                </Link>
              );
            })}
          </div>

          <h2 className={`${classeTituloSecao} mb-3`}>Últimos 6 meses</h2>
          <div className={classeTabela}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 text-left text-xs uppercase tracking-wide text-texto-secundario">
                  <th className="px-4 py-3 font-semibold">Cartão</th>
                  <th className="px-4 py-3 font-semibold" />
                  {meses.map((m) => (
                    <th key={m} className="px-4 py-3 text-right font-semibold">
                      {siglaMes(m)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cartoes.flatMap((cartao) => [
                  <tr key={`${cartao.id}-c`} className="hover:bg-white/60">
                    <td className="px-4 pb-0.5 pt-2.5 font-medium">{cartao.nome}</td>
                    <td className="px-4 pb-0.5 pt-2.5 text-texto-secundario">Compras</td>
                    {meses.map((m) => (
                      <td key={m} className={`px-4 pb-0.5 pt-2.5 text-right tabular-nums ${m === mes ? "font-semibold" : ""}`}>
                        {formatarMoeda(compraDe(cartao.id, m))}
                      </td>
                    ))}
                  </tr>,
                  <tr key={`${cartao.id}-p`} className="border-b border-slate-200/50 hover:bg-white/60">
                    <td className="px-4 pb-2.5 pt-0.5" />
                    <td className="px-4 pb-2.5 pt-0.5 text-texto-secundario">Pago</td>
                    {meses.map((m) => (
                      <td key={m} className={`px-4 pb-2.5 pt-0.5 text-right tabular-nums text-texto-secundario ${m === mes ? "font-semibold" : ""}`}>
                        {formatarMoeda(pagoDe(cartao.id, m))}
                      </td>
                    ))}
                  </tr>,
                ])}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
