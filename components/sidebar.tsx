"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  IconeResumo,
  IconeLancamentos,
  IconeEntradas,
  IconeContas,
  IconeParcelados,
  IconeCartoes,
  IconeDividas,
  IconePrevisao,
  IconeOrcamento,
  IconeMetas,
  IconeImportar,
  IconeConfiguracoes,
  IconeNovoGasto,
  IconeNovaEntrada,
  IconeMenuRecolher,
  IconeMenuExpandir,
  IconeNuvem,
  IconeSetas,
} from "@/components/icones";
import { useAbertura } from "@/lib/use-abertura";
import { aplicarMenuRecolhido } from "@/lib/preferencias-menu";
import { COR_ESCOPO, LABEL_VISAO, VISOES, formatarMoedaCheia } from "@/lib/formatacao";
import type { DadosMenu } from "@/lib/menu";

type Item = { href: string; label: string; Icone: (p: { className?: string }) => React.ReactNode; aviso?: keyof Avisos };
type Avisos = { contas: number; entradas: number };

/** Menu em grupos, como nas referências: títulos curtos e itens com ícone. */
const grupos: { titulo: string; itens: Item[] }[] = [
  {
    titulo: "Principal",
    itens: [
      { href: "/", label: "Resumo", Icone: IconeResumo },
      { href: "/lancamentos", label: "Lançamentos", Icone: IconeLancamentos },
      { href: "/entradas", label: "Entradas", Icone: IconeEntradas, aviso: "entradas" },
    ],
  },
  {
    titulo: "Contas e cartões",
    itens: [
      { href: "/contas", label: "Contas fixas", Icone: IconeContas, aviso: "contas" },
      { href: "/cartoes", label: "Cartões", Icone: IconeCartoes },
      { href: "/parcelados", label: "Parcelados", Icone: IconeParcelados },
      { href: "/dividas", label: "Dívidas e acordos", Icone: IconeDividas },
    ],
  },
  {
    titulo: "Planejamento",
    itens: [
      { href: "/previsao", label: "Previsão", Icone: IconePrevisao },
      { href: "/orcamento", label: "Orçamento e limites", Icone: IconeOrcamento },
      { href: "/metas", label: "Metas e reserva", Icone: IconeMetas },
    ],
  },
];

/** Atalhos para as ações mais comuns (não marcam página atual). */
const atalhos: Item[] = [
  { href: "/lancamentos/novo", label: "Novo gasto", Icone: IconeNovoGasto },
  { href: "/entradas/nova", label: "Nova entrada", Icone: IconeNovaEntrada },
  { href: "/importar", label: "Importar extrato", Icone: IconeImportar },
];

const configuracoes: Item = { href: "/configuracoes", label: "Configurações", Icone: IconeConfiguracoes };

/** Atalhos da barra inferior no celular. */
const itensInferiores = [
  { href: "/", label: "Resumo", Icone: IconeResumo },
  { href: "/lancamentos", label: "Lançamentos", Icone: IconeLancamentos },
  { href: "/cartoes", label: "Cartões", Icone: IconeCartoes },
  { href: "/contas", label: "Contas", Icone: IconeContas },
  { href: "/previsao", label: "Previsão", Icone: IconePrevisao },
];

/** Telas que aceitam a visão (Família, Eu, Esposa, Casa) pela URL. */
const COM_VISAO = ["/", "/lancamentos", "/entradas", "/contas", "/parcelados", "/dividas", "/previsao", "/orcamento"];

function estaAtivo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/importar") return pathname.startsWith("/importar");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Marca() {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-accent to-sky-400 text-base font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_6px_14px_-6px_rgb(37_99_235/0.7)]"
      >
        R$
      </span>
      <span className="menu-rotulo flex min-w-0 flex-col leading-tight">
        <span className="menu-forte truncate text-[16px] font-semibold tracking-tight">Finanças da Casa</span>
        <span className="menu-fraco truncate text-xs">Eu · Esposa · Casa</span>
      </span>
    </span>
  );
}

function Selo({ total, recolhido = false }: { total: number; recolhido?: boolean }) {
  if (total <= 0) return null;
  return recolhido ? (
    <span aria-hidden="true" className="menu-selo-ponto absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-critico ring-2" />
  ) : (
    <span className="menu-rotulo ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-critico px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
      {total}
    </span>
  );
}

