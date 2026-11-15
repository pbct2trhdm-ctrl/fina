/**
 * Regras do controle financeiro. O gasto de um mês é a soma de três coisas:
 * gastos avulsos do mês, contas fixas pagas naquele mês e a parcela do mês de
 * cada compra parcelada em andamento.
 */
import { prisma } from "@/lib/prisma";
import { hojeIsoLocal } from "@/lib/datas";
import { diaDoMes, diferencaMeses, intervaloDoMes, mesAtual, somarMeses } from "@/lib/meses";
import { ESCOPOS, type CategoriaChave, type EscopoChave, type VisaoChave } from "@/lib/formatacao";

export type Lancamento = {
  id: string;
  tipo: "GASTO" | "CONTA" | "PARCELA";
  /** "AAAA-MM-DD" */
  data: string;
  descricao: string;
  categoria: CategoriaChave;
  escopo: EscopoChave;
  valor: number;
};

export const somar = (itens: { valor: number }[]) => itens.reduce((total, item) => total + item.valor, 0);

export const naVisao = <T extends { escopo: string }>(itens: T[], visao: VisaoChave) =>
  visao === "TODOS" ? itens : itens.filter((item) => item.escopo === visao);

/** Lançamentos de vários meses de uma vez (uma consulta por tabela), sempre de todas as pessoas. */
export async function lancamentosPorMes(meses: string[]): Promise<Record<string, Lancamento[]>> {
  const ordenados = [...meses].sort();
  const [gastos, pagamentos, compras] = await Promise.all([
    prisma.gasto.findMany({
      where: {
        data: {
          gte: intervaloDoMes(ordenados[0]).inicio,
          lt: intervaloDoMes(ordenados[ordenados.length - 1]).fim,
        },
      },
    }),
    prisma.pagamentoConta.findMany({ where: { mes: { in: meses } }, include: { conta: true } }),
    prisma.compraParcelada.findMany(),
  ]);

  const porMes: Record<string, Lancamento[]> = Object.fromEntries(meses.map((m) => [m, []]));

  for (const gasto of gastos) {
    const dia = gasto.data.toISOString().slice(0, 10);
    porMes[dia.slice(0, 7)]?.push({
      id: gasto.id,
      tipo: "GASTO",
      data: dia,
      descricao: gasto.descricao,
      categoria: gasto.categoria,
      escopo: gasto.escopo,
      valor: gasto.valor,
    });
  }
  for (const pagamento of pagamentos) {
    porMes[pagamento.mes]?.push({
      id: pagamento.contaId,
      tipo: "CONTA",
      data: diaDoMes(pagamento.mes, pagamento.conta.diaVencimento),
      descricao: pagamento.conta.descricao,
      categoria: pagamento.conta.categoria,
      escopo: pagamento.conta.escopo,
      valor: pagamento.valor,
    });
  }
  for (const compra of compras) {
    for (const mes of meses) {
      const indice = diferencaMeses(compra.inicio, mes);
      if (indice < 0 || indice >= compra.parcelas) continue;
      porMes[mes].push({
        id: compra.id,
        tipo: "PARCELA",
        data: diaDoMes(mes, compra.diaCobranca),
        descricao: `${compra.descricao} (${indice + 1}/${compra.parcelas})`,
        categoria: compra.categoria,
        escopo: compra.escopo,
        valor: compra.valorParcela,
      });
    }
  }
  for (const mes of meses) {
    porMes[mes].sort((a, b) => b.data.localeCompare(a.data) || a.descricao.localeCompare(b.descricao));
  }
  return porMes;
}

export type SituacaoConta = "PAGA" | "VENCIDA" | "VENCE_HOJE" | "A_VENCER";

/** Contas fixas em vigor no mês, com a situação de pagamento naquele mês. */
export async function contasDoMes(mes: string) {
  const contas = await prisma.contaFixa.findMany({
    where: { inicio: { lte: mes }, OR: [{ fim: null }, { fim: { gte: mes } }] },
    include: { pagamentos: { where: { mes } } },
    orderBy: [{ diaVencimento: "asc" }, { descricao: "asc" }],
  });
  const hoje = hojeIsoLocal();
  return contas.map((conta) => {
    const pagamento = conta.pagamentos[0] ?? null;
    const vencimento = diaDoMes(mes, conta.diaVencimento);
    const situacao: SituacaoConta = pagamento
      ? "PAGA"
      : vencimento < hoje
        ? "VENCIDA"
        : vencimento === hoje
          ? "VENCE_HOJE"
          : "A_VENCER";
    return {
      id: conta.id,
      descricao: conta.descricao,
      categoria: conta.categoria,
      escopo: conta.escopo,
      diaVencimento: conta.diaVencimento,
      vencimento,
      /** Valor pago, se já paga; senão o valor atual da conta. */
      valor: pagamento ? pagamento.valor : conta.valor,
      situacao,
    };
  });
}

/** Compras parceladas com parcela no mês informado. */
export async function parcelasDoMes(mes: string) {
  const compras = await prisma.compraParcelada.findMany({ orderBy: { criadoEm: "asc" } });
  return compras
    .map((compra) => ({ ...compra, indice: diferencaMeses(compra.inicio, mes) }))
    .filter((compra) => compra.indice >= 0 && compra.indice < compra.parcelas)
    .map((compra) => ({
      id: compra.id,
      descricao: compra.descricao,
      escopo: compra.escopo,
      valor: compra.valorParcela,
      numero: compra.indice + 1,
      parcelas: compra.parcelas,
      falta: compra.valorParcela * (compra.parcelas - compra.indice - 1),
    }));
}

/** Orçamento mensal por pessoa (zero para quem ainda não tem). */
export async function orcamentos(): Promise<Record<EscopoChave, number>> {
  const linhas = await prisma.orcamento.findMany();
  const mapa = Object.fromEntries(ESCOPOS.map((e) => [e, 0])) as Record<EscopoChave, number>;
  for (const linha of linhas) mapa[linha.escopo] = linha.valor;
  return mapa;
}

export function orcamentoDaVisao(mapa: Record<EscopoChave, number>, visao: VisaoChave): number {
  return visao === "TODOS" ? ESCOPOS.reduce((total, e) => total + mapa[e], 0) : mapa[visao];
}

/** Limites por categoria da visão (cada visão tem os seus; não somam entre si). */
export async function limitesDaVisao(visao: VisaoChave): Promise<Partial<Record<CategoriaChave, number>>> {
  const linhas = await prisma.limiteCategoria.findMany({ where: { visao } });
  return Object.fromEntries(linhas.map((l) => [l.categoria, l.valor]));
}

/**
 * Média de gastos da família nos últimos meses fechados (até 3), base da
 * reserva de emergência. Usa o mês de hoje, não o mês aberto na tela.
 */
export async function mediaGastosRecentes(): Promise<{ media: number; meses: number }> {
  const atual = mesAtual();
  const meses = [1, 2, 3].map((i) => somarMeses(atual, -i));
  const porMes = await lancamentosPorMes(meses);
  const totais = meses.map((m) => somar(porMes[m])).filter((total) => total > 0);
  return { media: totais.length ? totais.reduce((a, b) => a + b, 0) / totais.length : 0, meses: totais.length };
}
