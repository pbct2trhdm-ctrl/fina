/** Leitura segura dos campos de formulário usados pelas actions. */
import { CATEGORIAS, ESCOPOS, VISOES, type CategoriaChave, type EscopoChave, type VisaoChave } from "@/lib/formatacao";
import { mesAtual, mesValido } from "@/lib/meses";

export function texto(valor: FormDataEntryValue | null): string {
  return (valor ?? "").toString().trim();
}

/** Valor em reais, nunca negativo, arredondado para centavos. */
export function dinheiro(valor: FormDataEntryValue | null): number {
  const numero = Number((valor ?? "").toString().replace(",", "."));
  return Number.isFinite(numero) ? Math.max(0, Math.round(numero * 100) / 100) : 0;
}

export function inteiro(valor: FormDataEntryValue | null, minimo: number, maximo: number, padrao: number): number {
  const numero = Math.round(Number(valor ?? ""));
  return Number.isFinite(numero) ? Math.min(maximo, Math.max(minimo, numero)) : padrao;
}

export function categoria(valor: unknown): CategoriaChave {
  const chave = (valor ?? "").toString();
  return (CATEGORIAS as readonly string[]).includes(chave) ? (chave as CategoriaChave) : "OUTROS";
}

export function escopo(valor: unknown): EscopoChave {
  const chave = (valor ?? "").toString();
  return (ESCOPOS as readonly string[]).includes(chave) ? (chave as EscopoChave) : "CASA";
}

export function visao(valor: unknown): VisaoChave {
  const chave = (valor ?? "").toString();
  return (VISOES as readonly string[]).includes(chave) ? (chave as VisaoChave) : "TODOS";
}

export function mes(valor: unknown): string {
  const chave = (valor ?? "").toString();
  return mesValido(chave) ? chave : mesAtual();
}

/** "AAAA-MM-DD" → Date à meia-noite UTC (convenção das datas gravadas); nulo se inválida. */
export function data(valor: unknown): Date | null {
  const m = (valor ?? "").toString().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 ? d : null;
}
