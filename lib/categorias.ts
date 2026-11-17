import { prisma } from "@/lib/prisma";
import { chaveDescricao } from "@/lib/extrato";
import type { CategoriaChave } from "@/lib/formatacao";

/** Regras aprendidas para um conjunto de descrições: chave → categoria. */
export async function regrasPara(descricoes: string[]): Promise<Record<string, CategoriaChave>> {
  const chaves = [...new Set(descricoes.map(chaveDescricao).filter(Boolean))];
  if (chaves.length === 0) return {};
  const regras = await prisma.regraCategoria.findMany({ where: { chave: { in: chaves } } });
  return Object.fromEntries(regras.map((r) => [r.chave, r.categoria]));
}

/**
 * Guarda a categoria escolhida para a descrição; "OUTROS" e "CARTAO" não
 * ensinam nada (OUTROS é a ausência de escolha) e apagam a regra que houver.
 */
export async function aprenderCategoria(descricao: string, categoria: string) {
  const chave = chaveDescricao(descricao);
  if (!chave) return;
  if (categoria === "OUTROS" || categoria === "CARTAO") {
    await prisma.regraCategoria.deleteMany({ where: { chave } });
    return;
  }
  await prisma.regraCategoria.upsert({
    where: { chave },
    create: { chave, categoria: categoria as CategoriaChave },
    update: { categoria: categoria as CategoriaChave },
  });
}

/** Aprende várias de uma vez (importação): a última ocorrência de cada chave vale. */
export async function aprenderCategorias(linhas: { descricao: string; categoria: string }[]) {
  const porChave = new Map<string, string>();
  for (const linha of linhas) {
    const chave = chaveDescricao(linha.descricao);
    if (chave && linha.categoria !== "OUTROS" && linha.categoria !== "CARTAO") porChave.set(chave, linha.categoria);
  }
  for (const [chave, categoria] of porChave) {
    await prisma.regraCategoria.upsert({
      where: { chave },
      create: { chave, categoria: categoria as CategoriaChave },
      update: { categoria: categoria as CategoriaChave },
    });
  }
}
