import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MetaForm } from "@/components/meta-form";
import { atualizarMeta, excluirMeta } from "@/lib/actions/metas";
import { classeBotaoPerigo, classeTituloPagina } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarMetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await prisma.meta.findUnique({ where: { id } });
  if (!meta) notFound();

  return (
    <div>
      <LinkVoltar href="/metas" label="Voltar para Metas e reserva" />
      <div className="mb-6 flex max-w-xl items-center justify-between">
        <h1 className={classeTituloPagina}>Editar meta</h1>
        <form action={excluirMeta.bind(null, meta.id)}>
          <BotaoEnvio textoAguardando="Excluindo…" className={classeBotaoPerigo} confirmacao={`Excluir a meta "${meta.descricao}"?`}>
            Excluir
          </BotaoEnvio>
        </form>
      </div>
      <MetaForm meta={meta} action={atualizarMeta.bind(null, meta.id)} />
    </div>
  );
}
