"use client";

import { useState, useTransition } from "react";
import {
  chaveDescricao,
  lerLinhasExtrato,
  parecePagamentoDeFatura,
  pareceTransferencia,
  semAcento,
  separarFatura,
  separarGastos,
  sugerirCategoria,
  sugerirTipoEntrada,
  type LinhaExtrato,
} from "@/lib/extrato";
import { SenhaDoPdfNecessaria, extrairLinhasPdf, lerLinhasDeFatura } from "@/lib/extrato-pdf";
import { hojeIsoLocal } from "@/lib/datas";
import {
  entradasNoIntervalo,
  gastosNoIntervalo,
  importarEntradas,
  importarFatura,
  importarGastos,
  categoriasAprendidas,
  pagamentosDeCartaoNoIntervalo,
  pagamentosNoIntervalo,
} from "@/lib/actions/importacao";
import { CATEGORIAS, ESCOPOS, LABEL_CATEGORIA, LABEL_ESCOPO, LABEL_TIPO_ENTRADA, TIPOS_ENTRADA, formatarMoeda } from "@/lib/formatacao";
import { classeBadgeNeutro, classeBotaoPrimario, classeBotaoSecundario, classeCard, classeInput, classeInputAuto, classeLabel } from "@/lib/estilos";

/** `categoria` guarda a categoria do gasto ou, no modo Entradas, o tipo da entrada. */
type Linha = {
  escolhida: boolean;
  duplicada: boolean;
  /** Em extrato de conta: o débito parece pagar a fatura de um cartão (já conta no cartão). */
  pagamentoFatura?: boolean;
  /** Em extrato de conta: bate com um pagamento de fatura já registrado em um cartão. */
  pagamentoRegistrado?: string;
  /** Movimento entre contas da própria pessoa (não é gasto nem renda). */
  transferencia?: boolean;
  /** Categoria veio de uma regra aprendida com uma correção sua. */
  aprendida?: boolean;
  data: string;
  descricao: string;
  valor: number;
  categoria: string;
  escopo: string;
};
/** Pagamento da fatura de um cartão lido do PDF: entra nos gastos do mês, na data do pagamento. */
type LinhaPagamento = { escolhida: boolean; duplicada: boolean; data: string; descricao: string; valor: number; escopo: string };
type Modo = "GASTOS" | "ENTRADAS";

const chave = (data: string, valor: number, descricao: string) => `${data}|${valor.toFixed(2)}|${semAcento(descricao)}`;

