import type { Meta } from "@/app/generated/prisma/client";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";
import { BotaoEnvio } from "@/components/botao-envio";

export function MetaForm({ meta, action }: { meta?: Meta; action: (formData: FormData) => void }) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className={classeLabel} htmlFor="descricao">
          Descrição
        </label>
        <input id="descricao" name="descricao" required maxLength={60} defaultValue={meta?.descricao ?? ""} placeholder="Ex.: Viagem de férias" className={classeInput} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={classeLabel} htmlFor="valorAlvo">
            Valor da meta (R$)
          </label>
          <input id="valorAlvo" name="valorAlvo" type="number" step="0.01" min={0.01} required defaultValue={meta?.valorAlvo ?? ""} className={classeInput} />
        </div>
        <div>
          <label className={classeLabel} htmlFor="valorGuardado">
            Já guardado (R$)
          </label>
          <input id="valorGuardado" name="valorGuardado" type="number" step="0.01" min={0} required defaultValue={meta?.valorGuardado ?? 0} className={classeInput} />
        </div>
      </div>

      <div className="max-w-[calc(50%-0.5rem)]">
        <label className={classeLabel} htmlFor="prazo">
          Prazo (opcional)
        </label>
        <input id="prazo" name="prazo" type="month" defaultValue={meta?.prazo ?? ""} className={classeInput} />
      </div>

      <BotaoEnvio textoAguardando="Salvando…" className={classeBotaoPrimario}>
        Salvar
      </BotaoEnvio>
    </form>
  );
}
