import { EntradaFixaForm } from "@/components/entrada-form";
import { criarEntradaFixa } from "@/lib/actions/entradas";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";
import { mes as lerMes } from "@/lib/validacao";

export default async function NovaEntradaFixaPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes } = await searchParams;
  return (
    <div>
      <LinkVoltar href="/entradas" label="Voltar para Entradas" />
      <h1 className={`${classeTituloPagina} mb-6`}>Nova entrada fixa</h1>
      <EntradaFixaForm action={criarEntradaFixa} inicioPadrao={lerMes(mes)} />
    </div>
  );
}