export function ImportarExtrato({ cartoes }: { cartoes: { id: string; nome: string; escopo: string }[] }) {
  // Lançamentos lidos do arquivo, com o sinal original — guardados para o botão "trocar".
  const [origem, setOrigem] = useState<{ brutas: LinhaExtrato[]; nome: string; inverter: boolean; pdf: boolean } | null>(null);
  // PDF protegido aguardando a senha.
  const [pdfComSenha, setPdfComSenha] = useState<{ bytes: Uint8Array; nome: string; errada: boolean } | null>(null);
  const [senha, setSenha] = useState("");
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [pagamentos, setPagamentos] = useState<LinhaPagamento[]>([]);
  const [ignorados, setIgnorados] = useState(0);
  const [escopo, setEscopo] = useState<string>("CASA");
  // O que trazer do arquivo: as saídas (gastos) ou o dinheiro que entrou.
  const [modo, setModo] = useState<Modo>("GASTOS");
  // Cartão de crédito da fatura (em branco = extrato de conta, sem cartão).
  const [cartaoId, setCartaoId] = useState("");
  const [erro, setErro] = useState("");
  const [lendo, setLendo] = useState(false);
  const [enviando, iniciarEnvio] = useTransition();

  async function carregar(
    brutas: LinhaExtrato[],
    nome: string,
    inverter: boolean,
    pdf: boolean,
    modoAtual: Modo = modo,
    cartaoSel: string = cartaoId,
    escopoSel: string = escopo
  ) {
    setErro("");
    setLendo(true);
    try {
      const faturaDeCartao = modoAtual === "GASTOS" && !!cartaoSel;
      const donoDoCartao = cartoes.find((c) => c.id === cartaoSel)?.escopo ?? escopoSel;
      let compras: LinhaExtrato[];
      let lidosPagamentos: LinhaExtrato[] = [];
      let fora: number;
      if (faturaDeCartao) {
        ({ compras, pagamentos: lidosPagamentos, ignorados: fora } = separarFatura(brutas, inverter));
      } else {
        // Entradas são o lado que a separação de gastos descarta: basta inverter a escolha.
        const separado = separarGastos(brutas, inverter !== (modoAtual === "ENTRADAS"));
        compras = separado.gastos;
        fora = separado.ignorados;
      }

      // Lançamentos já gravados no mesmo intervalo, para marcar os repetidos.
      const buscar = modoAtual === "ENTRADAS" ? entradasNoIntervalo : gastosNoIntervalo;
      const extratoDeConta = modoAtual === "GASTOS" && !cartaoSel;
      const [existentes, regras, pagosEmCartoes] = await Promise.all([
        compras.length ? buscar(compras[compras.length - 1].data, compras[0].data) : Promise.resolve([]),
        modoAtual === "GASTOS" ? categoriasAprendidas(compras.map((g) => g.descricao)) : Promise.resolve({} as Record<string, string>),
        extratoDeConta && compras.length ? pagamentosDeCartaoNoIntervalo(compras[compras.length - 1].data, compras[0].data) : Promise.resolve([]),
      ]);
      const vistos = new Set(existentes.map((g) => chave(g.data, g.valor, g.descricao)));
      // Débito da conta que bate (valor igual, até 3 dias de diferença) com um pagamento de fatura já registrado.
      const pagamentoRegistrado = (g: LinhaExtrato) =>
        pagosEmCartoes.find((p) => Math.abs(p.valor - g.valor) < 0.005 && Math.abs(Date.parse(p.data) - Date.parse(g.data)) <= 3 * 86_400_000)?.cartao;
      const jaPagos = new Set<string>();
      if (faturaDeCartao && lidosPagamentos.length) {
        const datas = lidosPagamentos.map((p) => p.data).sort();
        (await pagamentosNoIntervalo(cartaoSel, datas[0], datas[datas.length - 1])).forEach((p) => jaPagos.add(`${p.data}|${p.valor.toFixed(2)}`));
      }

      setOrigem({ brutas, nome, inverter, pdf });
      setIgnorados(fora);
      setLinhas(
        compras.map((g) => {
          const duplicada = vistos.has(chave(g.data, g.valor, g.descricao));
          const regra = modoAtual === "GASTOS" ? regras[chaveDescricao(g.descricao)] : undefined;
          const classe = regra ?? (modoAtual === "ENTRADAS" ? sugerirTipoEntrada(g.descricao) : sugerirCategoria(g.descricao));
          // Em extrato de conta, o débito que paga a fatura de um cartão já está no cartão: vem desmarcado.
          const registrado = extratoDeConta ? pagamentoRegistrado(g) : undefined;
          const pagamentoFatura = extratoDeConta && !registrado && parecePagamentoDeFatura(g.descricao);
          // Transferência entre contas próprias não é gasto nem renda: vem desmarcada.
          const transferencia = !cartaoSel && pareceTransferencia(g.descricao);
          return {
            ...g,
            escolhida: !duplicada && !pagamentoFatura && !registrado && !transferencia,
            duplicada,
            pagamentoFatura,
            pagamentoRegistrado: registrado,
            transferencia,
            aprendida: !!regra,
            categoria: classe,
            escopo: escopoSel,
          };
        })
      );
      setPagamentos(
        lidosPagamentos.map((p) => {
          const duplicada = jaPagos.has(`${p.data}|${p.valor.toFixed(2)}`);
          return { ...p, escolhida: !duplicada, duplicada, escopo: donoDoCartao };
        })
      );
    } catch {
      setErro("Não foi possível ler o arquivo.");
    } finally {
      setLendo(false);
    }
  }

  async function carregarPdf(bytes: Uint8Array, nome: string, senhaInformada?: string) {
    setErro("");
    setLendo(true);
    try {
      const linhas = await extrairLinhasPdf(bytes, senhaInformada);
      setPdfComSenha(null);
      setSenha("");
      if (linhas.join("").trim().length === 0) {
        setOrigem(null);
        setLinhas([]);
        setPagamentos([]);
        setErro("Este PDF não tem texto (parece uma imagem digitalizada). Baixe a fatura em PDF direto do app ou site do banco.");
        return;
      }
      await carregar(lerLinhasDeFatura(linhas, hojeIsoLocal()), nome, false, true);
    } catch (e) {
      if (e instanceof SenhaDoPdfNecessaria) {
        setOrigem(null);
        setLinhas([]);
        setPagamentos([]);
        setPdfComSenha({ bytes, nome, errada: e.senhaErrada });
      } else {
        setErro("Não foi possível ler o PDF.");
      }
    } finally {
      setLendo(false);
    }
  }

  async function aoEscolherArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    const bytes = await arquivo.arrayBuffer();
    setPdfComSenha(null);
    setSenha("");
    // PDF começa com "%PDF"; vale mais que a extensão do arquivo.
    const inicio = new Uint8Array(bytes.slice(0, 4));
    if (arquivo.name.toLowerCase().endsWith(".pdf") || String.fromCharCode(...inicio) === "%PDF") {
      await carregarPdf(new Uint8Array(bytes), arquivo.name);
      return;
    }
    let texto: string;
    try {
      texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      // Bancos brasileiros ainda exportam em Latin-1/Windows-1252.
      texto = new TextDecoder("windows-1252").decode(bytes);
    }
    await carregar(lerLinhasExtrato(texto), arquivo.name, false, false);
  }

  const alterar = (indice: number, mudanca: Partial<Linha>) =>
    setLinhas((atuais) => atuais.map((linha, i) => (i === indice ? { ...linha, ...mudanca } : linha)));

  function trocarModo(novo: Modo) {
    setModo(novo);
    if (origem) carregar(origem.brutas, origem.nome, origem.inverter, origem.pdf, novo);
  }

  function trocarCartao(id: string) {
    setCartaoId(id);
    // A pessoa dona do cartão é a sugestão natural para as compras da fatura.
    const dono = cartoes.find((c) => c.id === id)?.escopo ?? escopo;
    setEscopo(dono);
    if (origem) carregar(origem.brutas, origem.nome, origem.inverter, origem.pdf, modo, id, dono);
  }

  function trocarEscopo(novo: string) {
    setEscopo(novo);
    setLinhas((atuais) => atuais.map((linha) => ({ ...linha, escopo: novo })));
  }

  const escolhidas = linhas.filter((linha) => linha.escolhida);
  const pagamentosEscolhidos = pagamentos.filter((pagamento) => pagamento.escolhida);
  const alterarPagamento = (indice: number, mudanca: Partial<LinhaPagamento>) =>
    setPagamentos((atuais) => atuais.map((p, i) => (i === indice ? { ...p, ...mudanca } : p)));
  const faturaDeCartao = modo === "GASTOS" && !!cartaoId;
  const duplicadas = linhas.filter((linha) => linha.duplicada).length;

  function importar() {
    setErro("");
    iniciarEnvio(async () => {
      try {
        if (modo === "ENTRADAS") {
          await importarEntradas(escolhidas.map(({ data, descricao, valor, categoria, escopo: de }) => ({ data, descricao, valor, tipo: categoria, escopo: de })));
        } else if (faturaDeCartao) {
          await importarFatura(
            cartaoId,
            escolhidas.map(({ data, descricao, valor, categoria, escopo: de }) => ({ data, descricao, valor, categoria, escopo: de })),
            pagamentosEscolhidos.map(({ data, descricao, valor, escopo: de }) => ({ data, descricao, valor, escopo: de }))
          );
        } else {
          await importarGastos(
            escolhidas.map(({ data, descricao, valor, categoria, escopo: de }) => ({ data, descricao, valor, categoria, escopo: de })),
            cartaoId || null
          );
        }
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
      <div className={`${classeCard} grid grid-cols-1 gap-4 md:grid-cols-4`}>
        <div className="md:col-span-2">
          <label className={classeLabel} htmlFor="arquivo">
            Fatura do cartão ou extrato (PDF, CSV ou OFX)
          </label>
          <input id="arquivo" type="file" accept=".pdf,.csv,.ofx,.txt,.tsv,application/pdf" onChange={aoEscolherArquivo} className={classeInput} />
        </div>
        <div>
          <label className={classeLabel} htmlFor="modo">
            O que importar
          </label>
          <select id="modo" value={modo} onChange={(e) => trocarModo(e.target.value as Modo)} className={classeInput}>
            <option value="GASTOS">Gastos (saídas)</option>
            <option value="ENTRADAS">Entradas de dinheiro</option>
          </select>
        </div>
        <div>
          <label className={classeLabel} htmlFor="escopo-padrao">
            De quem são
          </label>
          <select id="escopo-padrao" value={escopo} onChange={(e) => trocarEscopo(e.target.value)} className={classeInput}>
            {ESCOPOS.map((opcao) => (
              <option key={opcao} value={opcao}>
                {LABEL_ESCOPO[opcao]}
              </option>
            ))}
          </select>
        </div>
        {cartoes.length > 0 && modo === "GASTOS" && (
          <div className="md:col-span-2">
            <label className={classeLabel} htmlFor="cartao-fatura">
              Cartão de crédito da fatura
            </label>
            <select id="cartao-fatura" value={cartaoId} onChange={(e) => trocarCartao(e.target.value)} className={classeInput}>
              <option value="">Nenhum (extrato da conta)</option>
              {cartoes.map((cartao) => (
                <option key={cartao.id} value={cartao.id}>
                  {cartao.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        <p className="text-sm text-texto-secundario md:col-span-4">
          O arquivo é lido neste navegador; só as linhas que você escolher são gravadas. Confira e ajuste antes de importar.
        </p>
      </div>

      {erro && (
        <p role="alert" className="rounded-xl border border-critico/30 bg-critico-fundo px-3 py-2 text-sm text-critico">
          ⚠ {erro}
        </p>
      )}
      {lendo && <p className="text-sm text-texto-secundario">Lendo o arquivo…</p>}

      {pdfComSenha && !lendo && (
        <form
          className={`${classeCard} flex flex-wrap items-end gap-3`}
          onSubmit={(e) => {
            e.preventDefault();
            if (senha) carregarPdf(pdfComSenha.bytes, pdfComSenha.nome, senha);
          }}
        >
          <div className="min-w-[14rem] flex-1">
            <label className={classeLabel} htmlFor="senha-pdf">
              Senha do PDF “{pdfComSenha.nome}”
            </label>
            <input
              id="senha-pdf"
              type="password"
              autoComplete="off"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={classeInput}
              aria-describedby="senha-pdf-ajuda"
            />
            <p id="senha-pdf-ajuda" className={`mt-1 text-xs ${pdfComSenha.errada ? "font-semibold text-critico" : "text-texto-secundario"}`}>
              {pdfComSenha.errada
                ? "⚠ Senha incorreta. Tente de novo."
                : "A fatura é protegida. O banco informa a senha no e-mail da fatura (costuma ser parte do CPF). Ela é usada só para abrir o arquivo neste navegador e não é gravada."}
            </p>
          </div>
          <button type="submit" disabled={!senha} className={`${classeBotaoSecundario} disabled:cursor-not-allowed disabled:opacity-60`}>
            Abrir PDF
          </button>
        </form>
      )}

      {origem && !lendo && linhas.length === 0 && pagamentos.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 backdrop-blur-md text-center text-sm text-texto-secundario">
          {modo === "ENTRADAS" ? "Nenhuma entrada encontrada" : "Nenhum gasto encontrado"} em “{origem.nome}”.{" "}
          {origem.pdf
            ? "Não achei linhas com data, descrição e valor neste PDF; se o banco oferecer, tente a fatura em CSV ou OFX."
            : "O arquivo precisa ter data, descrição e valor de cada lançamento."}
        </div>
      )}

      {origem && (linhas.length > 0 || pagamentos.length > 0) && (
        <>
          <p className="text-sm text-texto-secundario">
            <strong className="text-texto-principal">
              {linhas.length}{" "}
              {faturaDeCartao
                ? linhas.length === 1 ? "compra encontrada" : "compras encontradas"
                : modo === "ENTRADAS"
                ? linhas.length === 1 ? "entrada encontrada" : "entradas encontradas"
                : linhas.length === 1 ? "gasto encontrado" : "gastos encontrados"}
            </strong>{" "}
            em “{origem.nome}”
            {ignorados > 0 && (
              <>
                {" "}
                · {ignorados} de sinal contrário {ignorados === 1 ? "ignorado" : "ignorados"}, {faturaDeCartao ? "como estornos e créditos" : modo === "ENTRADAS" ? "como gastos e pagamentos" : "como entradas e pagamentos"} (
                <button type="button" className="font-semibold text-accent hover:underline" onClick={() => carregar(origem.brutas, origem.nome, !origem.inverter, origem.pdf)}>
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

          <div className="vidro max-h-[26rem] overflow-auto rounded-2xl">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white/85 backdrop-blur-md">
                <tr className="border-b border-slate-200/70 text-left text-xs uppercase tracking-wide text-texto-secundario">
                  <th className="px-3 py-3" />
                  <th className="px-3 py-3 font-semibold">Data</th>
                  <th className="px-3 py-3 font-semibold">Descrição</th>
                  <th className="px-3 py-3 font-semibold">{modo === "ENTRADAS" ? "Tipo" : "Categoria"}</th>
                  <th className="px-3 py-3 font-semibold">De quem</th>
                  <th className="px-3 py-3 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha, i) => (
                  <tr key={i} className="border-b border-slate-200/50 last:border-0">
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
                      {linha.pagamentoRegistrado && (
                        <span className={`${classeBadgeNeutro} ml-2`} title="Este valor já está registrado como pagamento de fatura e já conta nos gastos.">
                          já registrado · fatura {linha.pagamentoRegistrado}
                        </span>
                      )}
                      {linha.transferencia && (
                        <span className={`${classeBadgeNeutro} ml-2`} title="Transferência, aplicação ou resgate entre contas suas: não é gasto nem renda. Marque se for mesmo um gasto.">
                          parece transferência
                        </span>
                      )}
                      {linha.aprendida && (
                        <span className="ml-2 text-[11px] text-texto-secundario" title="Categoria aprendida de uma correção sua em importação ou edição anterior.">
                          ✓ categoria aprendida
                        </span>
                      )}
                      {linha.pagamentoFatura && (
                        <span className={`${classeBadgeNeutro} ml-2`} title="Já conta nas compras do cartão. Para registrar o pagamento da fatura, importe a fatura escolhendo o cartão ou use Cartões → Registrar pagamento.">
                          parece pagamento de fatura
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={linha.categoria}
                        onChange={(e) => alterar(i, { categoria: e.target.value })}
                        aria-label={modo === "ENTRADAS" ? "Tipo" : "Categoria"}
                        className={`${classeInputAuto} py-1`}
                      >
                        {(modo === "ENTRADAS" ? TIPOS_ENTRADA : CATEGORIAS).map((categoria) => (
                          <option key={categoria} value={categoria}>
                            {modo === "ENTRADAS" ? LABEL_TIPO_ENTRADA[categoria] : LABEL_CATEGORIA[categoria]}
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

          {faturaDeCartao && (
            <div>
              <h3 className="mb-1 text-sm font-semibold">Pagamentos da fatura</h3>
              <p className="mb-2 text-sm text-texto-secundario">
                Estes são os pagamentos (total ou parcial) que aparecem na fatura. Eles <strong>entram nos gastos do mês</strong>, na data em que
                foram pagos; as compras acima ficam só no cartão.
              </p>
              {pagamentos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white/50 px-4 py-3 text-sm text-texto-secundario">
                  Nenhum pagamento encontrado neste arquivo. Depois de importar, registre o valor pago em Cartões → Registrar pagamento.
                </p>
              ) : (
                <div className="vidro overflow-auto rounded-2xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200/70 text-left text-xs uppercase tracking-wide text-texto-secundario">
                        <th className="px-3 py-3" />
                        <th className="px-3 py-3 font-semibold">Data</th>
                        <th className="px-3 py-3 font-semibold">Descrição</th>
                        <th className="px-3 py-3 font-semibold">De quem</th>
                        <th className="px-3 py-3 text-right font-semibold">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagamentos.map((pagamento, i) => (
                        <tr key={i} className="border-b border-slate-200/50 last:border-0">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={pagamento.escolhida}
                              onChange={(e) => alterarPagamento(i, { escolhida: e.target.checked })}
                              aria-label={`Registrar pagamento de ${formatarMoeda(pagamento.valor)}`}
                              className="h-4 w-4 accent-[var(--color-accent)]"
                            />
                          </td>
                          <td className="px-3 py-2 tabular-nums text-texto-secundario">
                            {pagamento.data.slice(8)}/{pagamento.data.slice(5, 7)}/{pagamento.data.slice(0, 4)}
                          </td>
                          <td className="px-3 py-2">
                            {pagamento.descricao}
                            {pagamento.duplicada && <span className={`${classeBadgeNeutro} ml-2`}>já registrado</span>}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={pagamento.escopo}
                              onChange={(e) => alterarPagamento(i, { escopo: e.target.value })}
                              aria-label="De quem"
                              className={`${classeInputAuto} py-1`}
                            >
                              {ESCOPOS.map((opcao) => (
                                <option key={opcao} value={opcao}>
                                  {LABEL_ESCOPO[opcao]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatarMoeda(pagamento.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-texto-secundario">
              {escolhidas.length} de {linhas.length} {faturaDeCartao ? "compras" : "selecionados"} · {formatarMoeda(escolhidas.reduce((total, linha) => total + linha.valor, 0))}
              {faturaDeCartao && (
                <>
                  {" "}
                  · {pagamentosEscolhidos.length} {pagamentosEscolhidos.length === 1 ? "pagamento" : "pagamentos"} ·{" "}
                  {formatarMoeda(pagamentosEscolhidos.reduce((total, p) => total + p.valor, 0))} nos gastos
                </>
              )}
            </p>
            <button
              type="button"
              onClick={importar}
              disabled={(escolhidas.length === 0 && pagamentosEscolhidos.length === 0) || enviando}
              className={`${classeBotaoPrimario} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {enviando
                ? "Importando…"
                : faturaDeCartao
                  ? `Importar ${escolhidas.length} ${escolhidas.length === 1 ? "compra" : "compras"} e ${pagamentosEscolhidos.length} ${pagamentosEscolhidos.length === 1 ? "pagamento" : "pagamentos"}`
                  : `Importar ${escolhidas.length} ${modo === "ENTRADAS" ? (escolhidas.length === 1 ? "entrada" : "entradas") : escolhidas.length === 1 ? "gasto" : "gastos"}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
