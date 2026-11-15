import { listarCartoes } from "@/lib/financas";
import { CompraForm } from "@/components/compra-form";
import { criarCompra } from "@/lib/actions/parcelados";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default async function NovaCompraPage() {
  const cartoes = await listarCartoes();
  return (
    <div>
      <LinkVoltar href="/parcelados" label="Voltar para Parcelados" />
      <h1 className={`${classeTituloPagina} mb-6`}>Nova compra parcelada</h1>
      <CompraForm cartoes={cartoes} action={criarCompra} />
    </div>
  );
}
