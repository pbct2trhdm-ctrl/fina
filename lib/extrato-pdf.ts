/**
 * Leitura de fatura de cartão (ou extrato) em PDF. Duas etapas:
 *
 * 1. `extrairLinhasPdf` tira o texto do PDF e o remonta em linhas, pela
 *    posição de cada trecho na página (roda no navegador, via PDF.js).
 * 2. `lerLinhasDeFatura` procura, em cada linha, o padrão de um lançamento:
 *    data, descrição e valor em reais.
 *
 * Cada banco desenha a fatura de um jeito; o que há de comum é esse trio. Por
 * isso a leitura é por padrão de texto, não por posição de coluna, e o
 * resultado sempre passa pela revisão antes de gravar.
 */
import { lerNumero, type LinhaExtrato } from "./extrato";

const MESES: Record<string, number> = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
const NOME_MES = "(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-zç]*\\.?";
/** "12/10", "12/10/26", "12/10/2026", "12 out", "12 de outubro de 2026". */
const DATA = `(?:\\d{1,2}/\\d{1,2}(?:/\\d{4}|/\\d{2})?(?![/\\d])|\\d{1,2}\\s+(?:de\\s+)?${NOME_MES}(?:\\s+(?:de\\s+)?\\d{4})?)`;
/**
 * "1.234,56", "R$ 12,50", "-12,50", "- 12,50", "-R$ 12,50", "R$ -12,50",
 * "12,50-", "12,50 CR". Um hífen solto antes de "R$" ("LOJA - R$ 12,50") é
 * separador, não sinal, e fica de fora.
 */
