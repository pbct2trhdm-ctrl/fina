import { listarCartoes } from "@/lib/financas";
import { CompraForm } from "@/components/compra-form";
import { criarCompra } from "@/lib/actions/parcelados";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function NovaDividaPage() {
  const cartoes = await listarCartoes();
  return (
    <div>
      <LinkVoltar href="/dividas" label="Voltar para Dívidas e acordos" />
      <h1 className={`${classeTituloPagina} mb-6`}>Nova dívida ou acordo</h1>
      <CompraForm tipo="DIVIDA" cartoes={cartoes} action={criarCompra} />
    </div>
  );
}
