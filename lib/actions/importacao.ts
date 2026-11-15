"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { categoria, data, dinheiro, escopo } from "@/lib/validacao";

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
export async function importarGastos(linhas: LinhaImportada[]) {
  const validas = linhas
    .slice(0, 2000)
    .map((linha) => ({
      data: data(linha.data),
      descricao: String(linha.descricao ?? "").trim().slice(0, 60),
      valor: dinheiro(String(linha.valor)),
      categoria: categoria(linha.categoria),
      escopo: escopo(linha.escopo),
    }))
    .filter((linha): linha is typeof linha & { data: Date } => !!linha.data && !!linha.descricao && linha.valor > 0);

  if (validas.length === 0) throw new Error("Nenhuma linha válida para importar");
  await prisma.gasto.createMany({ data: validas });

  revalidatePath("/");
  revalidatePath("/lancamentos");
  const maisRecente = validas.map((l) => l.data.toISOString().slice(0, 7)).sort().at(-1);
  redirect(`/lancamentos?mes=${maisRecente}`);
}
