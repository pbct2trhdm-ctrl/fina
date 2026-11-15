import { ContaForm } from "@/components/conta-form";
import { criarConta } from "@/lib/actions/contas";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";
import { mes as lerMes } from "@/lib/validacao";

export default async function NovaContaPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes } = await searchParams;
  return (
    <div>
      <LinkVoltar href="/contas" label="Voltar para Contas fixas" />
      <h1 className={`${classeTituloPagina} mb-6`}>Nova conta fixa</h1>
      <ContaForm action={criarConta} inicioPadrao={lerMes(mes)} />
    </div>
  );
}
