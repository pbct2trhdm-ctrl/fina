export const ESCOPOS = ["EU", "ESPOSA", "CASA"] as const;
export type EscopoChave = (typeof ESCOPOS)[number];

export const VISOES = ["TODOS", "EU", "ESPOSA", "CASA"] as const;
export type VisaoChave = (typeof VISOES)[number];

export const LABEL_ESCOPO: Record<string, string> = {
  EU: "Eu",
  ESPOSA: "Esposa",
  CASA: "Casa",
};

export const LABEL_VISAO: Record<string, string> = {
  TODOS: "Família",
  ...LABEL_ESCOPO,
};

/**
 * Cor de cada pessoa nos gráficos e marcadores. A cor segue a pessoa, nunca a
 * posição: filtrar uma visão não repinta as demais. Trio validado para
 * daltonismo (azul, laranja, verde-água) — ver app/globals.css.
 */
export const COR_ESCOPO: Record<string, string> = {
  EU: "var(--color-escopo-eu)",
  ESPOSA: "var(--color-escopo-esposa)",
  CASA: "var(--color-escopo-casa)",
};

export const CATEGORIAS = [
  "MORADIA",
  "MERCADO",
  "ALIMENTACAO",
  "TRANSPORTE",
  "SAUDE",
  "LAZER",
  "ROUPAS",
  "ASSINATURAS",
  "EDUCACAO",
  "ELETRONICOS",
  "OUTROS",
] as const;
export type CategoriaChave = (typeof CATEGORIAS)[number];

export const LABEL_CATEGORIA: Record<string, string> = {
  MORADIA: "Moradia",
  MERCADO: "Mercado",
  ALIMENTACAO: "Alimentação",
  TRANSPORTE: "Transporte",
  SAUDE: "Saúde",
  LAZER: "Lazer",
  ROUPAS: "Roupas",
  ASSINATURAS: "Assinaturas",
  EDUCACAO: "Educação",
  ELETRONICOS: "Eletrônicos",
  OUTROS: "Outros",
};

export const TIPOS_ENTRADA = ["SALARIO", "HONORARIOS", "EXTRA", "OUTROS"] as const;
export type TipoEntradaChave = (typeof TIPOS_ENTRADA)[number];

export const LABEL_TIPO_ENTRADA: Record<string, string> = {
  SALARIO: "Salário",
  HONORARIOS: "Honorários",
  EXTRA: "Renda extra",
  OUTROS: "Outros",
};

export const LABEL_TIPO_LANCAMENTO: Record<string, string> = {
  GASTO: "Gasto",
  CONTA: "Conta fixa",
  PARCELA: "Parcela",
};

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Moeda sem centavos — para orçamentos e metas, onde os centavos só poluem. */
export function formatarMoedaCheia(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function formatarData(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** "AAAA-MM-DD" de uma data gravada (meia-noite UTC) — valor de campos de data. */
export function paraInputDate(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().slice(0, 10);
}
