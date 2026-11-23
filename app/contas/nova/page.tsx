import { ContaForm } from "@/components/conta-form";
import { criarConta } from "@/lib/actions/contas";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";
import { mes as lerMes } from "@/lib/validacao";
import { cartaoExistente, listarCartoes } from "@/lib/financas";

export default async function NovaContaPage({ searchParams }: { searchParams: Promise<{ mes?: string; cartao?: string }> }) {
  const { mes, cartao } = await searchParams;
  const [cartoes, cartaoPadrao] = await Promise.all([listarCartoes(), cartaoExistente(cartao)]);
  return (
    <div>
      <LinkVoltar href={cartaoPadrao ? `/cartoes/${cartaoPadrao}` : "/contas"} label={cartaoPadrao ? "Voltar para o cartão" : "Voltar para Contas fixas"} />
      <h1 className={`${classeTituloPagina} mb-6`}>{cartaoPadrao ? "Nova recorrência no cartão" : "Nova conta fixa"}</h1>
      <ContaForm action={criarConta} inicioPadrao={lerMes(mes)} cartoes={cartoes} cartaoPadrao={cartaoPadrao ?? undefined} />
    </div>
  );
}
