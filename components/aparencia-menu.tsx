"use client";

import { useEffect, useState } from "react";
import { aplicarMenuRecolhido, aplicarTemaMenu } from "@/lib/preferencias-menu";

const TEMAS = [
  { valor: "vidro", rotulo: "Vidro", amostra: "linear-gradient(180deg, rgb(255 255 255 / 0.85), rgb(255 255 255 / 0.55))", texto: "#0f172a" },
  { valor: "azul", rotulo: "Azul", amostra: "linear-gradient(165deg, #3468f2, #1d43c2)", texto: "#ffffff" },
  { valor: "escuro", rotulo: "Escuro", amostra: "linear-gradient(180deg, #1d1f27, #15161c)", texto: "#f1f5f9" },
] as const;

/** Escolha do tema do menu lateral e do modo recolhido; fica guardada neste navegador. */
export function AparenciaMenu() {
  const [tema, setTema] = useState("vidro");
  const [recolhido, setRecolhido] = useState(false);

  useEffect(() => {
    const d = document.documentElement;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o que o script do <head> aplicou
    setTema(d.dataset.menuTema ?? "vidro");
    setRecolhido(d.dataset.menuRecolhido === "1");
  }, []);

  function escolher(valor: string) {
    setTema(valor);
    aplicarTemaMenu(valor);
  }

  function alternar(valor: boolean) {
    setRecolhido(valor);
    aplicarMenuRecolhido(valor);
  }

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Tema do menu" className="grid grid-cols-3 gap-3 sm:max-w-md">
        {TEMAS.map((t) => (
          <button
            key={t.valor}
            type="button"
            role="radio"
            aria-checked={tema === t.valor}
            onClick={() => escolher(t.valor)}
            className={`rounded-2xl border p-2 text-left ${tema === t.valor ? "border-accent ring-2 ring-accent/30" : "border-slate-200 hover:border-slate-300"}`}
          >
            <span className="mb-2 flex h-16 flex-col justify-between rounded-xl p-2 shadow-sm" style={{ background: t.amostra, color: t.texto }}>
              <span className="h-1.5 w-8 rounded-full bg-current opacity-80" />
              <span className="space-y-1">
                <span className="block h-1 w-10 rounded-full bg-current opacity-40" />
                <span className="block h-1 w-7 rounded-full bg-current opacity-40" />
              </span>
            </span>
            <span className="text-sm font-medium">{t.rotulo}</span>
          </button>
        ))}
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={recolhido} onChange={(e) => alternar(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
        Menu recolhido (só ícones; o nome aparece ao passar o mouse)
      </label>
    </div>
  );
}
