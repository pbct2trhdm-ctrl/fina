"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { categoria, dinheiro, escopo, inteiro, mes, texto } from "@/lib/validacao";
import { cartaoExistente } from "@/lib/financas";

function tipoDe(formData: FormData): "COMPRA" | "DIVIDA" {
  return formData.get("tipo") === "DIVIDA" ? "DIVIDA" : "COMPRA";
}

function destino(tipo: "COMPRA" | "DIVIDA") {
  return tipo === "DIVIDA" ? "/dividas" : "/parcelados";
}

async function dadosComuns(formData: FormData) {
  const tipo = tipoDe(formData);
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
    tipo,
    // Dívida é paga da conta, nunca "no cartão".
    cartaoId: tipo === "DIVIDA" ? null : await cartaoExistente(formData.get("cartaoId")),
  };
}

function revalidar() {
  revalidatePath("/");
  revalidatePath("/parcelados");
  revalidatePath("/dividas");
  revalidatePath("/previsao");
  revalidatePath("/lancamentos");
}

export async function criarCompra(formData: FormData) {
  const dados = await dadosComuns(formData);
  await prisma.compraParcelada.create({ data: dados });
  revalidar();
  redirect(destino(dados.tipo));
}

export async function atualizarCompra(id: string, formData: FormData) {
  const dados = await dadosComuns(formData);
  await prisma.compraParcelada.update({ where: { id }, data: dados });
  revalidar();
  redirect(destino(dados.tipo));
}

export async function excluirCompra(id: string) {
  const apagada = await prisma.compraParcelada.delete({ where: { id } });
  revalidar();
  redirect(destino(apagada.tipo));
}
