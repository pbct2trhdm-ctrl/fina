import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { naVisao } from "@/lib/financas";
import { LABEL_CATEGORIA, LABEL_ESCOPO, formatarMoeda } from "@/lib/formatacao";
import { diferencaMeses, mesAtual, nomeMes, somarMeses } from "@/lib/meses";
import { visao as lerVisao } from "@/lib/validacao";
import { BarraProgresso } from "@/components/barra-progresso";
import { EmptyState } from "@/components/empty-state";
import { Bolinha, SeletorVisao } from "@/components/seletores";
import { Selo } from "@/components/selo";
import { classeBotaoPrimario, classeCard, classeCardHover, classeTituloPagina, classeTituloSecao } from "@/lib/estilos";

export default async function ParceladosPage({ searchParams }: { searchParams: Promise<{ visao?: string }> }) {
  const visao = lerVisao((await searchParams).visao);
  const atual = mesAtual();
  const compras = naVisao(await prisma.compraParcelada.findMany({ orderBy: { inicio: "desc" } }), visao).map((compra) => {
    // Parcelas já vencidas até o mês atual (0 se ainda não começou, todas se terminou).
    const pagas = Math.min(compra.parcelas, Math.max(0, diferencaMeses(compra.inicio, atual) + 1));
    return { ...compra, pagas, falta: compra.valorParcela * (compra.parcelas - pagas), ultimo: somarMeses(compra.inicio, compra.parcelas - 1) };
  });
  const emAndamento = compras.filter((compra) => compra.pagas < compra.parcelas);
  const concluidas = compras.filter((compra) => compra.pagas >= compra.parcelas);
  const noMes = emAndamento.filter((compra) => compra.pagas > 0);

  const cartao = (compra: (typeof compras)[number]) => (
    <Link key={compra.id} href={`/parcelados/${compra.id}/editar`} className={`${classeCardHover} block`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{compra.descricao}</p>
          <p className="inline-flex items-center gap-1.5 text-xs text-texto-secundario">
            <Bolinha escopo={compra.escopo} />
            {LABEL_ESCOPO[compra.escopo]} · {LABEL_CATEGORIA[compra.categoria]}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular-nums font-semibold">{formatarMoeda(compra.valorParcela)}</p>
          <p className="text-xs text-texto-secundario">
            {compra.parcelas}× · total {formatarMoeda(compra.valorParcela * compra.parcelas)}
          </p>
        </div>
      </div>
      <div className="my-3">
        <BarraProgresso valor={compra.pagas} total={compra.parcelas} fina rotulo="Parcelas pagas" />
      </div>
      <div className="flex items-center justify-between text-xs text-texto-secundario">
        <span>
          {compra.pagas === 0
            ? `Começa em ${nomeMes(compra.inicio, true)}`
            : `Parcela ${compra.pagas} de ${compra.parcelas} · última em ${nomeMes(compra.ultimo, true)}`}
        </span>
        {compra.pagas >= compra.parcelas ? <Selo tom="tranquilo">✓ Quitada</Selo> : <span>Faltam {formatarMoeda(compra.falta)}</span>}
      </div>
    </Link>
  );

  return (
    <div className="max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className={classeTituloPagina}>Compras parceladas</h1>
        <Link href="/parcelados/novo" className={classeBotaoPrimario}>
          Nova compra
        </Link>
      </div>

      <div className="mb-4">
        <SeletorVisao base="/parcelados" visao={visao} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { rotulo: `Parcelas de ${nomeMes(atual, true)}`, valor: noMes.reduce((t, c) => t + c.valorParcela, 0), detalhe: `${noMes.length} em cobrança` },
          { rotulo: "Ainda a pagar", valor: emAndamento.reduce((t, c) => t + c.falta, 0), detalhe: "soma das parcelas futuras" },
          { rotulo: "Em andamento", valor: null, detalhe: `${emAndamento.length} ${emAndamento.length === 1 ? "compra" : "compras"}` },
        ].map((item) => (
          <div key={item.rotulo} className={classeCard}>
            <p className="text-sm text-texto-secundario">{item.rotulo}</p>
            <p className="text-2xl font-semibold tracking-tight">{item.valor == null ? emAndamento.length : formatarMoeda(item.valor)}</p>
            <p className="text-xs text-texto-secundario">{item.detalhe}</p>
          </div>
        ))}
      </div>

      {compras.length === 0 ? (
        <EmptyState mensagem="Nenhuma compra parcelada nesta visão." acaoHref="/parcelados/novo" acaoLabel="Nova compra" />
      ) : (
        <>
          {emAndamento.length > 0 && <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{emAndamento.map(cartao)}</div>}
          {concluidas.length > 0 && (
            <>
              <h2 className={`${classeTituloSecao} mb-3 mt-8`}>Quitadas</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{concluidas.map(cartao)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
