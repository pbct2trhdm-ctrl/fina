import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { mediaGastosRecentes } from "@/lib/financas";
import { formatarMoeda, formatarMoedaCheia } from "@/lib/formatacao";
import { diferencaMeses, mesAtual, nomeMes } from "@/lib/meses";
import { salvarReserva } from "@/lib/actions/metas";
import { BarraProgresso } from "@/components/barra-progresso";
import { BotaoEnvio } from "@/components/botao-envio";
import { EmptyState } from "@/components/empty-state";
import { classeBotaoPrimario, classeBotaoSecundario, classeCard, classeCardHover, classeInput, classeLabel, classeTituloPagina, classeTituloSecao } from "@/lib/estilos";

export default async function MetasPage() {
  const [reserva, metas, media] = await Promise.all([
    prisma.reserva.findUnique({ where: { id: 1 } }),
    prisma.meta.findMany({ orderBy: { criadoEm: "asc" } }),
    mediaGastosRecentes(),
  ]);
  const atual = mesAtual();
  const guardado = reserva?.valorGuardado ?? 0;
  const mesesMeta = reserva?.mesesMeta ?? 6;
  const cobertura = media.media > 0 ? guardado / media.media : 0;
  const falta = media.media * mesesMeta - guardado;

  return (
    <div className="max-w-4xl">
      <h1 className={`${classeTituloPagina} mb-6`}>Metas e reserva</h1>

      <section className={`${classeCard} mb-8`}>
        <h2 className={`${classeTituloSecao} mb-2`}>Reserva de emergência</h2>
        <p className="text-3xl font-semibold tracking-tight">
          {media.media > 0 ? cobertura.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—"}{" "}
          <span className="text-sm font-normal text-texto-secundario">
            {cobertura === 1 ? "mês" : "meses"} de proteção · meta de {mesesMeta}
          </span>
        </p>
        <div className="my-3 max-w-xl">
          <BarraProgresso valor={cobertura} total={mesesMeta} rotulo="Reserva sobre a meta" />
        </div>
        <p className="text-sm text-texto-secundario">
          {formatarMoeda(guardado)} guardados.{" "}
          {media.media > 0
            ? `Média de gastos da família nos últimos ${media.meses} meses fechados: ${formatarMoeda(media.media)}.`
            : "Ainda não há meses fechados para calcular a média de gastos."}
        </p>
        {media.media > 0 && (
          <p className="mt-1 text-sm text-texto-secundario">
            {falta > 0 ? (
              `Faltam ${formatarMoeda(falta)} para cobrir ${mesesMeta} meses.`
            ) : (
              <strong className="text-tranquilo">✓ Meta de {mesesMeta} meses atingida.</strong>
            )}
          </p>
        )}

        <form action={salvarReserva} className="mt-5 flex flex-wrap items-end gap-4 border-t border-borda-suave pt-4">
          <div className="w-48">
            <label className={classeLabel} htmlFor="valorGuardado">
              Valor guardado hoje (R$)
            </label>
            <input id="valorGuardado" name="valorGuardado" type="number" step="0.01" min={0} required defaultValue={guardado} className={classeInput} />
          </div>
          <div className="w-48">
            <label className={classeLabel} htmlFor="mesesMeta">
              Meta em meses de gastos
            </label>
            <input id="mesesMeta" name="mesesMeta" type="number" step={1} min={1} max={36} required defaultValue={mesesMeta} className={classeInput} />
          </div>
          <BotaoEnvio textoAguardando="Salvando…" className={classeBotaoSecundario}>
            Atualizar reserva
          </BotaoEnvio>
        </form>
      </section>

      <div className="mb-4 flex items-center justify-between">
        <h2 className={classeTituloSecao}>Metas</h2>
        <Link href="/metas/nova" className={classeBotaoPrimario}>
          Nova meta
        </Link>
      </div>

      {metas.length === 0 ? (
        <EmptyState mensagem="Nenhuma meta cadastrada." acaoHref="/metas/nova" acaoLabel="Nova meta" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {metas.map((meta) => {
            const faltaMeta = meta.valorAlvo - meta.valorGuardado;
            const restantes = meta.prazo ? diferencaMeses(atual, meta.prazo) + 1 : 0;
            return (
              <Link key={meta.id} href={`/metas/${meta.id}/editar`} className={`${classeCardHover} block`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{meta.descricao}</p>
                  <p className="text-right tabular-nums">
                    <span className="font-semibold">{formatarMoeda(meta.valorGuardado)}</span>
                    <span className="block text-xs text-texto-secundario">de {formatarMoedaCheia(meta.valorAlvo)}</span>
                  </p>
                </div>
                <div className="my-3">
                  <BarraProgresso valor={meta.valorGuardado} total={meta.valorAlvo} rotulo="Meta guardada" />
                </div>
                <p className="text-xs text-texto-secundario">
                  {Math.floor(Math.min(100, (meta.valorGuardado / meta.valorAlvo) * 100))}% ·{" "}
                  {faltaMeta <= 0 ? (
                    <strong className="text-tranquilo">✓ Meta atingida</strong>
                  ) : (
                    <>
                      faltam {formatarMoeda(faltaMeta)}
                      {meta.prazo &&
                        (restantes > 0 ? (
                          <> · guardar {formatarMoeda(faltaMeta / restantes)} por mês até {nomeMes(meta.prazo, true)}</>
                        ) : (
                          <strong className="text-critico"> · ⚠ prazo vencido em {nomeMes(meta.prazo, true)}</strong>
                        ))}
                    </>
                  )}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
