import type { Gasto } from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";
import { paraInputDate } from "@/lib/formatacao";
import { hojeIsoLocal } from "@/lib/datas";
import { BotaoEnvio } from "@/components/botao-envio";
import { CampoCategoria, CampoEscopo } from "@/components/campos";

export function GastoForm({ gasto, action }: { gasto?: Gasto; action: (formData: FormData) => void }) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className={classeLabel} htmlFor="descricao">
          Descrição
        </label>
        <input id="descricao" name="descricao" required maxLength={60} defaultValue={gasto?.descricao ?? ""} placeholder="Ex.: Supermercado" className={classeInput} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="valor">
            Valor (R$)
          </label>
          <input id="valor" name="valor" type="number" step="0.01" min={0.01} required defaultValue={gasto?.valor ?? ""} className={classeInput} />
        </div>
        <div>
          <label className={classeLabel} htmlFor="data">
            Data
          </label>
          <input id="data" name="data" type="date" required defaultValue={gasto ? paraInputDate(gasto.data) : hojeIsoLocal()} className={classeInput} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CampoEscopo padrao={gasto?.escopo ?? "CASA"} />
        <CampoCategoria padrao={gasto?.categoria ?? "MERCADO"} />
      </div>

      <BotaoEnvio textoAguardando="Salvando…" className={classeBotaoPrimario}>
        Salvar
      </BotaoEnvio>
    </form>
  );
}
