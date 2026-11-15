import { MetaForm } from "@/components/meta-form";
import { criarMeta } from "@/lib/actions/metas";
import { classeTituloPagina } from "@/lib/estilos";
import { LinkVoltar } from "@/components/link-voltar";

export default function NovaMetaPage() {
  return (
    <div>
      <LinkVoltar href="/metas" label="Voltar para Metas e reserva" />
      <h1 className={`${classeTituloPagina} mb-6`}>Nova meta</h1>
      <MetaForm action={criarMeta} />
    </div>
  );
}
