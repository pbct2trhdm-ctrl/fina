import Link from "next/link";
import { previsao } from "@/lib/previsao";
import { formatarMoeda, LABEL_VISAO } from "@/lib/formatacao";
import { nomeMes } from "@/lib/meses";
import { visao as lerVisao } from "@/lib/validacao";
import { SeletorVisao } from "@/components/seletores";
import { classeCard, classeTabela, classeTituloPagina } from "@/lib/estilos";

export default async function PrevisaoPage({ searchParams }: { searchParams: Promise<{ visao?: string }> }) {
  const visao = lerVisao((await searchParams).visao);
  const { meses, baseVariaveis, mesesBase } = await previsao(visao, 3);
  const linhas: { rotulo: string; chave: keyof (typeof meses)[number]; nota?: string; forte?: boolean; negativo?: boolean }[] = [
    { rotulo: "Entradas fixas previstas", chave: "entradasFixas", nota: "salário e outras entradas fixas em vigor", forte: true },
    { rotulo: "Contas fixas", chave: "contasFixas", nota: "pagas fora do cartão: aluguel, energia…", negativo: true },
    { rotulo: "Parcelas (fora do cartão)", chave: "parcelas", negativo: true },
    { rotulo: "Dívidas e acordos", chave: "dividas", negativo: true },
    { rotulo: "Gastos variáveis (estimativa)", chave: "variaveisEstimados", nota: mesesBase ? `média dos últimos ${mesesBase} ${mesesBase === 1 ? "mês fechado" : "meses fechados"}: gastos avulsos e pagamentos de fatura` : "sem meses fechados para calcular", negativo: true },
    { rotulo: "Total de saídas previstas", chave: "totalSaidas", forte: true, negativo: true },
    { rotulo: "Sobra prevista", chave: "sobra", forte: true },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className={`${classeTituloPagina} mb-1`}>Previsão</h1>
      <p className="mb-4 text-sm text-texto-secundario">
        O que já está comprometido nos próximos meses, para a visão {LABEL_VISAO[visao]}: entradas fixas menos contas fixas, parcelas, dívidas e
        uma estimativa dos gastos variáveis. Compras novas no cartão não estão previstas.
      </p>
      <div className="mb-4">
        <SeletorVisao base="/previsao" visao={visao} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {meses.map((m) => (
          <div key={m.mes} className={`${classeCard} ${m.sobra < 0 ? "border-critico/30" : ""}`}>
            <p className="text-sm text-texto-secundario">{nomeMes(m.mes)}</p>
            <p className={`text-2xl font-semibold tracking-tight ${m.sobra < 0 ? "text-critico" : "text-tranquilo"}`}>
              {m.sobra < 0 ? "−" : "+"}
              {formatarMoeda(Math.abs(m.sobra))}
            </p>
            <p className="text-xs text-texto-secundario">
              {formatarMoeda(m.entradasFixas)} entram · {formatarMoeda(m.totalSaidas)} saem
            </p>
          </div>
        ))}
      </div>

      <div className={classeTabela}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/70 text-left text-xs uppercase tracking-wide text-texto-secundario">
              <th className="px-4 py-3 font-semibold" />
              {meses.map((m) => (
                <th key={m.mes} className="px-4 py-3 text-right font-semibold">
                  {nomeMes(m.mes, true)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.chave} className={`border-b border-slate-200/50 last:border-0 ${linha.forte ? "font-semibold" : ""}`}>
                <td className="px-4 py-2.5">
                  {linha.rotulo}
                  {linha.nota && <span className="block text-xs font-normal text-texto-secundario">{linha.nota}</span>}
                </td>
                {meses.map((m) => {
                  const valor = m[linha.chave] as number;
                  const vermelho = linha.chave === "sobra" && valor < 0;
                  return (
                    <td key={m.mes} className={`px-4 py-2.5 text-right tabular-nums ${vermelho ? "text-critico" : ""}`}>
                      {linha.chave === "sobra" && valor < 0 ? "−" : ""}
                      {linha.negativo && valor > 0 ? "− " : ""}
                      {formatarMoeda(Math.abs(valor))}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="text-texto-secundario">
              <td className="px-4 py-2.5">
                Parcelas e recorrências já comprometidas nos cartões
                <span className="block text-xs">não somam nas saídas: entram quando a fatura for paga</span>
              </td>
              {meses.map((m) => (
                <td key={m.mes} className="px-4 py-2.5 text-right tabular-nums">
                  {formatarMoeda(m.parcelasNoCartao)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-texto-secundario">
        Os gastos variáveis usam a média de {formatarMoeda(baseVariaveis)} por mês. Para melhorar a previsão, cadastre as{" "}
        <Link href="/entradas" className="text-accent hover:underline">
          entradas fixas
        </Link>
        , as{" "}
        <Link href="/contas" className="text-accent hover:underline">
          contas fixas
        </Link>{" "}
        e as{" "}
        <Link href="/dividas" className="text-accent hover:underline">
          dívidas
        </Link>
        .
      </p>
    </div>
  );
}
