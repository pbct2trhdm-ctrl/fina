import { GastoForm } from "@/components/gasto-form";
import { criarGasto } from "@/lib/actions/gastos";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default function NovoGastoPage() {
  return (
    <div>
      <LinkVoltar href="/lancamentos" label="Voltar para Lançamentos" />
      <h1 className={`${classeTituloPagina} mb-6`}>Novo gasto</h1>
      <GastoForm action={criarGasto} />
    </div>
  );
}
