export type Tom = "critico" | "atencao" | "tranquilo" | "neutro";

const CLASSES: Record<Tom, string> = {
  critico: "border-critico/30 bg-critico-fundo text-critico",
  atencao: "border-atencao/30 bg-atencao-fundo text-atencao",
  tranquilo: "border-tranquilo/30 bg-tranquilo-fundo text-tranquilo",
  neutro: "border-slate-200/80 bg-white/60 text-texto-secundario",
};

/** Selo de situação: a cor nunca vai sozinha, sempre com texto (e ícone quando é alerta). */
export function Selo({ tom, children }: { tom: Tom; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${CLASSES[tom]}`}>
      {children}
    </span>
  );
}

export const SELO_SITUACAO_ENTRADA: Record<string, { tom: Tom; texto: string }> = {
  RECEBIDA: { tom: "tranquilo", texto: "✓ Recebida" },
  A_CONFIRMAR: { tom: "atencao", texto: "● A confirmar" },
  PREVISTA: { tom: "neutro", texto: "Prevista" },
};

export const SELO_SITUACAO_CONTA: Record<string, { tom: Tom; texto: string }> = {
  PAGA: { tom: "tranquilo", texto: "✓ Paga" },
  VENCIDA: { tom: "critico", texto: "⚠ Vencida" },
  VENCE_HOJE: { tom: "atencao", texto: "● Vence hoje" },
  A_VENCER: { tom: "neutro", texto: "A vencer" },
};
