"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { categoria, data, dinheiro, escopo, texto } from "@/lib/validacao";
import { cartaoExistente } from "@/lib/financas";
import { aprenderCategoria } from "@/lib/categorias";

async function dadosComuns(formData: FormData) {
  const descricao = texto(formData.get("descricao"));
  const quando = data(formData.get("data"));
  const valor = dinheiro(formData.get("valor"));
  if (!descricao) throw new Error("Descrição é obrigatória");
  if (!quando) throw new Error("Data inválida");
  if (valor <= 0) throw new Error("Valor deve ser maior que zero");
  return {
    descricao,
    categoria: categoria(formData.get("categoria")),
    escopo: escopo(formData.get("escopo")),
    valor,
    data: quando,
    cartaoId: await cartaoExistente(formData.get("cartaoId")),
  };
}

function revalidar() {
  revalidatePath("/");
  revalidatePath("/lancamentos");
}

export async function criarGasto(formData: FormData) {
  const gasto = await prisma.gasto.create({ data: await dadosComuns(formData) });
  revalidar();
  redirect(`/lancamentos?mes=${gasto.data.toISOString().slice(0, 7)}`);
}

export async function atualizarGasto(id: string, formData: FormData) {
  const dados = await dadosComuns(formData);
  const anterior = await prisma.gasto.findUnique({ where: { id }, select: { categoria: true } });
  const gasto = await prisma.gasto.update({ where: { id }, data: dados });
  // Categoria corrigida à mão ensina as próximas importações.
  if (anterior && anterior.categoria !== dados.categoria) await aprenderCategoria(dados.descricao, dados.categoria);
  revalidar();
  redirect(`/lancamentos?mes=${gasto.data.toISOString().slice(0, 7)}`);
}

export async function excluirGasto(id: string) {
  const gasto = await prisma.gasto.delete({ where: { id } });
  revalidar();
  redirect(`/lancamentos?mes=${gasto.data.toISOString().slice(0, 7)}`);
}
