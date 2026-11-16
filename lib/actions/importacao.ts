"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { categoria, data, dinheiro, escopo, tipoEntrada } from "@/lib/validacao";
import { cartaoExistente } from "@/lib/financas";

export type LinhaImportada = { data: string; descricao: string; valor: number; categoria: string; escopo: string };

/** Lançamentos já gravados em um intervalo de datas, para marcar duplicados na revisão do extrato. */
export async function gastosNoIntervalo(de: string, ate: string) {
  const inicio = data(de);
  const fim = data(ate);
  if (!inicio || !fim) return [];
  const gastos = await prisma.gasto.findMany({
    where: { data: { gte: inicio, lte: fim } },
    select: { data: true, valor: true, descricao: true },
  });
  return gastos.map((g) => ({ data: g.data.toISOString().slice(0, 10), valor: g.valor, descricao: g.descricao }));
}

/** Grava as linhas escolhidas na revisão do extrato; linhas inválidas são descartadas. */
export async function importarGastos(linhas: LinhaImportada[], cartaoId: string | null = null) {
  const cartao = await cartaoExistente(cartaoId);
  const validas = linhas
    .slice(0, 2000)
    .map((linha) => ({
      data: data(linha.data),
      descricao: String(linha.descricao ?? "").trim().slice(0, 60),
      valor: dinheiro(String(linha.valor)),
      categoria: categoria(linha.categoria),
      escopo: escopo(linha.escopo),
      cartaoId: cartao,
    }))
    .filter((linha): linha is typeof linha & { data: Date } => !!linha.data && !!linha.descricao && linha.valor > 0);

  if (validas.length === 0) throw new Error("Nenhuma linha válida para importar");
  await prisma.gasto.createMany({ data: validas });

  revalidatePath("/");
  revalidatePath("/lancamentos");
  const maisRecente = validas.map((l) => l.data.toISOString().slice(0, 7)).sort().at(-1);
  redirect(`/lancamentos?mes=${maisRecente}`);
}

export type EntradaImportada = { data: string; descricao: string; valor: number; tipo: string; escopo: string };

/** Entradas avulsas já gravadas em um intervalo de datas, para marcar duplicadas na revisão do extrato. */
export async function entradasNoIntervalo(de: string, ate: string) {
  const inicio = data(de);
  const fim = data(ate);
  if (!inicio || !fim) return [];
  const entradas = await prisma.entrada.findMany({
    where: { data: { gte: inicio, lte: fim } },
    select: { data: true, valor: true, descricao: true },
  });
  return entradas.map((e) => ({ data: e.data.toISOString().slice(0, 10), valor: e.valor, descricao: e.descricao }));
}

/** Grava como entradas avulsas as linhas escolhidas na revisão do extrato. */
export async function importarEntradas(linhas: EntradaImportada[]) {
  const validas = linhas
    .slice(0, 2000)
    .map((linha) => ({
      data: data(linha.data),
      descricao: String(linha.descricao ?? "").trim().slice(0, 60),
      valor: dinheiro(String(linha.valor)),
      tipo: tipoEntrada(linha.tipo),
      escopo: escopo(linha.escopo),
    }))
    .filter((linha): linha is typeof linha & { data: Date } => !!linha.data && !!linha.descricao && linha.valor > 0);

  if (validas.length === 0) throw new Error("Nenhuma linha válida para importar");
  await prisma.entrada.createMany({ data: validas });

  revalidatePath("/");
  revalidatePath("/entradas");
  const maisRecente = validas.map((l) => l.data.toISOString().slice(0, 7)).sort().at(-1);
  redirect(`/entradas?mes=${maisRecente}`);
}

export type PagamentoImportado = { data: string; descricao: string; valor: number; escopo: string };

/** Pagamentos já registrados no cartão em um intervalo de datas, para marcar duplicados na revisão. */
export async function pagamentosNoIntervalo(cartaoId: string, de: string, ate: string) {
  const inicio = data(de);
  const fim = data(ate);
  if (!inicio || !fim) return [];
  const pagamentos = await prisma.pagamentoCartao.findMany({
    where: { cartaoId, data: { gte: inicio, lte: fim } },
    select: { data: true, valor: true },
  });
  return pagamentos.map((p) => ({ data: p.data.toISOString().slice(0, 10), valor: p.valor }));
}

/**
 * Grava a fatura de um cartão: as compras ficam no cartão (fora dos gastos do
 * mês) e os pagamentos escolhidos viram pagamentos da fatura (entram nos gastos
 * na data em que foram pagos).
 */
export async function importarFatura(cartaoId: string, compras: LinhaImportada[], pagamentos: PagamentoImportado[]) {
  const cartao = await cartaoExistente(cartaoId);
  if (!cartao) throw new Error("Cartão não encontrado");

  const comprasValidas = compras
    .slice(0, 2000)
    .map((linha) => ({
      data: data(linha.data),
      descricao: String(linha.descricao ?? "").trim().slice(0, 60),
      valor: dinheiro(String(linha.valor)),
      categoria: categoria(linha.categoria),
      escopo: escopo(linha.escopo),
      cartaoId: cartao,
    }))
    .filter((linha): linha is typeof linha & { data: Date } => !!linha.data && !!linha.descricao && linha.valor > 0);

  const pagamentosValidos = pagamentos
    .slice(0, 200)
    .map((linha) => ({
      data: data(linha.data),
      valor: dinheiro(String(linha.valor)),
      escopo: escopo(linha.escopo),
      descricao: String(linha.descricao ?? "").trim().slice(0, 60) || null,
      cartaoId: cartao,
    }))
    .filter((linha): linha is typeof linha & { data: Date } => !!linha.data && linha.valor > 0);

  if (comprasValidas.length + pagamentosValidos.length === 0) throw new Error("Nada válido para importar");
  await prisma.$transaction([
    prisma.gasto.createMany({ data: comprasValidas }),
    prisma.pagamentoCartao.createMany({ data: pagamentosValidos }),
  ]);

  revalidatePath("/");
  revalidatePath("/cartoes");
  revalidatePath("/lancamentos");
  const meses = [...comprasValidas, ...pagamentosValidos].map((l) => l.data.toISOString().slice(0, 7)).sort();
  redirect(`/cartoes/${cartao}?mes=${meses.at(-1)}`);
}
