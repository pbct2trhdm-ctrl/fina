import Link from "next/link";
import { classeBotaoPrimario } from "@/lib/estilos";

export function EmptyState({
  mensagem,
  acaoHref,
  acaoLabel,
}: {
  mensagem: string;
  acaoHref?: string;
  acaoLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center backdrop-blur-md">
      <p className="text-sm text-texto-secundario mb-4">{mensagem}</p>
      {acaoHref && acaoLabel && (
        <Link href={acaoHref} className={classeBotaoPrimario}>
          {acaoLabel}
        </Link>
      )}
    </div>
  );
}
