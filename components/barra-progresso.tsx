/**
 * Barra de progresso (gasto contra orçamento, parcelas pagas, meta guardada).
 * Com `alertaAoEstourar`, fica vermelha quando o valor passa do total — usar
 * só onde passar do total é ruim (orçamento), não onde é bom (meta, reserva).
 */
export function BarraProgresso({
  valor,
  total,
  alertaAoEstourar = false,
  fina = false,
  rotulo,
}: {
  valor: number;
  total: number;
  alertaAoEstourar?: boolean;
  fina?: boolean;
  rotulo: string;
}) {
  const percentual = total > 0 ? Math.min(100, (valor / total) * 100) : 0;
  const estourou = alertaAoEstourar && valor > total;
  return (
    <div
      role="img"
      aria-label={`${rotulo}: ${Math.round(total > 0 ? (valor / total) * 100 : 0)}%`}
      className={`w-full overflow-hidden rounded-full bg-trilho shadow-[inset_0_1px_1px_rgb(15_23_42/0.06)] ${fina ? "h-1.5" : "h-2.5"}`}
    >
      <div
        className={`animar-barra h-full rounded-full ${estourou ? "bg-critico" : "bg-linear-to-r from-accent to-sky-400"}`}
        style={{ width: `${percentual}%` }}
      />
    </div>
  );
}
