import { listarCartoes } from "@/lib/financas";
import { GastoForm } from "@/components/gasto-form";
import { criarGasto } from "@/lib/actions/gastos";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function NovoGastoPage() {
  const cartoes = await listarCartoes();
  return (
    <div>
      <LinkVoltar href="/lancamentos" label="Voltar para Lançamentos" />
      <h1 className={`${classeTituloPagina} mb-6`}>Novo gasto</h1>
      <GastoForm cartoes={cartoes} action={criarGasto} />
    </div>
  );
}
