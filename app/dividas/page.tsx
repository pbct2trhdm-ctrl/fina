import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { naVisao } from "@/lib/financas";
import { LABEL_ESCOPO, formatarMoeda } from "@/lib/formatacao";
import { diferencaMeses, mesAtual, nomeMes, somarMeses } from "@/lib/meses";
import { visao as lerVisao } from "@/lib/validacao";
import { BarraProgresso } from "@/components/barra-progresso";
import { EmptyState } from "@/components/empty-state";
import { Bolinha, SeletorVisao } from "@/components/seletores";
import { Selo } from "@/components/selo";
import { classeBotaoPrimario, classeCard, classeCardHover, classeTituloPagina, classeTituloSecao } from "@/lib/estilos";

export default async function DividasPage({ searchParams }: { searchParams: Promise<{ visao?: string }> }) {
  const visao = lerVisao((await searchParams).visao);
  const atual = mesAtual();
  const dividas = naVisao(await prisma.compraParcelada.findMany({ where: { tipo: "DIVIDA" }, orderBy: { inicio: "asc" } }), visao).map((d) => {
    const pagas = Math.min(d.parcelas, Math.max(0, diferencaMeses(d.inicio, atual) + 1));
    const restantes = d.parcelas - pagas;
    return { ...d, pagas, restantes, saldo: d.valorParcela * restantes, total: d.valorParcela * d.parcelas, quitacao: somarMeses(d.inicio, d.parcelas - 1) };
  });
  const emAberto = dividas.filter((d) => d.restantes > 0);
  const quitadas = dividas.filter((d) => d.restantes === 0);
  const saldoTotal = emAberto.reduce((t, d) => t + d.saldo, 0);
  const mensal = emAberto.filter((d) => d.pagas > 0 || d.inicio === atual).reduce((t, d) => t + d.valorParcela, 0);
  const ultima = emAberto.map((d) => d.quitacao).sort().at(-1);

  const cartao = (d: (typeof dividas)[number]) => (
    <Link key={d.id} href={`/dividas/${d.id}/editar`} className={`${classeCardHover} block`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{d.descricao}</p>
          <p className="inline-flex items-center gap-1.5 text-xs text-texto-secundario">
            <Bolinha escopo={d.escopo} />
            {LABEL_ESCOPO[d.escopo]} · {d.parcelas}× de {formatarMoeda(d.valorParcela)} · total {formatarMoeda(d.total)}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular-nums font-semibold">{formatarMoeda(d.saldo)}</p>
          <p className="text-xs text-texto-secundario">saldo devedor</p>
        </div>
      </div>
      <div className="my-3">
        <BarraProgresso valor={d.pagas} total={d.parcelas} fina rotulo="Parcelas pagas" />
      </div>
      <div className="flex items-center justify-between text-xs text-texto-secundario">
        <span>
          {d.pagas === 0
            ? `Começa em ${nomeMes(d.inicio, true)}`
            : `${d.pagas} de ${d.parcelas} pagas · faltam ${d.restantes}`}
        </span>
        {d.restantes === 0 ? <Selo tom="tranquilo">✓ Quitada</Selo> : <span>quita em {nomeMes(d.quitacao, true)}</span>}
      </div>
    </Link>
  );

  return (
    <div className="max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className={classeTituloPagina}>Dívidas e acordos</h1>
        <Link href="/dividas/nova" className={classeBotaoPrimario}>
          Nova dívida
        </Link>
      </div>
      <div className="mb-4">
        <SeletorVisao base="/dividas" visao={visao} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { rotulo: "Saldo devedor", valor: formatarMoeda(saldoTotal), detalhe: `${emAberto.length} ${emAberto.length === 1 ? "dívida em aberto" : "dívidas em aberto"}` },
          { rotulo: "Parcelas por mês", valor: formatarMoeda(mensal), detalhe: "soma das parcelas em andamento" },
          { rotulo: "Última quitação", valor: ultima ? nomeMes(ultima, true) : "—", detalhe: ultima ? "quando a última dívida termina" : "nenhuma dívida em aberto" },
        ].map((item) => (
          <div key={item.rotulo} className={classeCard}>
            <p className="text-sm text-texto-secundario">{item.rotulo}</p>
            <p className="text-2xl font-semibold tracking-tight">{item.valor}</p>
            <p className="text-xs text-texto-secundario">{item.detalhe}</p>
          </div>
        ))}
      </div>

      {dividas.length === 0 ? (
        <EmptyState
          mensagem="Nenhuma dívida ou acordo cadastrado. Empréstimos, renegociações e acordos pagos em parcelas entram aqui; cada parcela cai nos gastos do mês."
          acaoHref="/dividas/nova"
          acaoLabel="Nova dívida"
        />
      ) : (
        <>
          {emAberto.length > 0 && <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{emAberto.map(cartao)}</div>}
          {quitadas.length > 0 && (
            <>
              <h2 className={`${classeTituloSecao} mb-3 mt-8`}>Quitadas</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{quitadas.map(cartao)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
