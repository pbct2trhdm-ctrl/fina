"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { escopo, inteiro, texto } from "@/lib/validacao";

function revalidar() {
  revalidatePath("/");
  revalidatePath("/cartoes");
  revalidatePath("/lancamentos");
  revalidatePath("/parcelados");
}

/** Dia do mês (1–31) ou nulo se o campo estiver em branco. */
function diaOpcional(valor: FormDataEntryValue | null): number | null {
  return texto(valor) === "" ? null : inteiro(valor, 1, 31, 1);
}

function dados(formData: FormData) {
  const nome = texto(formData.get("nome"));
  if (!nome) throw new Error("Nome é obrigatório");
  return {
    nome: nome.slice(0, 40),
    escopo: escopo(formData.get("escopo")),
    diaFechamento: diaOpcional(formData.get("diaFechamento")),
    diaVencimento: diaOpcional(formData.get("diaVencimento")),
  };
}

export async function criarCartao(formData: FormData) {
  await prisma.cartao.create({ data: dados(formData) });
  revalidar();
  redirect("/cartoes");
}

export async function atualizarCartao(id: string, formData: FormData) {
  await prisma.cartao.update({ where: { id }, data: dados(formData) });
  revalidar();
  redirect("/cartoes");
}

/** Apaga o cartão; os gastos e parcelas dele continuam, só ficam sem cartão. */
export async function excluirCartao(id: string) {
  await prisma.cartao.delete({ where: { id } });
  revalidar();
  redirect("/cartoes");
}
