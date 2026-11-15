import { CartaoForm } from "@/components/cartao-form";
import { criarCartao } from "@/lib/actions/cartoes";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default function NovoCartaoPage() {
  return (
    <div>
      <LinkVoltar href="/cartoes" label="Voltar para Cartões" />
      <h1 className={`${classeTituloPagina} mb-6`}>Novo cartão</h1>
      <CartaoForm action={criarCartao} />
    </div>
  );
}
