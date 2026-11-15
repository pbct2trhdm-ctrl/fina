/**
 * Leitura de extratos de banco/cartão em CSV ou OFX (PDF: lib/extrato-pdf.ts).
 * Roda no navegador: o arquivo não é enviado ao servidor, só as linhas
 * escolhidas na revisão.
 */
import type { CategoriaChave } from "@/lib/formatacao";

export type LinhaExtrato = { data: string; descricao: string; valor: number };

const PALPITES: [CategoriaChave, RegExp][] = [
  ["MERCADO", /mercado|supermerc|carrefour|assai|atacad|hortifruti|feira|sacolao/],
  ["ALIMENTACAO", /ifood|restaurante|lanch|padaria|pizza|burger|cafe/],
  ["TRANSPORTE", /uber|99 ?app|99pop|posto|combust|shell|ipiranga|estacion|pedagio/],
  ["SAUDE", /farm|drog|clinica|hospital|laborat|academia|dentist/],
  ["ASSINATURAS", /netflix|spotify|disney|prime video|youtube|icloud|hbo|globoplay/],
  ["ROUPAS", /renner|riachuelo|c&a|zara|roupa|calcado/],
  ["EDUCACAO", /curso|escola|livraria|udemy|faculdade/],
  ["LAZER", /cinema|ingresso|teatro|\bbar\b|show/],
  ["MORADIA", /aluguel|condom|energia|\bluz\b|\bagua\b|internet|enel|sabesp|cemig|copel|equatorial/],
  ["ELETRONICOS", /kabum|magazine|fast ?shop|apple store/],
];

export const semAcento = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Categoria sugerida pela descrição; "OUTROS" quando nenhuma palavra conhecida aparece. */
export function sugerirCategoria(descricao: string): CategoriaChave {
  const texto = semAcento(descricao);
  return PALPITES.find(([, padrao]) => padrao.test(texto))?.[0] ?? "OUTROS";
}

/** Tipo sugerido para uma entrada de dinheiro, pela descrição. */
export function sugerirTipoEntrada(descricao: string): "SALARIO" | "HONORARIOS" | "EXTRA" | "OUTROS" {
  const texto = semAcento(descricao);
  if (/salario|folha|pro-?labore|proventos|13o/.test(texto)) return "SALARIO";
  if (/honorario/.test(texto)) return "HONORARIOS";
  return "OUTROS";
}

/** Aceita "1.045,00", "1045.00", "R$ 12,50", "-12,50", "(12,50)" e "12,50-". */
export function lerNumero(bruto: string): number {
  let x = String(bruto).replace(/[R$\s"]/g, "");
  if (!x) return NaN;
  const negativo = /^\(.*\)$/.test(x) || /^-|-$/.test(x);
  x = x.replace(/[()+-]/g, "");
  if (!/^[\d.,]+$/.test(x)) return NaN;
  const virgula = x.lastIndexOf(",");
  const ponto = x.lastIndexOf(".");
  if (virgula > -1 && ponto > -1) x = virgula > ponto ? x.replace(/\./g, "").replace(",", ".") : x.replace(/,/g, "");
  else if (virgula > -1) x = x.replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(x)) x = x.replace(/\./g, "");
  const valor = parseFloat(x);
  return negativo ? -valor : valor;
}

/** Aceita AAAA-MM-DD e DD/MM/AAAA (ou com ano de 2 dígitos); devolve "AAAA-MM-DD" ou nulo. */
export function lerData(bruto: string): string | null {
  const x = String(bruto).trim();
  const pad = (n: string) => n.padStart(2, "0");
  let partes: [string, string, string] | null = null;
  let m = x.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) partes = [m[1], m[2], m[3]];
  else {
    m = x.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4}|\d{2})(?!\d)/);
    if (m) partes = [m[3].length === 2 ? `20${m[3]}` : m[3], pad(m[2]), pad(m[1])];
  }
  if (!partes) return null;
  const [, mes, dia] = partes.map(Number);
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31 ? partes.join("-") : null;
}

