import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  contasDoMes,
  lancamentosPorMes,
  limitesDaVisao,
  mediaGastosRecentes,
  naVisao,
  orcamentoDaVisao,
  orcamentos,
  parcelasDoMes,
  somar,
} from "@/lib/financas";
import {
  CATEGORIAS,
  ESCOPOS,
  LABEL_CATEGORIA,
  LABEL_ESCOPO,
  LABEL_TIPO_LANCAMENTO,
  LABEL_VISAO,
  formatarMoeda,
  formatarMoedaCheia,
  type CategoriaChave,
} from "@/lib/formatacao";
import { diasNoMes, diferencaMeses, mesAtual, nomeMes, somarMeses } from "@/lib/meses";
import { hojeIsoLocal } from "@/lib/datas";
import { mes as lerMes, visao as lerVisao } from "@/lib/validacao";
import { alternarPagamento } from "@/lib/actions/contas";
import { BarraProgresso } from "@/components/barra-progresso";
import { BotaoEnvio } from "@/components/botao-envio";
import { EmptyState } from "@/components/empty-state";
import { GraficoMeses } from "@/components/grafico-meses";
import { Bolinha, SeletorMes, SeletorVisao, montarHref } from "@/components/seletores";
import { Selo, SELO_SITUACAO_CONTA } from "@/components/selo";
import {
  classeBotaoConfirma,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeCard,
  classeTituloPagina,
  classeTituloSecao,
} from "@/lib/estilos";

const linkDiscreto = "text-sm text-accent hover:underline";