/** Link do menu: no modo recolhido mostra só o ícone e o nome aparece num balão ao passar o mouse. */
function LinkMenu({ item, ativo, avisos }: { item: Item; ativo: boolean; avisos: Avisos }) {
  const total = item.aviso ? avisos[item.aviso] : 0;
  return (
    <Link
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      aria-label={total ? `${item.label} (${total} ${total === 1 ? "pendente" : "pendentes"})` : undefined}
      className={`menu-item group relative flex h-9 items-center gap-3 rounded-xl px-3 text-sm ${ativo ? "font-semibold" : "font-medium"}`}
    >
      <span className="relative grid w-5 shrink-0 place-items-center transition-transform duration-200 group-hover:scale-110">
        <item.Icone />
      </span>
      <span className="menu-rotulo flex-1 truncate">{item.label}</span>
      <Selo total={total} />
      <span className="menu-so-recolhido">
        <Selo total={total} recolhido />
      </span>
      <span role="tooltip" className="menu-dica pointer-events-none absolute left-[calc(100%+14px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium">
        {item.label}
        {total > 0 && ` · ${total}`}
      </span>
    </Link>
  );
}

/**
 * Lista do menu com um destaque que desliza até o item da tela atual (em vez
 * de pular). A posição é medida no próprio container, então funciona com os
 * grupos e com o menu recolhido.
 */
