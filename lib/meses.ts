/**
 * Meses como texto "AAAA-MM" — a unidade do controle financeiro (orçamento,
 * contas fixas e parcelas são mensais). Comparar dois meses é comparar texto.
 */
import { hojeIsoLocal } from "@/lib/datas";

const pad = (n: number) => String(n).padStart(2, "0");

/** Mês de hoje no calendário local (mesma convenção de lib/datas.ts). */
export function mesAtual(): string {
  return hojeIsoLocal().slice(0, 7);
}

export function mesValido(texto: string | null | undefined): texto is string {
  return !!texto && /^\d{4}-(0[1-9]|1[0-2])$/.test(texto);
}

export function somarMeses(mes: string, quantidade: number): string {
  const [ano, m] = mes.split("-").map(Number);
  const total = ano * 12 + (m - 1) + quantidade;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

/** Quantos meses de `de` até `ate` (negativo se `ate` é anterior). */
export function diferencaMeses(de: string, ate: string): number {
  const [a1, m1] = de.split("-").map(Number);
  const [a2, m2] = ate.split("-").map(Number);
  return (a2 - a1) * 12 + (m2 - m1);
}

export function diasNoMes(mes: string): number {
  const [ano, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(ano, m, 0)).getUTCDate();
}

/** "AAAA-MM-DD" de um dia do mês, limitando ao último dia (dia 31 em fevereiro → 28). */
export function diaDoMes(mes: string, dia: number): string {
  return `${mes}-${pad(Math.min(Math.max(1, dia), diasNoMes(mes)))}`;
}

/** Intervalo [início, fim) do mês como datas à meia-noite UTC, para filtrar no banco. */
export function intervaloDoMes(mes: string): { inicio: Date; fim: Date } {
  const [ano, m] = mes.split("-").map(Number);
  return { inicio: new Date(Date.UTC(ano, m - 1, 1)), fim: new Date(Date.UTC(ano, m, 1)) };
}

/** "Novembro de 2026" (ou "nov. de 2026" com `curto`). */
export function nomeMes(mes: string, curto = false): string {
  const [ano, m] = mes.split("-").map(Number);
  const texto = new Date(Date.UTC(ano, m - 1, 1)).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    month: curto ? "short" : "long",
    year: "numeric",
  });
  return curto ? texto : texto[0].toUpperCase() + texto.slice(1);
}

/** "Nov" — rótulo de eixo. */
export function siglaMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  const texto = new Date(Date.UTC(ano, m - 1, 1))
    .toLocaleDateString("pt-BR", { timeZone: "UTC", month: "short" })
    .replace(".", "");
  return texto[0].toUpperCase() + texto.slice(1);
}
