"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { dinheiro, inteiro, texto } from "@/lib/validacao";
import { mesValido } from "@/lib/meses";

function revalidar() {
  revalidatePath("/");
  revalidatePath("/metas");
}

export async function salvarReserva(formData: FormData) {
  const dados = {
    valorGuardado: dinheiro(formData.get("valorGuardado")),
    mesesMeta: inteiro(formData.get("mesesMeta"), 1, 36, 6),
  };
  await prisma.reserva.upsert({ where: { id: 1 }, create: { id: 1, ...dados }, update: dados });
  revalidar();
  redirect("/metas");
}

function dadosMeta(formData: FormData) {
  const descricao = texto(formData.get("descricao"));
  const valorAlvo = dinheiro(formData.get("valorAlvo"));
  const prazo = texto(formData.get("prazo"));
  if (!descricao) throw new Error("Descrição é obrigatória");
  if (valorAlvo <= 0) throw new Error("Valor da meta deve ser maior que zero");
  return {
    descricao,
    valorAlvo,
    valorGuardado: dinheiro(formData.get("valorGuardado")),
    prazo: mesValido(prazo) ? prazo : null,
  };
}

export async function criarMeta(formData: FormData) {
  await prisma.meta.create({ data: dadosMeta(formData) });
  revalidar();
  redirect("/metas");
}

export async function atualizarMeta(id: string, formData: FormData) {
  await prisma.meta.update({ where: { id }, data: dadosMeta(formData) });
  revalidar();
  redirect("/metas");
}

export async function excluirMeta(id: string) {
  await prisma.meta.delete({ where: { id } });
  revalidar();
  redirect("/metas");
}