function ListaMenu({ pathname, avisos, recolhido }: { pathname: string; avisos: Avisos; recolhido: boolean }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [indicador, setIndicador] = useState<{ top: number; height: number } | null>(null);

  const medir = useCallback(() => {
    const atual = caixa.current?.querySelector<HTMLElement>('[data-principal] [aria-current="page"]');
    if (!caixa.current || !atual) return setIndicador(null);
    const base = caixa.current.getBoundingClientRect();
    const alvo = atual.getBoundingClientRect();
    setIndicador({ top: alvo.top - base.top, height: alvo.height });
  }, []);

  useLayoutEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [medir, pathname, recolhido]);

  return (
    <div ref={caixa} className="relative px-3 py-2">
      <span
        aria-hidden="true"
        className="menu-indicador indicador-menu pointer-events-none absolute inset-x-3 rounded-xl transition-[transform,height,opacity] duration-[420ms] ease-[cubic-bezier(0.3,1.3,0.4,1)]"
        style={{ transform: `translateY(${indicador?.top ?? 0}px)`, height: indicador?.height ?? 0, opacity: indicador ? 1 : 0, top: 0 }}
      />
      <div data-principal className="relative">
        {grupos.map((grupo) => (
          <div key={grupo.titulo} className="mb-2">
            <p className="menu-secao px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]">
              <span className="menu-rotulo">{grupo.titulo}</span>
            </p>
            <ul className="space-y-0.5">
              {grupo.itens.map((item) => (
                <li key={item.href}>
                  <LinkMenu item={item} ativo={estaAtivo(pathname, item.href)} avisos={avisos} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="relative mb-2">
        <p className="menu-secao px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]">
          <span className="menu-rotulo">Atalhos</span>
        </p>
        <ul className="space-y-0.5">
          {atalhos.map((item) => (
            <li key={item.href}>
              <LinkMenu item={item} ativo={false} avisos={avisos} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Troca a visão (Família, Eu, Esposa, Casa) da tela aberta, mantendo o mês e os filtros. */
function SeletorVisaoMenu({ pathname }: { pathname: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const painel = useAbertura(aberto, 160);
  const caixa = useRef<HTMLDivElement>(null);
  const disponivel = COM_VISAO.includes(pathname);
  const atual = (VISOES as readonly string[]).includes(params.get("visao") ?? "") ? params.get("visao")! : "TODOS";

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fechar);
    document.addEventListener("keydown", fechar);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("keydown", fechar);
    };
  }, [aberto]);

  function escolher(visao: string) {
    const novos = new URLSearchParams(params.toString());
    if (visao === "TODOS") novos.delete("visao");
    else novos.set("visao", visao);
    const query = novos.toString();
    setAberto(false);
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  const bolinhas = (visao: string) =>
    visao === "TODOS" ? (
      <span aria-hidden="true" className="flex -space-x-1">
        {["EU", "ESPOSA", "CASA"].map((e) => (
          <span key={e} className="menu-anel h-3 w-3 rounded-full ring-2" style={{ background: COR_ESCOPO[e] }} />
        ))}
      </span>
    ) : (
      <span aria-hidden="true" className="menu-anel h-3 w-3 rounded-full ring-2" style={{ background: COR_ESCOPO[visao] }} />
    );

  return (
    <div ref={caixa} className="menu-rotulo relative px-3 pb-1">
      <button
        type="button"
        disabled={!disponivel}
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        title={disponivel ? "Trocar a visão desta tela" : "Esta tela não separa por pessoa"}
        className="menu-cartao flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left disabled:cursor-default"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/80 shadow-sm">{bolinhas(disponivel ? atual : "TODOS")}</span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="menu-forte block truncate text-sm font-semibold">{disponivel ? LABEL_VISAO[atual] : "Família"}</span>
          <span className="menu-fraco block truncate text-xs">{disponivel ? "visão desta tela" : "visão geral"}</span>
        </span>
        {disponivel && (
          <span className="menu-fraco">
            <IconeSetas className="h-4 w-4" />
          </span>
        )}
      </button>
      {painel.montado && (
        <ul
          role="listbox"
          aria-label="Visão"
          className={`menu-flutuante absolute inset-x-3 top-[calc(100%+4px)] z-50 rounded-2xl p-1.5 ${painel.fechando ? "animar-sumir" : "animar-surgir"}`}
        >
          {VISOES.map((visao) => (
            <li key={visao}>
              <button
                type="button"
                role="option"
                aria-selected={visao === atual}
                onClick={() => escolher(visao)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${visao === atual ? "bg-accent text-white" : "text-texto-principal hover:bg-slate-900/5"}`}
              >
                <span className="grid w-6 place-items-center">{bolinhas(visao)}</span>
                {LABEL_VISAO[visao]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Cartão do orçamento do mês da família (como o "espaço usado" das referências). */
function CartaoOrcamento({ orcamento }: { orcamento: DadosMenu["orcamento"] }) {
  const { gasto, total } = orcamento;
  const pct = total > 0 ? Math.round((gasto / total) * 100) : 0;
  const estourou = total > 0 && gasto > total;
  return (
    <Link href="/orcamento" className="menu-rotulo menu-cartao mx-3 mb-2 mt-2 block shrink-0 rounded-2xl p-3">
      <span className="menu-forte block text-sm font-semibold">Orçamento do mês</span>
      {total > 0 ? (
        <>
          <span className="menu-fraco block text-xs">
            {formatarMoedaCheia(gasto)} de {formatarMoedaCheia(total)}
          </span>
          <span className="mt-2.5 flex items-center gap-2">
            <span className="menu-trilho h-1.5 flex-1 overflow-hidden rounded-full">
              <span className={`block h-full rounded-full ${estourou ? "bg-critico" : "menu-barra"}`} style={{ width: `${Math.min(100, pct)}%` }} />
            </span>
            <span className={`text-xs font-semibold tabular-nums ${estourou ? "text-critico" : "menu-forte"}`}>{pct}%</span>
          </span>
        </>
      ) : (
        <span className="menu-fraco block text-xs">Nenhum orçamento definido. Toque para definir.</span>
      )}
    </Link>
  );
}

/** Rodapé: situação da cópia de segurança. */
function Rodape({ ultimoBackup, recolhido, alternar }: { ultimoBackup: string | null; recolhido: boolean; alternar: () => void }) {
  const [agora] = useState(() => Date.now());
  const horas = ultimoBackup ? (agora - Date.parse(ultimoBackup)) / 3_600_000 : Infinity;
  const quando = !ultimoBackup
    ? "nunca feito"
    : horas < 24
      ? `hoje às ${new Date(ultimoBackup).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
      : `há ${Math.floor(horas / 24)} ${Math.floor(horas / 24) === 1 ? "dia" : "dias"}`;
  const atrasado = horas > 48;
  return (
    <div className="menu-rodape flex shrink-0 items-center gap-2 border-t px-3 py-2.5">
      <Link href="/configuracoes" className="menu-item group relative flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${atrasado ? "bg-critico/15 text-critico" : "menu-avatar"}`}>
          <IconeNuvem />
        </span>
        <span className="menu-rotulo min-w-0 leading-tight">
          <span className="menu-forte block truncate text-sm font-semibold">Backup</span>
          <span className={`block truncate text-xs ${atrasado ? "font-semibold text-critico" : "menu-fraco"}`}>{quando}</span>
        </span>
        <span role="tooltip" className="menu-dica pointer-events-none absolute left-[calc(100%+14px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium">
          Backup {quando} · Configurações
        </span>
      </Link>
      <button
        type="button"
        onClick={alternar}
        aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
        title={recolhido ? "Expandir menu" : "Recolher menu"}
        className="menu-item menu-rotulo grid h-9 w-9 shrink-0 place-items-center rounded-xl"
      >
        <IconeMenuRecolher />
      </button>
    </div>
  );
}

/**
 * Navegação do sistema. No computador: menu lateral flutuante, em grupos, que
 * pode ser recolhido num trilho só de ícones (a preferência fica guardada) e
 * tem três temas (vidro, azul, escuro — Configurações). Em telas estreitas:
 * barra superior, menu completo por cima do conteúdo e barra inferior.
 */
export function Sidebar({ dados }: { dados: DadosMenu }) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const gaveta = useAbertura(menuAberto, 220);
  const [rotaDoMenu, setRotaDoMenu] = useState(pathname);
  const [recolhido, setRecolhido] = useState(false);
  const avisos: Avisos = { contas: dados.contasPendentes, entradas: dados.entradasAConfirmar };

  // O estado real vem do atributo que o script do <head> aplicou antes da pintura.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o atributo aplicado antes da hidratação
    setRecolhido(document.documentElement.dataset.menuRecolhido === "1");
  }, []);

  function alternarRecolhido() {
    const novo = !recolhido;
    setRecolhido(novo);
    aplicarMenuRecolhido(novo);
  }

  // Fecha o menu do celular ao trocar de página.
  if (rotaDoMenu !== pathname) {
    setRotaDoMenu(pathname);
    setMenuAberto(false);
  }

  useEffect(() => {
    if (!menuAberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
    window.addEventListener("keydown", fechar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fechar);
      document.body.style.overflow = "";
    };
  }, [menuAberto]);

  const ativoConfig = estaAtivo(pathname, configuracoes.href);

  return (
    <>
      {/* Computador */}
      <nav aria-label="Menu principal" className="menu-lateral menu-desktop vidro-forte hidden md:flex shrink-0 m-4 mr-0 rounded-3xl h-[calc(100vh-2rem)] sticky top-4 flex-col overflow-hidden">
        <div className="menu-topo flex items-center justify-between gap-2 px-3 pb-3 pt-4">
          <Link href="/" className="min-w-0 rounded-2xl px-1.5 py-1" aria-label="Finanças da Casa — Resumo">
            <Marca />
          </Link>
          <button
            type="button"
            onClick={alternarRecolhido}
            aria-label="Expandir menu"
            title="Expandir menu"
            className="menu-item menu-so-recolhido h-8 w-8 place-items-center rounded-lg"
          >
            <IconeMenuExpandir className="h-4 w-4" />
          </button>
        </div>

        <Suspense fallback={<div className="menu-rotulo mx-3 mb-1 h-14 rounded-2xl" />}>
          <SeletorVisaoMenu pathname={pathname} />
        </Suspense>

        {/* Só a lista rola; o cartão do orçamento e o rodapé ficam sempre à vista. */}
        <div className="menu-meio min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <ListaMenu pathname={pathname} avisos={avisos} recolhido={recolhido} />
        </div>

        <CartaoOrcamento orcamento={dados.orcamento} />
        <div className="shrink-0 px-3 pb-1">
          <LinkMenu item={configuracoes} ativo={ativoConfig} avisos={avisos} />
        </div>
        <Rodape ultimoBackup={dados.ultimoBackup} recolhido={recolhido} alternar={alternarRecolhido} />
      </nav>

      {/* Celular: barra superior */}
      <header className="vidro-forte md:hidden sticky top-2 z-40 mx-2 flex items-center gap-3 rounded-2xl px-4 py-2.5">
        <Link href="/" className="flex min-w-0 flex-1 items-center" aria-label="Finanças da Casa — Resumo">
          <Marca />
        </Link>
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          aria-controls="menu-celular"
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-texto-principal hover:bg-white/70"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
          {avisos.contas + avisos.entradas > 0 && <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-critico ring-2 ring-white" />}
        </button>
      </header>

      {/* Celular: menu completo por cima do conteúdo */}
      {gaveta.montado && (
        <div className="md:hidden fixed inset-0 z-50 flex p-2">
          <button
            type="button"
            aria-label="Fechar menu"
            className={`absolute inset-0 bg-slate-900/25 backdrop-blur-[3px] ${gaveta.fechando ? "animar-esmaecer-sair" : "animar-esmaecer-entrar"}`}
            onClick={() => setMenuAberto(false)}
          />
          <nav
            id="menu-celular"
            aria-label="Menu principal"
            className={`menu-lateral vidro-forte relative flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto rounded-3xl ${
              gaveta.fechando ? "animar-sair-esquerda" : "animar-entrar-esquerda"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-4">
              <Marca />
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                className="menu-item grid h-9 w-9 place-items-center rounded-xl"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <ListaMenu pathname={pathname} avisos={avisos} recolhido={false} />
            <CartaoOrcamento orcamento={dados.orcamento} />
            <div className="px-3 pb-3">
              <LinkMenu item={configuracoes} ativo={ativoConfig} avisos={avisos} />
            </div>
          </nav>
        </div>
      )}

      {/* Celular: atalhos na barra inferior */}
      <nav
        aria-label="Atalhos"
        className="vidro-forte md:hidden fixed inset-x-2 bottom-2 z-40 grid grid-cols-5 rounded-2xl pb-[env(safe-area-inset-bottom)]"
      >
        {itensInferiores.map((item) => {
          const ativo = estaAtivo(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] ${
                ativo ? "font-semibold text-accent" : "text-texto-secundario hover:text-texto-principal"
              }`}
            >
              <item.Icone />
              {item.label}
              {item.href === "/contas" && avisos.contas > 0 && (
                <span aria-hidden="true" className="absolute right-[calc(50%-1rem)] top-1.5 h-2 w-2 rounded-full bg-critico ring-2 ring-white" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
