import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EntradaForm } from "@/components/entrada-form";
import { atualizarEntrada, excluirEntrada } from "@/lib/actions/entradas";
import { classeBotaoPerigo, classeTituloPagina } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { LinkVoltar } from "@/components/link-voltar";

export default async function EditarEntradaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entrada = await prisma.entrada.findUnique({ where: { id } });
  if (!entrada) notFound();

  return (
    <div>
      <LinkVoltar href={`/entradas?mes=${entrada.data.toISOString().slice(0, 7)}`} label="Voltar para Entradas" />
      <div className="mb-6 flex max-w-xl items-center justify-between">
        <h1 className={classeTituloPagina}>Editar entrada</h1>
        <form action={excluirEntrada.bind(null, entrada.id)}>
          <BotaoEnvio textoAguardando="Excluindo…" className={classeBotaoPerigo} confirmacao={`Excluir a entrada "${entrada.descricao}"?`}>
            Excluir
          </BotaoEnvio>
        </form>
      </div>
      <EntradaForm entrada={entrada} action={atualizarEntrada.bind(null, entrada.id)} />
    </div>
  );
}
