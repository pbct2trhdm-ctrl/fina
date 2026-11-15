import type { Entrada, EntradaFixa } from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";
import { LABEL_TIPO_ENTRADA, TIPOS_ENTRADA, paraInputDate } from "@/lib/formatacao";
import { hojeIsoLocal } from "@/lib/datas";
import { BotaoEnvio } from "@/components/botao-envio";
import { CampoEscopo } from "@/components/campos";

function CampoTipo({ padrao }: { padrao: string }) {
  return (
    <div>
      <label className={classeLabel} htmlFor="tipo">
        Tipo
      </label>
      <select id="tipo" name="tipo" defaultValue={padrao} className={classeInput}>
        {TIPOS_ENTRADA.map((tipo) => (
          <option key={tipo} value={tipo}>
            {LABEL_TIPO_ENTRADA[tipo]}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Entrada avulsa: dinheiro que entrou em uma data (renda extra, reembolso, 13º…). */
export function EntradaForm({ entrada, action }: { entrada?: Entrada; action: (formData: FormData) => void }) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className={classeLabel} htmlFor="descricao">
          Descrição
        </label>
        <input id="descricao" name="descricao" required maxLength={60} defaultValue={entrada?.descricao ?? ""} placeholder="Ex.: Reembolso de viagem" className={classeInput} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="valor">
            Valor (R$)
          </label>
          <input id="valor" name="valor" type="number" step="0.01" min={0.01} required defaultValue={entrada?.valor ?? ""} className={classeInput} />
        </div>
        <div>
          <label className={classeLabel} htmlFor="data">
            Data
          </label>
          <input id="data" name="data" type="date" required defaultValue={entrada ? paraInputDate(entrada.data) : hojeIsoLocal()} className={classeInput} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoEscopo padrao={entrada?.escopo ?? "EU"} />
        <CampoTipo padrao={entrada?.tipo ?? "EXTRA"} />
      </div>

      <BotaoEnvio textoAguardando="Salvando…" className={classeBotaoPrimario}>
        Salvar
      </BotaoEnvio>
    </form>
  );
}

/** Entrada fixa: repete todo mês (salário). `inicioPadrao` (AAAA-MM) só é usado ao criar. */
export function EntradaFixaForm({
  fixa,
  inicioPadrao,
  action,
}: {
  fixa?: EntradaFixa;
  inicioPadrao?: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className={classeLabel} htmlFor="descricao">
          Descrição
        </label>
        <input id="descricao" name="descricao" required maxLength={60} defaultValue={fixa?.descricao ?? ""} placeholder="Ex.: Salário" className={classeInput} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="valor">
            Valor mensal (R$)
          </label>
          <input id="valor" name="valor" type="number" step="0.01" min={0.01} required defaultValue={fixa?.valor ?? ""} className={classeInput} />
        </div>
        <div>
          <label className={classeLabel} htmlFor="diaRecebimento">
            Dia em que costuma entrar
          </label>
          <input id="diaRecebimento" name="diaRecebimento" type="number" step={1} min={1} max={31} required defaultValue={fixa?.diaRecebimento ?? 5} className={classeInput} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoEscopo padrao={fixa?.escopo ?? "EU"} />
        <CampoTipo padrao={fixa?.tipo ?? "SALARIO"} />
      </div>

      {!fixa && (
        <div className="max-w-[calc(50%-0.5rem)]">
          <label className={classeLabel} htmlFor="inicio">
            Vale a partir de
          </label>
          <input id="inicio" name="inicio" type="month" required defaultValue={inicioPadrao} className={classeInput} />
        </div>
      )}

      <p className="text-sm text-texto-secundario">
        A entrada só conta no mês depois que você confirma o recebimento.
        {fixa && " Mudar o valor só afeta os meses ainda não confirmados."}
      </p>

      <BotaoEnvio textoAguardando="Salvando…" className={classeBotaoPrimario}>
        Salvar
      </BotaoEnvio>
    </form>
  );
}
