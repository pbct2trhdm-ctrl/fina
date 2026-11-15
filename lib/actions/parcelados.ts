"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { categoria, dinheiro, escopo, inteiro, mes, texto } from "@/lib/validacao";
import { cartaoExistente } from "@/lib/financas";

async function dadosComuns(formData: FormData) {
  const descricao = texto(formData.get("descricao"));
  const valorParcela = dinheiro(formData.get("valorParcela"));
  if (!descricao) throw new Error("Descrição é obrigatória");
  if (valorParcela <= 0) throw new Error("Valor da parcela deve ser maior que zero");
  return {
    descricao,
    valorParcela,
    parcelas: inteiro(formData.get("parcelas"), 1, 120, 1),
    inicio: mes(formData.get("inicio")),
    diaCobranca: inteiro(formData.get("diaCobranca"), 1, 31, 10),
    categoria: categoria(formData.get("categoria")),
    escopo: escopo(formData.get("escopo")),
    cartaoId: await cartaoExistente(formData.get("cartaoId")),
  };
}

function revalidar() {
  revalidatePath("/");
  revalidatePath("/parcelados");
  revalidatePath("/lancamentos");
}

export async function criarCompra(formData: FormData) {
  await prisma.compraParcelada.create({ data: await dadosComuns(formData) });
  revalidar();
  redirect("/parcelados");
}

export async function atualizarCompra(id: string, formData: FormData) {
  await prisma.compraParcelada.update({ where: { id }, data: await dadosComuns(formData) });
  revalidar();
  redirect("/parcelados");
}

export async function excluirCompra(id: string) {
  await prisma.compraParcelada.delete({ where: { id } });
  revalidar();
  redirect("/parcelados");
}
