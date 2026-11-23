/**
 * Dados que o menu lateral mostra em todas as telas: avisos (contas vencidas,
 * entradas a confirmar), o orçamento do mês da família e a data do último
 * backup. Lido no layout a cada página (o sistema roda só neste computador).
 */
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { contasDoMes, entradasFixasDoMes, lancamentosPorMes, orcamentoDaVisao, orcamentos, somar } from "@/lib/financas";
import { mesAtual } from "@/lib/meses";

export type DadosMenu = {
  contasPendentes: number;
  entradasAConfirmar: number;
  orcamento: { gasto: number; total: number };
  /** ISO do backup mais recente, ou nulo se nunca houve. */
  ultimoBackup: string | null;
};

function ultimoBackup(): string | null {
  const pasta = process.env.BACKUP_LOCAL_DIR ? path.resolve(process.env.BACKUP_LOCAL_DIR) : path.join(process.cwd(), "backups");
  try {
    const datas = readdirSync(pasta)
      .filter((nome) => nome.startsWith("financas-casa_") && nome.endsWith(".db"))
      .map((nome) => statSync(path.join(pasta, nome)).mtimeMs);
    return datas.length ? new Date(Math.max(...datas)).toISOString() : null;
  } catch {
    return null;
  }
}

export async function dadosDoMenu(): Promise<DadosMenu> {
  const mes = mesAtual();
  try {
    const [contas, entradas, porMes, mapa] = await Promise.all([contasDoMes(mes), entradasFixasDoMes(mes), lancamentosPorMes([mes]), orcamentos()]);
    return {
      contasPendentes: contas.filter((c) => c.situacao === "VENCIDA" || c.situacao === "VENCE_HOJE").length,
      entradasAConfirmar: entradas.filter((e) => e.situacao === "A_CONFIRMAR").length,
      orcamento: { gasto: somar(porMes[mes]), total: orcamentoDaVisao(mapa, "TODOS") },
      ultimoBackup: ultimoBackup(),
    };
  } catch {
    // O menu nunca derruba a página: sem banco, mostra o menu sem números.
    return { contasPendentes: 0, entradasAConfirmar: 0, orcamento: { gasto: 0, total: 0 }, ultimoBackup: ultimoBackup() };
  }
}
