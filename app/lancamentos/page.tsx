import Link from "next/link";
import { lancamentosPorMes, naVisao, somar } from "@/lib/financas";
import {
  CATEGORIAS,
  LABEL_CATEGORIA,
  LABEL_ESCOPO,
  LABEL_TIPO_LANCAMENTO,
  formatarMoeda,
} from "@/lib/formatacao";
import { mes as lerMes, visao as lerVisao } from "@/lib/validacao";
import { EmptyState } from "@/components/empty-state";
import { Bolinha, SeletorMes, SeletorVisao, montarHref } from "@/components/seletores";
import {
  classeBadgeNeutro,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeInputAuto,
  classeTabela,
  classeTituloPagina,
} from "@/lib/estilos";

const EDITAR: Record<string, (id: string) => string> = {
  GASTO: (id) => `/lancamentos/${id}/editar`,
  CONTA: (id) => `/contas/${id}/editar`,
  PARCELA: (id) => `/parcelados/${id}/editar`,
};

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string; mes?: string; q?: string; categoria?: string }>;
}) {
  const parametros = await searchParams;
  const visao = lerVisao(parametros.visao);
  const mes = lerMes(parametros.mes);
  const q = (parametros.q ?? "").trim();
  const categoria = (CATEGORIAS as readonly string[]).includes(parametros.categoria ?? "") ? parametros.categoria! : "";
  const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const doMes = naVisao((await lancamentosPorMes([mes]))[mes], visao);
  const lista = doMes
    .filter((item) => !categoria || item.categoria === categoria)
    .filter((item) => !q || normalizar(item.descricao).includes(normalizar(q)));
  const filtrado = !!q || !!categoria;
  const extras = { q: q || undefined, categoria: categoria || undefined };

  return (
    <div className="max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className={classeTituloPagina}>Lançamentos</h1>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorMes base="/lancamentos" mes={mes} visao={visao} extras={extras} />
          <Link href="/importar" className={classeBotaoSecundario}>
            Importar extrato
          </Link>
          <Link href="/lancamentos/novo" className={classeBotaoPrimario}>
            Novo gasto
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SeletorVisao base="/lancamentos" visao={visao} mes={mes} extras={extras} />
        <form className="flex flex-1 flex-wrap items-center gap-2" action="/lancamentos">
          {visao !== "TODOS" && <input type="hidden" name="visao" value={visao} />}
          <input type="hidden" name="mes" value={mes} />
          <input name="q" defaultValue={q} placeholder="Buscar pela descrição" aria-label="Buscar pela descrição" className={`${classeInputAuto} min-w-[12rem] flex-1`} />
          <select name="categoria" defaultValue={categoria} aria-label="Categoria" className={classeInputAuto}>
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {LABEL_CATEGORIA[c]}
              </option>
            ))}
          </select>
          <button type="submit" className={classeBotaoSecundario}>
            Filtrar
          </button>
          {filtrado && (
            <Link href={montarHref("/lancamentos", { visao, mes })} className="text-sm text-accent hover:underline">
              Limpar
            </Link>
          )}
        </form>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          mensagem={filtrado ? "Nenhum lançamento com esse filtro neste mês." : "Nenhum lançamento neste mês."}
          acaoHref="/lancamentos/novo"
          acaoLabel="Novo gasto"
        />
      ) : (
        <div className={classeTabela}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 text-left text-xs uppercase tracking-wide text-texto-secundario">
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Descrição</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">De quem</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {lista.map((item) => (
                <tr key={`${item.tipo}-${item.id}`} className="border-b border-slate-200/50 last:border-0 hover:bg-white/60 transition-colors">
                  <td className="px-4 py-2.5 tabular-nums text-texto-secundario">
                    {item.data.slice(8)}/{item.data.slice(5, 7)}
                  </td>
                  <td className="px-4 py-2.5">{item.descricao}</td>
                  <td className="px-4 py-2.5">{LABEL_CATEGORIA[item.categoria]}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Bolinha escopo={item.escopo} />
                      {LABEL_ESCOPO[item.escopo]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={classeBadgeNeutro}>{LABEL_TIPO_LANCAMENTO[item.tipo]}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatarMoeda(item.valor)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={EDITAR[item.tipo](item.id)} className="text-accent hover:underline" aria-label={`Editar ${item.descricao}`}>
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200/70 font-semibold">
                <td className="px-4 py-3" colSpan={5}>
                  {lista.length} {lista.length === 1 ? "lançamento" : "lançamentos"}
                  {filtrado && <span className="font-normal text-texto-secundario"> de {doMes.length} no mês</span>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatarMoeda(somar(lista))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