function linhasCsv(texto: string): string[][] {
  const linhas = texto.split(/\r?\n/).filter((linha) => linha.trim());
  if (!linhas.length) return [];
  const separador = [";", "\t", ","]
    .map((s) => [s, linhas[0].split(s).length] as const)
    .sort((a, b) => b[1] - a[1])[0][0];
  return linhas.map((linha) => {
    const celulas: string[] = [];
    let atual = "";
    let aspas = false;
    for (let i = 0; i < linha.length; i++) {
      const c = linha[i];
      if (c === '"') {
        if (aspas && linha[i + 1] === '"') {
          atual += '"';
          i++;
        } else aspas = !aspas;
      } else if (c === separador && !aspas) {
        celulas.push(atual);
        atual = "";
      } else atual += c;
    }
    celulas.push(atual);
    return celulas.map((celula) => celula.trim());
  });
}

function lerCsv(texto: string): LinhaExtrato[] {
  const linhas = linhasCsv(texto);
  if (!linhas.length) return [];
  const cabecalho = linhas[0].map(semAcento);
  const amostra = linhas[1] ?? linhas[0];
  let iData = cabecalho.findIndex((c) => /^data|date/.test(c));
  let iDescricao = cabecalho.findIndex((c) => /descri|histor|title|titulo|lancamento|estabelec|memo/.test(c));
  let iValor = cabecalho.findIndex((c) => /valor|amount|quantia|montante/.test(c));
  // Sem cabeçalho reconhecido: descobre as colunas pelo conteúdo.
  if (iData < 0) iData = amostra.findIndex((c) => lerData(c));
  if (iValor < 0) amostra.forEach((c, i) => { if (i !== iData && !Number.isNaN(lerNumero(c))) iValor = i; });
  if (iDescricao < 0)
    amostra.forEach((c, i) => {
      if (i !== iData && i !== iValor && (iDescricao < 0 || c.length > amostra[iDescricao].length)) iDescricao = i;
    });
  if (iData < 0 || iValor < 0) return [];
  return linhas
    .map((linha) => ({
      data: lerData(linha[iData] ?? ""),
      descricao: (iDescricao >= 0 && linha[iDescricao]) || "Sem descrição",
      valor: lerNumero(linha[iValor] ?? ""),
    }))
    .filter((linha): linha is LinhaExtrato => !!linha.data && !Number.isNaN(linha.valor) && linha.valor !== 0);
}

function lerOfx(texto: string): LinhaExtrato[] {
  const linhas: LinhaExtrato[] = [];
  for (const bloco of texto.split(/<STMTTRN>/i).slice(1)) {
    const campo = (nome: string) => bloco.match(new RegExp(`<${nome}>([^<\\r\\n]*)`, "i"))?.[1].trim() ?? "";
    const data = campo("DTPOSTED");
    const valor = parseFloat(campo("TRNAMT").replace(",", "."));
    if (data.length >= 8 && !Number.isNaN(valor) && valor !== 0) {
      linhas.push({
        data: `${data.slice(0, 4)}-${data.slice(4, 6)}-${data.slice(6, 8)}`,
        descricao: campo("MEMO") || campo("NAME") || "Sem descrição",
        valor,
      });
    }
  }
  return linhas;
}

/** Lançamentos de um CSV ou OFX, com o sinal original (negativo = saída, em extrato de conta). */
export function lerLinhasExtrato(texto: string): LinhaExtrato[] {
  return /<STMTTRN>/i.test(texto) ? lerOfx(texto) : lerCsv(texto);
}

/**
 * Separa os gastos do resto. Gasto é o sinal mais frequente no arquivo:
 * negativo em extrato de conta, positivo em fatura de cartão. O que tem o
 * sinal contrário (salário, pagamento da fatura) é ignorado; `inverter` troca
 * a escolha quando o palpite erra.
 */
export function separarGastos(linhas: LinhaExtrato[], inverter = false): { gastos: LinhaExtrato[]; ignorados: number } {
  const negativos = linhas.filter((l) => l.valor < 0).length;
  const positivos = linhas.filter((l) => l.valor > 0).length;
  const gastoEhNegativo = (negativos >= positivos) !== inverter;
  const gastos = linhas
    .filter((l) => (gastoEhNegativo ? l.valor < 0 : l.valor > 0))
    .map((l) => ({ data: l.data, descricao: l.descricao.slice(0, 60), valor: Math.round(Math.abs(l.valor) * 100) / 100 }))
    .sort((a, b) => b.data.localeCompare(a.data));
  return { gastos, ignorados: linhas.length - gastos.length };
}
