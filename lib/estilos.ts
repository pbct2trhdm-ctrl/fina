/**
 * Classes compartilhadas. O visual de "vidro líquido" (.vidro, .vidro-forte,
 * .vidro-destaque, .vidro-clicavel) e as animações ficam em app/globals.css.
 */
const campo =
  "rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 shadow-[inset_0_1px_2px_rgb(15_23_42/0.04)] placeholder:text-texto-secundario/60 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent focus:bg-white";

export const classeInput = `w-full ${campo}`;

/**
 * Mesmo visual de classeInput mas sem `w-full` — usar em barras de filtro
 * (selects lado a lado com outros controles), onde `w-full` entraria em
 * conflito com `flex-1`/largura automática dos elementos vizinhos.
 */
export const classeInputAuto = campo;

export const classeBotaoPrimario =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_6px_16px_-6px_rgb(37_99_235/0.6)] hover:bg-accent-hover hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_10px_22px_-8px_rgb(37_99_235/0.7)] hover:-translate-y-px";

export const classeBotaoSecundario =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/80 bg-white/65 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_1px_2px_rgb(15_23_42/0.06)] backdrop-blur-md hover:bg-white hover:text-texto-principal";

export const classeBotaoPerigo =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-critico/25 bg-critico-fundo/80 px-3 py-1.5 text-sm font-medium text-critico hover:bg-red-100";

export const classeBotaoConfirma =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-tranquilo/25 bg-tranquilo-fundo/80 px-3 py-1.5 text-sm font-medium text-tranquilo hover:bg-green-100";

export const classeCard = "vidro rounded-2xl p-5";

/** Cartão que é um link: sobe de leve ao passar o mouse. */
export const classeCardHover = "vidro vidro-clicavel rounded-2xl p-5";

/** Moldura das tabelas (rolagem horizontal em telas estreitas). */
export const classeTabela = "vidro overflow-x-auto rounded-2xl";

export const classeLabel = "block text-sm font-medium mb-1 text-texto-principal";

/**
 * Badge neutro para categorização visual (ex.: tipo do lançamento) — não usar
 * para situação/urgência, que têm cores semânticas próprias em components/selo.tsx.
 */
export const classeBadgeNeutro =
  "inline-flex items-center rounded-full border border-slate-200/80 bg-white/60 px-2 py-0.5 text-xs font-medium text-texto-secundario";

export const classeTituloSecao = "text-base font-semibold tracking-tight text-texto-principal";

export const classeTituloPagina = "text-2xl font-semibold tracking-tight text-texto-principal";
