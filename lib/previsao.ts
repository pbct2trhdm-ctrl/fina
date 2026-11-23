/**
 * Previsão dos próximos meses: o que já está comprometido (contas fixas,
 * parcelas, dívidas, entradas fixas) mais uma estimativa dos gastos variáveis
 * pela média dos últimos meses fechados.
 */
import { prisma } from "@/lib/prisma";
import { diferencaMeses, mesAtual, somarMeses } from "@/lib/meses";
import { lancamentosPorMes, naVisao, somar } from "@/lib/financas";
import type { VisaoChave } from "@/lib/formatacao";

export type MesPrevisto = {
  mes: string;
  entradasFixas: number;
  contasFixas: number;
  parcelas: number;
  dividas: number;
  /** Parcelas e recorrências (assinaturas…) que vão cair nas faturas dos cartões. */
  parcelasNoCartao: number;
  /** Média dos gastos avulsos (sem cartão) e pagamentos de fatura dos últimos meses fechados. */
  variaveisEstimados: number;
  totalSaidas: number;
  sobra: number;
};

export async function previsao(visao: VisaoChave, quantidade = 3): Promise<{ meses: MesPrevisto[]; baseVariaveis: number; mesesBase: number }> {
  const atual = mesAtual();
  const futuros = Array.from({ length: quantidade }, (_, i) => somarMeses(atual, i + 1));
  const ultimo = futuros[futuros.length - 1];
  const [entradas, contas, parceladas] = await Promise.all([
    prisma.entradaFixa.findMany({ where: { inicio: { lte: ultimo } } }),
    prisma.contaFixa.findMany({ where: { inicio: { lte: ultimo } } }),
    prisma.compraParcelada.findMany(),
  ]);

  // Média dos gastos variáveis (gastos avulsos fora do cartão + pagamentos de fatura) nos últimos 3 meses fechados.
  const passados = [1, 2, 3].map((i) => somarMeses(atual, -i));
  const porMes = await lancamentosPorMes(passados);
  const totais = passados
    .map((m) => somar(naVisao(porMes[m], visao).filter((item) => item.tipo === "GASTO" || item.tipo === "FATURA")))
    .filter((total) => total > 0);
  const baseVariaveis = totais.length ? totais.reduce((a, b) => a + b, 0) / totais.length : 0;

  const vigente = (item: { inicio: string; fim: string | null }, mes: string) => item.inicio <= mes && (!item.fim || item.fim >= mes);
  const meses = futuros.map((mes) => {
    const entradasFixas = somar(naVisao(entradas, visao).filter((e) => vigente(e, mes)));
    const contasVigentes = naVisao(contas, visao).filter((c) => vigente(c, mes));
    // Conta cobrada no cartão entra pelo pagamento da fatura (já na estimativa de variáveis).
    const contasFixas = somar(contasVigentes.filter((c) => !c.cartaoId));
    const recorrenciasNoCartao = somar(contasVigentes.filter((c) => !!c.cartaoId));
    const ativas = naVisao(parceladas, visao)
      .map((p) => ({ ...p, indice: diferencaMeses(p.inicio, mes) }))
      .filter((p) => p.indice >= 0 && p.indice < p.parcelas)
      .map((p) => ({ ...p, valor: p.valorParcela }));
    const dividas = somar(ativas.filter((p) => p.tipo === "DIVIDA"));
    const parcelas = somar(ativas.filter((p) => p.tipo === "COMPRA" && !p.cartaoId));
    const parcelasNoCartao = somar(ativas.filter((p) => p.tipo === "COMPRA" && !!p.cartaoId)) + recorrenciasNoCartao;
    const variaveisEstimados = baseVariaveis;
    const totalSaidas = contasFixas + parcelas + dividas + variaveisEstimados;
    return { mes, entradasFixas, contasFixas, parcelas, dividas, parcelasNoCartao, variaveisEstimados, totalSaidas, sobra: entradasFixas - totalSaidas };
  });
  return { meses, baseVariaveis, mesesBase: totais.length };
}
