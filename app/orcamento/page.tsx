import { limitesDaVisao, orcamentos } from "@/lib/financas";
import { CATEGORIAS, ESCOPOS, LABEL_CATEGORIA, LABEL_ESCOPO, LABEL_VISAO, formatarMoeda } from "@/lib/formatacao";
import { visao as lerVisao } from "@/lib/validacao";
import { salvarLimites, salvarOrcamentos } from "@/lib/actions/orcamento";
import { BotaoEnvio } from "@/components/botao-envio";
import { Bolinha, SeletorVisao } from "@/components/seletores";
import { classeBotaoPrimario, classeCard, classeInput, classeLabel, classeTituloPagina, classeTituloSecao } from "@/lib/estilos";

export default async function OrcamentoPage({ searchParams }: { searchParams: Promise<{ visao?: string }> }) {
  const visao = lerVisao((await searchParams).visao);
  const [mapa, limites] = await Promise.all([orcamentos(), limitesDaVisao(visao)]);
  const totalFamilia = ESCOPOS.reduce((total, escopo) => total + mapa[escopo], 0);

  return (
    <div className="max-w-4xl">
      <h1 className={`${classeTituloPagina} mb-6`}>Orçamento e limites</h1>

      <section className={`${classeCard} mb-6`}>
        <h2 className={`${classeTituloSecao} mb-1`}>Orçamento mensal</h2>
        <p className="mb-4 text-sm text-texto-secundario">
          Quanto cada um pode gastar por mês. O orçamento da família é a soma: {formatarMoeda(totalFamilia)}.
        </p>
        <form action={salvarOrcamentos} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ESCOPOS.map((escopo) => (
              <div key={escopo}>
                <label className={`${classeLabel} inline-flex items-center gap-2`} htmlFor={`orc-${escopo}`}>
                  <Bolinha escopo={escopo} />
                  {LABEL_ESCOPO[escopo]} (R$)
                </label>
                <input id={`orc-${escopo}`} name={escopo} type="number" step="0.01" min={0} required defaultValue={mapa[escopo]} className={classeInput} />
              </div>
            ))}
          </div>
          <BotaoEnvio textoAguardando="Salvando…" className={classeBotaoPrimario}>
            Salvar orçamento
          </BotaoEnvio>
        </form>
      </section>

      <section className={classeCard}>
        <h2 className={`${classeTituloSecao} mb-1`}>Limites por categoria</h2>
        <p className="mb-4 text-sm text-texto-secundario">
          Valor máximo por mês em cada categoria. Cada visão tem os seus limites, independentes entre si, e eles valem para todos os meses.
          Deixe em branco para não ter limite.
        </p>
        <div className="mb-4">
          <SeletorVisao base="/orcamento" visao={visao} />
        </div>
        {/* key: ao trocar de visão o formulário é recriado com os valores daquela visão */}
        <form key={visao} action={salvarLimites.bind(null, visao)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {CATEGORIAS.map((categoria) => (
              <div key={categoria}>
                <label className={classeLabel} htmlFor={`lim-${categoria}`}>
                  {LABEL_CATEGORIA[categoria]} (R$)
                </label>
                <input
                  id={`lim-${categoria}`}
                  name={categoria}
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={limites[categoria] ?? ""}
                  placeholder="Sem limite"
                  className={classeInput}
                />
              </div>
            ))}
          </div>
          <BotaoEnvio textoAguardando="Salvando…" className={classeBotaoPrimario}>
            Salvar limites de {LABEL_VISAO[visao]}
          </BotaoEnvio>
        </form>
      </section>
    </div>
  );
}
