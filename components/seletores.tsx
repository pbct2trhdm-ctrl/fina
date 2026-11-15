import Link from "next/link";
import { LABEL_VISAO, VISOES, COR_ESCOPO, type VisaoChave } from "@/lib/formatacao";
import { mesAtual, nomeMes, somarMeses } from "@/lib/meses";

/** Monta o endereço da tela mantendo visão e mês; os valores padrão ficam fora da URL. */
export function montarHref(base: string, parametros: { visao?: string; mes?: string; [chave: string]: string | undefined }) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros)) {
    if (!valor) continue;
    if (chave === "visao" && valor === "TODOS") continue;
    if (chave === "mes" && valor === mesAtual()) continue;
    params.set(chave, valor);
  }
  const query = params.toString();
  return `${base}${query ? `?${query}` : ""}`;
}

export function Bolinha({ escopo, anel = false }: { escopo: string; anel?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${anel ? "ring-2 ring-white" : ""}`}
      style={{ background: COR_ESCOPO[escopo] ?? "var(--color-texto-secundario)" }}
    />
  );
}

/** Alterna entre Família, Eu, Esposa e Casa (mesmo controle segmentado da tela de Clientes do escritório). */
export function SeletorVisao({
  base,
  visao,
  mes,
  extras = {},
}: {
  base: string;
  visao: VisaoChave;
  mes?: string;
  extras?: Record<string, string | undefined>;
}) {
  return (
    <div className="vidro inline-flex flex-wrap items-center gap-1 rounded-2xl p-1">
      {VISOES.map((opcao) => {
        const ativo = opcao === visao;
        return (
          <Link
            key={opcao}
            href={montarHref(base, { ...extras, visao: opcao, mes })}
            aria-current={ativo ? "true" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-medium ${
              ativo
                ? "bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_6px_14px_-6px_rgb(37_99_235/0.6)]"
                : "text-texto-secundario hover:bg-white/70 hover:text-texto-principal"
            }`}
          >
            {opcao !== "TODOS" && <Bolinha escopo={opcao} anel={ativo} />}
            {LABEL_VISAO[opcao]}
          </Link>
        );
      })}
    </div>
  );
}

/** Navegação mês a mês, com atalho para voltar ao mês atual. */
export function SeletorMes({
  base,
  mes,
  visao,
  extras = {},
}: {
  base: string;
  mes: string;
  visao?: string;
  extras?: Record<string, string | undefined>;
}) {
  const seta = "grid h-8 w-8 place-items-center rounded-xl text-texto-secundario hover:bg-white/80 hover:text-texto-principal";
  return (
    <div className="inline-flex items-center gap-2">
      {mes !== mesAtual() && (
        <Link href={montarHref(base, { ...extras, visao })} className="text-sm text-accent hover:underline">
          Mês atual
        </Link>
      )}
      <div className="vidro inline-flex items-center gap-1 rounded-2xl p-1">
        <Link href={montarHref(base, { ...extras, visao, mes: somarMeses(mes, -1) })} aria-label="Mês anterior" className={seta}>
          ‹
        </Link>
        <span className="min-w-[9.5rem] text-center text-sm font-semibold">{nomeMes(mes)}</span>
        <Link href={montarHref(base, { ...extras, visao, mes: somarMeses(mes, 1) })} aria-label="Próximo mês" className={seta}>
          ›
        </Link>
      </div>
    </div>
  );
}