export default async function ResumoPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string; mes?: string }>;
}) {
  const parametros = await searchParams;
  const visao = lerVisao(parametros.visao);
  const mes = lerMes(parametros.mes);
  const atual = mesAtual();
  const meses = Array.from({ length: 6 }, (_, i) => somarMeses(mes, i - 5));

  const [vazio, porMes, contas, parcelas, mapaOrcamentos, limites, reserva, metas, media] = await Promise.all([
    Promise.all([prisma.gasto.count(), prisma.contaFixa.count(), prisma.compraParcelada.count()]).then(
      (totais) => totais.every((total) => total === 0)
    ),
    lancamentosPorMes(meses),
    contasDoMes(mes),
    parcelasDoMes(mes),
    orcamentos(),
    limitesDaVisao(visao),
    prisma.reserva.findUnique({ where: { id: 1 } }),
    prisma.meta.findMany({ orderBy: { criadoEm: "asc" } }),
    mediaGastosRecentes(),
  ]);

  if (vazio) {
    return (
      <div className="max-w-3xl">
        <h1 className={`${classeTituloPagina} mb-6`}>Resumo</h1>
        <EmptyState
          mensagem="Ainda não há nada lançado. Comece pelo primeiro gasto ou carregue dados de exemplo em Configurações para conhecer o sistema."
          acaoHref="/lancamentos/novo"
          acaoLabel="Novo gasto"
        />
        <p className="mt-4 text-center">
          <Link href="/configuracoes" className={linkDiscreto}>
            Carregar dados de exemplo
          </Link>
        </p>
      </div>
    );
  }

  const lista = naVisao(porMes[mes], visao);
  const total = somar(lista);
  const orcamento = orcamentoDaVisao(mapaOrcamentos, visao);
  const contasVisao = naVisao(contas, visao);
  const aPagar = somar(contasVisao.filter((conta) => conta.situacao !== "PAGA"));
  const livre = orcamento - total - aPagar;
  const parcelasVisao = naVisao(parcelas, visao);
  const aqui = (extras: { visao?: string; mes?: string } = {}) => montarHref("/", { visao, mes, ...extras });

  // Gasto por categoria (categorias com limite aparecem mesmo sem gasto).
  const porCategoria = new Map<CategoriaChave, number>();
  for (const item of lista) porCategoria.set(item.categoria, (porCategoria.get(item.categoria) ?? 0) + item.valor);
  for (const categoria of CATEGORIAS) if (limites[categoria] != null && !porCategoria.has(categoria)) porCategoria.set(categoria, 0);
  const categorias = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]);
  const maiorCategoria = categorias.length && categorias[0][1] > 0 ? categorias[0][1] : 1;

  const series = visao === "TODOS" ? [...ESCOPOS] : [visao];
  const valoresGrafico = meses.map((m) => series.map((serie) => somar(porMes[m].filter((item) => item.escopo === serie))));

  let recado: React.ReactNode;
  if (mes === atual) {
    const dias = diasNoMes(mes) - Number(hojeIsoLocal().slice(8)) + 1;
    recado =
      livre >= 0 ? (
        <>
          Dá para gastar até <strong>{formatarMoeda(livre / dias)}</strong> por dia nos próximos {dias} dias.
        </>
      ) : (
        <>
          <strong className="text-critico">▲ {formatarMoeda(-livre)} acima</strong> do orçamento, contando as contas a pagar.
        </>
      );
  } else if (mes < atual) {
    recado =
      orcamento - total >= 0 ? (
        <>
          <strong className="text-tranquilo">▼ Fechou {formatarMoeda(orcamento - total)} abaixo</strong> do orçamento.
        </>
      ) : (
        <>
          <strong className="text-critico">▲ Fechou {formatarMoeda(total - orcamento)} acima</strong> do orçamento.
        </>
      );
  } else {
    recado = "Mês futuro: só contas fixas e parcelas previstas.";
  }

  const cobertura = media.media > 0 && reserva ? reserva.valorGuardado / media.media : 0;

  return (
    <div className="max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={classeTituloPagina}>Resumo</h1>
          <p className="text-sm text-texto-secundario">
            {visao === "TODOS" ? "Visão geral da família" : `Gastos · ${LABEL_VISAO[visao]}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorMes base="/" mes={mes} visao={visao} />
          <Link href="/importar" className={classeBotaoSecundario}>
            Importar extrato
          </Link>
          <Link href="/lancamentos/novo" className={classeBotaoPrimario}>
            Novo gasto
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <SeletorVisao base="/" visao={visao} mes={mes} />
      </div>

      <div className="animar-cascata grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Gasto no mês */}
        <section className="vidro-destaque rounded-2xl p-5 lg:col-span-5">
          <h2 className="mb-2 text-sm text-texto-secundario">Gasto no mês</h2>
          <p className="text-4xl font-bold tracking-tight">
            {formatarMoeda(total)}{" "}
            <span className="text-sm font-normal text-texto-secundario">/ {formatarMoedaCheia(orcamento)}</span>
          </p>
          <div className="my-3">
            <BarraProgresso valor={total} total={orcamento} alertaAoEstourar rotulo="Gasto sobre o orçamento" />
          </div>
          <p className="text-sm text-texto-secundario">{recado}</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-accent/15 pt-4">
            <div>
              <dt className="text-xs text-texto-secundario">Contas a pagar</dt>
              <dd className="font-semibold">{formatarMoeda(aPagar)}</dd>
            </div>
            <div>
              <dt className="text-xs text-texto-secundario">Livre no mês</dt>
              <dd className="font-semibold">
                {livre < 0 ? "−" : ""}
                {formatarMoeda(Math.abs(livre))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-texto-secundario">Lançamentos</dt>
              <dd className="font-semibold">{lista.length}</dd>
            </div>
          </dl>
        </section>

        {/* Por pessoa (só na visão da família) */}
        {visao === "TODOS" && (
          <section className={`${classeCard} lg:col-span-7`}>
            <h2 className="mb-2 text-sm text-texto-secundario">Por pessoa</h2>
            <ul className="divide-y divide-borda-suave">
              {ESCOPOS.map((escopo) => {
                const gasto = somar(porMes[mes].filter((item) => item.escopo === escopo));
                const limite = mapaOrcamentos[escopo];
                return (
                  <li key={escopo}>
                    <Link
                      href={aqui({ visao: escopo })}
                      className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 rounded-xl px-2 py-3 hover:bg-white/70"
                    >
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <Bolinha escopo={escopo} />
                        {LABEL_ESCOPO[escopo]}
                      </span>
                      <BarraProgresso valor={gasto} total={limite} alertaAoEstourar rotulo={`Gasto de ${LABEL_ESCOPO[escopo]}`} />
                      <span className="text-right tabular-nums">
                        {formatarMoeda(gasto)} <span className="text-xs text-texto-secundario">/ {formatarMoedaCheia(limite)}</span>
                        {gasto > limite && <strong className="ml-1 text-critico">▲</strong>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Categorias */}
        <section className={`${classeCard} ${visao === "TODOS" ? "lg:col-span-5 lg:order-4" : "lg:col-span-7"}`}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm text-texto-secundario">Gastos por categoria</h2>
            <Link href={montarHref("/orcamento", { visao })} className={linkDiscreto}>
              Editar limites
            </Link>
          </div>
          {categorias.length === 0 ? (
            <p className="py-6 text-center text-sm text-texto-secundario">Nenhum gasto neste mês.</p>
          ) : (
            <ul>
              {categorias.map(([categoria, valor]) => {
                const limite = limites[categoria];
                const estourou = limite != null && valor > limite;
                return (
                  <li key={categoria} className="grid grid-cols-[6.5rem_1fr_2.25rem_7.75rem] items-center gap-3 py-1.5 text-sm">
                    <span>{LABEL_CATEGORIA[categoria]}</span>
                    <span>
                      <span
                        className={`animar-barra block h-2 rounded-full ${estourou ? "bg-critico" : "bg-slate-400/80"}`}
                        style={{ width: `${(valor / maiorCategoria) * 100}%`, minWidth: valor > 0 ? 3 : 0 }}
                      />
                    </span>
                    <span className="text-right text-xs text-texto-secundario">{total > 0 ? Math.round((valor / total) * 100) : 0}%</span>
                    <span className="text-right tabular-nums">
                      {formatarMoeda(valor)}
                      {limite != null &&
                        (estourou ? (
                          <span className="block text-[11px] font-semibold text-critico">▲ {formatarMoeda(valor - limite)} acima</span>
                        ) : (
                          <span className="block text-[11px] text-texto-secundario">
                            {limite > 0 ? Math.round((valor / limite) * 100) : 0}% de {formatarMoedaCheia(limite)}
                          </span>
                        ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Últimos 6 meses */}
        <section className={`${classeCard} ${visao === "TODOS" ? "lg:col-span-7 lg:order-3" : "lg:col-span-12"}`}>
          <h2 className="mb-1 text-sm text-texto-secundario">Últimos 6 meses</h2>
          <div className={visao === "TODOS" ? "" : "mx-auto max-w-3xl"}>
            <GraficoMeses meses={meses} series={series} valores={valoresGrafico} mesAtivo={mes} hrefDoMes={(m) => aqui({ mes: m })} />
          </div>
        </section>

        {/* Contas do mês */}
        <section className={`${classeCard} lg:order-5 lg:col-span-6`}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm text-texto-secundario">Contas do mês</h2>
            <Link href={montarHref("/contas", { visao, mes })} className={linkDiscreto}>
              Ver todas
            </Link>
          </div>
          {contasVisao.length === 0 ? (
            <p className="py-6 text-center text-sm text-texto-secundario">Nenhuma conta fixa nesta visão neste mês.</p>
          ) : (
            <ul className="divide-y divide-borda-suave">
              {contasVisao.map((conta) => {
                const selo = SELO_SITUACAO_CONTA[conta.situacao];
                const paga = conta.situacao === "PAGA";
                return (
                  <li key={conta.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-2.5 text-sm">
                    <span>
                      <span className={`font-medium ${paga ? "text-texto-secundario line-through" : ""}`}>{conta.descricao}</span>
                      <span className="block text-xs text-texto-secundario">
                        dia {conta.diaVencimento} · {LABEL_ESCOPO[conta.escopo]}
                      </span>
                    </span>
                    <Selo tom={selo.tom}>{selo.texto}</Selo>
                    <span className={`w-24 text-right tabular-nums ${paga ? "text-texto-secundario" : ""}`}>{formatarMoeda(conta.valor)}</span>
                    <form action={alternarPagamento.bind(null, conta.id, mes, aqui())}>
                      <BotaoEnvio
                        textoAguardando="…"
                        className={`${paga ? classeBotaoSecundario : classeBotaoConfirma} w-[5.25rem]`}
                      >
                        {paga ? "Desfazer" : "Pagar"}
                      </BotaoEnvio>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Parcelas do mês */}
        <section className={`${classeCard} lg:order-6 lg:col-span-6`}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm text-texto-secundario">
              Compras parceladas
              {parcelasVisao.length > 0 && <> · {formatarMoeda(somar(parcelasVisao))} neste mês</>}
            </h2>
            <Link href="/parcelados" className={linkDiscreto}>
              Ver todas
            </Link>
          </div>
          {parcelasVisao.length === 0 ? (
            <p className="py-6 text-center text-sm text-texto-secundario">Nenhuma parcela neste mês.</p>
          ) : (
            <ul className="divide-y divide-borda-suave">
              {parcelasVisao.map((parcela) => (
                <li key={parcela.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-2.5 text-sm">
                  <span>
                    <strong>{parcela.descricao}</strong>{" "}
                    <span className="text-xs text-texto-secundario">
                      · parcela {parcela.numero} de {parcela.parcelas} · {LABEL_ESCOPO[parcela.escopo]}
                    </span>
                    <span className="my-1.5 block">
                      <BarraProgresso valor={parcela.numero} total={parcela.parcelas} fina rotulo="Parcelas pagas" />
                    </span>
                    <span className="text-xs text-texto-secundario">Faltam {formatarMoeda(parcela.falta)}</span>
                  </span>
                  <span className="w-24 text-right tabular-nums">{formatarMoeda(parcela.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Reserva e metas (só na visão da família) */}
        {visao === "TODOS" && (
          <>
            <section className={`${classeCard} lg:order-7 lg:col-span-5`}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm text-texto-secundario">Reserva de emergência</h2>
                <Link href="/metas" className={linkDiscreto}>
                  Atualizar
                </Link>
              </div>
              {!reserva ? (
                <p className="py-6 text-center text-sm text-texto-secundario">Reserva ainda não informada.</p>
              ) : (
                <>
                  <p className="text-2xl font-semibold tracking-tight">
                    {media.media > 0 ? cobertura.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—"}{" "}
                    <span className="text-sm font-normal text-texto-secundario">meses de proteção · meta de {reserva.mesesMeta}</span>
                  </p>
                  <div className="my-3">
                    <BarraProgresso valor={cobertura} total={reserva.mesesMeta} rotulo="Reserva sobre a meta" />
                  </div>
                  <p className="text-sm text-texto-secundario">
                    {formatarMoeda(reserva.valorGuardado)} guardados.{" "}
                    {media.media > 0
                      ? `Média de gastos da família nos últimos ${media.meses} meses fechados: ${formatarMoeda(media.media)}.`
                      : "Ainda não há meses fechados para calcular a média de gastos."}
                  </p>
                </>
              )}
            </section>

            <section className={`${classeCard} lg:order-8 lg:col-span-7`}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm text-texto-secundario">Metas</h2>
                <Link href="/metas" className={linkDiscreto}>
                  Ver todas
                </Link>
              </div>
              {metas.length === 0 ? (
                <p className="py-6 text-center text-sm text-texto-secundario">Nenhuma meta cadastrada.</p>
              ) : (
                <ul className="divide-y divide-borda-suave">
                  {metas.map((meta) => {
                    const falta = meta.valorAlvo - meta.valorGuardado;
                    const restantes = meta.prazo ? diferencaMeses(atual, meta.prazo) + 1 : 0;
                    return (
                      <li key={meta.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-2.5 text-sm">
                        <span>
                          <strong>{meta.descricao}</strong>{" "}
                          <span className="text-xs text-texto-secundario">
                            · {Math.floor(Math.min(100, (meta.valorGuardado / meta.valorAlvo) * 100))}%
                          </span>
                          <span className="my-1.5 block">
                            <BarraProgresso valor={meta.valorGuardado} total={meta.valorAlvo} fina rotulo="Meta guardada" />
                          </span>
                          <span className="text-xs text-texto-secundario">
                            {falta <= 0 ? (
                              <strong className="text-tranquilo">✓ Meta atingida</strong>
                            ) : (
                              <>
                                Faltam {formatarMoeda(falta)}
                                {meta.prazo &&
                                  (restantes > 0 ? (
                                    <> · guardar {formatarMoeda(falta / restantes)} por mês até {nomeMes(meta.prazo, true)}</>
                                  ) : (
                                    <strong className="text-critico"> · ⚠ prazo vencido em {nomeMes(meta.prazo, true)}</strong>
                                  ))}
                              </>
                            )}
                          </span>
                        </span>
                        <span className="text-right tabular-nums">
                          {formatarMoeda(meta.valorGuardado)}
                          <span className="block text-[11px] text-texto-secundario">de {formatarMoedaCheia(meta.valorAlvo)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}

        {/* Últimos lançamentos */}
        <section className={`${classeCard} lg:order-9 lg:col-span-12`}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className={classeTituloSecao}>Últimos lançamentos do mês</h2>
            <Link href={montarHref("/lancamentos", { visao, mes })} className={linkDiscreto}>
              Ver os {lista.length}
            </Link>
          </div>
          {lista.length === 0 ? (
            <p className="py-6 text-center text-sm text-texto-secundario">Nenhum lançamento neste mês.</p>
          ) : (
            <ul className="divide-y divide-borda-suave text-sm">
              {lista.slice(0, 6).map((item) => (
                <li key={`${item.tipo}-${item.id}`} className="grid grid-cols-[3rem_1fr_auto_auto] items-center gap-3 py-2">
                  <span className="tabular-nums text-texto-secundario">
                    {item.data.slice(8)}/{item.data.slice(5, 7)}
                  </span>
                  <span>
                    {item.descricao}
                    <span className="block text-xs text-texto-secundario">
                      {LABEL_CATEGORIA[item.categoria]} · {LABEL_TIPO_LANCAMENTO[item.tipo]}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-texto-secundario">
                    <Bolinha escopo={item.escopo} />
                    {LABEL_ESCOPO[item.escopo]}
                  </span>
                  <span className="w-24 text-right tabular-nums">{formatarMoeda(item.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
