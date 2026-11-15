"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconeResumo,
  IconeLancamentos,
  IconeEntradas,
  IconeContas,
  IconeParcelados,
  IconeCartoes,
  IconeOrcamento,
  IconeMetas,
  IconeImportar,
  IconeConfiguracoes,
} from "@/components/icones";
import { useAbertura } from "@/lib/use-abertura";

const itens = [
  { href: "/", label: "Resumo", Icone: IconeResumo },
  { href: "/lancamentos", label: "Lançamentos", Icone: IconeLancamentos },
  { href: "/entradas", label: "Entradas", Icone: IconeEntradas },
  { href: "/contas", label: "Contas fixas", Icone: IconeContas },
  { href: "/parcelados", label: "Parcelados", Icone: IconeParcelados },
  { href: "/cartoes", label: "Cartões", Icone: IconeCartoes },
  { href: "/orcamento", label: "Orçamento e limites", Icone: IconeOrcamento },
  { href: "/metas", label: "Metas e reserva", Icone: IconeMetas },
  { href: "/importar", label: "Importar extrato", Icone: IconeImportar },
  { href: "/configuracoes", label: "Configurações", Icone: IconeConfiguracoes },
];

/** Atalhos da barra inferior no celular. */
const itensInferiores = [
  { href: "/", label: "Resumo", Icone: IconeResumo },
  { href: "/lancamentos", label: "Lançamentos", Icone: IconeLancamentos },
  { href: "/entradas", label: "Entradas", Icone: IconeEntradas },
  { href: "/contas", label: "Contas", Icone: IconeContas },
  { href: "/metas", label: "Metas", Icone: IconeMetas },
];

function estaAtivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center rounded-xl bg-linear-to-br from-accent to-sky-400 font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_6px_14px_-6px_rgb(37_99_235/0.7)] ${
          compacta ? "h-8 w-8 text-sm" : "h-10 w-10 text-base"
        }`}
      >
        R$
      </span>
      <span className="flex flex-col leading-tight">
        <span className={`font-semibold tracking-tight text-texto-principal ${compacta ? "text-base" : "text-[17px]"}`}>
          Finanças da Casa
        </span>
        {!compacta && <span className="text-xs text-texto-secundario">Eu · Esposa · Casa</span>}
      </span>
    </span>
  );
}

/**
 * Lista do menu com um destaque que desliza até o item da tela atual
 * (em vez de pular de um item para outro).
 */
function ListaMenu({ pathname }: { pathname: string }) {
  const lista = useRef<HTMLUListElement>(null);
  const [indicador, setIndicador] = useState<{ top: number; height: number } | null>(null);
  const indiceAtivo = itens.findIndex((item) => estaAtivo(pathname, item.href));

  useLayoutEffect(() => {
    function medir() {
      const item = lista.current?.children[indiceAtivo + 1] as HTMLElement | undefined;
      const link = item?.firstElementChild as HTMLElement | null | undefined;
      setIndicador(item && link ? { top: item.offsetTop + link.offsetTop, height: link.offsetHeight } : null);
    }
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [indiceAtivo]);

  return (
    <ul ref={lista} className="relative flex-1 py-3">
      {/* Destaque deslizante (primeiro filho; os itens vêm depois) */}
      <li
        aria-hidden="true"
        className="indicador-menu pointer-events-none absolute inset-x-3 rounded-xl bg-white/85 ring-1 ring-white shadow-[inset_0_1px_0_white,0_1px_2px_rgb(15_23_42/0.06),0_10px_22px_-10px_rgb(37_99_235/0.45)] transition-[transform,height,opacity] duration-[420ms] ease-[cubic-bezier(0.3,1.3,0.4,1)]"
        style={{
          transform: `translateY(${indicador?.top ?? 0}px)`,
          height: indicador?.height ?? 0,
          opacity: indicador ? 1 : 0,
          top: 0,
        }}
      />
      {itens.map((item) => {
        const ativo = estaAtivo(pathname, item.href);
        return (
          <li key={item.href} className="relative">
            <Link
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`group mx-3 mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-[color,background-color] duration-200 ${
                ativo
                  ? "font-semibold text-accent"
                  : "font-medium text-slate-600 hover:bg-white/50 hover:text-texto-principal"
              }`}
            >
              <span className={`transition-transform duration-200 ${ativo ? "" : "group-hover:translate-x-0.5 group-hover:scale-110"}`}>
                <item.Icone />
              </span>
              <span className="flex-1 transition-transform duration-200 group-hover:translate-x-0.5">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Navegação do sistema. No computador: menu lateral fixo. Em telas estreitas
 * (celular ou janela dividida): barra superior com o nome sempre visível,
 * botão ☰ que abre o menu completo por cima do conteúdo e barra inferior com
 * os atalhos mais usados.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const gaveta = useAbertura(menuAberto, 220);
  const [rotaDoMenu, setRotaDoMenu] = useState(pathname);

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

  return (
    <>
      {/* Computador */}
      <nav className="vidro-forte hidden md:flex w-64 shrink-0 m-4 mr-0 rounded-3xl h-[calc(100vh-2rem)] sticky top-4 flex-col overflow-y-auto">
        <Link href="/" className="mx-3 mt-3 rounded-2xl px-3 py-4" aria-label="Finanças da Casa — Resumo">
          <Marca />
        </Link>
        <ListaMenu pathname={pathname} />
      </nav>

      {/* Celular: barra superior */}
      <header className="vidro-forte md:hidden sticky top-2 z-40 mx-2 flex items-center gap-3 rounded-2xl px-4 py-2.5">
        <Link href="/" className="flex min-w-0 flex-1 items-center" aria-label="Finanças da Casa — Resumo">
          <Marca compacta />
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
        </button>
      </header>

      {/* Celular: menu completo por cima do conteúdo */}
      {gaveta.montado && (
        <div className="md:hidden fixed inset-0 z-50 flex p-2">
          <button
            type="button"
            aria-label="Fechar menu"
            className={`absolute inset-0 bg-slate-900/25 backdrop-blur-[3px] ${
              gaveta.fechando ? "animar-esmaecer-sair" : "animar-esmaecer-entrar"
            }`}
            onClick={() => setMenuAberto(false)}
          />
          <nav
            id="menu-celular"
            className={`vidro-forte relative flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto rounded-3xl ${
              gaveta.fechando ? "animar-sair-esquerda" : "animar-entrar-esquerda"
            }`}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <Marca compacta />
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                className="grid h-9 w-9 place-items-center rounded-xl text-texto-principal hover:bg-white/70"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <ListaMenu pathname={pathname} />
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
            </Link>
          );
        })}
      </nav>
    </>
  );
}
