import { COR_ESCOPO, LABEL_ESCOPO, formatarMoeda, type EscopoChave } from "@/lib/formatacao";
import { nomeMes, siglaMes } from "@/lib/meses";
import { Bolinha } from "@/components/seletores";

/**
 * Barras empilhadas do gasto mensal por pessoa (ou de uma pessoa só). Cada
 * coluna é um link para o mês; passar o mouse mostra os valores. Um eixo só,
 * segmentos separados por 2px e só o topo arredondado.
 */
export function GraficoMeses({
  meses,
  series,
  valores,
  mesAtivo,
  hrefDoMes,
}: {
  meses: string[];
  series: EscopoChave[];
  /** valores[mes][série] */
  valores: number[][];
  mesAtivo: string;
  hrefDoMes: (mes: string) => string;
}) {
  const totais = valores.map((linha) => linha.reduce((a, b) => a + b, 0));
  const maior = Math.max(1, ...totais);
  const potencia = 10 ** Math.floor(Math.log10(maior));
  const teto = ([1, 1.5, 2, 3, 4, 5, 6, 8, 10].find((n) => n * potencia >= maior) ?? 10) * potencia;

  const L = 640, A = 230, esquerda = 56, topo = 12, base = 26;
  const altura = A - topo - base;
  const faixa = (L - esquerda - 8) / meses.length;
  const larguraBarra = Math.min(42, faixa * 0.6);
  const y = (v: number) => topo + altura - (v / teto) * altura;
  const rotuloEixo = (v: number) =>
    v >= 1000 ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : String(Math.round(v));

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-2 flex flex-wrap justify-end gap-4 text-xs text-texto-secundario">
          {series.map((serie) => (
            <span key={serie} className="inline-flex items-center gap-1.5">
              <Bolinha escopo={serie} />
              {LABEL_ESCOPO[serie]}
            </span>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${L} ${A}`} width="100%" role="img" aria-label="Gasto mensal dos últimos 6 meses">
        {[0, 1, 2, 3, 4].map((i) => {
          const v = (teto * i) / 4;
          return (
            <g key={i}>
              <line x1={esquerda} x2={L - 8} y1={y(v)} y2={y(v)} stroke={i ? "var(--color-borda-suave)" : "#c3cbd2"} />
              <text x={esquerda - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--color-texto-secundario)">
                {rotuloEixo(v)}
              </text>
            </g>
          );
        })}
        {meses.map((mes, i) => {
          const x = esquerda + faixa * i + (faixa - larguraBarra) / 2;
          const ultimo = valores[i].reduce((indice, v, j) => (v > 0 ? j : indice), -1);
          let acumulado = 0;
          const dica =
            `${nomeMes(mes)}\n` +
            series.map((serie, j) => `${LABEL_ESCOPO[serie]}: ${formatarMoeda(valores[i][j])}`).join("\n") +
            (series.length > 1 ? `\nTotal: ${formatarMoeda(totais[i])}` : "");
          return (
            <a key={mes} href={hrefDoMes(mes)} aria-label={`${nomeMes(mes)}: ${formatarMoeda(totais[i])}`}>
              <title>{dica}</title>
              <rect className="fill-transparent transition-colors hover:fill-white/70" rx="10" x={esquerda + faixa * i} y={topo} width={faixa} height={altura} />
              {valores[i].map((v, j) => {
                if (v <= 0) return null;
                const y1 = y(acumulado + v);
                const h = Math.max(1, y(acumulado) - y1 - (j < ultimo ? 2 : 0));
                acumulado += v;
                const cor = COR_ESCOPO[series[j]];
                const r = Math.min(4, h);
                return j === ultimo ? (
                  <path
                    key={j}
                    pointerEvents="none"
                    d={`M${x},${y1 + h}V${y1 + r}q0,${-r} ${r},${-r}h${larguraBarra - 2 * r}q${r},0 ${r},${r}V${y1 + h}z`}
                    fill={cor}
                  />
                ) : (
                  <rect key={j} pointerEvents="none" x={x} y={y1} width={larguraBarra} height={h} fill={cor} />
                );
              })}
              <text
                x={x + larguraBarra / 2}
                y={A - 8}
                textAnchor="middle"
                fontSize="11"
                fontWeight={mes === mesAtivo ? 600 : 400}
                fill={mes === mesAtivo ? "var(--color-texto-principal)" : "var(--color-texto-secundario)"}
              >
                {siglaMes(mes)}
              </text>
            </a>
          );
        })}
      </svg>
    </div>
  );
}
