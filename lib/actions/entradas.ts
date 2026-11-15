"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { data, dinheiro, escopo, inteiro, mes, texto, tipoEntrada } from "@/lib/validacao";
import { somarMeses } from "@/lib/meses";

function revalidar() {
  revalidatePath("/");
  revalidatePath("/entradas");
}

// ── Entradas avulsas ──

function dadosAvulsa(formData: FormData) {
  const descricao = texto(formData.get("descricao"));
  const quando = data(formData.get("data"));
  const valor = dinheiro(formData.get("valor"));
  if (!descricao) throw new Error("Descrição é obrigatória");
  if (!quando) throw new Error("Data inválida");
  if (valor <= 0) throw new Error("Valor deve ser maior que zero");
  return { descricao, valor, data: quando, tipo: tipoEntrada(formData.get("tipo")), escopo: escopo(formData.get("escopo")) };
}

export async function criarEntrada(formData: FormData) {
  const entrada = await prisma.entrada.create({ data: dadosAvulsa(formData) });
  revalidar();
  redirect(`/entradas?mes=${entrada.data.toISOString().slice(0, 7)}`);
}

export async function atualizarEntrada(id: string, formData: FormData) {
  const entrada = await prisma.entrada.update({ where: { id }, data: dadosAvulsa(formData) });
  revalidar();
  redirect(`/entradas?mes=${entrada.data.toISOString().slice(0, 7)}`);
}

export async function excluirEntrada(id: string) {
  const entrada = await prisma.entrada.delete({ where: { id } });
  revalidar();
  redirect(`/entradas?mes=${entrada.data.toISOString().slice(0, 7)}`);
}

// ── Entradas fixas (mesma lógica das contas fixas, em lib/actions/contas.ts) ──

function dadosFixa(formData: FormData) {
  const descricao = texto(formData.get("descricao"));
  const valor = dinheiro(formData.get("valor"));
  if (!descricao) throw new Error("Descrição é obrigatória");
  if (valor <= 0) throw new Error("Valor deve ser maior que zero");
  return {
    descricao,
    valor,
    tipo: tipoEntrada(formData.get("tipo")),
    escopo: escopo(formData.get("escopo")),
    diaRecebimento: inteiro(formData.get("diaRecebimento"), 1, 31, 5),
  };
}

export async function criarEntradaFixa(formData: FormData) {
  const inicio = mes(formData.get("inicio"));
  await prisma.entradaFixa.create({ data: { ...dadosFixa(formData), inicio } });
  revalidar();
  redirect(`/entradas?mes=${inicio}`);
}

/** Mudar o valor só afeta meses ainda não confirmados: cada recebimento guarda o valor da época. */
export async function atualizarEntradaFixa(id: string, formData: FormData) {
  await prisma.entradaFixa.update({ where: { id }, data: dadosFixa(formData) });
  revalidar();
  redirect("/entradas");
}

/** Encerra a entrada a partir do mês informado, mantendo os recebimentos anteriores no histórico. */
export async function encerrarEntradaFixa(id: string, aPartirDe: string) {
  const fim = somarMeses(mes(aPartirDe), -1);
  await prisma.recebimentoEntrada.deleteMany({ where: { entradaId: id, mes: { gt: fim } } });
  const restantes = await prisma.recebimentoEntrada.count({ where: { entradaId: id } });
  if (restantes === 0) await prisma.entradaFixa.delete({ where: { id } });
  else await prisma.entradaFixa.update({ where: { id }, data: { fim } });
  revalidar();
  redirect(`/entradas?mes=${mes(aPartirDe)}`);
}

/** Apaga a entrada fixa e todos os recebimentos dela (para cadastro feito por engano). */
export async function excluirEntradaFixa(id: string) {
  await prisma.entradaFixa.delete({ where: { id } });
  revalidar();
  redirect("/entradas");
}

/** Confirma o recebimento no mês (pelo valor atual) ou desfaz a confirmação. */
export async function alternarRecebimento(id: string, mesRecebimento: string, voltarPara: string) {
  const alvo = mes(mesRecebimento);
  const existente = await prisma.recebimentoEntrada.findUnique({ where: { entradaId_mes: { entradaId: id, mes: alvo } } });
  if (existente) {
    await prisma.recebimentoEntrada.delete({ where: { id: existente.id } });
  } else {
    const fixa = await prisma.entradaFixa.findUniqueOrThrow({ where: { id } });
    await prisma.recebimentoEntrada.create({ data: { entradaId: id, mes: alvo, valor: fixa.valor } });
  }
  revalidar();
  redirect(voltarPara.startsWith("/") && !voltarPara.startsWith("//") ? voltarPara : "/entradas");
}
