import type { CompraParcelada } from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";
import { CampoCartao, CampoCategoria, CampoEscopo } from "@/components/campos";
import { mesAtual } from "@/lib/meses";

/** `tipo` DIVIDA troca os rótulos e esconde o cartão: dívidas são pagas da conta. */
export function CompraForm({
  compra,
  cartoes,
  tipo = compra?.tipo ?? "COMPRA",
  action,
}: {
  compra?: CompraParcelada;
  cartoes: { id: string; nome: string }[];
  tipo?: "COMPRA" | "DIVIDA";
  action: (formData: FormData) => void;
}) {
  const divida = tipo === "DIVIDA";
  return (
    <form action={action} className="max-w-xl space-y-4">
      <input type="hidden" name="tipo" value={tipo} />
      <div>
        <label className={classeLabel} htmlFor="descricao">
          {divida ? "Credor ou descrição" : "Descrição"}
        </label>
        <input id="descricao" name="descricao" required maxLength={60} defaultValue={compra?.descricao ?? ""} placeholder={divida ? "Ex.: Acordo Nubank" : "Ex.: Sofá"} className={classeInput} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="valorParcela">
            Valor da parcela (R$)
          </label>
          <input id="valorParcela" name="valorParcela" type="number" step="0.01" min={0.01} required defaultValue={compra?.valorParcela ?? ""} className={classeInput} />
        </div>
        <div>
          <label className={classeLabel} htmlFor="parcelas">
            Nº de parcelas
          </label>
          <input id="parcelas" name="parcelas" type="number" step={1} min={1} max={120} required defaultValue={compra?.parcelas ?? ""} className={classeInput} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="inicio">
            {divida ? "Mês da 1ª parcela (ou da próxima)" : "Mês da 1ª parcela"}
          </label>
          <input id="inicio" name="inicio" type="month" required defaultValue={compra?.inicio ?? mesAtual()} className={classeInput} />
        </div>
        <div>
          <label className={classeLabel} htmlFor="diaCobranca">
            {divida ? "Dia do pagamento" : "Dia da cobrança"}
          </label>
          <input id="diaCobranca" name="diaCobranca" type="number" step={1} min={1} max={31} required defaultValue={compra?.diaCobranca ?? 10} className={classeInput} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoEscopo padrao={compra?.escopo ?? "CASA"} />
        <CampoCategoria padrao={compra?.categoria ?? (divida ? "OUTROS" : "ELETRONICOS")} />
      </div>

      {!divida && (
        <div className="max-w-[calc(50%-0.5rem)]">
          <CampoCartao cartoes={cartoes} padrao={compra?.cartaoId} />
        </div>
      )}
      {divida && (
        <p className="text-sm text-texto-secundario">
          Cada parcela entra nos gastos do mês em que é paga. Se já pagou parte, informe só as parcelas que faltam e o mês da próxima.
        </p>
      )}

      {compra && (
        <p className="text-sm text-texto-secundario">Mudar o valor da parcela altera todos os meses da compra, inclusive os passados.</p>
      )}

      <BotaoEnvio textoAguardando="Salvando…" className={classeBotaoPrimario}>
        Salvar
      </BotaoEnvio>
    </form>
  );
}
