import { prisma } from "@/lib/prisma";
import { apagarTodosOsDados, carregarDadosDeExemplo } from "@/lib/actions/dados";
import { BotaoEnvio } from "@/components/botao-envio";
import { classeBotaoPerigo, classeBotaoSecundario, classeCard, classeTituloPagina, classeTituloSecao } from "@/lib/estilos";

export default async function ConfiguracoesPage() {
  const [gastos, contas, compras, metas, entradas, entradasFixas] = await Promise.all([
    prisma.gasto.count(),
    prisma.contaFixa.count(),
    prisma.compraParcelada.count(),
    prisma.meta.count(),
    prisma.entrada.count(),
    prisma.entradaFixa.count(),
  ]);
  const vazio = gastos + contas + compras + entradas + entradasFixas === 0;

  return (
    <div className="max-w-3xl">
      <h1 className={`${classeTituloPagina} mb-6`}>Configurações</h1>

      <section className={`${classeCard} mb-6`}>
        <h2 className={`${classeTituloSecao} mb-1`}>Dados gravados</h2>
        <p className="text-sm text-texto-secundario">
          {gastos} gastos avulsos · {contas} contas fixas · {compras} compras parceladas · {entradas} entradas avulsas · {entradasFixas}{" "}
          entradas fixas · {metas} metas. Tudo fica no arquivo{" "}
          <code>dev.db</code>, na pasta do sistema neste computador.
        </p>
      </section>

      <section className={`${classeCard} mb-6`}>
        <h2 className={`${classeTituloSecao} mb-1`}>Dados de exemplo</h2>
        <p className="mb-3 text-sm text-texto-secundario">
          Preenche o sistema com seis meses de gastos fictícios, para conhecer as telas antes de lançar os dados reais. Só funciona com o
          sistema vazio.
        </p>
        <form action={carregarDadosDeExemplo}>
          <BotaoEnvio textoAguardando="Carregando…" className={classeBotaoSecundario} desabilitado={!vazio}>
            Carregar dados de exemplo
          </BotaoEnvio>
        </form>
        {!vazio && <p className="mt-2 text-xs text-texto-secundario">Já existem dados; apague tudo antes de carregar o exemplo.</p>}
      </section>

      <section className={`${classeCard} mb-6`}>
        <h2 className={`${classeTituloSecao} mb-1`}>Cópia de segurança</h2>
        <p className="text-sm text-texto-secundario">
          No Terminal, dentro da pasta do sistema, <code>npm run backup</code> grava uma cópia do banco em <code>backups/</code> e, se
          <code> BACKUP_ONEDRIVE_DIR</code> estiver definido no arquivo <code>.env</code>, também na pasta do OneDrive.
        </p>
      </section>

      <section className={`${classeCard} border-critico/30`}>
        <h2 className={`${classeTituloSecao} mb-1`}>Apagar todos os dados</h2>
        <p className="mb-3 text-sm text-texto-secundario">
          Remove gastos, entradas, contas, parcelados, orçamentos, limites, reserva e metas. Não tem volta: faça uma cópia de segurança antes.
        </p>
        <form action={apagarTodosOsDados}>
          <BotaoEnvio
            textoAguardando="Apagando…"
            className={classeBotaoPerigo}
            desabilitado={vazio && metas === 0}
            confirmacao="Apagar TODOS os dados do sistema? Esta ação não pode ser desfeita."
          >
            Apagar tudo
          </BotaoEnvio>
        </form>
      </section>
    </div>
  );
}
