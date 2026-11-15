import { EntradaForm } from "@/components/entrada-form";
import { criarEntrada } from "@/lib/actions/entradas";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default function NovaEntradaPage() {
  return (
    <div>
      <LinkVoltar href="/entradas" label="Voltar para Entradas" />
      <h1 className={`${classeTituloPagina} mb-6`}>Nova entrada</h1>
      <EntradaForm action={criarEntrada} />
    </div>
  );
}
