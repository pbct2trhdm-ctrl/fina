"use client";

import { useState, useTransition } from "react";
import { lerExtrato, semAcento, sugerirCategoria } from "@/lib/extrato";
import { gastosNoIntervalo, importarGastos } from "@/lib/actions/importacao";
import { CATEGORIAS, ESCOPOS, LABEL_CATEGORIA, LABEL_ESCOPO, formatarMoeda } from "@/lib/formatacao";
import { classeBadgeNeutro, classeBotaoPrimario, classeCard, classeInput, classeInputAuto, classeLabel } from "@/lib/estilos";

type Linha = { escolhida: boolean; duplicada: boolean; data: string; descricao: string; valor: number; categoria: string; escopo: string };

const chave = (data: string, valor: number, descricao: string) => `${data}|${valor.toFixed(2)}|${semAcento(descricao)}`;

export function ImportarExtrato() {
  const [origem, setOrigem] = useState<{ texto: string; nome: string; inverter: boolean } | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [ignorados, setIgnorados] = useState(0);
  const [escopo, setEscopo] = useState<string>("CASA");
  const [erro, setErro] = useState("");
  const [lendo, setLendo] = useState(false);
  const [enviando, iniciarEnvio] = useTransition();

  async function carregar(texto: string, nome: string, inverter: boolean) {
    setErro("");
    setLendo(true);
    try {
      const { gastos, ignorados: fora } = lerExtrato(texto, inverter);
      // Lançamentos já gravados no mesmo intervalo, para marcar os repetidos.
      const existentes = gastos.length ? await gastosNoIntervalo(gastos[gastos.length - 1].data, gastos[0].data) : [];
      const vistos = new Set(existentes.map((g) => chave(g.data, g.valor, g.descricao)));
      setOrigem({ texto, nome, inverter });
      setIgnorados(fora);
      setLinhas(
        gastos.map((g) => {
          const duplicada = vistos.has(chave(g.data, g.valor, g.descricao));
          return { ...g, escolhida: !duplicada, duplicada, categoria: sugerirCategoria(g.descricao), escopo };
        })
      );
    } catch {
      setErro("Não foi possível ler o arquivo.");
    } finally {
      setLendo(false);
    }
  }

  async function aoEscolherArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    const bytes = await arquivo.arrayBuffer();
    let texto: string;
    try {
      texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      // Bancos brasileiros ainda exportam em Latin-1/Windows-1252.
      texto = new TextDecoder("windows-1252").decode(bytes);
    }
    await carregar(texto, arquivo.name, false);
  }

  const alterar = (indice: number, mudanca: Partial<Linha>) =>
    setLinhas((atuais) => atuais.map((linha, i) => (i === indice ? { ...linha, ...mudanca } : linha)));

  function trocarEscopo(novo: string) {
    setEscopo(novo);
    setLinhas((atuais) => atuais.map((linha) => ({ ...linha, escopo: novo })));
  }

  const escolhidas = linhas.filter((linha) => linha.escolhida);
  const duplicadas = linhas.filter((linha) => linha.duplicada).length;

  function importar() {
    setErro("");
    iniciarEnvio(async () => {
      try {
        await importarGastos(escolhidas.map(({ data, descricao, valor, categoria, escopo: de }) => ({ data, descricao, valor, categoria, escopo: de })));
      } catch (e) {
        // redirect() do Next sai por exceção própria; qualquer outra é erro de verdade.
        if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
        if (typeof e === "object" && e && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
        setErro("Não foi possível importar. Tente de novo.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className={`${classeCard} grid grid-cols-1 gap-4 md:grid-cols-2`}>
        <div>
          <label className={classeLabel} htmlFor="arquivo">
            Arquivo do banco ou do cartão (CSV ou OFX)
          </label>
          <input id="arquivo" type="file" accept=".csv,.ofx,.txt,.tsv" onChange={aoEscolherArquivo} className={classeInput} />
        </div>
        <div>
          <label className={classeLabel} htmlFor="escopo-padrao">
            De quem são os gastos
          </label>
          <select id="escopo-padrao" value={escopo} onChange={(e) => trocarEscopo(e.target.value)} className={classeInput}>
            {ESCOPOS.map((opcao) => (
              <option key={opcao} value={opcao}>
                {LABEL_ESCOPO[opcao]}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-texto-secundario md:col-span-2">
          O arquivo é lido neste navegador; só as linhas que você escolher são gravadas. Confira e ajuste antes de importar.
        </p>
      </div>

      {erro && (
        <p role="alert" className="rounded-md border border-critico/30 bg-critico-fundo px-3 py-2 text-sm text-critico">
          ⚠ {erro}
        </p>
      )}
      {lendo && <p className="text-sm text-texto-secundario">Lendo o arquivo…</p>}

      {origem && !lendo && linhas.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-superficie/60 p-8 text-center text-sm text-texto-secundario">
          Nenhum gasto encontrado em “{origem.nome}”. O arquivo precisa ter data, descrição e valor de cada lançamento.
        </div>
      )}

      {origem && linhas.length > 0 && (
        <>
          <p className="text-sm text-texto-secundario">
            <strong className="text-texto-principal">
              {linhas.length} {linhas.length === 1 ? "gasto encontrado" : "gastos encontrados"}
            </strong>{" "}
            em “{origem.nome}”
            {ignorados > 0 && (
              <>
                {" "}
                · {ignorados} de sinal contrário {ignorados === 1 ? "ignorado" : "ignorados"}, como entradas e pagamentos (
                <button type="button" className="font-semibold text-accent hover:underline" onClick={() => carregar(origem.texto, origem.nome, !origem.inverter)}>
                  trocar
                </button>
                )
              </>
            )}
            {duplicadas > 0 && (
              <>
                {" "}
                · {duplicadas} já {duplicadas === 1 ? "lançado, desmarcado" : "lançados, desmarcados"}
              </>
            )}
          </p>

          <div className="max-h-[26rem] overflow-auto rounded-xl border border-slate-200 bg-superficie shadow-xs">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-superficie">
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-texto-secundario">
                  <th className="px-3 py-3" />
                  <th className="px-3 py-3 font-semibold">Data</th>
                  <th className="px-3 py-3 font-semibold">Descrição</th>
                  <th className="px-3 py-3 font-semibold">Categoria</th>
                  <th className="px-3 py-3 font-semibold">De quem</th>
                  <th className="px-3 py-3 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={linha.escolhida}
                        onChange={(e) => alterar(i, { escolhida: e.target.checked })}
                        aria-label={`Importar ${linha.descricao}`}
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                    </td>
                    <td className="px-3 py-2 tabular-nums text-texto-secundario">
                      {linha.data.slice(8)}/{linha.data.slice(5, 7)}/{linha.data.slice(0, 4)}
                    </td>
                    <td className="px-3 py-2">
                      {linha.descricao}
                      {linha.duplicada && <span className={`${classeBadgeNeutro} ml-2`}>já lançado</span>}
                    </td>
                    <td className="px-3 py-2">
                      <select value={linha.categoria} onChange={(e) => alterar(i, { categoria: e.target.value })} aria-label="Categoria" className={`${classeInputAuto} py-1`}>
                        {CATEGORIAS.map((categoria) => (
                          <option key={categoria} value={categoria}>
                            {LABEL_CATEGORIA[categoria]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={linha.escopo} onChange={(e) => alterar(i, { escopo: e.target.value })} aria-label="De quem" className={`${classeInputAuto} py-1`}>
                        {ESCOPOS.map((opcao) => (
                          <option key={opcao} value={opcao}>
                            {LABEL_ESCOPO[opcao]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatarMoeda(linha.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-texto-secundario">
              {escolhidas.length} de {linhas.length} selecionados · {formatarMoeda(escolhidas.reduce((total, linha) => total + linha.valor, 0))}
            </p>
            <button
              type="button"
              onClick={importar}
              disabled={escolhidas.length === 0 || enviando}
              className={`${classeBotaoPrimario} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {enviando ? "Importando…" : `Importar ${escolhidas.length} ${escolhidas.length === 1 ? "gasto" : "gastos"}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
