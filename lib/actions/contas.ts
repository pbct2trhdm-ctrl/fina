"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { categoria, dinheiro, escopo, inteiro, mes, texto } from "@/lib/validacao";
import { somarMeses } from "@/lib/meses";
import { cartaoExistente } from "@/lib/financas";

async function dadosComuns(formData: FormData) {
  const descricao = texto(formData.get("descricao"));
  const valor = dinheiro(formData.get("valor"));
  if (!descricao) throw new Error("Descrição é obrigatória");
  if (valor <= 0) throw new Error("Valor deve ser maior que zero");
  return {
    descricao,
    valor,
    categoria: categoria(formData.get("categoria")),
    escopo: escopo(formData.get("escopo")),
    diaVencimento: inteiro(formData.get("diaVencimento"), 1, 31, 10),
    cartaoId: await cartaoExistente(formData.get("cartaoId")),
  };
}

function revalidar() {
  revalidatePath("/");
  revalidatePath("/contas");
  revalidatePath("/lancamentos");
  revalidatePath("/cartoes");
  revalidatePath("/previsao");
}

export async function criarConta(formData: FormData) {
  const inicio = mes(formData.get("inicio"));
  await prisma.contaFixa.create({ data: { ...(await dadosComuns(formData)), inicio } });
  revalidar();
  redirect(`/contas?mes=${inicio}`);
}

/** Mudar o valor só afeta meses ainda não pagos: cada pagamento guarda o valor da época. */
export async function atualizarConta(id: string, formData: FormData) {
  await prisma.contaFixa.update({ where: { id }, data: await dadosComuns(formData) });
  revalidar();
  redirect("/contas");
}

/**
 * Encerra a conta a partir do mês informado: ela deixa de aparecer dali em
 * diante e os pagamentos anteriores continuam no histórico. Se a conta nunca
 * foi paga antes desse mês, é simplesmente apagada.
 */
export async function encerrarConta(id: string, aPartirDe: string) {
  const fim = somarMeses(mes(aPartirDe), -1);
  await prisma.pagamentoConta.deleteMany({ where: { contaId: id, mes: { gt: fim } } });
  const restantes = await prisma.pagamentoConta.count({ where: { contaId: id } });
  if (restantes === 0) await prisma.contaFixa.delete({ where: { id } });
  else await prisma.contaFixa.update({ where: { id }, data: { fim } });
  revalidar();
  redirect(`/contas?mes=${mes(aPartirDe)}`);
}

/** Apaga a conta e todos os pagamentos dela, inclusive o histórico (para cadastro feito por engano). */
export async function excluirConta(id: string) {
  await prisma.contaFixa.delete({ where: { id } });
  revalidar();
  redirect("/contas");
}

/** Marca a conta como paga no mês (pelo valor atual) ou desfaz o pagamento. */
export async function alternarPagamento(id: string, mesPagamento: string, voltarPara: string) {
  const alvo = mes(mesPagamento);
  const existente = await prisma.pagamentoConta.findUnique({ where: { contaId_mes: { contaId: id, mes: alvo } } });
  if (existente) {
    await prisma.pagamentoConta.delete({ where: { id: existente.id } });
  } else {
    const conta = await prisma.contaFixa.findUniqueOrThrow({ where: { id } });
    // Conta cobrada no cartão não se paga aqui: entra pelo pagamento da fatura.
    if (conta.cartaoId) throw new Error("Conta cobrada no cartão: registre o pagamento da fatura do cartão");
    await prisma.pagamentoConta.create({ data: { contaId: id, mes: alvo, valor: conta.valor } });
  }
  revalidar();
  redirect(voltarPara.startsWith("/") && !voltarPara.startsWith("//") ? voltarPara : "/contas");
}