const VALOR = "(?:-\\s*(?=\\d)|-(?=R\\$)|\\+\\s*)?(?:R\\$\\s*)?(?:[-+]\\s*)?\\d{1,3}(?:\\.\\d{3})*,\\d{2}(?:\\s*-)?(?:\\s*(?:CR|C|D)\\b)?";
/** Um lançamento a partir da posição atual: data, descrição, valor — seguido de outro lançamento (fatura em duas colunas) ou do fim da linha. */
const LANCAMENTO = new RegExp(`[\\s•·*|]*(${DATA})\\s+(.+?)\\s+(${VALOR})(?=\\s+${DATA}\\s|\\s*$)`, "iy");
const VALOR_NO_FIM = new RegExp(`^(.*\\S)\\s+(${VALOR})$`, "i");
const PARCELA = /(?:^|[\s(])(\d{1,2})\s*\/\s*(\d{1,2})(?![\/\d])/;
const EH_PAGAMENTO = /pagamento (efetuado|recebido|de fatura|da fatura|em \d)|pa?gto\.? (de |da )?fatura|credito de pagamento|estorno|desconto de antecipacao/;

const pad = (n: number) => String(n).padStart(2, "0");
const semAcento = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const diasDesde1970 = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;

/** Valor com sinal: negativo com "-" antes ou depois, ou com "CR"/"C" (crédito) no fim. */
function lerValor(bruto: string): number {
  const credito = /\b(CR|C)\s*$/i.test(bruto);
  const numero = lerNumero(bruto.replace(/\s*\b(CR|C|D)\s*$/i, ""));
  return credito ? -Math.abs(numero) : numero;
}

/**
 * Data de referência da fatura, para dar ano às datas "12/10": o vencimento,
 * se aparecer; senão a data completa mais recente do documento; senão hoje.
 */
function dataDeReferencia(linhas: string[], hoje: string): string {
  const texto = linhas.join("\n");
  const paraIso = (d: string, m: string, a: string) => `${a}-${pad(+m)}-${pad(+d)}`;
  const vencimento = texto.match(/vencimento[^\d\n]{0,40}(\d{2})\/(\d{2})\/(\d{4})/i);
  if (vencimento) return paraIso(vencimento[1], vencimento[2], vencimento[3]);
  const completas = [...texto.matchAll(/(\d{2})\/(\d{2})\/(20\d{2})(?!\d)/g)]
    .map((m) => paraIso(m[1], m[2], m[3]))
    .filter((iso) => +iso.slice(5, 7) >= 1 && +iso.slice(5, 7) <= 12);
  return completas.sort().at(-1) ?? hoje;
}

/** Converte a data lida em "AAAA-MM-DD"; sem ano, usa o ano que a deixa até 45 dias depois da referência. */
function lerDataDeFatura(bruto: string, referencia: string): string | null {
  const texto = semAcento(bruto);
  let dia: number, mes: number, ano: number | null;
  const numerica = texto.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (numerica) {
    dia = +numerica[1];
    mes = +numerica[2];
    ano = numerica[3] ? (numerica[3].length === 2 ? 2000 + +numerica[3] : +numerica[3]) : null;
  } else {
    const extenso = texto.match(/^(\d{1,2})\s+(?:de\s+)?([a-z]{3})[a-z]*\.?(?:\s+(?:de\s+)?(\d{4}))?$/);
    if (!extenso || !MESES[extenso[2]]) return null;
    dia = +extenso[1];
    mes = MESES[extenso[2]];
    ano = extenso[3] ? +extenso[3] : null;
  }
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  if (ano == null) {
    ano = +referencia.slice(0, 4);
    if (diasDesde1970(`${ano}-${pad(mes)}-${pad(dia)}`) > diasDesde1970(referencia) + 45) ano -= 1;
  }
  return `${ano}-${pad(mes)}-${pad(dia)}`;
}

/** Soma meses a uma data, limitando o dia ao fim do mês (31/01 + 1 mês → 28/02). */
function somarMesesNaData(iso: string, meses: number): string {
  const total = +iso.slice(0, 4) * 12 + (+iso.slice(5, 7) - 1) + meses;
  const ano = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${ano}-${pad(mes)}-${pad(Math.min(+iso.slice(8, 10), ultimoDia))}`;
}

/**
 * Lançamentos encontrados nas linhas de texto da fatura, com sinal: compras
 * positivas; pagamentos, estornos e créditos negativos.
 *
 * - Parcela "3/10" vem com a data da compra original; a data é levada para o
 *   mês em que a parcela é cobrada (compra + 2 meses), para o gasto cair no
 *   mês certo.
 * - Extrato de conta costuma ter duas colunas de valor (lançamento e saldo):
 *   quando a maioria das linhas termina com dois valores, vale o primeiro.
 */
export function lerLinhasDeFatura(linhas: string[], hoje: string): LinhaExtrato[] {
  const referencia = dataDeReferencia(linhas, hoje);
  const achados: { data: string; descricao: string; valor: string; valorAnterior: string | null }[] = [];

  for (const bruta of linhas) {
    const linha = bruta.replace(/[−–—]/g, "-").replace(/\s+/g, " ").trim();
    let posicao = 0;
    while (posicao < linha.length) {
      LANCAMENTO.lastIndex = posicao;
      const m = LANCAMENTO.exec(linha);
      if (!m) break;
      posicao = LANCAMENTO.lastIndex;
      const data = lerDataDeFatura(m[1].trim(), referencia);
      if (!data) continue;
      const dupla = m[2].match(VALOR_NO_FIM);
      achados.push({ data, descricao: dupla ? dupla[1] : m[2], valor: m[3], valorAnterior: dupla ? dupla[2] : null });
    }
  }

  // Coluna de saldo: só é tratada como tal se aparecer na maioria das linhas.
  const temSaldo = achados.length >= 3 && achados.filter((a) => a.valorAnterior).length / achados.length > 0.6;

  return achados
    .map((achado) => {
      const usarAnterior = temSaldo && achado.valorAnterior;
      let descricao = (usarAnterior || !achado.valorAnterior ? achado.descricao : `${achado.descricao} ${achado.valorAnterior}`).trim();
      descricao = descricao.replace(/\s*R\$\s*$/i, "").replace(/\s+-$/, "").trim();
      let valor = lerValor(usarAnterior ? achado.valorAnterior! : achado.valor);
      if (valor > 0 && EH_PAGAMENTO.test(semAcento(descricao))) valor = -valor;

      let data = achado.data;
      const parcela = descricao.match(PARCELA);
      if (parcela) {
        const [numero, total] = [+parcela[1], +parcela[2]];
        if (total >= 2 && numero >= 2 && numero <= total && diasDesde1970(referencia) - diasDesde1970(data) > 40) {
          data = somarMesesNaData(data, numero - 1);
        }
      }
      return { data, descricao, valor };
    })
    .filter((l) => !Number.isNaN(l.valor) && l.valor !== 0 && l.descricao.length > 0);
}

/** O PDF tem senha (comum em faturas: costuma ser parte do CPF) e ela não foi informada ou está errada. */
export class SenhaDoPdfNecessaria extends Error {
  readonly senhaErrada: boolean;
  constructor(senhaErrada: boolean) {
    super(senhaErrada ? "Senha do PDF incorreta" : "O PDF é protegido por senha");
    this.name = "SenhaDoPdfNecessaria";
    this.senhaErrada = senhaErrada;
  }
}

/**
 * Texto do PDF remontado em linhas. Os trechos de cada página são agrupados
 * pela altura (mesma linha = mesma altura, com pequena tolerância) e
 * ordenados da esquerda para a direita.
 */
export async function extrairLinhasPdf(bytes: Uint8Array, senha?: string): Promise<string[]> {
  const { getDocumentProxy } = await import("unpdf");
  let pdf;
  try {
    // PDF.js toma posse dos bytes: passa uma cópia para poder tentar de novo com senha.
    pdf = await getDocumentProxy(bytes.slice(), senha ? { password: senha } : undefined);
  } catch (erro) {
    if (erro instanceof Error && erro.name === "PasswordException") throw new SenhaDoPdfNecessaria(!!senha);
    throw erro;
  }

  const linhas: string[] = [];
  for (let numero = 1; numero <= pdf.numPages; numero++) {
    const pagina = await pdf.getPage(numero);
    const conteudo = await pagina.getTextContent();
    const trechos = conteudo.items
      .flatMap((item) => ("str" in item && item.str.trim() ? [{ texto: item.str, x: item.transform[4], y: item.transform[5], largura: item.width }] : []))
      .sort((a, b) => b.y - a.y || a.x - b.x);

    let atual: typeof trechos = [];
    const fecharLinha = () => {
      if (!atual.length) return;
      atual.sort((a, b) => a.x - b.x);
      let texto = "";
      let fim = -Infinity;
      for (const trecho of atual) {
        texto += (texto && trecho.x - fim > 1 ? " " : "") + trecho.texto;
        fim = trecho.x + trecho.largura;
      }
      linhas.push(texto.replace(/\s+/g, " ").trim());
      atual = [];
    };
    for (const trecho of trechos) {
      if (atual.length && Math.abs(trecho.y - atual[0].y) > 2.5) fecharLinha();
      atual.push(trecho);
    }
    fecharLinha();
  }
  return linhas;
}
