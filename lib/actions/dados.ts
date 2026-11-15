"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mesAtual, somarMeses, diasNoMes } from "@/lib/meses";
import { hojeIsoLocal } from "@/lib/datas";
import type { CategoriaChave, EscopoChave } from "@/lib/formatacao";

async function apagarTudo() {
  await prisma.$transaction([
    prisma.recebimentoEntrada.deleteMany(),
    prisma.entradaFixa.deleteMany(),
    prisma.entrada.deleteMany(),
    prisma.pagamentoConta.deleteMany(),
    prisma.contaFixa.deleteMany(),
    prisma.gasto.deleteMany(),
    prisma.compraParcelada.deleteMany(),
    prisma.orcamento.deleteMany(),
    prisma.limiteCategoria.deleteMany(),
    prisma.reserva.deleteMany(),
    prisma.meta.deleteMany(),
    prisma.cartao.deleteMany(),
  ]);
}

export async function apagarTodosOsDados() {
  await apagarTudo();
  revalidatePath("/", "layout");
  redirect("/configuracoes");
}

/**
 * Preenche o banco com dados fictícios dos últimos 6 meses, para conhecer o
 * sistema antes de lançar os dados reais. Só roda com o banco vazio.
 */
export async function carregarDadosDeExemplo() {
  const [gastos, contas, entradas, fixas] = await Promise.all([
    prisma.gasto.count(),
    prisma.contaFixa.count(),
    prisma.entrada.count(),
    prisma.entradaFixa.count(),
  ]);
  if (gastos + contas + entradas + fixas > 0) throw new Error("Já existem dados; apague tudo antes de carregar o exemplo");
  await apagarTudo();

  const atual = mesAtual();
  const diaHoje = Number(hojeIsoLocal().slice(8));
  // Gerador determinístico: o exemplo é sempre o mesmo.
  let semente = 42;
  const sorteio = () => (semente = (semente * 1664525 + 1013904223) % 4294967296) / 4294967296;

  const modelos: [string, CategoriaChave, EscopoChave, number, number][] = [
    ["Supermercado", "MERCADO", "CASA", 180, 420],
    ["Supermercado", "MERCADO", "CASA", 120, 300],
    ["Feira", "MERCADO", "CASA", 60, 140],
    ["Padaria", "ALIMENTACAO", "CASA", 20, 60],
    ["Almoço", "ALIMENTACAO", "EU", 28, 65],
    ["Combustível", "TRANSPORTE", "EU", 150, 260],
    ["Cinema", "LAZER", "EU", 40, 90],
    ["Livros", "EDUCACAO", "EU", 40, 120],
    ["Farmácia", "SAUDE", "ESPOSA", 40, 160],
    ["Roupas", "ROUPAS", "ESPOSA", 90, 350],
    ["Aplicativo de transporte", "TRANSPORTE", "ESPOSA", 18, 55],
    ["Salão", "OUTROS", "ESPOSA", 80, 220],
    ["Restaurante", "LAZER", "CASA", 120, 280],
  ];

  const novosGastos = [];
  for (let i = -5; i <= 0; i++) {
    const mes = somarMeses(atual, i);
    const limite = i === 0 ? diaHoje : diasNoMes(mes);
    const quantidade = Math.max(2, Math.round((22 * limite) / diasNoMes(mes)));
    const [ano, m] = mes.split("-").map(Number);
    for (let k = 0; k < quantidade; k++) {
      const [descricao, categoria, escopo, minimo, maximo] = modelos[Math.floor(sorteio() * modelos.length)];
      novosGastos.push({
        descricao,
        categoria,
        escopo,
        valor: Math.round((minimo + sorteio() * (maximo - minimo)) * 100) / 100,
        data: new Date(Date.UTC(ano, m - 1, 1 + Math.floor(sorteio() * limite))),
      });
    }
  }
  await prisma.gasto.createMany({ data: novosGastos });

  const contasExemplo: [string, number, number, EscopoChave, CategoriaChave][] = [
    ["Aluguel", 5, 2800, "CASA", "MORADIA"],
    ["Academia", 8, 130, "ESPOSA", "SAUDE"],
    ["Condomínio", 10, 650, "CASA", "MORADIA"],
    ["Energia", 12, 240, "CASA", "MORADIA"],
    ["Internet", 15, 120, "CASA", "MORADIA"],
    ["Água", 18, 95, "CASA", "MORADIA"],
    ["Celular", 20, 70, "EU", "ASSINATURAS"],
    ["Streaming", 22, 56, "CASA", "ASSINATURAS"],
  ];
  const inicio = somarMeses(atual, -5);
  for (const [descricao, diaVencimento, valor, escopo, categoria] of contasExemplo) {
    const mesesPagos = [-5, -4, -3, -2, -1].map((i) => somarMeses(atual, i));
    if (diaVencimento <= diaHoje - 2) mesesPagos.push(atual);
    await prisma.contaFixa.create({
      data: {
        descricao,
        diaVencimento,
        valor,
        escopo,
        categoria,
        inicio,
        pagamentos: { create: mesesPagos.map((mes) => ({ mes, valor })) },
      },
    });
  }

  // Salários: confirmados nos meses fechados e, no mês atual, só se o dia já passou.
  const salarios: [string, number, number, EscopoChave][] = [
    ["Salário", 5, 9000, "EU"],
    ["Salário", 5, 6500, "ESPOSA"],
  ];
  for (const [descricao, diaRecebimento, valor, escopo] of salarios) {
    const mesesRecebidos = [-5, -4, -3, -2, -1].map((i) => somarMeses(atual, i));
    if (diaRecebimento <= diaHoje) mesesRecebidos.push(atual);
    await prisma.entradaFixa.create({
      data: {
        descricao,
        tipo: "SALARIO",
        diaRecebimento,
        valor,
        escopo,
        inicio,
        recebimentos: { create: mesesRecebidos.map((mes) => ({ mes, valor })) },
      },
    });
  }
  const [anoPassado, mesPassado] = somarMeses(atual, -1).split("-").map(Number);
  await prisma.entrada.create({
    data: { descricao: "Reembolso de viagem", tipo: "EXTRA", valor: 480, escopo: "EU", data: new Date(Date.UTC(anoPassado, mesPassado - 1, 18)) },
  });

  await prisma.compraParcelada.createMany({
    data: [
      { descricao: "Geladeira", escopo: "CASA", categoria: "ELETRONICOS", valorParcela: 389.9, parcelas: 10, inicio: somarMeses(atual, -5), diaCobranca: 7 },
      { descricao: "Notebook", escopo: "EU", categoria: "ELETRONICOS", valorParcela: 412.5, parcelas: 12, inicio: somarMeses(atual, -8), diaCobranca: 3 },
      { descricao: "Curso de inglês", escopo: "ESPOSA", categoria: "EDUCACAO", valorParcela: 199, parcelas: 6, inicio: somarMeses(atual, -2), diaCobranca: 2 },
    ],
  });
  await prisma.orcamento.createMany({
    data: [
      { escopo: "EU", valor: 2500 },
      { escopo: "ESPOSA", valor: 1800 },
      { escopo: "CASA", valor: 6500 },
    ],
  });
  await prisma.limiteCategoria.createMany({
    data: [
      { visao: "TODOS", categoria: "MERCADO", valor: 1500 },
      { visao: "TODOS", categoria: "LAZER", valor: 600 },
      { visao: "EU", categoria: "TRANSPORTE", valor: 400 },
      { visao: "ESPOSA", categoria: "ROUPAS", valor: 250 },
      { visao: "CASA", categoria: "MERCADO", valor: 1500 },
    ],
  });
  await prisma.reserva.create({ data: { id: 1, valorGuardado: 18000, mesesMeta: 6 } });
  await prisma.meta.createMany({
    data: [
      { descricao: "Viagem de férias", valorAlvo: 15000, valorGuardado: 9200, prazo: somarMeses(atual, 8) },
      { descricao: "Troca do carro", valorAlvo: 40000, valorGuardado: 6500, prazo: null },
    ],
  });

  revalidatePath("/", "layout");
  redirect("/");
}
