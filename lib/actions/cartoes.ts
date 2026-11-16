"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { data, dinheiro, escopo, inteiro, texto } from "@/lib/validacao";

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

// ── Pagamentos de fatura (total ou parcial): é o que entra nos gastos do mês ──

function dadosPagamento(formData: FormData) {
  const quando = data(formData.get("data"));
  const valor = dinheiro(formData.get("valor"));
  if (!quando) throw new Error("Data inválida");
  if (valor <= 0) throw new Error("Valor deve ser maior que zero");
  const descricao = texto(formData.get("descricao")).slice(0, 60);
  return { data: quando, valor, escopo: escopo(formData.get("escopo")), descricao: descricao || null };
}

function destino(cartaoId: string, quando: Date) {
  return `/cartoes/${cartaoId}?mes=${quando.toISOString().slice(0, 7)}`;
}

export async function criarPagamento(cartaoId: string, formData: FormData) {
  const dados = dadosPagamento(formData);
  await prisma.pagamentoCartao.create({ data: { ...dados, cartaoId } });
  revalidar();
  redirect(destino(cartaoId, dados.data));
}

export async function atualizarPagamento(cartaoId: string, id: string, formData: FormData) {
  const dados = dadosPagamento(formData);
  await prisma.pagamentoCartao.update({ where: { id }, data: dados });
  revalidar();
  redirect(destino(cartaoId, dados.data));
}

export async function excluirPagamento(cartaoId: string, id: string) {
  const pagamento = await prisma.pagamentoCartao.delete({ where: { id } });
  revalidar();
  redirect(destino(cartaoId, pagamento.data));
}
